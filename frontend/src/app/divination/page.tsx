"use client";

/**
 * 占卜流程页面 — 核心交互（v1.2 逐爻摇卦版）
 *
 * 状态机：IDLE → SHAKING → JUDGMENT → EXPANDED
 *
 * SHAKING 阶段用户点击龟壳 6 次，每爻结果即时显示。
 * 第 6 次完成后发起 API 获取判词，进入 JUDGMENT。
 */

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

import QuestionInput from "@/components/divination/QuestionInput";
import TurtleShake, { type LineResult } from "@/components/divination/TurtleShake";
import JudgmentCard from "@/components/divination/JudgmentCard";
import InterpretationSection, { type InterpretationData } from "@/components/divination/InterpretationSection";
import ShareCard from "@/components/divination/ShareCard";
import {
  mockDivination, mockInterpretation, isMockMode, type MockDivinationResponse,
} from "@/lib/mock";
import { apiPost, apiGet } from "@/lib/api";

/* =========================================================================
 * 类型定义
 * ========================================================================= */

type DivinationPhase = "idle" | "shaking" | "judgment" | "expanded";

/** 六爻完成后的卦名揭晓提示 */
interface HexagramReveal {
  name: string;
  rarity: string;
}

/** 稀有度配色：大吉金色 / 吉暖金 / 中平素色 / 慎暗紫 */
const RARITY_STYLE: Record<string, { color: string; glow: string }> = {
  "大吉": { color: "#ffd76a", glow: "rgba(255,215,106,0.6)" },
  "吉": { color: "#e8b45c", glow: "rgba(232,180,92,0.5)" },
  "中平": { color: "#f6efff", glow: "rgba(246,239,255,0.32)" },
  "慎": { color: "#a58bd8", glow: "rgba(165,139,216,0.55)" },
};

interface RealDivinationResponse {
  id: string;
  question: string;
  hexagram: { original: { name: string; lines: number[]; trigram_upper: string; trigram_lower: string }; changing_lines: number[]; transformed: { name: string } | null; mutual: { name: string }; rarity: string };
  judgment_cn: string | null;
  created_at: string;
}

interface RealInterpretationResponse { reading_id: string; interpretation: string; cached: boolean; }

function parseInterpretation(text: string): InterpretationData {
  const s: InterpretationData = { directAnswer: "", hexagramAnalysis: "", practicalAdvice: "" };
  const m1 = text.match(/【直接回答】([\s\S]*?)(?=【卦象与变爻分析】|$)/);
  const m2 = text.match(/【卦象与变爻分析】([\s\S]*?)(?=【务实建议】|$)/);
  const m3 = text.match(/【务实建议】([\s\S]*?)$/);
  if (m1) s.directAnswer = m1[1].trim();
  if (m2) s.hexagramAnalysis = m2[1].trim();
  if (m3) s.practicalAdvice = m3[1].trim();
  return s;
}

function normalizeResponse(data: RealDivinationResponse): MockDivinationResponse {
  const h = data.hexagram;
  const set_ = new Set(h.changing_lines);
  return {
    id: data.id,
    hexagram: {
      name: h.original.name,
      changedName: h.transformed?.name,
      lines: h.original.lines.map((v, i) => ({
        position: i + 1,
        type: (v === 7 || v === 9 ? "yang" : "yin") as "yang" | "yin",
        changing: set_.has(i),
      })),
      rarity: (h.rarity || "中平") as MockDivinationResponse["hexagram"]["rarity"],
    },
    judgment: data.judgment_cn || "",
  };
}

/* =========================================================================
 * 视觉辅助组件
 * ========================================================================= */

type NavItem =
  | { label: string; kind: "active" }
  | { label: string; kind: "link"; href: string }
  | { label: string; kind: "soon" };

const NAV_ITEMS: NavItem[] = [
  { label: "占卜流程", kind: "active" },
  { label: "卦象解读", kind: "soon" },
  { label: "变爻解析", kind: "soon" },
  { label: "占卜记录", kind: "link", href: "/dashboard" },
];

function LineGlyph({ line }: { line: LineResult }) {
  const isYang = line.type === "yang";
  return (
    <div className="flex h-5 w-16 items-center justify-center gap-1.5">
      {isYang ? (
        <span className="h-1.5 w-14 rounded-full bg-[var(--color-accent,#d9b46a)]" />
      ) : (
        <>
          <span className="h-1.5 w-6 rounded-full bg-[var(--color-accent,#d9b46a)]" />
          <span className="h-1.5 w-6 rounded-full bg-[var(--color-accent,#d9b46a)]" />
        </>
      )}
    </div>
  );
}

function LinesPanel({ collectedLines }: { collectedLines: LineResult[] }) {
  return (
    <div className="rounded-[2rem] border border-[var(--color-border,rgba(217,180,106,0.18))] bg-[var(--color-bg-card,rgba(18,14,38,0.72))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-[family-name:var(--font-noto-serif)] text-base text-[var(--color-text,#f6efff)]">已得爻位</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary,rgba(246,239,255,0.62))]">自下而上成卦</p>
        </div>
        <span className="rounded-full border border-[var(--color-accent,#d9b46a)]/30 px-2.5 py-1 text-xs text-[var(--color-accent,#d9b46a)]">
          {collectedLines.length}/6
        </span>
      </div>

      <div className="flex flex-col-reverse gap-2.5">
        <AnimatePresence>
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const line = collectedLines[idx];
            const rowClassName = `flex min-h-11 items-center justify-between rounded-2xl border px-3 py-2 transition ${
              line
                ? "border-[var(--color-accent,#d9b46a)]/25 bg-[var(--color-accent,#d9b46a)]/8"
                : "border-[var(--color-border,rgba(217,180,106,0.12))] bg-black/10 opacity-70"
            }`;
            const rowContent = (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-9 text-xs text-[var(--color-text-secondary,rgba(246,239,255,0.58))]">{["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"][idx]}</span>
                  {line ? <LineGlyph line={line} /> : <span className="h-1.5 w-14 rounded-full bg-[var(--color-text-secondary,rgba(246,239,255,0.18))]" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={line ? "text-sm text-[var(--color-accent,#d9b46a)]" : "text-sm text-[var(--color-text-secondary,rgba(246,239,255,0.32))]"}>
                    {line?.typeName || "未得"}
                  </span>
                  {line?.changing && (
                    <span className="rounded-full bg-[var(--color-accent-alt,var(--color-accent,#d9b46a))] px-1.5 py-0.5 text-[10px] text-[#160f1e]">变</span>
                  )}
                </div>
              </>
            );
            return line ? (
              <motion.div
                key={line.position}
                className={rowClassName}
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {rowContent}
              </motion.div>
            ) : (
              <div key={`empty-${idx}`} className={rowClassName}>
                {rowContent}
              </div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DesktopLeftRail() {
  /** "即将开放" tooltip 当前显示的导航项 */
  const [soonTip, setSoonTip] = useState<string | null>(null);
  const soonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 点击未开放导航项，短暂显示 tooltip */
  const showSoonTip = (label: string) => {
    setSoonTip(label);
    if (soonTimer.current) clearTimeout(soonTimer.current);
    soonTimer.current = setTimeout(() => setSoonTip(null), 1600);
  };

  return (
    <aside className="hidden min-h-[690px] flex-col rounded-[2rem] border border-[var(--color-border,rgba(217,180,106,0.18))] bg-[var(--color-bg-card,rgba(18,14,38,0.72))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:flex">
      <Link
        href="/"
        className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border,rgba(217,180,106,0.22))] px-3 py-2 text-xs text-[var(--color-text-secondary,rgba(246,239,255,0.72))] transition hover:border-[var(--color-accent,#d9b46a)] hover:text-[var(--color-accent,#d9b46a)]"
      >
        <span>‹</span>
        返回
      </Link>

      <div className="relative mb-6 flex h-64 items-end justify-center overflow-hidden rounded-[1.75rem] bg-[radial-gradient(circle_at_50%_20%,rgba(217,180,106,0.18),rgba(141,91,255,0.12)_42%,transparent_74%)]">
        <Image
          src="/images/anime/chibi-oracle.webp"
          alt="占卜巫女"
          width={220}
          height={260}
          className="h-full w-auto object-contain drop-shadow-[0_18px_32px_rgba(0,0,0,0.35)]"
          unoptimized
          priority
        />
      </div>

      <nav className="space-y-3">
        {NAV_ITEMS.map((item) => {
          /* 当前页：占卜流程（高亮，不可点击） */
          if (item.kind === "active") {
            return (
              <div
                key={item.label}
                className="flex w-full items-center justify-between rounded-2xl border border-[var(--color-accent,#d9b46a)]/45 bg-[var(--color-accent,#d9b46a)]/12 px-4 py-3 text-left font-[family-name:var(--font-noto-serif)] text-sm text-[var(--color-accent,#d9b46a)]"
              >
                {item.label}
                <span className="text-xs opacity-55">✦</span>
              </div>
            );
          }

          /* 可跳转链接：占卜记录 → /dashboard */
          if (item.kind === "link") {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex w-full items-center justify-between rounded-2xl border border-[var(--color-border,rgba(217,180,106,0.14))] bg-black/10 px-4 py-3 text-left font-[family-name:var(--font-noto-serif)] text-sm text-[var(--color-text-secondary,rgba(246,239,255,0.62))] transition hover:border-[var(--color-accent,#d9b46a)]/50 hover:bg-[var(--color-accent,#d9b46a)]/8 hover:text-[var(--color-accent,#d9b46a)]"
              >
                {item.label}
                <span className="text-xs opacity-55 transition group-hover:opacity-90">✦</span>
              </Link>
            );
          }

          /* 未开放：点击显示 "即将开放" tooltip */
          return (
            <div key={item.label} className="relative">
              <button
                type="button"
                onClick={() => showSoonTip(item.label)}
                className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-[var(--color-border,rgba(217,180,106,0.14))] bg-black/10 px-4 py-3 text-left font-[family-name:var(--font-noto-serif)] text-sm text-[var(--color-text-secondary,rgba(246,239,255,0.62))] transition hover:border-[var(--color-accent,#d9b46a)]/40 hover:text-[var(--color-text,#f6efff)]"
              >
                {item.label}
                <span className="text-xs opacity-55">✦</span>
              </button>
              <AnimatePresence>
                {soonTip === item.label && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 -translate-y-1/2 whitespace-nowrap rounded-full border border-[var(--color-accent,#d9b46a)]/40 bg-[#160f1e] px-2.5 py-1 text-[10px] text-[var(--color-accent,#d9b46a)] shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                  >
                    即将开放
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <p className="mt-auto pt-6 text-xs leading-6 text-[var(--color-text-secondary,rgba(246,239,255,0.5))]">
        静心、定问、观象。六爻既成，方见其辞。
      </p>
    </aside>
  );
}

function MobileTopHeader() {
  return (
    <div className="relative mb-3 flex items-center justify-between sm:hidden">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border,rgba(217,180,106,0.18))] bg-[var(--color-bg-card,rgba(18,14,38,0.62))] px-3 py-1.5 text-xs text-[var(--color-text-secondary,rgba(246,239,255,0.72))] backdrop-blur-md"
      >
        <span>‹</span>
        返回
      </Link>
      <div className="text-right">
        <p className="font-[family-name:var(--font-noto-serif)] text-xl tracking-[0.18em] text-[var(--color-text,#f6efff)]">六爻</p>
        <p className="mt-0.5 text-[11px] tracking-[0.08em] text-[var(--color-text-secondary,rgba(246,239,255,0.62))]">以铜钱问天，以卦象观心</p>
      </div>
    </div>
  );
}

function MobileOracleBanner() {
  return (
    <div className="mb-3 flex items-center gap-3 rounded-[1.5rem] border border-[var(--color-border,rgba(217,180,106,0.16))] bg-[var(--color-bg-card,rgba(18,14,38,0.72))] p-2.5 shadow-[0_16px_48px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:hidden">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[radial-gradient(circle,rgba(217,180,106,0.16),rgba(141,91,255,0.12)_58%,transparent)]">
        <Image
          src="/images/anime/chibi-oracle.webp"
          alt="占卜巫女"
          width={96}
          height={112}
          className="absolute bottom-0 left-1/2 h-20 w-auto -translate-x-1/2 object-contain"
          unoptimized
          priority
        />
      </div>
      <div>
        <p className="font-[family-name:var(--font-noto-serif)] text-sm text-[var(--color-text,#f6efff)]">摇卦占卜</p>
        <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-secondary,rgba(246,239,255,0.64))]">凝神于问，轻触龟壳，逐爻成象。</p>
      </div>
    </div>
  );
}

function DesktopRightRail({ collectedLines }: { collectedLines: LineResult[] }) {
  return (
    <aside className="relative hidden min-h-[690px] flex-col overflow-hidden rounded-[2rem] border border-[var(--color-border,rgba(217,180,106,0.18))] bg-[var(--color-bg-card,rgba(18,14,38,0.72))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:flex">
      <LinesPanel collectedLines={collectedLines} />

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-60">
        <div className="absolute bottom-6 left-1/2 h-12 w-40 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(133,84,214,0.5)_0%,rgba(74,47,122,0.3)_58%,transparent_72%)] blur-[1px]" />
        <Image
          src="/images/anime/hero-cat.webp"
          alt="黑猫"
          width={360}
          height={360}
          className="absolute bottom-8 left-1/2 w-36 -translate-x-1/2 object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.38)]"
          unoptimized
        />
      </div>
    </aside>
  );
}

/* =========================================================================
 * 主组件
 * ========================================================================= */

export default function DivinationPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [phase, setPhase] = useState<DivinationPhase>("idle");
  const [question, setQuestion] = useState("");
  const [lineCount, setLineCount] = useState(0);
  const [collectedLines, setCollectedLines] = useState<LineResult[]>([]);
  const [result, setResult] = useState<MockDivinationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [awaitingJudgment, setAwaitingJudgment] = useState(false);
  const [reveal, setReveal] = useState<HexagramReveal | null>(null);

  const [interpretation, setInterpretation] = useState<InterpretationData | null>(null);
  const [loadingInterpretation, setLoadingInterpretation] = useState(false);
  const [interpretationError, setInterpretationError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  /* ── 每爻回调 ── */
  const handleLineRevealed = useCallback((line: LineResult) => {
    setCollectedLines((prev) => [...prev, line]);
    setLineCount((prev) => prev + 1);
  }, []);

  /* ── 六爻完成 → 发起 API ── */
  const handleShakeComplete = useCallback(async () => {
    setAwaitingJudgment(true);
    try {
      const data = isMockMode()
        ? await mockDivination(question)
        : await apiPost<RealDivinationResponse>("/api/divination", { question }).then((raw) => {
            /* 429 等异常响应可能返回非卦象格式，先校验再 normalize，避免爆出难懂的 TypeError */
            if (!raw || !raw.hexagram || !raw.hexagram.original || !Array.isArray(raw.hexagram.original.lines)) {
              throw new Error("卦象数据异常，请稍后重试");
            }
            return normalizeResponse(raw);
          });
      setResult(data);
      /* 先揭晓卦名（2.5s 停留 + 淡出），再进入判词阶段 */
      setReveal({ name: data.hexagram.name, rarity: data.hexagram.rarity });
      await new Promise((r) => setTimeout(r, 2500));
      setReveal(null);
      await new Promise((r) => setTimeout(r, 450)); /* 等淡出动画结束 */
      setPhase("judgment");
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      const msg = /429|次数|额度|上限|频繁|quota|limit/i.test(raw)
        ? "今日免费次数已用完，请明天再来"
        : raw || "网络异常，请稍后重试";
      setError(msg);
      /* 关键：离开 shaking 阶段，否则错误卡片（只在 judgment/expanded 渲染）永远不会出现，页面卡死 */
      setPhase("judgment");
    } finally {
      setAwaitingJudgment(false);
    }
  }, [question]);

  /* ── 展开解卦 ── */
  const handleExpand = useCallback(async () => {
    if (!result) return;
    setPhase("expanded");
    setLoadingInterpretation(true);
    setInterpretationError(null);
    try {
      const data = isMockMode()
        ? await mockInterpretation(result.hexagram.name)
        : await apiGet<RealInterpretationResponse>(`/api/divination/${result.id}/interpretation`)
            .then((r) => parseInterpretation(r.interpretation));
      setInterpretation(data);
    } catch (e) {
      setInterpretationError(e instanceof Error ? e.message : "解读加载失败");
    } finally {
      setLoadingInterpretation(false);
    }
  }, [result]);

  /* ── 重新占卜 ── */
  const handleRetry = useCallback(() => {
    setPhase("idle"); setQuestion(""); setLineCount(0); setCollectedLines([]);
    setResult(null); setError(null); setInterpretation(null); setInterpretationError(null);
    setAwaitingJudgment(false); setReveal(null); setShareOpen(false);
  }, []);

  /* ── 渲染 ── */

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[var(--color-bg,#080713)] text-[var(--color-text,#f6efff)]">
        <p className="text-[var(--color-accent,#d9b46a)]">加载中...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-[var(--color-bg,#080713)] px-4 text-center text-[var(--color-text,#f6efff)]">
        <p className="text-[var(--color-text-secondary,rgba(246,239,255,0.72))]">请先登录后开始占卜</p>
        <Link href="/login" className="rounded-full border border-[var(--color-accent,#d9b46a)] px-6 py-2 font-[family-name:var(--font-noto-serif)] text-[var(--color-accent,#d9b46a)] transition-colors hover:bg-[var(--color-accent,#d9b46a)] hover:text-[#15101f]">前往登录</Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[var(--color-bg,#080713)] px-3 py-4 text-[var(--color-text,#f6efff)] sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_6%,rgba(217,180,106,0.12),transparent_34%),radial-gradient(circle_at_75%_42%,rgba(126,87,194,0.14),transparent_30%),radial-gradient(circle_at_18%_78%,rgba(217,180,106,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:48px_48px]" />

      <MobileTopHeader />
      <MobileOracleBanner />

      <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 sm:grid-cols-[250px_minmax(0,1fr)_280px] sm:gap-5">
        <DesktopLeftRail />

        <main className="min-h-[690px] overflow-hidden rounded-[2rem] border border-[var(--color-border,rgba(217,180,106,0.18))] bg-[var(--color-bg-card,rgba(18,14,38,0.72))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <AnimatePresence mode="wait">
                <motion.h1
                  key={phase}
                  className="font-[family-name:var(--font-noto-serif)] text-2xl tracking-[0.16em] text-[var(--color-text,#f6efff)] sm:text-3xl"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {phase === "idle" ? "摇卦占卜" : phase === "shaking" ? "占卜流程" : "卦象解读"}
                </motion.h1>
              </AnimatePresence>
              <p className="mt-2 text-sm text-[var(--color-text-secondary,rgba(246,239,255,0.62))]">
                {phase === "idle" ? "写下所问之事，再以六爻观其趋向。" : `当前进度：第 ${lineCount}/6 爻`}
              </p>
            </div>

            {isMockMode() && <span className="w-fit rounded-full border border-[var(--color-accent,#d9b46a)]/25 px-3 py-1 text-[10px] tracking-[0.2em] text-[var(--color-accent,#d9b46a)]">MOCK 模式</span>}
          </div>

          {/* IDLE */}
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative flex min-h-[560px] flex-col items-center justify-center gap-6 overflow-hidden rounded-[2rem]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[url('/images/anime/velvet-bg.webp')] bg-cover bg-center opacity-50" />
                <div className="relative flex h-52 w-52 items-center justify-center sm:h-64 sm:w-64">
                  <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle,rgba(217,180,106,0.16),rgba(141,91,255,0.14)_45%,transparent_72%)] blur-xl" />
                  <div className="absolute bottom-5 left-1/2 h-14 w-44 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(70,38,101,0.52)_0%,rgba(38,18,61,0.38)_48%,transparent_76%)] blur-[2px]" />
                  <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
                    <Image
                      src="/images/anime/turtle-shell-shake.webp"
                      alt="占卜龟壳"
                      width={512}
                      height={512}
                      className="relative z-10 h-full w-full object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.38)]"
                      unoptimized
                      priority
                    />
                  </motion.div>
                </div>
                <div className="w-full max-w-xl">
                  <QuestionInput question={question} onQuestionChange={setQuestion} onSubmit={() => { if (question.trim()) setPhase("shaking"); }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SHAKING */}
          <AnimatePresence>
            {phase === "shaking" && (
              <motion.div key="shaking" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex w-full flex-col items-center gap-4">
                <TurtleShake onLineRevealed={handleLineRevealed} onComplete={handleShakeComplete} collectedLines={collectedLines} />

                <AnimatePresence>
                  {awaitingJudgment && (
                    <motion.div key="awaiting" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 rounded-3xl border border-[var(--color-border,rgba(217,180,106,0.18))] bg-black/15 px-6 py-5">
                      <p className="font-[family-name:var(--font-noto-serif)] text-sm text-[var(--color-text,#f6efff)]">推演天机...</p>
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <motion.span key={i} className="inline-block h-2 w-2 rounded-full bg-[var(--color-accent,#d9b46a)]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6 }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* JUDGMENT + EXPANDED */}
          <AnimatePresence>
            {(phase === "judgment" || phase === "expanded") && (
              <motion.div key="judgment-area" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex w-full flex-col items-center gap-4 pt-4">
                {error && (
                  <div className="mx-auto w-full max-w-lg rounded-3xl border border-[var(--color-border,rgba(217,180,106,0.18))] bg-[var(--color-bg-card,rgba(18,14,38,0.72))] p-6 text-center">
                    <p className="mb-4 text-[var(--color-accent,#d9b46a)]">{error}</p>
                    <button onClick={handleRetry} className="cursor-pointer rounded-full border border-[var(--color-accent,#d9b46a)] px-6 py-2 font-[family-name:var(--font-noto-serif)] text-[var(--color-accent,#d9b46a)] transition-colors hover:bg-[var(--color-accent,#d9b46a)] hover:text-[#15101f]">重新占卜</button>
                  </div>
                )}

                {!error && result && (
                  <>
                    <JudgmentCard
                      phase={phase === "judgment" ? "judgment" : "judgment"}
                      hexagramName={result.hexagram.name}
                      rarity={result.hexagram.rarity}
                      judgment={result.judgment}
                      onExpand={handleExpand}
                      onRetry={handleRetry}
                      canExpand={true}
                      onShare={() => setShareOpen(true)}
                    />

                    <AnimatePresence>
                      {phase === "expanded" && (
                        <motion.div key="interpretation" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="w-full overflow-hidden">
                          <InterpretationSection data={interpretation} loading={loadingInterpretation} error={interpretationError} />
                          {interpretation && (
                            <div className="flex flex-wrap items-center justify-center gap-4 pb-4">
                              <button onClick={() => setShareOpen(true)} className="cursor-pointer rounded-full border border-[var(--color-accent,#d9b46a)]/45 px-5 py-1.5 text-sm text-[var(--color-accent,#d9b46a)] transition-colors hover:bg-[var(--color-accent,#d9b46a)] hover:text-[#15101f] font-[family-name:var(--font-body)]">生成分享图</button>
                              <button onClick={() => setPhase("judgment")} className="cursor-pointer text-sm text-[var(--color-accent,#d9b46a)] transition-colors hover:text-[var(--color-text,#f6efff)] font-[family-name:var(--font-body)]">[收起]</button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <DesktopRightRail collectedLines={collectedLines} />
      </div>

      {/* 卦名揭晓：大字居中，稀有度配色，2.5s 后淡出 */}
      <AnimatePresence>
        {reveal && (
          <motion.div
            key="hexagram-reveal"
            className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(8,7,19,0.82),rgba(8,7,19,0.55)_60%,transparent_85%)]" />
            <motion.p
              className="relative font-[family-name:var(--font-noto-serif)] text-5xl tracking-[0.24em] sm:text-7xl"
              style={{
                color: RARITY_STYLE[reveal.rarity]?.color ?? "#f6efff",
                textShadow: `0 0 32px ${RARITY_STYLE[reveal.rarity]?.glow ?? "rgba(246,239,255,0.3)"}, 0 4px 18px rgba(0,0,0,0.5)`,
              }}
              initial={{ opacity: 0, scale: 0.82, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
            >
              {reveal.name}
            </motion.p>
            <motion.span
              className="relative rounded-full border px-4 py-1.5 font-[family-name:var(--font-noto-serif)] text-sm tracking-[0.3em]"
              style={{
                color: RARITY_STYLE[reveal.rarity]?.color ?? "#f6efff",
                borderColor: `${RARITY_STYLE[reveal.rarity]?.color ?? "#f6efff"}66`,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              {reveal.rarity}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 判词分享图预览层（P1-1） */}
      {result && (
        <ShareCard
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          hexagramName={result.hexagram.name}
          rarity={result.hexagram.rarity}
          judgment={result.judgment}
          lines={collectedLines.map((l) => ({
            position: l.position,
            type: l.type,
            changing: l.changing,
          }))}
        />
      )}

      <div className="relative mt-4 sm:hidden">
        <LinesPanel collectedLines={collectedLines} />
      </div>
    </div>
  );
}

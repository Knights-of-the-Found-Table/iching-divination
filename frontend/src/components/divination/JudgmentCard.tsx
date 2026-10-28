"use client";

/**
 * 判词展示卡片
 *
 * 两种状态：
 * 1. AWAITING — 正在等待 LLM 判词，"⋯ 推演天机 ⋯" 加载态（三点脉冲动画）
 * 2. JUDGMENT — 判词逐字浮现（typewriter 效果）
 *
 * 包含稀有度标签、查看详细解读 / 再次占卜按钮。
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import RarityEffect, { type Rarity } from "./RarityEffect";

/* =========================================================================
 * 类型定义
 * ========================================================================= */

/** JudgmentCard 组件属性 */
export interface JudgmentCardProps {
  /** 当前状态：awaiting 或 judgment */
  phase: "awaiting" | "judgment";
  /** 卦名 */
  hexagramName: string;
  /** 稀有度 */
  rarity: Rarity;
  /** 判词全文（phase=judgment 时可用） */
  judgment: string;
  /** 点击"查看详细解读" */
  onExpand: () => void;
  /** 点击"再次占卜" */
  onRetry: () => void;
  /** 是否有解卦数据（控制"查看详细解读"是否可点击） */
  canExpand?: boolean;
}

/* =========================================================================
 * 子组件：AWAITING 加载态
 * ========================================================================= */

/** 三点脉冲动画 */
function AwaitingDots() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <p className="font-[family-name:var(--font-noto-serif)] text-lg text-ink">
        ⋯ 推演天机 ⋯
      </p>
      {/* 三点依次亮起 */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block w-2 h-2 rounded-full bg-gold"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
 * 子组件：稀有度徽章
 * ========================================================================= */

/** 各等级视觉配置 */
const RARITY_BADGE_CONFIG: Record<
  Rarity,
  { icon: string; text: string; className: string; breathing?: boolean }
> = {
  大吉: {
    icon: "✦",
    text: "大吉",
    className:
      "border-[#d4af37]/80 bg-[#d4af37]/10 text-[#b8912f] shadow-[0_0_14px_rgba(212,175,55,0.4)]",
    breathing: true,
  },
  吉: {
    icon: "✧",
    text: "吉",
    className:
      "border-[#c4a97d]/70 bg-[#c4a97d]/8 text-[#a8843f] shadow-[0_0_8px_rgba(196,169,125,0.25)]",
    breathing: true,
  },
  中平: {
    icon: "◇",
    text: "中平",
    className: "border-ink-light/25 text-ink-light/80",
  },
  慎: {
    icon: "☾",
    text: "慎",
    className: "border-[#8d7fb8]/40 bg-[#8d7fb8]/8 text-[#7a6a9e]",
  },
};

/** 稀有度徽章：图标 + 文字；大吉带星星闪烁，大吉/吉带呼吸发光 */
function RarityBadge({ rarity }: { rarity: Rarity }) {
  const { icon, text, className, breathing } = RARITY_BADGE_CONFIG[rarity];

  const badge = (
    <span
      className={`relative inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-[family-name:var(--font-body)] tracking-wider ${className}`}
    >
      <span className="text-[11px] leading-none">{icon}</span>
      {text}
      {/* 大吉专属：两颗闪烁小星星 */}
      {rarity === "大吉" && (
        <>
          <motion.span
            aria-hidden="true"
            className="absolute -right-1 -top-1 text-[8px] text-[#d4af37]"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            ✦
          </motion.span>
          <motion.span
            aria-hidden="true"
            className="absolute -bottom-1 -left-1 text-[8px] text-[#d4af37]"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: 0.8, ease: "easeInOut" }}
          >
            ✦
          </motion.span>
        </>
      )}
    </span>
  );

  /* 中平 / 慎：静态徽章，干净克制 */
  if (!breathing) return badge;

  /* 大吉 / 吉：微弱呼吸发光 */
  return (
    <motion.span
      className="inline-block"
      animate={{ opacity: [0.82, 1, 0.82], scale: [1, 1.05, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      {badge}
    </motion.span>
  );
}

/** 稀有度对应图片 */
const RARITY_IMAGE: Record<Rarity, string> = {
  大吉: "/images/anime/rarity-great-fortune.webp",
  吉: "/images/anime/rarity-good-fortune.webp",
  中平: "/images/anime/rarity-neutral.webp",
  慎: "/images/anime/rarity-caution.webp",
};

/* =========================================================================
 * 主组件
 * ========================================================================= */

/** 字符显示速度配置 */
const CHAR_SPEED = 50; // 基础速度（ms/字）
const PUNCTUATION_PAUSE: Record<string, number> = {
  "。": 300,
  "，": 150,
  "；": 200,
  "：": 200,
  "\n": 400,
  "！": 250,
  "？": 250,
  "、": 100,
};

/**
 * 判词卡片。
 *
 * AWAITING 阶段显示加载动画；JUDGMENT 阶段执行 typewriter 效果。
 * 外层由 RarityEffect 包裹以展示稀有度视觉差异。
 */
export default function JudgmentCard({
  phase,
  hexagramName,
  rarity,
  judgment,
  onExpand,
  onRetry,
  canExpand = true,
}: JudgmentCardProps) {
  /** 已显示的字符数（typewriter 进度） */
  const [displayedCount, setDisplayedCount] = useState(0);
  /** typewriter 是否已完成 */
  const [typewriterDone, setTypewriterDone] = useState(false);
  /** 计时器引用 */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 下一个字符的延迟（根据字符类型变化） */
  const delayRef = useRef<number>(CHAR_SPEED);

  /* 重置 typewriter 当判词变化 */
  useEffect(() => {
    setDisplayedCount(0);
    setTypewriterDone(false);
  }, [judgment]);

  /* Typewriter 逐字动画 */
  useEffect(() => {
    if (phase !== "judgment" || !judgment || displayedCount >= judgment.length) {
      if (displayedCount >= judgment.length && judgment.length > 0) {
        setTypewriterDone(true);
      }
      return;
    }

    const char = judgment[displayedCount];
    delayRef.current = PUNCTUATION_PAUSE[char] ?? CHAR_SPEED;

    timerRef.current = setTimeout(() => {
      setDisplayedCount((prev) => prev + 1);
    }, delayRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, judgment, displayedCount]);

  /** 已完成文本 */
  const visibleText = judgment.slice(0, displayedCount);

  return (
    <RarityEffect rarity={rarity} className="w-full max-w-lg mx-auto">
      <div className="p-6 sm:p-8">
        {/* 等待态 */}
        {phase === "awaiting" && <AwaitingDots />}

        {/* 判词展示 */}
        {phase === "judgment" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* 卦名 + 稀有度图片标签 */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <h3
                className="font-[family-name:var(--font-noto-serif)] text-xl text-ink"
                style={
                  rarity === "大吉"
                    ? {
                        animation: "daji-name-float 2s ease-in-out infinite",
                        color: "#b8912f",
                        textShadow: "0 0 16px rgba(212,175,55,0.5)",
                      }
                    : rarity === "吉"
                      ? {
                          animation: "ji-brightness 1.5s ease-in-out infinite alternate",
                          color: "#a8843f",
                          textShadow: "0 0 10px rgba(196,169,125,0.35)",
                        }
                      : rarity === "慎"
                        ? { color: "#6b5d8a" }
                        : {}
                }
              >
                {rarity === "大吉" && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                    className="mr-1 inline-block"
                  >
                    ✨
                  </motion.span>
                )}
                {hexagramName}
              </h3>
              <Image
                src={RARITY_IMAGE[rarity]}
                alt={rarity}
                width={200}
                height={100}
                className="h-14 w-auto object-contain"
                unoptimized
              />
            </div>

            {/* 判词正文 — typewriter 效果 */}
            <div
              className="font-[family-name:var(--font-noto-serif)] text-lg sm:text-xl leading-[2.0] text-ink whitespace-pre-line"
              aria-label={judgment}
            >
              {visibleText}
              {!typewriterDone && (
                <motion.span
                  className="inline-block w-[2px] h-[1em] bg-gold ml-[1px] align-text-bottom"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </div>

            {/* 判词完成后显示按钮 */}
            <AnimatePresence>
              {typewriterDone && (
                <motion.div
                  className="flex items-center justify-center gap-6 mt-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* 查看详细解读 */}
                  <motion.button
                    onClick={onExpand}
                    disabled={!canExpand}
                    whileHover={canExpand ? { scale: 1.03 } : {}}
                    whileTap={canExpand ? { scale: 0.97 } : {}}
                    className={`rounded border px-5 py-2 font-[family-name:var(--font-noto-serif)] text-sm
                      transition-all duration-300
                      ${
                        canExpand
                          ? "border-gold text-gold hover:bg-gold hover:text-ivory cursor-pointer"
                          : "border-warning/30 text-warning cursor-not-allowed"
                      }`}
                  >
                    查看详细解读
                  </motion.button>

                  {/* 再次占卜 */}
                  <motion.button
                    onClick={onRetry}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded border border-ink-light/30 px-5 py-2
                      font-[family-name:var(--font-noto-serif)] text-sm text-ink-light
                      hover:border-ink-light hover:text-ink
                      transition-all duration-300 cursor-pointer"
                  >
                    再次占卜
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </RarityEffect>
  );
}

"use client";

/**
 * 卦象收集册
 *
 * 以 8×8 网格展示六十四卦的收集进度：
 * - 已收集：金色卦象符号 + 卦名 + 首次收集日期，点击展开该卦的全部判词
 * - 未收集：灰色半透明占位
 * - 顶部显示 "已收集 X/64" 与进度条
 *
 * 数据由父组件（Dashboard）从 GET /api/divination?limit=100 拉取后传入。
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HEXAGRAMS_64 } from "@/lib/hexagrams";

/* =========================================================================
 * 类型定义
 * ========================================================================= */

/** 一条可计入收集册的占卜记录 */
export interface CollectionRecord {
  id: string;
  /** 本卦卦名（与 HEXAGRAMS_64 中的 name 匹配） */
  hexagramName: string;
  question: string;
  judgment: string | null;
  rarity: string;
  createdAt: string;
}

interface HexagramCollectionProps {
  records: CollectionRecord[];
}

/** 单个卦的收集信息 */
interface CollectedInfo {
  /** 首次收集时间（ISO） */
  firstAt: string;
  /** 收集次数 */
  count: number;
  /** 该卦的全部记录（时间倒序） */
  records: CollectionRecord[];
}

/* =========================================================================
 * 工具函数
 * ========================================================================= */

/** ISO 时间 → "2026.07.18" */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** 详情面板中的稀有度小标签样式 */
const RARITY_CHIP: Record<string, string> = {
  大吉: "border-gold/60 text-gold",
  吉: "border-purple-400/50 text-purple-600",
  中平: "border-blue-400/50 text-blue-600",
  慎: "border-ink-light/30 text-ink-light/70",
};

/* =========================================================================
 * 主组件
 * ========================================================================= */

export default function HexagramCollection({ records }: HexagramCollectionProps) {
  /** 当前展开详情的卦名 */
  const [selected, setSelected] = useState<string | null>(null);

  /** 按卦名聚合收集信息 */
  const collected = useMemo(() => {
    const map = new Map<string, CollectedInfo>();
    for (const r of records) {
      const existing = map.get(r.hexagramName);
      if (existing) {
        existing.count += 1;
        existing.records.push(r);
        if (new Date(r.createdAt).getTime() < new Date(existing.firstAt).getTime()) {
          existing.firstAt = r.createdAt;
        }
      } else {
        map.set(r.hexagramName, { firstAt: r.createdAt, count: 1, records: [r] });
      }
    }
    return map;
  }, [records]);

  const collectedCount = collected.size;
  const selectedInfo = selected ? collected.get(selected) : undefined;
  const selectedHex = selected
    ? HEXAGRAMS_64.find((h) => h.name === selected)
    : undefined;

  return (
    <section>
      {/* 标题 + 进度 */}
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-[family-name:var(--font-noto-serif)] text-lg text-ink">
          卦象收集册
        </h2>
        <p className="text-sm text-warning">
          已收集{" "}
          <span className="font-[family-name:var(--font-noto-serif)] text-base text-gold">
            {collectedCount}
          </span>
          /64
        </p>
      </div>

      {/* 进度条 */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-diviner">
        <motion.div
          className="h-full rounded-full bg-gold"
          initial={{ width: 0 }}
          animate={{ width: `${(collectedCount / 64) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* 64 卦网格 */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {HEXAGRAMS_64.map((h) => {
          const info = collected.get(h.name);
          const isSelected = selected === h.name;

          /* 未收集：灰色半透明占位 */
          if (!info) {
            return (
              <div
                key={h.id}
                className="flex flex-col items-center rounded border border-ink-light/15 px-1 py-2 opacity-40"
                title={`${h.name} · 未收集`}
              >
                <span className="text-xl leading-none text-ink-light/50">
                  {h.symbol}
                </span>
                <span className="mt-1 w-full truncate text-center text-[10px] text-ink-light/60">
                  {h.name}
                </span>
                <span className="mt-0.5 text-[9px] text-ink-light/40">未收集</span>
              </div>
            );
          }

          /* 已收集：金色高亮，可点击展开 */
          return (
            <motion.button
              key={h.id}
              type="button"
              onClick={() => setSelected(isSelected ? null : h.name)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className={`flex cursor-pointer flex-col items-center rounded border px-1 py-2 transition-colors ${
                isSelected
                  ? "border-gold bg-gold/15 shadow-[0_0_10px_rgba(196,169,125,0.25)]"
                  : "border-gold/40 bg-gold/5 hover:border-gold"
              }`}
              title={`${h.name} · ${formatDate(info.firstAt)} 首次收集`}
            >
              <span className="text-xl leading-none text-gold">{h.symbol}</span>
              <span className="mt-1 w-full truncate text-center text-[10px] text-ink">
                {h.name}
              </span>
              <span className="mt-0.5 text-[9px] text-warning">
                {formatDate(info.firstAt)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* 已收集卦象详情：历史判词列表 */}
      <AnimatePresence>
        {selected && selectedInfo && selectedHex && (
          <motion.div
            key={selected}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded border border-gold/40 bg-diviner p-5 shadow-sm">
              {/* 详情头部 */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none text-gold">
                    {selectedHex.symbol}
                  </span>
                  <div>
                    <p className="font-[family-name:var(--font-noto-serif)] text-ink">
                      {selected}
                    </p>
                    <p className="text-xs text-warning">
                      共得 {selectedInfo.count} 次 · 首次 {formatDate(selectedInfo.firstAt)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="cursor-pointer text-xs text-warning underline underline-offset-2 transition-colors hover:text-ink-light"
                >
                  收起
                </button>
              </div>

              {/* 判词列表 */}
              <div className="space-y-3">
                {selectedInfo.records.map((r) => (
                  <div
                    key={r.id}
                    className="rounded border border-ink-light/15 bg-ivory/60 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 flex-1 truncate text-sm text-ink">
                        &ldquo;{r.question}&rdquo;
                      </p>
                      <span
                        className={`flex-shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${
                          RARITY_CHIP[r.rarity] ?? RARITY_CHIP["中平"]
                        }`}
                      >
                        {r.rarity}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-line font-[family-name:var(--font-noto-serif)] text-sm leading-6 text-ink-light">
                      {r.judgment ?? "判词生成中..."}
                    </p>
                    <p className="mt-1.5 text-[10px] text-warning">
                      {formatDate(r.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

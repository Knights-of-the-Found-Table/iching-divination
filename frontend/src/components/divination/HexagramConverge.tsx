"use client";

/**
 * 成卦汇聚动画（P2-2）
 *
 * 六爻完成后、卦名揭晓层出现前的过渡动画：
 * 1. 已摇出的 6 条爻线从右侧依次飞入屏幕中央，自下而上堆叠成完整卦象（带光轨）
 * 2. 堆叠完成后整卦发光脉冲一次
 * 3. 卦象缩小上移，交由外层显示卦名揭晓层（接现有揭晓流程）
 *
 * 总时长约 2.6s；点击任意处可跳过（立即回调 onDone）。
 * 爻线的阴阳/动爻属性与右侧「已得爻位」面板一致（由父组件传入同一份 collectedLines）。
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/* =========================================================================
 * 类型与常量
 * ========================================================================= */

export interface ConvergeLine {
  position: number; // 1~6，1 = 初爻
  type: "yang" | "yin";
  changing: boolean;
}

interface HexagramConvergeProps {
  lines: ConvergeLine[];
  /** 动画自然结束或被跳过时回调（父组件收起本层并进入揭晓） */
  onDone: () => void;
}

/** 各阶段时长（ms）：5 次错峰 + 飞入 + 脉冲 + 收势 ≈ 2.6s */
const STAGGER = 220;
const FLY = 480;
const PULSE = 520;
const SETTLE = 460;

const YANG_COLOR = "#d9b46a";
const YIN_COLOR = "#b8a9d6";

/* =========================================================================
 * 子组件：单条爻线（含飞行光轨）
 * ========================================================================= */

function FlyingLine({
  line,
  index,
  stage,
}: {
  line: ConvergeLine;
  index: number;
  stage: "fly" | "pulse" | "settle";
}) {
  const color = line.type === "yang" ? YANG_COLOR : YIN_COLOR;
  const isYang = line.type === "yang";
  /* 自下而上：初爻在最下 */
  const fromBottom = 6 - line.position;

  return (
    <motion.div
      className="absolute left-1/2 flex w-60 items-center justify-center"
      style={{ bottom: `calc(50% - 158px + ${fromBottom * 26}px)`, marginLeft: "-7.5rem" }}
      initial={{ x: 300, opacity: 0, filter: "blur(4px)" }}
      animate={{
        x: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: {
          delay: index * STAGGER,
          duration: FLY / 1000,
          ease: [0.16, 1, 0.3, 1],
        },
      }}
    >
      <div className="relative flex h-5 w-60 items-center justify-center">
        {/* 光轨：飞行时跟随线尾的渐变彗尾 */}
        <motion.span
          className="absolute right-0 h-1.5 w-24 rounded-full"
          style={{ background: `linear-gradient(to left, transparent, ${color})` }}
          initial={{ opacity: 0, x: 90 }}
          animate={{ opacity: [0, 0.85, 0], x: 90 }}
          transition={{ delay: index * STAGGER, duration: FLY / 1000, ease: "easeOut" }}
        />

        {/* 爻线本体：阳爻实线 / 阴爻断线 */}
        {isYang ? (
          <span
            className="h-1.5 w-52 rounded-full"
            style={{ background: color, boxShadow: `0 0 14px ${color}88` }}
          />
        ) : (
          <span className="flex w-52 items-center justify-between">
            <span className="h-1.5 w-24 rounded-full" style={{ background: color, boxShadow: `0 0 14px ${color}88` }} />
            <span className="h-1.5 w-24 rounded-full" style={{ background: color, boxShadow: `0 0 14px ${color}88` }} />
          </span>
        )}

        {/* 动爻标记 */}
        {line.changing && (
          <motion.span
            className="absolute -right-6 text-xs"
            style={{ color: "#ffd76a", textShadow: "0 0 10px rgba(255,215,106,0.9)" }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * STAGGER + FLY / 1000, duration: 0.3 }}
          >
            ✦
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

/* =========================================================================
 * 主组件
 * ========================================================================= */

export default function HexagramConverge({ lines, onDone }: HexagramConvergeProps) {
  /** 动画阶段：fly（逐爻飞入）→ pulse（整卦发光）→ settle（缩小上移） */
  const [stage, setStage] = useState<"fly" | "pulse" | "settle">("fly");
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  };

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage("pulse"), (lines.length - 1) * STAGGER + FLY),
      setTimeout(() => setStage("settle"), (lines.length - 1) * STAGGER + FLY + PULSE),
      setTimeout(finish, (lines.length - 1) * STAGGER + FLY + PULSE + SETTLE),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.length]);

  return (
    <motion.div
      key="hexagram-converge"
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      onClick={finish}
      role="button"
      aria-label="成卦汇聚动画，点击跳过"
    >
      {/* 暗色聚焦底 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(8,7,19,0.86),rgba(8,7,19,0.6)_58%,rgba(8,7,19,0.25)_85%)]" />

      {/* 卦象堆叠（整体脉冲 + 缩小上移） */}
      <motion.div
        className="relative"
        animate={
          stage === "pulse"
            ? { scale: [1, 1.05, 1], filter: ["brightness(1)", "brightness(1.75)", "brightness(1)"] }
            : stage === "settle"
              ? { scale: 0.66, y: -110, opacity: 0.85 }
              : {}
        }
        transition={{ duration: (stage === "pulse" ? PULSE : SETTLE) / 1000, ease: "easeInOut" }}
        style={{ width: 240, height: 320 }}
      >
        {lines.slice(0, 6).map((line, i) => (
          <FlyingLine key={line.position} line={line} index={i} stage={stage} />
        ))}
      </motion.div>

      {/* 跳过提示 */}
      <motion.p
        className="absolute bottom-10 text-xs tracking-[0.3em] text-[var(--color-text-secondary,rgba(246,239,255,0.45))]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        点击任意处跳过
      </motion.p>
    </motion.div>
  );
}

"use client";

/**
 * 龟壳摇卦动画组件（v2.1 - 占卜流程视觉重设计）
 *
 * 核心逻辑保持不变：
 * 每次点击触发一爻 → 模拟三钱抛掷 → 回传 LineResult → 第 6 爻后调用 onComplete。
 */

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

/* =========================================================================
 * 类型定义
 * ========================================================================= */

/** 单爻结果 */
export interface LineResult {
  position: number;       // 1~6，1=初爻
  positionName: string;   // "初爻"~"上爻"
  type: "yang" | "yin";
  typeName: string;       // "少阳" / "少阴" / "老阳" / "老阴"
  value: number;          // 7/8/9/6
  changing: boolean;      // 老阳或老阴
}

/** TurtleShake 组件属性 */
export interface TurtleShakeProps {
  /** 每摇出一爻时回调 */
  onLineRevealed: (line: LineResult) => void;
  /** 六爻全部完成后回调 */
  onComplete: () => void;
  /** 已摇出的爻列表（由父组件管理，用于展示进度） */
  collectedLines?: LineResult[];
}

type CoinFace = "front" | "back";

interface VisualCoin {
  id: number;
  face: CoinFace;
  rotate: number;
  x: number;
  delay: number;
}

/* =========================================================================
 * 常量
 * ========================================================================= */

const LINE_NAMES = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

const TYPE_NAMES: Record<number, string> = {
  6: "老阴",
  7: "少阳",
  8: "少阴",
  9: "老阳",
};

const SHAKE_DURATION = 0.4;

/* =========================================================================
 * 工具函数
 * ========================================================================= */

/** 模拟三钱抛掷，返回 6/7/8/9 */
function castOneLine(): number {
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    sum += Math.random() < 0.5 ? 3 : 2;
  }
  return sum;
}

function randomCoinSet(seed = Date.now()): VisualCoin[] {
  return [0, 1, 2].map((i) => ({
    id: seed + i,
    face: Math.random() < 0.5 ? "front" : "back",
    rotate: Math.round(Math.random() * 30 - 15),
    x: (i - 1) * 46 + Math.round(Math.random() * 12 - 6),
    delay: i * 0.15,
  }));
}

/* =========================================================================
 * 子组件：新素材
 * ========================================================================= */

function VelvetBase() {
  return (
    <div className="pointer-events-none absolute bottom-10 left-1/2 z-[2] h-20 w-52 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(70,38,101,0.58)_0%,rgba(38,18,61,0.42)_42%,rgba(217,180,106,0.12)_60%,transparent_76%)] blur-[2px] sm:bottom-14 sm:h-28 sm:w-72" />
  );
}

function CoinSet({ coins, droppedCoinCount }: { coins: VisualCoin[]; droppedCoinCount: number }) {
  return (
    <div className="relative h-20 w-40 sm:h-24 sm:w-48">
      {coins.slice(0, droppedCoinCount).map((coin) => (
        <motion.div
          key={coin.id}
          className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 sm:h-14 sm:w-14"
          style={{ x: coin.x, rotate: coin.rotate }}
          initial={{ y: -80, opacity: 0, scale: 0.68, filter: "blur(3px)" }}
          animate={{ y: 24, opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 110, damping: 20 }}
        >
          <Image
            src={coin.face === "front" ? "/images/anime/coin-front.webp" : "/images/anime/coin-back.webp"}
            alt={coin.face === "front" ? "铜钱正面" : "铜钱反面"}
            width={112}
            height={112}
            className="h-full w-full object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.38)]"
            unoptimized
          />
        </motion.div>
      ))}
    </div>
  );
}

function LineToast({ line }: { line: LineResult }) {
  const color = line.type === "yang" ? "#d9b46a" : "#b8a9d6";
  const glow = line.changing
    ? `0 0 18px ${color}, 0 0 42px ${color}66, 0 6px 24px rgba(0,0,0,0.45)`
    : `0 0 10px ${color}55, 0 6px 20px rgba(0,0,0,0.4)`;

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-5 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-sm sm:top-7 sm:px-5 sm:py-2.5"
      style={{
        borderColor: `${color}88`,
        backgroundColor: "rgba(21,16,31,0.72)",
        boxShadow: glow,
      }}
      initial={{ opacity: 0, scale: 0.5, y: -12 }}
      animate={{ opacity: 1, scale: [0.5, 1.1, 1], y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -16, transition: { duration: 0.45, ease: "easeIn" } }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <span
        className="font-[family-name:var(--font-noto-serif)] text-sm font-semibold tracking-[0.12em] sm:text-base"
        style={{ color }}
      >
        {line.positionName} · {line.typeName}
      </span>
      {line.changing && (
        <motion.span
          className="text-sm sm:text-base"
          style={{ color, textShadow: `0 0 8px ${color}` }}
          animate={{ scale: [1, 1.25, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          ★ 动
        </motion.span>
      )}
    </motion.div>
  );
}

/* =========================================================================
 * 主组件
 * ========================================================================= */

export default function TurtleShake({ onLineRevealed, onComplete, collectedLines = [] }: TurtleShakeProps) {
  const [isShaking, setIsShaking] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [landedCoins, setLandedCoins] = useState(0);
  const [droppedCoinCount, setDroppedCoinCount] = useState(0);
  const [isKnocked, setIsKnocked] = useState(false);
  const [visibleCoins, setVisibleCoins] = useState<VisualCoin[]>(() => randomCoinSet(1));
  const [lastToast, setLastToast] = useState<LineResult | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onLineRevealedRef = useRef(onLineRevealed);
  onLineRevealedRef.current = onLineRevealed;

  const handleClick = useCallback(() => {
    if (isShaking || isDone) return;

    const startsNextLine = droppedCoinCount === 3;
    const nextDroppedCoinCount = startsNextLine ? 1 : droppedCoinCount + 1;

    if (startsNextLine) {
      setVisibleCoins(randomCoinSet());
      setDroppedCoinCount(0);
    }

    setIsKnocked(true);
    setTimeout(() => setIsKnocked(false), 200);
    setIsShaking(true);

    // 每次触碰只落下一枚铜钱；第三枚落定后才生成这一爻。
    setTimeout(() => {
      setDroppedCoinCount(nextDroppedCoinCount);

      // 等铜钱弹落定后，才允许下一次触碰或揭示爻象。
      setTimeout(() => {
        setIsShaking(false);

        if (nextDroppedCoinCount !== 3) return;

        const value = castOneLine();
        const pos = landedCoins; // 0~5
        const line: LineResult = {
          position: pos + 1,
          positionName: LINE_NAMES[pos],
          type: value === 7 || value === 9 ? "yang" : "yin",
          typeName: TYPE_NAMES[value],
          value,
          changing: value === 6 || value === 9,
        };

        setLandedCoins((prev) => prev + 1);
        onLineRevealedRef.current(line);
        setLastToast(line);
        setTimeout(() => setLastToast(null), 2100);

        if (pos + 1 >= 6) {
          setTimeout(() => {
            setIsDone(true);
            onCompleteRef.current();
          }, 600);
        }
      }, 450);
    }, SHAKE_DURATION * 1000 + 200);
  }, [isShaking, isDone, landedCoins, droppedCoinCount]);

  const currentIndex = Math.min(landedCoins + 1, 6);
  const statusText = isDone
    ? "卦象已成，正在推演"
    : isShaking
      ? `龟纹震荡中 · 第 ${currentIndex}/6 爻`
      : landedCoins === 0
        ? "轻触龟壳开始第一爻"
        : `轻触龟壳开始${LINE_NAMES[landedCoins]} · 第 ${currentIndex}/6 爻`;

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 px-2 py-3 text-[var(--color-text,#f6efff)] sm:gap-6 sm:px-4 sm:py-6">
      <div className="relative flex min-h-[280px] w-full max-w-[520px] flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-[url('/images/anime/velvet-bg.webp')] bg-cover bg-center bg-no-repeat sm:min-h-[430px]">
        <div className="relative z-10 flex flex-col items-center pt-4 sm:pt-2">
          <motion.button
            type="button"
            aria-label="轻触龟壳开始下一爻"
            className="group relative z-30 flex h-44 w-44 cursor-pointer items-center justify-center rounded-full outline-none disabled:cursor-not-allowed sm:h-60 sm:w-60"
            onClick={handleClick}
            disabled={isShaking || isDone}
            whileHover={isShaking || isDone ? {} : { scale: 1.03 }}
            whileTap={isShaking || isDone ? {} : { scale: 0.96 }}
            animate={{
              scale: isKnocked ? 0.96 : [1, 1.04, 1],
              rotate: isShaking ? [0, -3, 4, -2, 2, 0] : 0,
            }}
            transition={{
              scale: isKnocked
                ? { duration: 0.18, ease: "easeOut" }
                : { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: SHAKE_DURATION, ease: "easeInOut" },
            }}
          >
            <span className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(217,180,106,0.18)_0%,rgba(94,61,138,0.14)_46%,transparent_72%)] blur-xl transition-opacity group-hover:opacity-90 sm:inset-8" />
            <Image
              src="/images/anime/turtle-shell-shake.webp"
              alt="占卜龟壳"
              width={512}
              height={512}
              className="relative z-10 h-full w-full object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.36)] sm:drop-shadow-[0_22px_38px_rgba(0,0,0,0.4)]"
              unoptimized
              priority
            />
          </motion.button>

        </div>

        <AnimatePresence>
          {lastToast && (
            <LineToast key={lastToast.position} line={lastToast} />
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute left-1/2 top-[68%] z-20 flex -translate-x-1/2 sm:top-[72%]">
          <CoinSet coins={visibleCoins} droppedCoinCount={droppedCoinCount} />
        </div>
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={isShaking || isDone}
        className="sticky bottom-4 z-30 w-full max-w-[280px] rounded-full border border-[var(--color-accent,#d9b46a)]/50 bg-[var(--color-accent,#d9b46a)] px-5 py-2.5 font-[family-name:var(--font-noto-serif)] text-xs font-semibold tracking-[0.16em] text-[#15101f] shadow-[0_14px_40px_rgba(217,180,106,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55 sm:static sm:max-w-[320px] sm:px-6 sm:py-3 sm:text-sm"
      >
        {isDone ? "六爻已成" : isShaking ? "铜钱落定中" : "轻触龟壳开始下一爻"}
      </button>

      <div className="flex items-center justify-center gap-2 pt-1" aria-label={`第 ${landedCoins}/6 爻`}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const completed = i < collectedLines.length;
          const current = !isDone && i === collectedLines.length;
          return (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-all sm:h-2.5 sm:w-2.5 ${
                completed
                  ? "bg-[var(--color-accent,#d9b46a)] shadow-[0_0_12px_rgba(217,180,106,0.65)]"
                  : current
                    ? "scale-125 border border-[var(--color-accent,#d9b46a)] bg-[var(--color-accent,#d9b46a)]/30"
                    : "bg-[var(--color-text-secondary,rgba(246,239,255,0.22))]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

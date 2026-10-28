"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useAuth } from "@/hooks/useAuth";

const hexagrams = ["䷀", "䷁", "䷂", "䷊", "䷖", "䷝", "䷾", "䷿"];
const coinPositions = [
  "left-[7%] top-[22%]",
  "left-[18%] bottom-[18%]",
  "right-[12%] top-[18%]",
  "right-[7%] bottom-[26%]",
  "left-[44%] top-[9%]",
];

function HexLine({ broken = false, delay = 0 }: { broken?: boolean; delay?: number }) {
  return (
    <motion.div
      className="flex h-2.5 w-28 items-center justify-center gap-2 sm:h-3 sm:w-36"
      initial={{ opacity: 0, scaleX: 0.5 }}
      animate={{ opacity: [0.45, 1, 0.6], scaleX: 1 }}
      transition={{ duration: 2.4, delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
    >
      {broken ? (
        <>
          <span className="h-full flex-1 rounded-full bg-[var(--color-accent)] shadow-[0_0_16px_var(--color-accent-soft)]" />
          <span className="h-full flex-1 rounded-full bg-[var(--color-accent)] shadow-[0_0_16px_var(--color-accent-soft)]" />
        </>
      ) : (
        <span className="h-full w-full rounded-full bg-[var(--color-accent)] shadow-[0_0_18px_var(--color-accent-soft)]" />
      )}
    </motion.div>
  );
}

function CopperCoin({ className = "", delay = 0, face = "front" }: { className?: string; delay?: number; face?: "front" | "back" }) {
  return (
    <motion.div
      className={`absolute hidden h-12 w-12 rounded-full sm:block ${className}`}
      animate={{ y: [0, -14, 0], rotateY: [0, 180, 360], opacity: [0.35, 0.9, 0.35] }}
      transition={{ duration: 5.8, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <Image
        src={face === "front" ? "/images/anime/coin-front.webp" : "/images/anime/coin-back.webp"}
        alt={face === "front" ? "铜钱正面" : "铜钱反面"}
        width={96}
        height={96}
        className="h-full w-full object-contain drop-shadow-[0_0_22px_rgba(184,124,52,0.28)]"
        unoptimized
      />
    </motion.div>
  );
}

export default function HeroSectionAlt() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  return (
    <section
      className="relative isolate min-h-[760px] overflow-hidden px-5 py-16 text-[var(--color-text)] sm:min-h-[820px] sm:px-8 lg:px-12 lg:py-24"
      style={
        {
          "--color-bg": "#080713",
          "--color-bg-deep": "#03020a",
          "--color-surface": "rgba(18, 14, 38, 0.72)",
          "--color-surface-strong": "rgba(34, 23, 62, 0.84)",
          "--color-text": "#f6efff",
          "--color-text-muted": "#bdb1d8",
          "--color-accent": "#d9b46a",
          "--color-accent-soft": "rgba(217, 180, 106, 0.58)",
          "--color-oracle": "#9a7cff",
          "--color-oracle-soft": "rgba(154, 124, 255, 0.42)",
          "--color-crystal": "#8feaff",
          "--color-crystal-soft": "rgba(143, 234, 255, 0.42)",
          "--color-coin": "#b87934",
          "--color-coin-bright": "#f2cb7b",
          "--color-coin-dark": "#5c3519",
        } as CSSProperties
      }
    >
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_66%_38%,rgba(143,234,255,0.16),transparent_28%),radial-gradient(circle_at_20%_18%,rgba(154,124,255,0.18),transparent_30%),linear-gradient(135deg,var(--color-bg-deep),var(--color-bg)_45%,#13091f)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25 [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />

      {coinPositions.map((position, index) => (
        <CopperCoin key={position} className={position} delay={index * 0.45} face={index % 2 === 0 ? "front" : "back"} />
      ))}

      <div className="absolute left-1/2 top-8 hidden -translate-x-1/2 items-center gap-5 text-[var(--color-accent)]/45 sm:flex">
        {hexagrams.map((symbol, index) => (
          <motion.span
            key={symbol}
            className="text-3xl font-serif"
            animate={{ opacity: [0.22, 0.82, 0.22], y: [0, -8, 0] }}
            transition={{ duration: 4.6, delay: index * 0.22, repeat: Infinity, ease: "easeInOut" }}
          >
            {symbol}
          </motion.span>
        ))}
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.88fr_1.12fr]">
        <motion.div
          className="relative z-10 order-2 mx-auto flex max-w-xl flex-col items-center text-center lg:order-1 lg:mx-0 lg:items-start lg:text-left"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-[var(--color-accent)]/25 bg-[var(--color-surface)] px-4 py-2 text-xs tracking-[0.32em] text-[var(--color-accent)] shadow-[0_0_36px_rgba(217,180,106,0.12)] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_12px_var(--color-accent)]" />
            六爻灵视 · 铜钱起卦
          </div>

          <h1 className="font-[family-name:var(--font-noto-serif)] text-5xl font-semibold leading-[0.95] tracking-[0.08em] text-[var(--color-text)] sm:text-7xl lg:text-8xl">
            向幽微处
            <span className="mt-3 block bg-[linear-gradient(92deg,var(--color-accent),var(--color-crystal),var(--color-oracle))] bg-clip-text text-transparent">
              问一卦
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-[var(--color-text-muted)] sm:text-lg">
铜钱落下，阴阳成线。让灵龟之甲映出当下的势，六爻卦象替你把混沌折成可读的方向。
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
            <motion.button
              type="button"
              onClick={() => router.push(isLoggedIn ? "/divination" : "/login")}
              className="group relative overflow-hidden rounded-full border border-[var(--color-accent)]/45 bg-[linear-gradient(135deg,var(--color-accent),#9b5e28)] px-9 py-4 font-[family-name:var(--font-noto-serif)] text-base font-semibold tracking-[0.18em] text-[#160d09] shadow-[0_0_32px_var(--color-accent-soft)]"
              whileHover={{ scale: 1.045, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">免费开始占卜</span>
            </motion.button>

            <div className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-[var(--color-text-muted)] backdrop-blur-md">
              <span className="text-[var(--color-accent)]">䷗</span> 少阴、少阳、老阴、老阳
            </div>
          </div>

          <div className="mt-10 grid w-full max-w-md grid-cols-3 gap-3 text-center sm:gap-4 lg:text-left">
            {["铜钱", "六亲", "变爻"].map((item, index) => (
              <motion.div
                key={item}
                className="rounded-2xl border border-white/10 bg-[var(--color-surface)] p-4 backdrop-blur-md"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 + index * 0.12 }}
              >
                <div className="text-2xl text-[var(--color-accent)]">{["◌", "✦", "☯"][index]}</div>
                <div className="mt-2 text-sm tracking-[0.18em] text-[var(--color-text-muted)]">{item}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="relative order-1 mx-auto h-[510px] w-full max-w-[620px] lg:order-2 lg:h-[640px] lg:max-w-none"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.12, ease: "easeOut" }}
        >
          <motion.div
            className="absolute left-1/2 top-[8%] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_50%,var(--color-crystal-soft),transparent_60%)] blur-3xl sm:h-[470px] sm:w-[470px]"
            animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.94, 1.08, 0.94] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute left-1/2 top-[8%] h-[340px] w-[340px] -translate-x-1/2 rounded-full border border-[var(--color-crystal)]/30 bg-[radial-gradient(circle_at_34%_25%,rgba(255,255,255,0.78),rgba(143,234,255,0.32)_18%,rgba(154,124,255,0.18)_42%,rgba(5,9,24,0.34)_72%)] shadow-[inset_0_0_42px_rgba(255,255,255,0.22),0_0_80px_var(--color-crystal-soft)] sm:h-[430px] sm:w-[430px]"
            animate={{ y: [0, -14, 0], rotate: [0, 1.5, -1.5, 0] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/images/anime/turtle-shell-shake.webp"
              alt="发光龟壳"
              fill
              sizes="(max-width: 640px) 340px, 430px"
              className="object-contain opacity-90 drop-shadow-[0_0_42px_var(--color-crystal-soft)]"
              priority
              unoptimized
            />
            <motion.div
              className="absolute inset-[12%] rounded-full border border-white/25"
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute left-1/2 top-0 -translate-x-1/2 text-2xl text-[var(--color-accent)]">䷀</span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl text-[var(--color-accent)]">䷁</span>
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl text-[var(--color-accent)]">䷊</span>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-2xl text-[var(--color-accent)]">䷋</span>
            </motion.div>
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-3 opacity-90">
              {[false, true, false, true, true, false].map((broken, index) => (
                <HexLine key={index} broken={broken} delay={index * 0.16} />
              ))}
            </div>
          </motion.div>

          <div className="absolute left-1/2 top-[68%] h-16 w-[340px] -translate-x-1/2 rounded-[50%] bg-black/45 blur-xl sm:w-[460px]" />
          <div className="absolute left-1/2 top-[64%] h-16 w-[290px] -translate-x-1/2 rounded-[50%] border border-[var(--color-accent)]/30 bg-[linear-gradient(180deg,rgba(217,180,106,0.24),rgba(47,26,16,0.86))] sm:w-[410px]" />

          <motion.div
            className="absolute bottom-0 right-[-4%] h-[330px] w-[245px] sm:right-[2%] sm:h-[430px] sm:w-[320px] lg:right-[1%]"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-x-8 bottom-3 h-16 rounded-[50%] bg-[var(--color-oracle-soft)] blur-2xl" />
            <Image
              src="/images/anime/chibi-oracle.webp"
              alt="占卜巫女"
              width={400}
              height={540}
              className="relative z-10 h-full w-full object-contain drop-shadow-[0_0_28px_var(--color-oracle-soft)]"
              priority
              unoptimized
            />
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}

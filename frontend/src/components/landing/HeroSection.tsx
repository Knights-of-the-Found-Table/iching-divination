"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import CrystalBall from "./CrystalBall";

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:py-32 text-center sm:text-left">
      {/* 太极暗纹 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none">
        <span className="text-[20rem] leading-none">☯</span>
      </div>

      <div className="relative mx-auto max-w-6xl flex flex-col sm:flex-row items-center gap-8 sm:gap-16">
        {/* 左边文字 */}
        <motion.div
          className="flex-1 flex flex-col items-center sm:items-start gap-4"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-ink font-[family-name:var(--font-noto-serif)] text-5xl sm:text-6xl lg:text-7xl leading-none tracking-wide">
            六爻
          </h1>
          <p className="text-ink-light font-[family-name:var(--font-body)] text-lg sm:text-xl max-w-md">
            以铜钱问天，以卦象观心
          </p>

          {/* IKB 蓝 CTA 按钮 + 呼吸发光 */}
          {/* 按钮：白底发光层 + 蓝底纹按钮 + 星标 */}
          <motion.div
            className="relative mt-4 inline-flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <button
              onClick={() => router.push("/divination")}
              className="relative z-10 flex items-center gap-3 rounded-full px-10 py-3.5 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #00208A 0%, #002FA7 40%, #0037C8 100%)",
                boxShadow: "0 2px 12px rgba(0,47,167,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* 左星标 */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="white" opacity="0.9">
                <polygon points="7,0 8.5,4.5 13,5.5 9.5,8.5 10.5,13 7,10.5 3.5,13 4.5,8.5 1,5.5 5.5,4.5" />
              </svg>
              <span
                className="font-[family-name:var(--font-noto-serif)] text-base font-medium tracking-wider"
                style={{ color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
              >
                免费开始占卜
              </span>
              {/* 右星标 */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="white" opacity="0.9">
                <polygon points="7,0 8.5,4.5 13,5.5 9.5,8.5 10.5,13 7,10.5 3.5,13 4.5,8.5 1,5.5 5.5,4.5" />
              </svg>
            </button>

            {/* 白色发光下层 */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(ellipse at center, rgba(255,255,255,0.25) 0%, transparent 70%)",
                filter: "blur(12px)",
                transform: "scale(1.15)",
              }}
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>

        {/* 右边：水晶球（全站视觉锚点） */}
        <motion.div
          className="flex-1 flex items-center justify-center"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CrystalBall />
        </motion.div>
      </div>
    </section>
  );
}

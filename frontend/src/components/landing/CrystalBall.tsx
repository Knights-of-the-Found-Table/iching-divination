"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const TRIGRAMS = ["☰", "☷", "☵", "☳", "☴", "☶", "☱"];

export default function CrystalBall() {
  return (
    <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
      {/* 外层光晕 */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(180,140,255,0.15) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 八卦符号环绕 */}
      {TRIGRAMS.map((symbol, i) => {
        const angle = (i / TRIGRAMS.length) * Math.PI * 2;
        const radius = 120; // orbit radius on desktop
        const smRadius = 150;
        return (
          <motion.span
            key={symbol}
            className="absolute text-lg sm:text-xl select-none pointer-events-none"
            style={{
              color: "var(--color-accent)",
              opacity: 0.6,
              textShadow: "0 0 8px rgba(240,192,96,0.3)",
            }}
            animate={{
              x: [
                Math.cos(angle) * radius * 0.8,
                Math.cos(angle + Math.PI * 2) * radius * 0.8,
              ],
              y: [
                Math.sin(angle) * radius * 0.8,
                Math.sin(angle + Math.PI * 2) * radius * 0.8,
              ],
            }}
            transition={{
              duration: 8 + i * 0.5,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {symbol}
          </motion.span>
        );
      })}

      {/* 水晶球主体 */}
      <motion.div
        className="relative z-10 w-48 h-48 sm:w-56 sm:h-56"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/images/anime/crystal-ball.webp"
          alt="水晶球"
          width={512}
          height={512}
          className="object-contain drop-shadow-[0_0_24px_rgba(180,140,255,0.4)]"
          unoptimized
          priority
        />
      </motion.div>

      {/* 底部底座 */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-2 sm:h-3 rounded-full z-10"
        style={{
          background: "linear-gradient(180deg, rgba(180,140,255,0.3), transparent)",
        }}
      />
    </div>
  );
}

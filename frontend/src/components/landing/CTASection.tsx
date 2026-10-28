"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function CTASection() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  return (
    <section className="px-4 py-32 text-center">
      <h2 className="mb-8 font-[family-name:var(--font-noto-serif)] text-2xl" style={{ color: "var(--color-text)" }}>
        准备好了吗？
      </h2>
      <motion.button
        onClick={() => router.push(isLoggedIn ? "/divination" : "/login")}
        className="inline-block rounded-full border px-10 py-4 font-[family-name:var(--font-noto-serif)] text-lg tracking-wider transition-colors duration-300"
        style={{
          borderColor: "var(--color-accent)",
          color: "var(--color-accent)",
          background: "transparent",
          fontWeight: 600,
          letterSpacing: "0.05em",
        }}
        animate={{
          boxShadow: [
            "0 0 0px rgba(240,192,96,0)",
            "0 0 18px rgba(240,192,96,0.4)",
            "0 0 0px rgba(240,192,96,0)",
          ],
        }}
        transition={{
          boxShadow: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
        }}
        whileHover={{
          scale: 1.05,
          boxShadow: "0 0 28px rgba(240,192,96,0.55)",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-bg)",
        }}
        whileTap={{ scale: 0.97 }}
      >
        开始占卜
      </motion.button>
    </section>
  );
}

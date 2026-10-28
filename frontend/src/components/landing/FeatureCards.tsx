"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const IconWisdom = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="7" r="2.2" opacity="0.9" />
    <circle cx="12" cy="17" r="2.2" />
    <path d="M12 1a11 11 0 0 0 0 22 11 11 0 0 0 0-22zm0 2a9 9 0 1 1 0 18 9 9 0 0 1 0-18z" opacity="0.3" />
  </svg>
);

const IconGift = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="9" width="18" height="12" rx="2" />
    <line x1="12" y1="9" x2="12" y2="21" />
    <path d="M12 9H7.5a2.5 2.5 0 0 1 0-5C8.5 4 12 6 12 9z" />
    <path d="M12 9h4.5a2.5 2.5 0 0 0 0-5C15.5 4 12 6 12 9z" />
  </svg>
);

const features = [
  { icon: <Image src="/images/anime/icon-ai-divine.webp" alt="AI解卦" width={48} height={48} className="object-contain" unoptimized />, title: "AI解卦", desc: "智能AI解读卦象，为你提供清晰指引与建议" },
  { icon: <IconWisdom />, title: "古老智慧", desc: "传承千年易学智慧，融合现代思维，洞察人生" },
  { icon: <Image src="/images/anime/icon-daily-free.webp" alt="每日免费" width={48} height={48} className="object-contain" unoptimized />, title: "每日免费10次", desc: "每日可免费占卜10次，好运指引常伴左右" },
];

export default function FeatureCards() {
  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="rounded-xl p-6 sm:p-8 text-center border"
            style={{
              borderRadius: "var(--radius-md)",
              borderColor: "var(--color-border)",
              background: "var(--color-bg-card)",
              boxShadow: "var(--shadow-card)",
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <div className="mb-3" style={{ color: "var(--color-accent)" }}>
              {f.icon}
            </div>
            <h3
              className="font-[family-name:var(--font-noto-serif)] text-lg mb-2"
              style={{ color: "var(--color-text)" }}
            >
              {f.title}
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

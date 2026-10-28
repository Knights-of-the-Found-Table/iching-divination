"use client";

import { motion } from "framer-motion";

export interface QuestionInputProps {
  question: string;
  onQuestionChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const MAX_LENGTH = 200;

export default function QuestionInput({
  question,
  onQuestionChange,
  onSubmit,
  disabled = false,
}: QuestionInputProps) {
  const isSubmitDisabled = disabled || question.trim().length === 0;

  return (
    <motion.div
      className="w-full max-w-md mx-auto px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h2
        className="mb-6 text-center font-[family-name:var(--font-noto-serif)] text-lg"
        style={{ color: "var(--color-text-secondary, rgba(246,239,255,0.7))" }}
      >
        请默念你所问之事
      </h2>

      <div className="relative mb-5">
        <textarea
          value={question}
          onChange={(e) => {
            if (e.target.value.length <= MAX_LENGTH) onQuestionChange(e.target.value);
          }}
          placeholder="例如：我今年的事业发展如何？"
          disabled={disabled}
          rows={3}
          className="w-full resize-none rounded-2xl px-4 py-3.5 font-[family-name:var(--font-noto-serif)] text-base leading-relaxed outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: "var(--color-text, #f6efff)",
            background: "rgba(0,0,0,0.2)",
            border: `1px solid var(--color-border, rgba(217,180,106,0.18))`,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--color-accent, #d9b46a)";
            e.target.style.boxShadow = "0 0 16px rgba(217,180,106,0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--color-border, rgba(217,180,106,0.18))";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span
          className="text-xs font-[family-name:var(--font-body)]"
          style={{ color: "var(--color-text-secondary, rgba(246,239,255,0.5))" }}
        >
          {question.length}/{MAX_LENGTH}
        </span>

        <motion.button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className="rounded-full px-7 py-2.5 font-[family-name:var(--font-noto-serif)] text-sm font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={{
            border: `1.5px solid var(--color-accent, #d9b46a)`,
            color: isSubmitDisabled ? "var(--color-text-secondary)" : "var(--color-accent, #d9b46a)",
            background: "transparent",
          }}
          whileHover={isSubmitDisabled ? {} : { scale: 1.03 }}
          whileTap={isSubmitDisabled ? {} : { scale: 0.97 }}
        >
          开始摇卦
        </motion.button>
      </div>
    </motion.div>
  );
}

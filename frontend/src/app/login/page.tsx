"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_RE = /^1\d{10}$/;

function IdentifierInput({
  value,
  onChange,
  disabled,
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const isFloating = focused || value.length > 0;

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={focused && !value ? "your@email.com 或 13800138000" : ""}
        disabled={disabled}
        autoComplete="username"
        autoFocus
        className="peer w-full bg-transparent px-2 pt-5 pb-2 font-[family-name:var(--font-body)] text-base outline-none transition-all duration-300 placeholder:text-[#9b8bb8]"
        style={{
          color: "var(--color-text, #f6efff)",
          borderBottom: hasError
            ? "2px solid #ef4444"
            : "1px solid var(--color-accent, #d9b46a)",
        }}
        onFocus={(event) => {
          setFocused(true);
          if (!hasError) {
            event.target.style.borderBottom =
              "2px solid var(--color-accent, #d9b46a)";
            event.target.style.boxShadow =
              "0 8px 18px -16px rgba(217,180,106,0.9)";
          }
        }}
        onBlur={(event) => {
          setFocused(false);
          if (!hasError) {
            event.target.style.borderBottom =
              "1px solid var(--color-accent, #d9b46a)";
            event.target.style.boxShadow = "none";
          }
        }}
      />
      <span
        className="pointer-events-none absolute left-2 z-10 font-[family-name:var(--font-body)] text-sm transition-all duration-200"
        style={{
          top: isFloating ? "4px" : "18px",
          fontSize: isFloating ? "0.7rem" : "0.9rem",
          color: isFloating
            ? hasError
              ? "#ef4444"
              : "var(--color-accent, #d9b46a)"
            : "var(--color-text-secondary, #b8a9d6)",
          opacity: isFloating ? 0.8 : 0.5,
        }}
      >
        邮箱/手机号
      </span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { simpleLogin } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [hasFieldError, setHasFieldError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): string | null {
    const value = identifier.trim();
    if (!value) {
      setHasFieldError(true);
      return "请输入邮箱或手机号";
    }
    if (value.includes("@") && !EMAIL_RE.test(value)) {
      setHasFieldError(true);
      return "邮箱格式不正确";
    }
    if (!value.includes("@") && !PHONE_RE.test(value)) {
      setHasFieldError(true);
      return "手机号格式不正确（需为1开头的11位数字）";
    }
    setHasFieldError(false);
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await simpleLogin(identifier.trim());
      router.push("/dashboard");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "进入失败，请稍后重试",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-12"
      style={{
        backgroundColor: "var(--color-bg, #080713)",
        backgroundImage:
          "radial-gradient(circle at 50% 18%, rgba(217,180,106,0.14), transparent 28%), radial-gradient(circle at 12% 82%, rgba(112,72,180,0.16), transparent 32%), linear-gradient(rgba(8,7,19,0.82), rgba(8,7,19,0.9)), url('/images/anime/velvet-bg.webp')",
        backgroundSize: "auto, auto, auto, cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute -left-12 top-10 font-[family-name:var(--font-noto-serif)] text-[13rem] leading-none text-[#d9b46a]/[0.035] sm:left-8">
        ☯
      </div>
      <div className="pointer-events-none absolute -right-16 bottom-0 font-[family-name:var(--font-noto-serif)] text-[16rem] leading-none text-[#d9b46a]/[0.03]">
        ☯
      </div>
      <motion.div
        className="relative w-full max-w-[420px] overflow-hidden rounded-lg p-8 sm:p-10"
        style={{
          background: "var(--color-bg-card, rgba(18,14,38,0.72))",
          border:
            "1px solid color-mix(in srgb, var(--color-accent, #d9b46a) 38%, transparent)",
          borderRadius: "var(--radius-md, 22px)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.48), 0 0 32px rgba(217,180,106,0.12)",
          backdropFilter: "blur(18px)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d9b46a]/60 to-transparent" />
        <img
          src="/images/anime/crystal-ball.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none mx-auto mb-3 h-10 w-10 object-contain opacity-90 drop-shadow-[0_0_16px_rgba(217,180,106,0.38)]"
        />
        <h1 className="mb-1 bg-gradient-to-b from-[#fff4c8] via-[var(--color-accent,#d9b46a)] to-[#8d6532] bg-clip-text text-center font-[family-name:var(--font-noto-serif)] text-4xl leading-tight text-transparent">
          六爻
        </h1>
        <p
          className="mb-8 text-center font-[family-name:var(--font-body)] text-lg"
          style={{ color: "var(--color-text-secondary, #b8a9d6)" }}
        >
          登录或创建账号
        </p>
        <p
          className="-mt-6 mb-6 text-center text-xs"
          style={{
            color: "var(--color-text-secondary, #b8a9d6)",
            opacity: 0.6,
          }}
        >
          输入邮箱或手机号即可进入
        </p>

        {error && (
          <motion.p
            className="mb-5 rounded-md border border-red-400/40 bg-red-950/30 px-4 py-2.5 text-center text-sm"
            style={{ color: "#fecaca" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <IdentifierInput
            value={identifier}
            onChange={setIdentifier}
            disabled={isSubmitting}
            hasError={hasFieldError}
          />

          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 w-full cursor-pointer rounded-full py-3 font-[family-name:var(--font-noto-serif)] text-base font-semibold tracking-[0.18em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              border: "1px solid var(--color-accent, #d9b46a)",
              color: "var(--color-bg, #080713)",
              background:
                "linear-gradient(135deg, #fff1b8 0%, var(--color-accent, #d9b46a) 48%, #8d6532 100%)",
            }}
            animate={{
              boxShadow: [
                "0 0 10px rgba(217,180,106,0.18)",
                "0 0 24px rgba(217,180,106,0.48)",
                "0 0 10px rgba(217,180,106,0.18)",
              ],
            }}
            transition={{
              boxShadow: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
            }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 0 32px rgba(217,180,106,0.62)",
              backgroundColor: "var(--color-accent, #d9b46a)",
              color: "var(--color-bg, #080713)",
            }}
            whileTap={{ scale: 0.97 }}
          >
            {isSubmitting ? "进入中..." : "进 入"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

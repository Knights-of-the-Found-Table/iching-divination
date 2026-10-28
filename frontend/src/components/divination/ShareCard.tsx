"use client";

/**
 * 判词分享图生成（P1-1）
 *
 * 纯客户端 Canvas 绘制竖版分享图（750×1334，暗夜金纹风格），不依赖后端：
 * - 顶部：卦名大字 + 稀有度标签
 * - 中部：本卦六线图形（自绘：阳爻实线 / 阴爻断线 / 动爻带 ✦ 标记）+ 判词全文
 * - 底部：回纹装饰 + 「六爻 · 6yao.seedestiny.com.cn」
 *
 * 预览层提供「保存图片」（<a download>）与「复制链接」；
 * 图片为普通 <img src=dataURL>，移动端长按可直接保存。
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* =========================================================================
 * 类型定义
 * ========================================================================= */

/** 分享图所需的单爻信息（与 LineResult 解耦，便于复用） */
export interface ShareLine {
  /** 1~6，1 = 初爻（画在最低处） */
  position: number;
  type: "yang" | "yin";
  changing: boolean;
}

export interface ShareCardProps {
  open: boolean;
  onClose: () => void;
  hexagramName: string;
  rarity: string;
  judgment: string;
  lines: ShareLine[];
}

/* =========================================================================
 * 画布常量
 * ========================================================================= */

const W = 750;
const H = 1334;

/** 稀有度配色（与占卜页揭晓层一致） */
const RARITY_COLOR: Record<string, string> = {
  大吉: "#ffd76a",
  吉: "#e8b45c",
  中平: "#f6efff",
  慎: "#a58bd8",
};

const GOLD = "#d9b46a";
const GOLD_DIM = "rgba(217, 180, 106, 0.45)";
const INK = "#e8e0d5";

const SITE_LINE = "六爻 · 6yao.seedestiny.com.cn";

/* =========================================================================
 * 绘制工具
 * ========================================================================= */

/** 获取页面实际加载的宋体族（next/font 注入的 --font-noto-serif） */
function getSerifFamily(): string {
  if (typeof window === "undefined") return '"Noto Serif SC", serif';
  const v = getComputedStyle(document.body)
    .getPropertyValue("--font-noto-serif")
    .trim();
  return v ? `${v}, "Noto Serif SC", serif` : '"Noto Serif SC", serif';
}

/**
 * 按最大宽度折行。保留显式 \n 分段；中文逐字断行，英文/数字按词聚合。
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) {
      out.push(""); // 空行保留段落间距
      continue;
    }
    let line = "";
    let lastBreakable = -1; // line 中最后一个可断位置（英文词边界后）
    for (const ch of paragraph) {
      const next = line + ch;
      if (ctx.measureText(next).width > maxWidth && line) {
        if (lastBreakable > 0) {
          out.push(line.slice(0, lastBreakable));
          line = line.slice(lastBreakable).replace(/^\s+/, "") + ch;
        } else {
          out.push(line);
          line = ch;
        }
        lastBreakable = -1;
      } else {
        line = next;
        if (/[a-zA-Z0-9]/.test(ch)) {
          if (lastBreakable < 0) lastBreakable = line.length - 1;
        } else {
          lastBreakable = -1;
        }
      }
    }
    if (line) out.push(line);
  }
  return out;
}

/** 自底向上绘制一条爻。y 为该爻中线。 */
function drawLine(
  ctx: CanvasRenderingContext2D,
  line: ShareLine,
  centerX: number,
  y: number,
  barWidth: number,
  barHeight: number,
) {
  const color = GOLD;
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(217, 180, 106, 0.35)";
  ctx.shadowBlur = 12;

  if (line.type === "yang") {
    roundRect(ctx, centerX - barWidth / 2, y - barHeight / 2, barWidth, barHeight, barHeight / 2);
    ctx.fill();
  } else {
    const seg = (barWidth - 26) / 2;
    roundRect(ctx, centerX - barWidth / 2, y - barHeight / 2, seg, barHeight, barHeight / 2);
    ctx.fill();
    roundRect(ctx, centerX + barWidth / 2 - seg, y - barHeight / 2, seg, barHeight, barHeight / 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  /* 动爻标记：右侧金色 ✦ 菱形星 */
  if (line.changing) {
    const sx = centerX + barWidth / 2 + 34;
    drawDiamond(ctx, sx, y, 9, line.type === "yang" ? "#ffd76a" : "#b8a9d6");
  }
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillRect(-r / 2, -r / 2, r, r);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 背景星点（每次生成随机撒点，数量固定） */
function drawStars(ctx: CanvasRenderingContext2D, count: number) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.4 + 0.4;
    ctx.fillStyle = `rgba(232, 224, 213, ${Math.random() * 0.35 + 0.08})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 底部回纹装饰：一串菱形连锁 */
function drawMeander(ctx: CanvasRenderingContext2D, centerX: number, y: number) {
  const span = 26;
  const n = 13;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x = centerX + (i - (n - 1) / 2) * span;
    drawDiamond(ctx, x, y, i === (n - 1) / 2 ? 9 : 5, i === (n - 1) / 2 ? GOLD : GOLD_DIM);
  }
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - ((n - 1) / 2) * span - 60, y);
  ctx.lineTo(centerX - ((n - 1) / 2) * span - 16, y);
  ctx.moveTo(centerX + ((n - 1) / 2) * span + 16, y);
  ctx.lineTo(centerX + ((n - 1) / 2) * span + 60, y);
  ctx.stroke();
  ctx.restore();
}

/** 金色双线边框 + 四角饰纹 */
function drawFrame(ctx: CanvasRenderingContext2D) {
  const m = 26;
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 2;
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  ctx.strokeStyle = "rgba(217, 180, 106, 0.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(m + 8, m + 8, W - (m + 8) * 2, H - (m + 8) * 2);

  /* 四角饰纹：角内小菱形 */
  const c = m + 8;
  for (const [cx, cy] of [
    [c, c],
    [W - c, c],
    [c, H - c],
    [W - c, H - c],
  ]) {
    drawDiamond(ctx, cx + 14 * Math.sign(W / 2 - cx), cy + 14 * Math.sign(H / 2 - cy), 7, GOLD_DIM);
  }
}

/* =========================================================================
 * 主绘制函数
 * ========================================================================= */

function renderShareCanvas(
  canvas: HTMLCanvasElement,
  opts: { hexagramName: string; rarity: string; judgment: string; lines: ShareLine[] },
): string {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const serif = getSerifFamily();
  const rarityColor = RARITY_COLOR[opts.rarity] ?? "#f6efff";

  /* ── 背景：暗夜渐变 + 星点 + 顶部金色辉光 ── */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0b0817");
  bg.addColorStop(0.45, "#16102b");
  bg.addColorStop(1, "#0b0817");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 150, 0, W / 2, 150, 420);
  glow.addColorStop(0, "rgba(217, 180, 106, 0.16)");
  glow.addColorStop(1, "rgba(217, 180, 106, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 620);

  drawStars(ctx, 90);
  drawFrame(ctx);

  /* ── 顶部：卦名 + 稀有度标签 ── */
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.font = `700 68px ${serif}`;
  ctx.fillStyle = rarityColor;
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 0;
  ctx.fillText(opts.hexagramName, W / 2, 175);

  /* 稀有度胶囊 */
  ctx.font = `400 26px ${serif}`;
  const label = `— ${opts.rarity} —`;
  const labelW = ctx.measureText(label).width + 56;
  roundRect(ctx, W / 2 - labelW / 2, 205, labelW, 46, 23);
  ctx.strokeStyle = rarityColor;
  ctx.globalAlpha = 0.65;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = rarityColor;
  ctx.fillText(label, W / 2, 238);

  /* ── 中部：本卦六线（初爻在底，自下而上） ── */
  const centerX = W / 2;
  const barWidth = 320;
  const barHeight = 20;
  const gap = 16;
  const hexCenterY = 400;
  for (const line of opts.lines.slice(0, 6)) {
    /* position 1 = 初爻 = 最低 */
    const y = hexCenterY + ((6 - line.position) - 2.5) * (barHeight + gap);
    drawLine(ctx, line, centerX, y, barWidth, barHeight);
  }

  /* 分隔饰线 */
  drawMeander(ctx, W / 2, 548);

  /* ── 判词全文：自动选号，保证不截断 ── */
  const textLeft = 86;
  const textWidth = W - textLeft * 2;
  const textTop = 600;
  const textBottom = H - 165;
  const avail = textBottom - textTop;

  const candidates = [27, 25, 23, 21, 19, 17, 16, 15, 14, 13];
  let fontSize = 13;
  let lineHeight = 13 * 1.9;
  let wrapped: string[] = [];
  for (const size of candidates) {
    ctx.font = `400 ${size}px ${serif}`;
    lineHeight = size * 1.9;
    wrapped = wrapText(ctx, opts.judgment.trim(), textWidth);
    const total = wrapped.length * lineHeight;
    if (total <= avail) {
      fontSize = size;
      break;
    }
    fontSize = size; /* 全都放不下时用最小号 */
  }

  ctx.font = `400 ${fontSize}px ${serif}`;
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  let y = textTop + fontSize;
  for (const text of wrapped) {
    if (y > textBottom + lineHeight) break; /* 极端兜底，正常路径不会触发 */
    if (text) ctx.fillText(text, textLeft, y);
    y += lineHeight;
  }
  ctx.textAlign = "center";

  /* ── 底部：装饰纹样 + 站点名 ── */
  drawMeander(ctx, W / 2, H - 108);
  ctx.font = `400 26px ${serif}`;
  ctx.fillStyle = GOLD;
  ctx.fillText(SITE_LINE, W / 2, H - 58);

  return canvas.toDataURL("image/jpeg", 0.92);
}

/* =========================================================================
 * 主组件
 * ========================================================================= */

export default function ShareCard({
  open,
  onClose,
  hexagramName,
  rarity,
  judgment,
  lines,
}: ShareCardProps) {
  const [dataUrl, setDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  /* 打开时生成图片；等待 webfont 就绪后再绘制，避免衬线字体缺字 */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setDataUrl("");

    (async () => {
      try {
        await document.fonts.ready;
      } catch {
        /* 字体 API 不可用时直接绘制 */
      }
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      const url = renderShareCanvas(canvas, { hexagramName, rarity, judgment, lines });
      if (!cancelled) setDataUrl(url);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, hexagramName, rarity, judgment, lines]);

  /* 每次打开重置复制态 */
  useEffect(() => {
    if (open) setCopied(false);
  }, [open]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 剪贴板不可用（非安全上下文等），静默失败 */
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* 遮罩：点击空白处关闭 */}
          <button
            type="button"
            aria-label="关闭分享图"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-[rgba(8,7,19,0.82)] backdrop-blur-sm"
          />

          <motion.div
            className="relative flex max-h-full w-full max-w-sm flex-col items-center gap-4 overflow-hidden
              rounded-[1.75rem] border border-[var(--color-accent,#d9b46a)]/35 bg-[var(--color-bg-card,rgba(18,14,38,0.92))]
              p-5 shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
            initial={{ scale: 0.92, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          >
            <p className="font-[family-name:var(--font-noto-serif)] text-base tracking-[0.14em] text-[var(--color-text,#f6efff)]">
              分享图已生成
            </p>

            {/* 预览图：普通 img，移动端长按即可保存 */}
            <div className="flex min-h-[280px] w-full flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black/25">
              {dataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={dataUrl}
                  alt={`${hexagramName}判词分享图`}
                  className="max-h-[52vh] w-auto max-w-full object-contain"
                  style={{ WebkitTouchCallout: "default" } as React.CSSProperties}
                />
              ) : (
                <span className="text-sm text-[var(--color-text-secondary,rgba(246,239,255,0.6))]">
                  正在绘制卦象...
                </span>
              )}
            </div>

            <div className="flex w-full flex-wrap items-center justify-center gap-3">
              {dataUrl && (
                <a
                  href={dataUrl}
                  download={`六爻-${hexagramName}.jpg`}
                  className="rounded-full border border-[var(--color-accent,#d9b46a)] px-5 py-2
                    font-[family-name:var(--font-noto-serif)] text-sm text-[var(--color-accent,#d9b46a)]
                    transition-colors hover:bg-[var(--color-accent,#d9b46a)] hover:text-[#15101f]"
                >
                  保存图片
                </a>
              )}
              <button
                type="button"
                onClick={handleCopyLink}
                className="cursor-pointer rounded-full border border-[var(--color-border,rgba(217,180,106,0.25))] px-5 py-2
                  font-[family-name:var(--font-noto-serif)] text-sm text-[var(--color-text-secondary,rgba(246,239,255,0.75))]
                  transition-colors hover:border-[var(--color-accent,#d9b46a)] hover:text-[var(--color-accent,#d9b46a)]"
              >
                {copied ? "已复制 ✓" : "复制链接"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-full px-4 py-2 text-sm text-[var(--color-text-secondary,rgba(246,239,255,0.55))]
                  underline-offset-4 transition-colors hover:text-[var(--color-text,#f6efff)] hover:underline"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

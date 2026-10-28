"use client";

/**
 * 音效系统（P2-1）— Web Audio API
 *
 * 4 个音效：铜钱落定 / 摇壳 / 成卦揭晓 / 判词出现，文件在 public/sounds/。
 * - AudioContext 必须在首次用户手势（点击龟壳）时创建或 resume，规避自动播放限制
 * - 静音状态存 localStorage（iching_sounds_muted），默认开启
 */

export type SoundName = "coin" | "shake" | "reveal" | "judgment";

const SOUND_SRC: Record<SoundName, string> = {
  coin: "/sounds/coin-land.mp3",
  shake: "/sounds/shell-shake.mp3",
  reveal: "/sounds/reveal-chime.mp3",
  judgment: "/sounds/judgment-ambient.mp3",
};

const MUTE_KEY = "iching_sounds_muted";

class SoundManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<SoundName, AudioBuffer>();
  private loading = new Set<SoundName>();

  /** 是否静音（localStorage 持久化，默认开启） */
  muted = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.muted = localStorage.getItem(MUTE_KEY) === "1";
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    }
  }

  /**
   * 创建 / 恢复 AudioContext 并预载音效。
   * 必须在用户手势事件处理器中调用（浏览器自动播放策略）。
   */
  async unlock(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
      }
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }
      (Object.keys(SOUND_SRC) as SoundName[]).forEach((name) =>
        this.load(name)
      );
    } catch {
      /* 音频不可用时静默降级为无声 */
    }
  }

  /** 拉取并解码单个音效（幂等） */
  private load(name: SoundName): void {
    if (!this.ctx || this.buffers.has(name) || this.loading.has(name)) return;
    this.loading.add(name);
    fetch(SOUND_SRC[name])
      .then((res) => res.arrayBuffer())
      .then((raw) => this.ctx!.decodeAudioData(raw))
      .then((buf) => {
        this.buffers.set(name, buf);
      })
      .catch(() => {
        /* 解码失败则该音效保持无声 */
      })
      .finally(() => {
        this.loading.delete(name);
      });
  }

  /** 播放音效；未解锁或静音时为空操作 */
  play(name: SoundName, volume = 1): void {
    if (!this.ctx || this.muted) return;
    const buf = this.buffers.get(name);
    if (!buf) {
      this.load(name); // 尚未就绪：顺带预载，本次跳过
      return;
    }
    try {
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      gain.gain.value = volume;
      src.buffer = buf;
      src.connect(gain).connect(this.ctx.destination);
      src.start();
    } catch {
      /* 播放失败静默 */
    }
  }
}

/** 全局单例：页面与组件共享同一 AudioContext 与静音状态 */
export const soundManager = new SoundManager();

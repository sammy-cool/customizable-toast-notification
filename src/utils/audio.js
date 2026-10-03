// src/utils/audio.js
"use strict";

let audioContext = null;
let audioEnabled = true;

/**
 * Lazily initialize and return a shared AudioContext.
 * Returns null in non-browser or unsupported environments.
 */
function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioContext) {
    try {
      audioContext = new AudioCtx();
    } catch {
      return null;
    }
  }

  if (audioContext && audioContext.state === "suspended") {
    // Resume context if suspended by browser autoplay policies
    try {
      audioContext.resume().catch(() => {});
    } catch {}
  }

  return audioContext;
}

/**
 * Synthesizes a pleasant audio chime or tone using pure Web Audio API oscillators.
 * Zero external audio assets or network requests.
 * @param {'success' | 'error' | 'warning' | 'info' | 'pop' | string} toneType
 */
export function playTone(toneType = "info") {
  if (!audioEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const tone = String(toneType || "info").toLowerCase().trim();

    if (tone === "success") {
      // Pleasant rising major chord chime (C5 -> E5 -> G5)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.36);
      });
    } else if (tone === "error") {
      // Subtle two-tone descending soft buzz
      const freqs = [320, 240];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.001, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.23);
      });
    } else if (tone === "warning") {
      // Gentle alert ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(493.88, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Light droplet pop ('info' or 'pop')
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.09);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    }
  } catch {}
}

/**
 * Globally enable or disable synthesized notification sounds.
 * @param {boolean} enabled
 */
export function setAudioEnabled(enabled) {
  audioEnabled = Boolean(enabled);
}

/**
 * Returns current global audio feedback status.
 * @returns {boolean}
 */
export function isAudioEnabled() {
  return audioEnabled;
}

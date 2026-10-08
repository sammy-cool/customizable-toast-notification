// src/utils/audio.js
"use strict";

import { getConfig } from "./config.js";

let audioContext = null;
let audioEnabled = true;

/**
 * Registry for user-defined sound synthesis functions.
 * @type {Map<string, (ctx: AudioContext, toneType: string, now: number) => void>}
 */
const customSoundPresets = new Map();

/**
 * Lazily initialize and return a shared AudioContext.
 * Returns null in non-browser or unsupported environments.
 * @returns {AudioContext | null}
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

let audioAnalyser = null;

/**
 * Returns a shared AnalyserNode for real-time waveform visualization.
 * @returns {AnalyserNode | null}
 */
export function getAudioAnalyser() {
  const ctx = getAudioContext();
  if (!ctx || typeof ctx.createAnalyser !== "function") return null;
  if (!audioAnalyser) {
    try {
      audioAnalyser = ctx.createAnalyser();
      audioAnalyser.fftSize = 128;
      audioAnalyser.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  return audioAnalyser;
}

/**
 * Route node to destination through analyser if available.
 * @param {AudioContext} ctx
 * @param {AudioNode} node
 */
function routeAudio(ctx, node) {
  if (audioAnalyser) {
    node.connect(audioAnalyser);
  } else {
    node.connect(ctx.destination);
  }
}

/**
 * Modern preset: crisp multi-tone chords and pings.
 * @param {AudioContext} ctx
 * @param {string} tone
 * @param {number} now
 */
function playModernPreset(ctx, tone, now) {
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
      routeAudio(ctx, gain);

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
      routeAudio(ctx, gain);

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
    routeAudio(ctx, gain);

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
    routeAudio(ctx, gain);

    osc.start(now);
    osc.stop(now + 0.13);
  }
}

/**
 * Retro 8-bit chip-tune preset: snappy square wave arpeggios and coin blips.
 * @param {AudioContext} ctx
 * @param {string} tone
 * @param {number} now
 */
function playRetroPreset(ctx, tone, now) {
  if (tone === "success") {
    // Rapid 4-note ascending 8-bit fanfare (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      const start = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.042);

      osc.connect(gain);
      routeAudio(ctx, gain);

      osc.start(start);
      osc.stop(start + 0.045);
    });
  } else if (tone === "error") {
    // Retro downward pitch slide (square wave 360Hz down to 90Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    routeAudio(ctx, gain);

    osc.start(now);
    osc.stop(now + 0.23);
  } else if (tone === "warning") {
    // Dual square blip (880Hz -> pause -> 880Hz)
    [0, 0.08].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      const start = now + offset;
      osc.frequency.setValueAtTime(880, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.07, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);

      osc.connect(gain);
      routeAudio(ctx, gain);

      osc.start(start);
      osc.stop(start + 0.055);
    });
  } else {
    // 8-bit coin blip (B5 -> E6)
    const notes = [987.77, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      const start = now + idx * 0.035;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.035);

      osc.connect(gain);
      routeAudio(ctx, gain);

      osc.start(start);
      osc.stop(start + 0.04);
    });
  }
}

/**
 * Futuristic sci-fi preset: resonant frequency modulation sweeps.
 * @param {AudioContext} ctx
 * @param {string} tone
 * @param {number} now
 */
function playFuturisticPreset(ctx, tone, now) {
  if (tone === "success") {
    // Sci-fi power-up sweep (440Hz -> 1760Hz with exponential ramp)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc.connect(gain);
    routeAudio(ctx, gain);

    osc.start(now);
    osc.stop(now + 0.33);
  } else if (tone === "error") {
    // Sci-fi shield down / power drain (880Hz down to 110Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.24);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    routeAudio(ctx, gain);

    osc.start(now);
    osc.stop(now + 0.26);
  } else if (tone === "warning") {
    // Dual resonant harmonic frequency sweep
    const freqs = [580, 870];
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.15, now + 0.1);
      osc.frequency.linearRampToValueAtTime(freq, now + 0.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      routeAudio(ctx, gain);

      osc.start(now);
      osc.stop(now + 0.26);
    });
  } else {
    // Holographic chirp (1100Hz -> 1600Hz -> 750Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.03);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    routeAudio(ctx, gain);

    osc.start(now);
    osc.stop(now + 0.13);
  }
}

/**
 * Subtle preset: low-amplitude micro-transient clicks for professional dashboards.
 * @param {AudioContext} ctx
 * @param {string} tone
 * @param {number} now
 */
function playSubtlePreset(ctx, tone, now) {
  if (tone === "success") {
    // Two rapid soft micro-clicks (750Hz then 1100Hz, 15ms each)
    [750, 1100].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const start = now + idx * 0.04;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.04, start + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.025);

      osc.connect(gain);
      routeAudio(ctx, gain);

      osc.start(start);
      osc.stop(start + 0.03);
    });
  } else if (tone === "error") {
    // Two low muffled micro-thuds (180Hz then 130Hz)
    [180, 130].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      const start = now + idx * 0.05;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.05, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.035);

      osc.connect(gain);
      routeAudio(ctx, gain);

      osc.start(start);
      osc.stop(start + 0.04);
    });
  } else if (tone === "warning") {
    // Single crisp 600Hz transient click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    routeAudio(ctx, gain);

    osc.start(now);
    osc.stop(now + 0.03);
  } else {
    // Single soft 450Hz transient pop (15ms)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(450, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    osc.connect(gain);
    routeAudio(ctx, gain);

    osc.start(now);
    osc.stop(now + 0.025);
  }
}

/**
 * Bell preset: acoustic harmonic bell chime with natural overtone decay.
 * @param {AudioContext} ctx
 * @param {string} tone
 * @param {number} now
 */
function playBellPreset(ctx, tone, now) {
  if (tone === "success") {
    // Harmonic bell chord: Fundamental 659.25Hz (E5) + Overtones
    const harmonics = [659.25, 1318.5, 2637.0];
    harmonics.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      const peakGain = 0.09 / (idx + 1);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc.connect(gain);
      routeAudio(ctx, gain);

      osc.start(now);
      osc.stop(now + 0.58);
    });
  } else if (tone === "error") {
    // Low bell toll: 220Hz + 440Hz with damped decay
    [220, 440].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      const peakGain = 0.1 / (idx + 1);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc.connect(gain);
      routeAudio(ctx, gain);

      osc.start(now);
      osc.stop(now + 0.4);
    });
  } else if (tone === "warning") {
    // Ringing attention bell (880Hz A5)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    routeAudio(ctx, gain);

    osc.start(now);
    osc.stop(now + 0.48);
  } else {
    // Crystal glass ping (1320Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1320, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    routeAudio(ctx, gain);

    osc.start(now);
    osc.stop(now + 0.3);
  }
}

/**
 * Built-in sound preset synthesizer table.
 */
const BUILTIN_PRESETS = {
  modern: playModernPreset,
  retro: playRetroPreset,
  futuristic: playFuturisticPreset,
  subtle: playSubtlePreset,
  bell: playBellPreset,
};

/**
 * Synthesizes a pleasant audio chime or tone using pure Web Audio API oscillators.
 * Zero external audio assets or network requests.
 * @param {'success' | 'error' | 'warning' | 'info' | 'pop' | string} [toneType="info"]
 * @param {'modern' | 'retro' | 'futuristic' | 'subtle' | 'bell' | string} [preset="modern"]
 * @returns {void}
 */
export function playTone(toneType = "info", preset) {
  if (
    typeof window !== "undefined" &&
    window.customizableToast &&
    typeof window.customizableToast.playTone === "function" &&
    window.customizableToast.playTone !== playTone
  ) {
    window.customizableToast.playTone(toneType, preset);
    return;
  }
  if (!audioEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const tone = String(toneType || "info").toLowerCase().trim();
    const activePreset = String(
      preset || getConfig().soundPreset || "modern"
    ).toLowerCase().trim();

    // Check custom synthesizer first
    if (customSoundPresets.has(activePreset)) {
      try {
        const customFn = customSoundPresets.get(activePreset);
        if (typeof customFn === "function") {
          customFn(ctx, tone, now);
          return;
        }
      } catch (err) {
        console.warn("Custom sound preset synthesizer error:", err);
      }
    }

    // Built-in presets with modern fallback
    const synthesizer = BUILTIN_PRESETS[activePreset] || BUILTIN_PRESETS.modern;
    synthesizer(ctx, tone, now);
  } catch {}
}

/**
 * Registers a custom sound synthesis preset.
 * @param {string} name - Name of the preset (e.g. 'arcade')
 * @param {(ctx: AudioContext, toneType: string, now: number) => void} synthesizerFn
 * @returns {boolean} True if successfully registered
 */
export function registerSoundPreset(name, synthesizerFn) {
  if (typeof name !== "string" || !name.trim() || typeof synthesizerFn !== "function") {
    return false;
  }
  const cleanName = name.toLowerCase().trim();
  customSoundPresets.set(cleanName, synthesizerFn);
  return true;
}

/**
 * Returns a list of all currently available sound presets (built-in + custom).
 * @returns {string[]}
 */
export function getSoundPresets() {
  const builtin = Object.keys(BUILTIN_PRESETS);
  const custom = Array.from(customSoundPresets.keys());
  return Array.from(new Set([...builtin, ...custom]));
}

/**
 * Clears custom sound presets (primarily for testing and environment resets).
 * @returns {void}
 */
export function resetSoundPresets() {
  customSoundPresets.clear();
}

/**
 * Globally enable or disable synthesized notification sounds.
 * @param {boolean} enabled
 * @returns {void}
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

/**
 * Resets the cached AudioContext instance (useful for test isolation).
 * @returns {void}
 */
export function resetAudioContext() {
  if (audioContext) {
    try {
      audioContext.close?.().catch?.(() => {});
    } catch {}
  }
  audioContext = null;
  audioAnalyser = null;
}

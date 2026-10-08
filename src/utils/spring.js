// src/utils/spring.js
"use strict";

/**
 * @typedef {Object} SpringConfig
 * @property {number} [stiffness=100] - Spring tension / stiffness constant (k > 0)
 * @property {number} [damping=10] - Damping friction coefficient (c > 0)
 * @property {number} [mass=1] - Inertial mass (m > 0)
 */

/**
 * @typedef {'default' | 'gentle' | 'wobbly' | 'stiff' | 'bouncy' | string} SpringPreset
 */

/**
 * Built-in spring physics presets calibrated for natural UI motion.
 * @type {Record<string, { stiffness: number, damping: number, mass: number, bezierFallback: string }>}
 */
export const SPRING_PRESETS = {
  default: {
    stiffness: 100,
    damping: 10,
    mass: 1,
    bezierFallback: "cubic-bezier(0.34, 1.4, 0.64, 1)",
  },
  gentle: {
    stiffness: 120,
    damping: 14,
    mass: 1,
    bezierFallback: "cubic-bezier(0.25, 1, 0.5, 1)",
  },
  wobbly: {
    stiffness: 180,
    damping: 12,
    mass: 1,
    bezierFallback: "cubic-bezier(0.35, 1.6, 0.55, 1)",
  },
  stiff: {
    stiffness: 210,
    damping: 20,
    mass: 1,
    bezierFallback: "cubic-bezier(0.18, 0.9, 0.32, 1)",
  },
  bouncy: {
    stiffness: 300,
    damping: 15,
    mass: 1.2,
    bezierFallback: "cubic-bezier(0.34, 1.75, 0.5, 1)",
  },
};

/**
 * Registry for user-defined spring configurations.
 * @type {Map<string, { stiffness: number, damping: number, mass: number, bezierFallback?: string }>}
 */
const customSpringPresets = new Map();

/**
 * Register a custom named spring preset.
 * @param {string} name - Unique preset identifier
 * @param {SpringConfig & { bezierFallback?: string }} config - Spring parameters
 */
export function registerSpringPreset(name, config) {
  if (typeof name !== "string" || !name.trim()) {
    throw new TypeError("registerSpringPreset: name must be a non-empty string");
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new TypeError("registerSpringPreset: config must be an object");
  }

  const stiffness = Number(config.stiffness);
  const damping = Number(config.damping);
  const mass = Number(config.mass);

  customSpringPresets.set(name.trim().toLowerCase(), {
    stiffness: Number.isFinite(stiffness) && stiffness > 0 ? stiffness : 100,
    damping: Number.isFinite(damping) && damping > 0 ? damping : 10,
    mass: Number.isFinite(mass) && mass > 0 ? mass : 1,
    bezierFallback:
      typeof config.bezierFallback === "string" && config.bezierFallback.trim()
        ? config.bezierFallback.trim()
        : "cubic-bezier(0.34, 1.4, 0.64, 1)",
  });
}

/**
 * Retrieve list of registered spring preset names.
 * @returns {string[]}
 */
export function getSpringPresets() {
  return [...Object.keys(SPRING_PRESETS), ...customSpringPresets.keys()];
}

/**
 * Reset all registered custom spring presets back to defaults.
 */
export function resetSpringPresets() {
  customSpringPresets.clear();
}

/**
 * Resolves a spring input into concrete numerical physics constants.
 * @param {boolean | SpringPreset | SpringConfig} spring - Preset name or custom parameters
 * @returns {{ stiffness: number, damping: number, mass: number, bezierFallback: string } | null}
 */
export function resolveSpringConfig(spring) {
  if (!spring) return null;

  if (typeof spring === "string") {
    const key = spring.trim().toLowerCase();
    if (customSpringPresets.has(key)) {
      return customSpringPresets.get(key);
    }
    if (Object.prototype.hasOwnProperty.call(SPRING_PRESETS, key)) {
      return SPRING_PRESETS[key];
    }
    return SPRING_PRESETS.default;
  }

  if (spring === true) {
    return SPRING_PRESETS.default;
  }

  if (typeof spring === "object" && !Array.isArray(spring)) {
    const rawStiffness = Number(spring.stiffness);
    const rawDamping = Number(spring.damping);
    const rawMass = Number(spring.mass);

    const stiffness = Number.isFinite(rawStiffness) && rawStiffness > 0 ? rawStiffness : 100;
    const damping = Number.isFinite(rawDamping) && rawDamping > 0 ? rawDamping : 10;
    const mass = Number.isFinite(rawMass) && rawMass > 0 ? rawMass : 1;

    // Dynamically derive appropriate bezier curve fallback based on damping ratio
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));
    let bezierFallback = "cubic-bezier(0.25, 1, 0.5, 1)";
    if (zeta < 0.6) {
      bezierFallback = "cubic-bezier(0.34, 1.7, 0.55, 1)";
    } else if (zeta < 0.85) {
      bezierFallback = "cubic-bezier(0.34, 1.35, 0.64, 1)";
    }

    return {
      stiffness,
      damping,
      mass,
      bezierFallback,
    };
  }

  return null;
}

/**
 * Solves the damped harmonic oscillator step response at time t (in seconds).
 * Returns displacement value y(t) transitioning from 0 to 1.
 *
 * @param {number} t - Time in seconds (t >= 0)
 * @param {{ stiffness: number, damping: number, mass: number }} config
 * @returns {number} Value of step response at time t
 */
export function solveSpring(t, config) {
  if (t <= 0) return 0;

  const k = Math.max(0.001, config.stiffness || 100);
  const c = Math.max(0.001, config.damping || 10);
  const m = Math.max(0.001, config.mass || 1);

  const omega0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));

  if (zeta < 1) {
    // Underdamped: oscillates around target
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega0 * t);
    const oscillation = Math.cos(omegaD * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(omegaD * t);
    return 1 - envelope * oscillation;
  }

  if (Math.abs(zeta - 1) < 1e-5) {
    // Critically damped: fastest convergence with zero overshoot
    return 1 - Math.exp(-omega0 * t) * (1 + omega0 * t);
  }

  // Overdamped: sluggish convergence without oscillation
  const omegaD = omega0 * Math.sqrt(zeta * zeta - 1);
  const envelope = Math.exp(-zeta * omega0 * t);
  const term = Math.cosh(omegaD * t) + (zeta / Math.sqrt(zeta * zeta - 1)) * Math.sinh(omegaD * t);
  return 1 - envelope * term;
}

/**
 * Calculates the duration (in milliseconds) required for the spring to settle
 * within an acceptable error threshold (default: 0.005 / 0.5%).
 *
 * @param {{ stiffness: number, damping: number, mass: number }} config
 * @param {number} [threshold=0.005]
 * @returns {number} Settling duration in milliseconds
 */
export function calculateSpringSettlingDuration(config, threshold = 0.005) {
  if (!config) return 400;

  const k = Math.max(0.001, config.stiffness || 100);
  const c = Math.max(0.001, config.damping || 10);
  const m = Math.max(0.001, config.mass || 1);

  const omega0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));

  // Search forward up to 3 seconds in 10ms steps
  const maxSeconds = 3.0;
  const step = 0.01;
  let settledTime = maxSeconds;

  for (let t = 0.1; t <= maxSeconds; t += step) {
    const val = solveSpring(t, { stiffness: k, damping: c, mass: m });
    if (Math.abs(val - 1) <= threshold) {
      // Check if it stays within threshold for next 100ms
      let staysSettled = true;
      for (let lookahead = t; lookahead <= Math.min(maxSeconds, t + 0.12); lookahead += step) {
        if (Math.abs(solveSpring(lookahead, { stiffness: k, damping: c, mass: m }) - 1) > threshold) {
          staysSettled = false;
          break;
        }
      }
      if (staysSettled) {
        settledTime = t;
        break;
      }
    }
  }

  const durationMs = Math.round(settledTime * 1000);
  return Math.max(150, Math.min(2500, durationMs));
}

/**
 * Generates a modern CSS linear(...) timing function representation of the spring motion.
 * @param {{ stiffness: number, damping: number, mass: number }} config
 * @param {number} [points=32]
 * @returns {string} CSS linear(...) curve string
 */
export function generateSpringLinearEasing(config, points = 32) {
  const durationMs = calculateSpringSettlingDuration(config);
  const durationSec = durationMs / 1000;
  const values = [];

  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    const t = progress * durationSec;
    const y = solveSpring(t, config);
    // Format to 3 decimal places
    const formattedY = Math.round(y * 1000) / 1000;
    const percent = Math.round(progress * 1000) / 10;
    values.push(`${formattedY} ${percent}%`);
  }

  return `linear(${values.join(", ")})`;
}

/**
 * Checks if the current browser environment supports the modern CSS linear() easing function.
 * @returns {boolean}
 */
export function supportsCSSLinearEasing() {
  if (typeof window === "undefined" || typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    return false;
  }
  try {
    return CSS.supports("transition-timing-function", "linear(0, 1)");
  } catch {
    return false;
  }
}

/**
 * Returns comprehensive transition timing, easing, and duration parameters for a toast with spring physics.
 * @param {boolean | SpringPreset | SpringConfig} spring
 * @returns {{ config: { stiffness: number, damping: number, mass: number }, duration: number, easing: string, isSpring: boolean } | null}
 */
export function getSpringTransition(spring) {
  const resolved = resolveSpringConfig(spring);
  if (!resolved) return null;

  const duration = calculateSpringSettlingDuration(resolved);
  const linearEasing = generateSpringLinearEasing(resolved);
  const isLinearSupported = supportsCSSLinearEasing();

  const easing = isLinearSupported ? linearEasing : (resolved.bezierFallback || "cubic-bezier(0.34, 1.4, 0.64, 1)");

  return {
    config: {
      stiffness: resolved.stiffness,
      damping: resolved.damping,
      mass: resolved.mass,
    },
    duration,
    easing,
    isSpring: true,
  };
}

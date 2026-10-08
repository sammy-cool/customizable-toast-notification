// examples/ai-triage/smart-triage.js
"use strict";

/**
 * @fileoverview TypeSafe AI Smart Notification Triage Recipe
 *
 * Demonstrates TypeSafe AI System One architecture (such as Jev) to turn
 * unstructured event streams, exceptions, and user actions into structured,
 * prioritized notification parameters with 100% deterministic offline fallback.
 *
 * Architectural Boundary:
 * Kept at the application/recipe layer to preserve the core library's zero-dependency footprint.
 */

/**
 * Deterministic offline rule-based triage classifier.
 * Evaluates event text and metadata to produce a typed notification plan.
 *
 * @param {string | object} event
 * @returns {import('./smart-triage').SmartToastPlan}
 */
export function classifyEventDeterministic(event) {
  const text = typeof event === "string" ? event : String(event?.message || event?.text || event?.title || "");
  const lower = text.toLowerCase();

  // 1. Destructive actions requiring Undo
  const isDestructive =
    /\b(delete|deleted|remove|removed|trash|trashed|discard|discarded|archive|archived)\b/.test(lower);

  // 2. High severity error keywords
  const isError =
    /\b(error|fail|failed|failure|fatal|reject|declined|timeout|crashed|unauthorized|forbidden|exception)\b/.test(lower);

  // 3. Warning keywords
  const isWarning =
    /\b(warning|warn|caution|deprecat|quota|limit|expir|slow|degraded|unsaved)\b/.test(lower);

  // 4. Success keywords
  const isSuccess =
    /\b(success|succeeded|completed|saved|created|updated|copied|connected|restored|verified|approved)\b/.test(lower);

  let type = "info";
  let soundPreset = "modern";
  let spring = "default";
  let priority = 50;

  if (isError) {
    type = "error";
    soundPreset = "retro"; // Sharp alert tone
    spring = "stiff";
    priority = 90;
  } else if (isDestructive || isWarning) {
    type = "warning";
    soundPreset = "subtle";
    spring = "wobbly";
    priority = 75;
  } else if (isSuccess) {
    type = "success";
    soundPreset = "bell"; // Pleasant chime
    spring = "bouncy";
    priority = 60;
  } else {
    type = "info";
    soundPreset = "futuristic";
    spring = "gentle";
    priority = 40;
  }

  // Calculate optimal reading duration based on word count + urgency
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const baseReadingTime = Math.max(2500, Math.min(8000, wordCount * 350));
  const duration = isDestructive ? 6000 : (isError ? 5000 : baseReadingTime);

  const plan = {
    message: text || "Event received",
    type,
    duration,
    soundPreset,
    spring,
    priority,
    sound: true,
  };

  if (isDestructive) {
    plan.undo = {
      label: "Undo",
      showCountdown: true,
      onUndo: () => {
        console.log(`[SmartTriage] Undo requested for action: "${text}"`);
      },
    };
  }

  return plan;
}

/**
 * Intelligent Triage function that executes TypeSafe AI System One models
 * with automatic deterministic offline fallback.
 *
 * @param {string | object} event
 * @param {{ apiKey?: string, customFallback?: (event: any) => import('./smart-triage').SmartToastPlan }} [options]
 * @returns {Promise<import('./smart-triage').SmartToastPlan>}
 */
export async function triageNotification(event, options = {}) {
  const apiKey = options.apiKey || (typeof process !== "undefined" ? process?.env?.TYPESAFE_API_KEY : undefined);

  if (apiKey) {
    try {
      const response = await fetch("https://api.typesafe.ai/v1/system-one", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: { event },
          questions: {
            severity: {
              primitive: "choice",
              instructions: "What is the severity of this notification event?",
              criteria: {
                error: "System or network failures, declined transactions, crashes",
                warning: "Destructive operations, quotas approaching, warnings",
                success: "Operations completed, records created, files exported",
                info: "General status updates, incoming notifications",
              },
            },
            needsUndo: {
              primitive: "choice",
              instructions: "Should this notification offer an Undo action?",
              criteria: {
                true: "Destructive or reversible deletion, archive, or discard operations",
                false: "Informational or read-only events",
              },
            },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const severity = data.judgments?.severity?.value || "info";
        const needsUndo = data.judgments?.needsUndo?.value === "true";

        const deterministic = classifyEventDeterministic(event);
        return {
          ...deterministic,
          type: severity,
          undo: needsUndo ? deterministic.undo || { label: "Undo", showCountdown: true } : undefined,
        };
      }
    } catch (err) {
      console.warn("[SmartTriage] TypeSafe AI endpoint unreachable, using deterministic fallback:", err);
    }
  }

  return classifyEventDeterministic(event);
}

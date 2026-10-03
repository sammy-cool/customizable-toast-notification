/**
 * @fileoverview TypeSafe AI Smart Notification Triage Recipe
 * 
 * Demonstrates how to use TypeSafe System One models (such as Jev) to turn
 * unstructured application events, error logs, and user notifications into
 * strictly-typed `ToastOptions` for `customizable-toast-notification`.
 * 
 * Architectural Boundary:
 * - Kept at the application/adapter layer to preserve the core library's
 *   zero-runtime-dependency, offline-first, and <50KB bundle footprint.
 * - Uses TypeSafe primitives: `choice`, `noul`, and `score` for fast,
 *   structured judgments rather than slow, unstructured LLM text generation.
 * 
 * Usage:
 *   node examples/typesafe-ai-smart-toast.mjs
 * 
 * With TypeSafe API Key:
 *   TYPESAFE_API_KEY=your_key node examples/typesafe-ai-smart-toast.mjs
 */

/**
 * @typedef {'info' | 'success' | 'warning' | 'error'} ToastType
 * 
 * @typedef {Object} TriageResult
 * @property {ToastType} type - Notification severity category
 * @property {string} message - Sanitized, concise notification message
 * @property {number} duration - Display duration in ms based on urgency
 * @property {string} position - Optimal screen position based on urgency
 * @property {boolean} [showLoader] - Whether to display an inline spinner
 * @property {Object} [cta] - Optional call-to-action button
 * @property {string} [cta.label] - CTA action button label
 * @property {boolean} [cta.autoClose] - Whether clicking CTA dismisses toast
 */

/**
 * Simulates or queries TypeSafe System One model (Jev).
 * In production, you can import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk"
 * or use the HTTP API directly at https://api.typesafe.ai/v1/system-one
 * 
 * @param {Object} eventData - Unstructured event payload
 * @returns {Promise<{
 *   severity: ToastType,
 *   needsActionProbability: number,
 *   ctaLabel: string,
 *   urgencyScore: number,
 *   isLoading: boolean
 * }>}
 */
async function queryTypeSafeSystemOne(eventData) {
  const apiKey = process.env.TYPESAFE_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.typesafe.ai/v1/system-one", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: { event: eventData },
          questions: {
            severity: {
              primitive: "choice",
              instructions: "What is the severity of this notification event?",
              criteria: {
                error: "System or network failures, expired credentials, payment decline",
                warning: "Approaching quota limits, deprecation notices, degradation",
                success: "Operations completed, records created, files exported",
                info: "General status updates, incoming messages, background tasks"
              }
            },
            needsAction: {
              primitive: "noul",
              instructions: "Does this notification require explicit user action or intervention?"
            },
            ctaLabel: {
              primitive: "choice",
              instructions: "Recommended 1-2 word CTA action label if user action is needed",
              criteria: {
                "Update": "For credentials, billing, or card updates",
                "Retry": "For failed operations that can be retried",
                "Download": "For ready exports, reports, or documents",
                "View": "For incoming messages or details",
                "Dismiss": "Passive notification with no special action"
              }
            },
            urgency: {
              primitive: "score",
              instructions: "Urgency scale: 1 is passive background notice, 5 is critical blocking issue",
              levels: [1, 2, 3, 4, 5]
            }
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          severity: data.answers.severity.choice,
          needsActionProbability: data.answers.needsAction.probability,
          ctaLabel: data.answers.ctaLabel.choice,
          urgencyScore: data.answers.urgency.score,
          isLoading: Boolean(eventData.inProgress || eventData.status === "processing")
        };
      }
    } catch (err) {
      console.warn("TypeSafe API request failed, falling back to local System One rules:", err.message);
    }
  }

  // Deterministic local System One rule simulation (offline fallback)
  const text = JSON.stringify(eventData).toLowerCase();
  
  let severity = "info";
  if (text.includes("fail") || text.includes("error") || text.includes("expired") || text.includes("declined")) {
    severity = "error";
  } else if (text.includes("warning") || text.includes("exceeded") || text.includes("quota") || text.includes("limit") || text.includes("threshold") || text.includes("utilization")) {
    severity = "warning";
  } else if (text.includes("complete") || text.includes("success") || text.includes("ready") || text.includes("saved")) {
    severity = "success";
  }

  const needsAction = severity === "error" || text.includes("upgrade") || text.includes("renew");
  const urgency = severity === "error" ? 5 : (severity === "warning" ? 3 : 2);
  const isLoading = Boolean(eventData.inProgress || eventData.status === "processing");

  let cta = "View";
  if (text.includes("card") || text.includes("payment")) cta = "Update";
  else if (text.includes("retry") || severity === "error") cta = "Retry";
  else if (text.includes("download") || text.includes("export")) cta = "Download";

  return {
    severity,
    needsActionProbability: needsAction ? 0.95 : 0.1,
    ctaLabel: cta,
    urgencyScore: urgency,
    isLoading
  };
}

/**
 * Triage function that transforms raw application events into typed ToastOptions.
 * 
 * @param {Object} rawEvent - Raw application event, telemetry, or user interaction
 * @returns {Promise<TriageResult>}
 */
export async function triageNotification(rawEvent) {
  const judgment = await queryTypeSafeSystemOne(rawEvent);

  /** @type {TriageResult} */
  const toastConfig = {
    type: judgment.severity,
    message: rawEvent.message || rawEvent.title || "Notification event received",
    duration: judgment.urgencyScore >= 4 ? 6000 : (judgment.urgencyScore <= 2 ? 2500 : 4000),
    position: judgment.urgencyScore >= 4 ? "top-center" : "bottom-right",
  };

  if (judgment.isLoading) {
    toastConfig.showLoader = true;
  }

  // Include CTA if System One indicates user action probability > 0.7
  if (judgment.needsActionProbability > 0.7 && judgment.ctaLabel !== "Dismiss") {
    toastConfig.cta = {
      label: judgment.ctaLabel,
      autoClose: true,
    };
  }

  return toastConfig;
}

// ---- CLI Demonstration ----
async function runDemo() {
  console.log("=== TypeSafe AI Smart Notification Triage Demo ===\n");

  const sampleEvents = [
    {
      title: "Invoice #1049 payment declined by card issuer",
      source: "stripe_webhook",
      errorCode: "card_expired"
    },
    {
      title: "Sales performance quarterly export generated (14.2 MB)",
      source: "background_worker",
      status: "completed"
    },
    {
      title: "Database storage utilization reached 89% threshold",
      source: "cloud_monitor",
      metric: "disk_used_pct"
    },
    {
      title: "Optimizing video encode for stream delivery",
      source: "transcoder",
      inProgress: true
    }
  ];

  for (const event of sampleEvents) {
    console.log(`Input Event: "${event.title}"`);
    const toastConfig = await triageNotification(event);
    console.log("-> Triaged ToastOptions:", JSON.stringify(toastConfig, null, 2));
    console.log("--------------------------------------------------\n");
  }

  console.log("All sample events successfully triaged into strongly-typed ToastOptions!");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo();
}

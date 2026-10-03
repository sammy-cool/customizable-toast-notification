# Examples & Cookbooks

This directory contains consumer-level integration recipes and adapters for `customizable-toast-notification`.

## 🤖 TypeSafe AI Smart Notification Triage

[`typesafe-ai-smart-toast.mjs`](file:///home/smarty/projects/customizable-toast-notification/examples/typesafe-ai-smart-toast.mjs) demonstrates how to connect TypeSafe System One models (such as Jev) to `customizable-toast-notification`.

### Why TypeSafe AI?
Rather than having an LLM generate unstructured text messages, TypeSafe System One models return fast, typed judgments (`choice`, `noul`, and `score`) directly from application telemetry, error payloads, or user feedback.

| TypeSafe Primitive | Notification Dimension | Toast Mapping |
| :--- | :--- | :--- |
| **`choice`** | Event severity category | `type: 'info' \| 'success' \| 'warning' \| 'error'` |
| **`noul`** | Actionability probability | `cta: { label, autoClose }` (if `p > 0.7`) |
| **`choice`** | Action verb selection | `cta.label: "Retry" \| "Update" \| "Download"` |
| **`score`** | Urgency level (1–5) | `duration: 6000ms`, `position: 'top-center'` |

### Architectural Boundary
Following our strict library guarantees:
- **Zero Runtime Dependencies**: The core `customizable-toast-notification` package remains 100% dependency-free, offline-first, and <50KB bundle footprint.
- **Application-Layer AI**: TypeSafe AI integrations live cleanly at the consumer/application level.

### Running the Example
```bash
# Run standalone with built-in offline simulation:
node examples/typesafe-ai-smart-toast.mjs

# Run with live TypeSafe API key:
TYPESAFE_API_KEY="your_api_key" node examples/typesafe-ai-smart-toast.mjs
```

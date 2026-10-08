# 🍳 Developer Cookbook & Production Recipes

A collection of battle-tested, zero-dependency recipes for common real-world notification workflows using `customizable-toast-notification`.

---

## Table of Contents
1. [Multi-Action Confirmation Toasts](#1-multi-action-confirmation-toasts)
2. [Global Uncaught Exception & Promise Rejection Catcher](#2-global-uncaught-exception--promise-rejection-catcher)
3. [Network Online / Offline Connectivity Monitor](#3-network-online--offline-connectivity-monitor)
4. [File Upload with Live Streaming Progress & Abort](#4-file-upload-with-live-streaming-progress--abort)
5. [Action Undo with Live Dynamic Countdown Badge](#5-action-undo-with-live-dynamic-countdown-badge)
6. [High-Frequency Burst Stream with Card Deck Stacking & Sound](#6-high-frequency-burst-stream-with-card-deck-stacking--sound)
7. [Inactive Tab Attention Alerting (tabTitleAlert)](#7-inactive-tab-attention-alerting-tabtitlealert)
8. [Persistent Notification Center History Drawer](#8-persistent-notification-center-history-drawer)

---

## 1. Multi-Action Confirmation Toasts

Support multiple action buttons on a single notification (e.g. "Confirm" and "Cancel", or "View" and "Share").

```javascript
import { createToast } from "customizable-toast-notification";

async function showInvitationToast(invitation) {
  return await createToast({
    type: "info",
    message: `Team invite from ${invitation.senderName} (${invitation.teamName})`,
    position: "top-right",
    duration: 10000,
    sound: "info",
    soundPreset: "modern",
    spring: "gentle",
    cta: [
      {
        label: "Accept",
        onClick: async () => {
          await api.acceptInvite(invitation.id);
          createToast({ type: "success", message: "Invitation accepted!" });
        },
      },
      {
        label: "Decline",
        autoClose: true,
        onClick: async () => {
          await api.declineInvite(invitation.id);
          createToast({ type: "warning", message: "Invitation declined" });
        },
      },
    ],
  });
}
```

---

## 2. Global Uncaught Exception & Promise Rejection Catcher

Automatically catch and surface unhandled runtime errors in QA, staging, or production environments without crashing the user interface.

```javascript
import { createToast } from "customizable-toast-notification";

export function setupGlobalErrorToasts() {
  function notifyError(error) {
    const message = error?.message || String(error || "Unknown exception");
    const stack = error?.stack || message;

    createToast({
      type: "error",
      message: `Error: ${message.slice(0, 90)}`,
      position: "top-right",
      duration: 8000,
      sound: "error",
      soundPreset: "retro",
      spring: "stiff",
      cta: [
        {
          label: "Copy Stack",
          autoClose: false,
          onClick: async () => {
            try {
              await navigator.clipboard.writeText(stack);
              createToast({ type: "success", message: "Stack trace copied!", duration: 2000 });
            } catch (err) {
              console.error("Clipboard copy failed:", err);
            }
          },
        },
        {
          label: "Report Issue",
          variant: "link",
          href: "https://your-app.com/support/tickets/new",
          target: "_blank",
        },
      ],
    });
  }

  window.addEventListener("error", (e) => {
    e.preventDefault();
    notifyError(e.error || e.message);
  });

  window.addEventListener("unhandledrejection", (e) => {
    e.preventDefault();
    notifyError(e.reason);
  });
}
```

---

## 3. Network Online / Offline Connectivity Monitor

Provide instantaneous, crystal-clear feedback when user internet disconnects and reconnects.

```javascript
import { createToast } from "customizable-toast-notification";

export function initNetworkMonitor() {
  let offlineToastHandle = null;

  async function handleOffline() {
    if (offlineToastHandle) await offlineToastHandle.dismiss();

    offlineToastHandle = await createToast({
      type: "error",
      message: "You are currently offline. Changes will sync automatically when reconnected.",
      position: "top-center",
      duration: 24 * 60 * 60 * 1000, // Keep visible until back online
      showProgressBar: false,
      sound: "error",
      soundPreset: "retro",
      spring: "stiff",
      cta: {
        label: "Check Status",
        autoClose: false,
        onClick: () => {
          if (navigator.onLine) handleOnline();
        },
      },
    });
  }

  async function handleOnline() {
    if (offlineToastHandle) {
      await offlineToastHandle.dismiss();
      offlineToastHandle = null;
    }

    await createToast({
      type: "success",
      message: "Connected! All operations restored.",
      position: "top-center",
      duration: 3500,
      sound: "success",
      soundPreset: "bell",
      spring: "bouncy",
    });
  }

  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);
}
```

---

## 4. File Upload with Live Streaming Progress & Abort

Update toast progress bar and message dynamically in-place without re-rendering or unmounting the toast element.

```javascript
import { createToast } from "customizable-toast-notification";

export async function uploadFileWithProgress(file) {
  const controller = new AbortController();

  const handle = await createToast({
    type: "info",
    message: `Uploading ${file.name}... (0%)`,
    position: "bottom-right",
    duration: 60000,
    showProgressBar: true,
    progress: 0,
    cta: {
      label: "Cancel",
      onClick: () => controller.abort(),
    },
  });

  try {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    controller.signal.addEventListener("abort", () => xhr.abort());

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        handle.update({
          message: `Uploading ${file.name}... (${percent}%)`,
          progress: percent,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        handle.update({
          type: "success",
          message: `Upload complete: ${file.name}`,
          progress: 100,
          duration: 3000,
          sound: "success",
        });
      } else {
        handle.update({
          type: "error",
          message: `Upload failed: ${xhr.statusText}`,
          duration: 4000,
        });
      }
    };

    xhr.send(file);
  } catch (err) {
    handle.update({
      type: "error",
      message: `Upload aborted or failed: ${err.message}`,
      duration: 4000,
    });
  }
}
```

---

## 5. Action Undo with Live Dynamic Countdown Badge

Provide high-confidence undo capability for destructive actions (e.g. deleting an email, removing an item, archiving an account).

```javascript
import { createToast } from "customizable-toast-notification";

export async function deleteItemWithUndo(item, deleteMutation, undoMutation) {
  // Optimistically remove from UI
  deleteMutation(item.id);

  await createToast({
    type: "warning",
    message: `Deleted "${item.title}".`,
    duration: 6000,
    position: "bottom-left",
    spring: "gentle",
    undo: {
      label: "Undo",
      showCountdown: true, // Displays dynamic decaying timer badge: "Undo (6s... 1s)"
      onUndo: async () => {
        await undoMutation(item);
        createToast({
          type: "info",
          message: `Restored "${item.title}".`,
          duration: 2500,
        });
      },
    },
  });
}
```

---

## 6. High-Frequency Burst Stream with Card Deck Stacking & Sound

Handle bursts of hundreds of notifications cleanly without screen clutter using iOS card deck stacking physics.

```javascript
import { createToast, setConfig } from "customizable-toast-notification";

// Enable stacking globally or per-toast
setConfig({
  stacked: true,
  maxVisible: 3,
  sound: true,
  soundPreset: "modern",
});

export async function onIncomingMessage(message) {
  await createToast({
    type: "info",
    message: `${message.sender}: ${message.text}`,
    stacked: true,
    spring: "wobbly",
    sound: "info",
  });
}
```

---

## 7. Inactive Tab Attention Alerting (`tabTitleAlert`)

When a user is multitasking on another browser tab, pulse the document title so critical alerts aren't missed, restoring the original title once the tab is focused.

```javascript
import { createToast } from "customizable-toast-notification";

export async function notifyWithTabAlert(options) {
  const originalTitle = document.title;
  let intervalId = null;

  if (document.hidden) {
    let toggle = false;
    intervalId = setInterval(() => {
      document.title = toggle
        ? `🔔 (1) ${options.message.slice(0, 30)}...`
        : originalTitle;
      toggle = !toggle;
    }, 1000);

    const onFocus = () => {
      clearInterval(intervalId);
      document.title = originalTitle;
      window.removeEventListener("focus", onFocus);
    };
    window.addEventListener("focus", onFocus);
  }

  return await createToast(options);
}
```

---

## 8. Persistent Notification Center History Drawer

Archive toasts into a slide-over history drawer so users can review dismissed notifications. See the full runnable demo in [`examples/notification-center/index.html`](../examples/notification-center/index.html).

```javascript
import { createToast } from "customizable-toast-notification";

const notificationHistory = [];

export async function dispatchAndArchive(options) {
  notificationHistory.push({
    options,
    timestamp: new Date().toLocaleTimeString(),
  });

  return await createToast(options);
}
```


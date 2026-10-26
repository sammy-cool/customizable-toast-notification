/**
 * Toast Notification History & Telemetry Subsystem
 * Zero-dependency in-memory ring buffer tracking active, dismissed, and dropped notifications.
 */

/**
 * @typedef {'info' | 'success' | 'error' | 'warning'} ToastType
 *
 * @typedef {Object} ToastHistoryEntry
 * @property {string} id - Unique toast key or identifier
 * @property {string} message - Notification text message
 * @property {ToastType} type - Notification status type
 * @property {string} position - Toast placement coordinates
 * @property {number} timestamp - Unix timestamp (ms) when created
 * @property {number} [dismissedAt] - Unix timestamp (ms) when dismissed
 * @property {'active' | 'dismissed' | 'dropped'} status - Current lifecycle status
 * @property {Record<string, unknown>} [options] - Snapshot of configured options
 */

const DEFAULT_CAPACITY = 50;
let historyCapacity = DEFAULT_CAPACITY;

/** @type {ToastHistoryEntry[]} */
const historyBuffer = [];

/**
 * Records a new toast into the telemetry ring buffer.
 * @param {string} id
 * @param {object} [options={}]
 * @param {'active' | 'dismissed' | 'dropped'} [status='active']
 * @returns {ToastHistoryEntry}
 */
export function recordToastHistory(id, options = {}, status = "active") {
  const safeId = String(id || "");
  const safeOptions = options && typeof options === "object" ? options : {};
  const entry = {
    id: safeId,
    message: String(safeOptions.message || ""),
    type: /** @type {ToastType} */ (safeOptions.type || "info"),
    position: String(safeOptions.position || "bottom-right"),
    timestamp: Date.now(),
    status,
    options: { ...safeOptions },
  };

  historyBuffer.unshift(entry);

  if (historyBuffer.length > historyCapacity) {
    historyBuffer.length = historyCapacity;
  }

  return entry;
}

/**
 * Marks an existing toast in history as dismissed.
 * @param {string} id
 */
export function markToastHistoryDismissed(id) {
  if (!id) return;
  const safeId = String(id);
  const entry = historyBuffer.find((item) => item.id === safeId && item.status === "active");
  if (entry) {
    entry.status = "dismissed";
    entry.dismissedAt = Date.now();
  }
}

/**
 * Marks a toast as dropped due to queue overflow.
 * @param {string} id
 * @param {object} [options={}]
 */
export function markToastHistoryDropped(id, options = {}) {
  recordToastHistory(id, options, "dropped");
}

/**
 * Returns a read-only snapshot copy of the notification history ring buffer.
 * @returns {ToastHistoryEntry[]}
 */
export function getToastHistory() {
  return historyBuffer.map((item) => ({ ...item, options: { ...item.options } }));
}

/**
 * Clears all entries from the notification history ring buffer.
 */
export function clearToastHistory() {
  historyBuffer.length = 0;
}

/**
 * Sets the maximum capacity of the history ring buffer.
 * @param {number} capacity - Maximum number of items to retain (minimum 1)
 */
export function setHistoryCapacity(capacity) {
  const num = Number(capacity);
  if (Number.isFinite(num) && num > 0) {
    historyCapacity = Math.floor(num);
    if (historyBuffer.length > historyCapacity) {
      historyBuffer.length = historyCapacity;
    }
  }
}

/**
 * Resets the history buffer back to empty and restores default capacity.
 */
export function resetToastHistory() {
  historyBuffer.length = 0;
  historyCapacity = DEFAULT_CAPACITY;
}

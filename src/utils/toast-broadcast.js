/**
 * Cross-tab Toast Synchronization Manager
 * Synchronizes toast notifications across multiple tabs of the same application
 * using BroadcastChannel API with graceful fallback
 */

"use strict";

import { generateToastId } from "./id.js";

/**
 * @typedef {Object} ToastSyncMessage
 * @property {string} type - Message type: 'create', 'update', 'dismiss', 'sync-request', 'sync-response'
 * @property {string} toastId - Unique toast identifier
 * @property {Object} payload - Message-specific data
 * @property {number} timestamp - Message timestamp
 * @property {string} tabId - Originating tab ID
 */

class ToastBroadcaster {
  constructor() {
    this.channel = null;
    this.tabId = this._generateTabId();
    this.isLeadTab = false;
    this.listeners = new Map();
    this.supportsBroadcastChannel = typeof BroadcastChannel !== 'undefined';

    if (this.supportsBroadcastChannel) {
      this._initBroadcastChannel();
    }
  }

  /**
   * Generate unique tab identifier using unified smart ID generator
   * @private
   * @returns {string}
   */
  _generateTabId() {
    return generateToastId("tab");
  }

  /**
   * Initialize BroadcastChannel if available
   * @private
   */
  _initBroadcastChannel() {
    try {
      this.channel = new BroadcastChannel('toast-notifications');
      // Node.js BroadcastChannel keeps the event loop alive unless unref'd
      // (browsers have no unref, hence the optional call). Without this,
      // test runners and CLI scripts using this module never exit.
      this.channel.unref?.();
      this.channel.onmessage = (event) => this._handleMessage(event.data);

      // Become leader if no leader exists
      this._becomeLeadIfNeeded();
    } catch (error) {
      console.warn('[Toast] BroadcastChannel initialization failed:', error);
      this.supportsBroadcastChannel = false;
    }
  }

  /**
   * Attempt to become the lead tab
   * @private
   */
  _becomeLeadIfNeeded() {
    if (!this.channel) return;

    // Request sync from existing leader
    this.broadcast('sync-request', '', {});

    // If no response within 1 second, become leader
    this.leaderTimer = setTimeout(() => {
      this.leaderTimer = null;
      if (!this.isLeadTab) {
        this.isLeadTab = true;
        this.broadcast('leader-elected', '', { tabId: this.tabId });
      }
    }, 1000);
    // Same Node event-loop-hang concern as the channel above.
    this.leaderTimer.unref?.();
  }

  /**
   * Broadcast a toast event to other tabs
   * @param {string} type - Event type
   * @param {string} [toastId=''] - Toast ID
   * @param {Object} [payload={}] - Event payload
   */
  broadcast(type, toastId = '', payload = {}) {
    if (!this.supportsBroadcastChannel || !this.channel) {
      return;
    }

    let actualToastId = toastId;
    let actualPayload = payload;

    // Gracefully handle if caller passed (type, payload) omitting toastId
    if (typeof toastId === 'object' && toastId !== null && Object.keys(payload).length === 0) {
      actualPayload = toastId;
      actualToastId = '';
    }

    const message = {
      type,
      toastId: typeof actualToastId === 'string' ? actualToastId : String(actualToastId ?? ''),
      payload: (actualPayload && typeof actualPayload === 'object') ? actualPayload : {},
      timestamp: Date.now(),
      tabId: this.tabId,
    };

    try {
      this.channel.postMessage(message);
    } catch (error) {
      console.warn('[Toast] Failed to broadcast message:', error);
    }
  }

  /**
   * Handle incoming message from other tab
   * @private
   * @param {ToastSyncMessage} message
   */
  _handleMessage(message) {
    if (!message || message.tabId === this.tabId) {
      return; // Ignore own messages
    }

    const { type, toastId, payload } = message;

    // Handle leader election
    if (type === 'leader-elected' && !this.isLeadTab) {
      this.isLeadTab = false; // Another tab is leader
      return;
    }

    // Handle sync requests
    if (type === 'sync-request' && this.isLeadTab) {
      this.broadcast('sync-response', 'all-toasts', {
        active: Array.from(this._getActiveToasts?.() || []),
        queue: this._getQueuedToasts?.() || [],
      });
      return;
    }

    // Trigger registered listeners
    const listeners = this.listeners.get(type) || [];
    listeners.forEach((callback) => {
      try {
        callback({ toastId, payload, message });
      } catch (error) {
        console.warn(`[Toast] Listener error for ${type}:`, error);
      }
    });
  }

  /**
   * Register listener for toast events
   * @param {string} type - Event type to listen for
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  on(type, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }

    this.listeners.get(type).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Register active toasts getter (set by ToastManager)
   * @param {Function} getter
   */
  registerActiveToastsGetter(getter) {
    this._getActiveToasts = getter;
  }

  /**
   * Register queued toasts getter (set by ToastManager)
   * @param {Function} getter
   */
  registerQueuedToastsGetter(getter) {
    this._getQueuedToasts = getter;
  }

  /**
   * Check if cross-tab sync is supported
   * @returns {boolean}
   */
  isSupported() {
    return this.supportsBroadcastChannel;
  }

  /**
   * Get current tab ID
   * @returns {string}
   */
  getTabId() {
    return this.tabId;
  }

  /**
   * Is this the lead tab
   * @returns {boolean}
   */
  isLeadingTab() {
    return this.isLeadTab;
  }

  /**
   * Cleanup on unload
   */
  destroy() {
    if (this.leaderTimer) {
      clearTimeout(this.leaderTimer);
      this.leaderTimer = null;
    }
    if (this.channel) {
      try {
        this.channel.close();
      } catch (error) {
        console.warn('[Toast] Failed to close BroadcastChannel:', error);
      }
    }
    this.listeners.clear();
    this.channel = null;
  }
}

// Singleton instance
let broadcasterInstance = null;

/**
 * Get or create the global broadcaster instance
 * @returns {ToastBroadcaster}
 */
export function getToastBroadcaster() {
  if (!broadcasterInstance) {
    broadcasterInstance = new ToastBroadcaster();

    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('unload', () => {
        broadcasterInstance?.destroy();
        broadcasterInstance = null;
      });
    }
  }
  return broadcasterInstance;
}

/**
 * Reset broadcaster instance (for testing)
 */
export function resetToastBroadcaster() {
  if (broadcasterInstance) {
    broadcasterInstance.destroy();
    broadcasterInstance = null;
  }
}

export { ToastBroadcaster };

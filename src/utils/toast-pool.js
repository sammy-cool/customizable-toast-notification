/**
 * Toast Element Pool Manager
 * Recycles DOM elements for efficient handling of 100+ toasts
 * Prevents memory leaks and performance degradation with large queues
 */

"use strict";

/**
 * @typedef {Object} PooledToastElement
 * @property {HTMLElement} element - The reusable toast element
 * @property {boolean} inUse - Whether element is currently allocated
 * @property {string} id - Unique toast ID
 */

class ToastElementPool {
  constructor(initialSize = 5, maxSize = 50) {
    this.initialSize = Math.max(1, Math.floor(initialSize));
    this.maxSize = Math.max(this.initialSize, Math.floor(maxSize));
    this.pool = [];
    this.inUseCount = 0;

    // Pre-allocate initial pool
    for (let i = 0; i < this.initialSize; i++) {
      this.pool.push({
        element: this._createToastElement(),
        inUse: false,
        id: null,
      });
    }
  }

  /**
   * Create a new toast element template
   * @private
   * @returns {HTMLElement}
   */
  _createToastElement() {
    const div = document.createElement('div');
    div.className = 'toast';
    div.setAttribute('role', 'alert');
    div.setAttribute('aria-live', 'polite');
    div.tabIndex = 0;
    return div;
  }

  /**
   * Acquire a toast element from pool or create new one
   * @param {string} toastId - Unique identifier for this toast
   * @returns {HTMLElement} - Ready-to-use toast element
   */
  acquire(toastId) {
    if (!toastId || typeof toastId !== 'string') {
      throw new Error('Toast ID required for pool allocation');
    }

    // Find available element in pool
    let poolEntry = this.pool.find((entry) => !entry.inUse);

    // If no available element, create new one (up to maxSize limit)
    if (!poolEntry && this.pool.length < this.maxSize) {
      poolEntry = {
        element: this._createToastElement(),
        inUse: false,
        id: null,
      };
      this.pool.push(poolEntry);
    }

    // If still no available element, recycle the oldest (emergency fallback)
    if (!poolEntry) {
      poolEntry = this.pool[0];
      if (poolEntry.element.parentNode) {
        poolEntry.element.parentNode.removeChild(poolEntry.element);
      }
    }

    // Clear element state and mark as in-use
    poolEntry.element.innerHTML = '';
    poolEntry.element.className = 'toast';
    poolEntry.element.setAttribute('role', 'alert');
    poolEntry.element.id = `toast-${toastId}`;
    poolEntry.inUse = true;
    poolEntry.id = toastId;
    this.inUseCount += 1;

    return poolEntry.element;
  }

  /**
   * Release a toast element back to pool
   * @param {HTMLElement} element - The element to release
   * @param {string} toastId - The toast ID being released
   */
  release(element, toastId) {
    if (!element || !toastId) {
      return;
    }

    // Find and release the pooled element
    const poolEntry = this.pool.find((entry) => entry.id === toastId);

    if (poolEntry && poolEntry.inUse) {
      // Remove all event listeners and children
      const clone = poolEntry.element.cloneNode(false);
      poolEntry.element.parentNode?.replaceChild(clone, poolEntry.element);
      poolEntry.element = clone;

      // Reset state
      poolEntry.inUse = false;
      poolEntry.id = null;
      this.inUseCount = Math.max(0, this.inUseCount - 1);
    }
  }

  /**
   * Get pool statistics for monitoring
   * @returns {Object} - Pool stats
   */
  getStats() {
    return {
      total: this.pool.length,
      inUse: this.inUseCount,
      available: this.pool.length - this.inUseCount,
      utilization: this.pool.length > 0 ? (this.inUseCount / this.pool.length) * 100 : 0,
      maxSize: this.maxSize,
    };
  }

  /**
   * Clear all pooled elements (for cleanup/testing)
   */
  clear() {
    this.pool.forEach((entry) => {
      if (entry.element.parentNode) {
        entry.element.parentNode.removeChild(entry.element);
      }
    });
    this.pool = [];
    this.inUseCount = 0;
  }

  /**
   * Compact pool (remove unused elements above initial size)
   * Useful for long-running apps with temporary toast spikes
   */
  compact() {
    if (this.pool.length > this.initialSize) {
      const available = this.pool.filter((entry) => !entry.inUse);
      const toRemove = Math.max(0, available.length - this.initialSize);

      if (toRemove > 0) {
        for (let i = 0; i < toRemove; i++) {
          const idx = this.pool.indexOf(available[i]);
          if (idx > -1) {
            this.pool.splice(idx, 1);
          }
        }
      }
    }
  }
}

// Singleton instance
let poolInstance = null;

/**
 * Get or create the global toast pool instance
 * @param {number} [initialSize=5] - Initial pool size
 * @param {number} [maxSize=50] - Maximum pool size
 * @returns {ToastElementPool}
 */
export function getToastPool(initialSize = 5, maxSize = 50) {
  if (!poolInstance) {
    poolInstance = new ToastElementPool(initialSize, maxSize);
  }
  return poolInstance;
}

/**
 * Reset pool instance (for testing)
 */
export function resetToastPool() {
  if (poolInstance) {
    poolInstance.clear();
    poolInstance = null;
  }
}

export { ToastElementPool };

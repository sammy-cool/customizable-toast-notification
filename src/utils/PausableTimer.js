// src/utils/PausableTimer.js
"use strict";

export class PausableTimer {
  constructor(callback, delay) {
    this.callback = callback;
    this.delay = delay;
    this.remaining = delay;
    this.startTime = null;
    this.timeoutId = null;
    this.isPaused = false;
    this.isCompleted = false;
  }

  start() {
    if (this.isCompleted || this.timeoutId) return this;
    this.startTime = Date.now();
    this.timeoutId = setTimeout(() => {
      this.isCompleted = true;
      this.timeoutId = null;
      this.callback();
    }, this.remaining);
    return this;
  }

  pause() {
    if (this.isPaused || !this.timeoutId || this.isCompleted) return this;
    clearTimeout(this.timeoutId);
    this.timeoutId = null;
    this.remaining -= Date.now() - this.startTime;
    this.remaining = Math.max(0, this.remaining); // prevent negative
    this.isPaused = true;
    return this;
  }

  resume() {
    if (!this.isPaused || this.isCompleted) return this;
    this.isPaused = false;
    this.start();
    return this;
  }

  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isCompleted = true;
    return this;
  }

  getRemainingTime() {
    if (this.isCompleted) return 0;
    if (this.isPaused) return this.remaining;
    if (!this.timeoutId) return this.delay;
    return Math.max(0, this.remaining - (Date.now() - this.startTime));
  }
}

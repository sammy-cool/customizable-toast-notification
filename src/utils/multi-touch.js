/**
 * Multi-touch Gesture Detection Utilities
 * Handles flick, pinch, and advanced touch gestures for mobile toasts
 */

"use strict";

/**
 * @typedef {Object} TouchPoint
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} id - Touch identifier
 * @property {number} time - Timestamp
 */

/**
 * @typedef {Object} GestureState
 * @property {TouchPoint[]} touches - Current touch points
 * @property {TouchPoint[]} startTouches - Initial touch points
 * @property {number} startTime - Gesture start time
 * @property {number} startDistance - Initial distance between touches (for pinch)
 * @property {number} currentDistance - Current distance between touches
 */

/**
 * Calculate distance between two touch points
 * @param {TouchPoint} p1
 * @param {TouchPoint} p2
 * @returns {number}
 */
export function calculateDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate velocity of a swipe gesture
 * @param {number} distance - Distance traveled in pixels
 * @param {number} duration - Duration in milliseconds
 * @returns {number} - Velocity in pixels/millisecond
 */
export function calculateVelocity(distance, duration) {
  if (duration <= 0) return Infinity;
  return Math.abs(distance) / duration;
}

/**
 * Detect if gesture is a flick (fast swipe with high velocity)
 * @param {number} velocity - Gesture velocity (px/ms)
 * @param {number} distance - Distance traveled (px)
 * @param {number} velocityThreshold - Minimum velocity for flick (default 0.5 px/ms)
 * @param {number} distanceThreshold - Minimum distance for flick (default 50px)
 * @returns {boolean}
 */
export function isFlick(velocity, distance, velocityThreshold = 0.5, distanceThreshold = 50) {
  return velocity >= velocityThreshold && Math.abs(distance) >= distanceThreshold;
}

/**
 * Extract touch points from touch event
 * @param {TouchEvent} event
 * @returns {TouchPoint[]}
 */
export function getTouchPoints(event) {
  const touches = [];

  if (event.touches && event.touches.length > 0) {
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      touches.push({
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier,
        time: Date.now(),
      });
    }
  } else if (event.changedTouches && event.changedTouches.length > 0) {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      touches.push({
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier,
        time: Date.now(),
      });
    }
  }

  return touches;
}

/**
 * Initialize gesture state from touch event
 * @param {TouchEvent} event
 * @returns {GestureState}
 */
export function initializeGestureState(event) {
  const touches = getTouchPoints(event);

  const state = {
    touches,
    startTouches: touches.map((t) => ({ ...t })),
    startTime: Date.now(),
    startDistance: touches.length >= 2 ? calculateDistance(touches[0], touches[1]) : 0,
    currentDistance: touches.length >= 2 ? calculateDistance(touches[0], touches[1]) : 0,
  };

  return state;
}

/**
 * Update gesture state with current touch event
 * @param {GestureState} state
 * @param {TouchEvent} event
 * @returns {GestureState}
 */
export function updateGestureState(state, event) {
  const touches = getTouchPoints(event);

  return {
    ...state,
    touches,
    currentDistance: touches.length >= 2 ? calculateDistance(touches[0], touches[1]) : state.currentDistance,
  };
}

/**
 * Detect pinch gesture (two-finger distance change)
 * @param {GestureState} state
 * @param {number} sensitivityThreshold - Minimum distance change for pinch (default 20px)
 * @returns {Object} - Pinch info { isPinch, scale, direction }
 */
export function detectPinch(state, sensitivityThreshold = 20) {
  if (state.startDistance === 0 || state.currentDistance === 0) {
    return { isPinch: false, scale: 1, direction: 'none' };
  }

  const distanceChange = state.currentDistance - state.startDistance;
  const isPinch = Math.abs(distanceChange) >= sensitivityThreshold;

  const scale = state.currentDistance / state.startDistance;
  const direction = distanceChange > 0 ? 'out' : 'in'; // out = zoom out, in = zoom in

  return { isPinch, scale, direction, distanceChange };
}

/**
 * Calculate horizontal swipe information
 * @param {GestureState} state
 * @returns {Object} - Swipe info { distance, velocity, direction }
 */
export function calculateSwipe(state) {
  if (state.startTouches.length === 0 || state.touches.length === 0) {
    return { distance: 0, velocity: 0, direction: 'none' };
  }

  const startTouch = state.startTouches[0];
  const currentTouch = state.touches[0];

  const distance = currentTouch.x - startTouch.x;
  const duration = Date.now() - state.startTime;
  const velocity = calculateVelocity(distance, duration);
  const direction = distance > 0 ? 'right' : 'left';

  return { distance, velocity, direction, duration };
}

/**
 * Detect if swipe should dismiss (high velocity or large distance)
 * @param {Object} swipe - Swipe info from calculateSwipe
 * @param {number} velocityThreshold - Velocity threshold (default 0.3 px/ms)
 * @param {number} distanceThreshold - Distance threshold (default 50px or 50% of width)
 * @returns {boolean}
 */
export function shouldDismissOnSwipe(swipe, velocityThreshold = 0.3, distanceThreshold = 50) {
  return swipe.velocity >= velocityThreshold || Math.abs(swipe.distance) >= distanceThreshold;
}

/**
 * Calculate snap-back animation values
 * @param {number} currentOffset - Current offset in pixels
 * @param {number} containerWidth - Width of container in pixels
 * @returns {Object} - Animation { targetOffset, duration, easing }
 */
export function calculateSnapBack(currentOffset, containerWidth = 400) {
  const targetOffset = 0;
  const distance = Math.abs(currentOffset - targetOffset);

  // Duration based on distance (faster for shorter distances)
  const baseDuration = 150;
  const maxDuration = 400;
  const duration = Math.min(baseDuration + distance / 2, maxDuration);

  return {
    targetOffset,
    duration,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-like easing
  };
}

/**
 * Create gesture detector function for element
 * @param {HTMLElement} element
 * @param {Object} options
 * @returns {Object} - Detector with attach/detach methods
 */
export function createGestureDetector(element, options = {}) {
  const {
    onFlick,
    onPinch,
    onSwipe,
    flickVelocityThreshold = 0.5,
    swipeVelocityThreshold = 0.3,
    swipeDistanceThreshold = 50,
    pinchSensitivity = 20,
  } = options;

  let gestureState = null;
  let isTracking = false;

  const handlers = {
    onTouchStart: (e) => {
      isTracking = true;
      gestureState = initializeGestureState(e);
    },

    onTouchMove: (e) => {
      if (!isTracking || !gestureState) return;
      gestureState = updateGestureState(gestureState, e);
    },

    onTouchEnd: (e) => {
      if (!isTracking || !gestureState) return;
      isTracking = false;

      // Detect pinch
      const pinch = detectPinch(gestureState, pinchSensitivity);
      if (pinch.isPinch && typeof onPinch === 'function') {
        onPinch(pinch);
      }

      // Detect swipe/flick
      const swipe = calculateSwipe(gestureState);

      const isFlickGesture = isFlick(swipe.velocity, swipe.distance, flickVelocityThreshold, 30);
      if (isFlickGesture && typeof onFlick === 'function') {
        onFlick(swipe);
      }

      const shouldDismiss = shouldDismissOnSwipe(swipe, swipeVelocityThreshold, swipeDistanceThreshold);
      if (shouldDismiss && typeof onSwipe === 'function') {
        onSwipe(swipe);
      }

      gestureState = null;
    },
  };

  return {
    attach() {
      if (!element) return;
      element.addEventListener('touchstart', handlers.onTouchStart, { passive: true });
      element.addEventListener('touchmove', handlers.onTouchMove, { passive: false });
      element.addEventListener('touchend', handlers.onTouchEnd, { passive: true });
      element.addEventListener('touchcancel', handlers.onTouchEnd, { passive: true });
    },

    detach() {
      if (!element) return;
      element.removeEventListener('touchstart', handlers.onTouchStart);
      element.removeEventListener('touchmove', handlers.onTouchMove);
      element.removeEventListener('touchend', handlers.onTouchEnd);
      element.removeEventListener('touchcancel', handlers.onTouchEnd);
    },

    getState() {
      return gestureState;
    },
  };
}

/**
 * AI Priority Routing for Toast Notifications
 * Uses content analysis to intelligently prioritize toast queue
 *
 * Scorers evaluate toasts and assign priority scores (0-100)
 * Higher scores = higher priority (show sooner)
 * Zero-dependency, TypeSafe AI compatible
 */

"use strict";

/**
 * @typedef {Object} ToastScoringContext
 * @property {string} type - Toast type (success, error, warning, info)
 * @property {string} message - Toast message content
 * @property {number} duration - Duration in milliseconds
 * @property {Record<string, unknown>} options - Full toast options
 */

/**
 * @typedef {Object} ScorerResult
 * @property {number} score - Priority score (0-100)
 * @property {Record<string, number>} breakdown - Score breakdown by factor
 * @property {string[]} keywords - Detected keywords affecting score
 */

/**
 * Base priority scores by toast type
 */
const TYPE_PRIORITY = {
  error: 85,
  warning: 70,
  info: 40,
  success: 30,
};

/**
 * High-priority urgency keywords
 */
const URGENCY_KEYWORDS = [
  // Critical/severe
  'error', 'critical', 'severe', 'emergency', 'failure', 'fatal', 'crash',
  'urgent', 'important', 'attention', 'immediate', 'now', 'fast',
  'deadline', 'due', 'timeout', 'expired', 'overdue',
  'security', 'breach', 'attack', 'unauthorized', 'hack',
  'lost', 'missing', 'offline', 'down', 'unavailable',

  // Business impact
  'outage', 'downtime', 'broken', 'malfunction', 'defect', 'bug',
  'data loss', 'corruption', 'invalid', 'wrong', 'incorrect',
  'blocked', 'stopped', 'halted', 'paused', 'interrupted',
  'exceeded', 'limit', 'quota', 'full', 'capacity',

  // User impact
  'cannot', 'unable', 'failed', 'rejected', 'denied', 'blocked',
  'invalid', 'expired', 'credentials', 'password', 'auth',
  'payment', 'billing', 'charge', 'transaction', 'money',
  'account', 'profile', 'settings', 'preferences',
];

/**
 * Neutral/Low priority keywords (demote score)
 */
const LOW_PRIORITY_KEYWORDS = [
  // Routine/informational
  'success', 'completed', 'finished', 'done', 'ready',
  'info', 'information', 'note', 'notice', 'reminder',
  'progress', 'processing', 'loading', 'saving', 'uploading',
  'test', 'demo', 'sample', 'example', 'placeholder',
  'updated', 'changed', 'modified', 'edited', 'created',
  'connected', 'disconnected', 'online', 'offline',
];

/**
 * Calculate priority score for toast based on type, message, and context
 * @param {ToastScoringContext} context
 * @returns {ScorerResult}
 */
export function calculateToastPriority(context) {
  if (!context || typeof context !== 'object') {
    return { score: 50, breakdown: { base: 50 }, keywords: [] };
  }

  const { type, message, duration } = context;
  const breakdown = {};
  const detectedKeywords = [];
  let score = 50; // Neutral base

  // Factor 1: Type priority
  const typeScore = TYPE_PRIORITY[type] || 50;
  breakdown.type = typeScore;
  score += (typeScore - 50) * 0.6; // Weight type moderately

  // Factor 2: Message urgency
  const safeMessage = typeof message === 'string' ? message : String(message ?? '');
  const messageLower = safeMessage.toLowerCase();
  let urgencyScore = 0;

  // Precompile regexes with word boundaries to prevent substring collisions (e.g. 'debug' matching 'bug', 'download' matching 'down')
  for (const keyword of URGENCY_KEYWORDS) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(safeMessage)) {
      detectedKeywords.push(keyword);
      urgencyScore += 2; // +2 points per urgency keyword
    }
  }

  for (const keyword of LOW_PRIORITY_KEYWORDS) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(safeMessage)) {
      detectedKeywords.push(keyword);
      urgencyScore -= 1; // -1 point per low-priority keyword
    }
  }

  breakdown.urgency = Math.min(Math.max(urgencyScore, -10), 20); // Cap -10 to +20
  score += urgencyScore;

  // Factor 3: Duration (shorter = higher priority)
  const hasDuration = typeof duration === 'number' && duration > 0;
  if (hasDuration) {
    const durationScore = Math.max(0, 30 - (duration / 1000)); // 0-30 range based on seconds
    breakdown.duration = Math.round(durationScore);
    score += durationScore * 0.5; // Weight duration lightly
  }

  // Factor 4: Message length (brief = higher priority)
  const messageLength = messageLower.length;
  if (messageLength > 0) {
    const lengthPenalty = Math.min(10, Math.floor(messageLength / 50)); // Penalty for long messages
    breakdown.length = -lengthPenalty;
    score -= lengthPenalty;
  }

  // Factor 5: Exclamation marks (indicates emphasis)
  const exclamationCount = (safeMessage.match(/!/g) || []).length;
  const exclamationScore = Math.min(5, exclamationCount); // Up to +5
  breakdown.emphasis = exclamationScore;
  score += exclamationScore;

  // Factor 6: ALL CAPS words (indicates shouting/urgency)
  const allCapsWords = (safeMessage.match(/\b[A-Z]{3,}\b/g) || []).length;
  const capsScore = Math.min(5, allCapsWords); // Up to +5
  breakdown.caps = capsScore;
  score += capsScore;

  // Clamp score to 0-100 range
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    breakdown,
    keywords: [...new Set(detectedKeywords)], // Deduplicate
  };
}

/**
 * Extract semantic category from toast message
 * @param {string} message
 * @returns {string[]} - Categories (security, performance, user, system, etc.)
 */
export function categorizeToast(message) {
  if (!message || typeof message !== 'string') return ['unknown'];

  const msgLower = message.toLowerCase();
  const categories = [];

  // Security-related
  if (/\b(security|auth|password|unauthorized|breach|hack)\b/i.test(msgLower)) {
    categories.push('security');
  }

  // Performance-related
  if (/\b(performance|slow|timeout|load|latency|responsive)\b/i.test(msgLower)) {
    categories.push('performance');
  }

  // User-related
  if (/\b(user|profile|account|preferences|settings|avatar)\b/i.test(msgLower)) {
    categories.push('user');
  }

  // System-related
  if (/\b(system|server|database|network|connection|backend)\b/i.test(msgLower)) {
    categories.push('system');
  }

  // Business-related
  if (/\b(payment|transaction|billing|charge|order|cart)\b/i.test(msgLower)) {
    categories.push('business');
  }

  // UI/UX related
  if (/\b(ui|interface|click|scroll|mobile)\b/i.test(msgLower)) {
    categories.push('ui');
  }

  // Fallback to 'general' if no specific category
  if (categories.length === 0) {
    categories.push('general');
  }

  return categories;
}

/**
 * Computes deterministic AI priority boost without non-deterministic random numbers.
 * Strictly offline-first, reproducible, and compliant with core library purity.
 * @param {ToastScoringContext} context
 * @param {ScorerResult} localScore
 * @returns {number} Boost between 5 and 15 points
 */
export function calculateDeterministicAIBoost(context, localScore) {
  let boost = 5; // Base deterministic boost when AI prioritization is active

  const safeMsg = String(context?.message ?? "").toLowerCase();
  const categories = categorizeToast(safeMsg);

  // 1. High-Impact Domain Boost: Security or business/payment issues
  if (categories.includes("security") || categories.includes("business")) {
    boost += 4;
  }

  // 2. Actionability Boost: When toast contains interactive CTA button (action required)
  if (context?.options?.cta || context?.options?.action) {
    boost += 3;
  }

  // 3. High Urgency Density: When 2 or more critical urgency keywords match
  if (Array.isArray(localScore?.keywords) && localScore.keywords.length >= 2) {
    boost += 3;
  }

  return Math.min(15, boost);
}

/**
 * TypeSafe AI integration: Enhanced scoring with deterministic rule-based boost
 * and customScorer hook support for user application models.
 * @param {ToastScoringContext} context
 * @param {Object} [aiOptions={}] - TypeSafe AI options
 * @returns {Promise<ScorerResult>}
 */
export async function scoreWithTypeSafeAI(context, aiOptions = {}) {
  const { useAI = false, apiKey, customScorer } = aiOptions;

  if (typeof customScorer === "function") {
    try {
      const customRes = await customScorer(context);
      if (typeof customRes === "number" && Number.isFinite(customRes)) {
        const clamped = Math.max(0, Math.min(100, Math.round(customRes)));
        return {
          score: clamped,
          breakdown: { custom: clamped },
          keywords: [],
          aiEnhanced: true,
        };
      } else if (customRes && typeof customRes === "object") {
        return {
          score: Math.max(0, Math.min(100, Math.round(customRes.score ?? 50))),
          breakdown: customRes.breakdown || {},
          keywords: Array.isArray(customRes.keywords) ? customRes.keywords : [],
          aiEnhanced: true,
        };
      }
    } catch (customErr) {
      console.warn("[Toast] Custom priority scorer threw error:", customErr);
    }
  }

  if (!useAI && !apiKey) {
    // Fallback to local scoring if AI not configured
    return calculateToastPriority(context);
  }

  try {
    const localScore = calculateToastPriority(context);
    const aiBoost = calculateDeterministicAIBoost(context, localScore);

    return {
      score: Math.min(100, localScore.score + aiBoost),
      breakdown: {
        ...localScore.breakdown,
        aiBoost,
      },
      keywords: localScore.keywords,
      aiEnhanced: true,
    };
  } catch (error) {
    console.warn("[Toast] AI scoring failed, falling back to local:", error);
    return calculateToastPriority(context);
  }
}

/**
 * Sort toast queue by priority score
 * @param {Array} queue - Toast queue items
 * @param {Object} [options={}] - Scoring options
 * @returns {Array} - Sorted queue (highest priority first)
 */
export function prioritizeQueue(queue, options = {}) {
  if (!Array.isArray(queue) || queue.length <= 1) {
    return Array.isArray(queue) ? queue : [];
  }

  const { useAI = false, aiApiKey, customScorer } = options;

  // Score each item in queue
  const scoredQueue = queue.map((item, index) => {
    const context = {
      type: item?.options?.type || "info",
      message: item?.options?.message || "",
      duration: item?.options?.duration,
      options: item?.options,
      queuePosition: index,
    };

    let scoreResult;
    if (typeof customScorer === "function") {
      try {
        const customVal = customScorer(context);
        const numVal = typeof customVal === "number" ? customVal : (customVal?.score ?? 50);
        scoreResult = {
          score: Math.max(0, Math.min(100, Math.round(numVal))),
          breakdown: { custom: numVal },
          keywords: [],
        };
      } catch {
        scoreResult = calculateToastPriority(context);
      }
    } else if (useAI || aiApiKey) {
      const base = calculateToastPriority(context);
      const boost = calculateDeterministicAIBoost(context, base);
      scoreResult = {
        score: Math.min(100, base.score + boost),
        breakdown: { ...base.breakdown, aiBoost: boost },
        keywords: base.keywords,
      };
    } else {
      scoreResult = calculateToastPriority(context);
    }

    return {
      ...item,
      _priority: {
        score: scoreResult.score,
        breakdown: scoreResult.breakdown,
        keywords: scoreResult.keywords,
      },
    };
  });

  // Sort by priority score (descending)
  return scoredQueue.sort((a, b) => {
    return (b?._priority?.score ?? 0) - (a?._priority?.score ?? 0);
  });
}

/**
 * Create a priority-based queue manager
 * @param {Object} config - Manager configuration
 * @returns {Object} - Queue manager instance
 */
export function createPriorityQueueManager(config = {}) {
  const {
    useAI = false,
    aiApiKey = null,
    minScoreThreshold = 20,
    enableAutoPrioritization = true,
  } = config;

  const state = {
    useAI,
    aiApiKey,
    minScoreThreshold,
    enableAutoPrioritization,
    scoringHistory: [],
  };

  return {
    /**
     * Add item to queue with priority scoring
     * @param {Object} item - Queue item
     * @param {Array} queue - Current queue
     * @returns {Array} - Updated queue
     */
    addWithPriority(item, queue = []) {
      if (!enableAutoPrioritization) {
        return [...queue, item];
      }

      const context = {
        type: item.options?.type || 'info',
        message: item.options?.message || '',
        duration: item.options?.duration,
        options: item.options,
      };

      const scoreResult = useAI && aiApiKey
        ? calculateToastPriority(context) // In production: await scoreWithTypeSafeAI(context, { useAI, apiKey: aiApiKey })
        : calculateToastPriority(context);

      const scoredItem = {
        ...item,
        _priority: {
          score: scoreResult.score,
          breakdown: scoreResult.breakdown,
          keywords: scoreResult.keywords,
          timestamp: Date.now(),
        },
      };

      // Add to scoring history
      state.scoringHistory.push({
        item: { key: item.key, type: context.type },
        score: scoreResult.score,
        timestamp: Date.now(),
      });

      // Keep history limited
      if (state.scoringHistory.length > 100) {
        state.scoringHistory.shift();
      }

      // Filter out low priority items if below threshold
      if (scoreResult.score < minScoreThreshold) {
        console.debug('[Toast] Low priority item skipped:', {
          key: item.key,
          score: scoreResult.score,
          threshold: minScoreThreshold,
        });
        return queue; // Skip adding to queue
      }

      // Insert into sorted position
      const newQueue = [...queue, scoredItem];
      return prioritizeQueue(newQueue, { useAI, aiApiKey });
    },

    /**
     * Get priority statistics
     * @returns {Object} - Stats about queue priority
     */
    getStats() {
      const recentScores = state.scoringHistory.slice(-10);
      const avgScore = recentScores.length > 0
        ? recentScores.reduce((sum, item) => sum + item.score, 0) / recentScores.length
        : 0;

      return {
        totalScored: state.scoringHistory.length,
        averageScore: Math.round(avgScore),
        recentScores: recentScores.map(s => s.score),
        config: {
          useAI,
          minScoreThreshold,
          enableAutoPrioritization,
        },
      };
    },

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration
     */
    updateConfig(newConfig) {
      Object.assign(state, newConfig);
    },

    /**
     * Get current configuration
     * @returns {Object} - Current configuration
     */
    getConfig() {
      return { ...state, scoringHistory: [] }; // Don't expose full history
    },

    /**
     * Reset manager state
     */
    reset() {
      state.scoringHistory = [];
    },
  };
}

// Default export for convenience
export default {
  calculateToastPriority,
  categorizeToast,
  scoreWithTypeSafeAI,
  prioritizeQueue,
  createPriorityQueueManager,
};

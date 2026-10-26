/**
 * i18n & Localization Engine for Customizable Toast Notifications
 * Zero-dependency, offline-first localization subsystem.
 *
 * Provides built-in locale dictionaries for 7 languages:
 * - English ('en')
 * - Hindi ('hi')
 * - Spanish ('es')
 * - French ('fr')
 * - German ('de')
 * - Arabic ('ar' - RTL)
 * - Japanese ('ja')
 */

/**
 * @typedef {'en' | 'hi' | 'es' | 'fr' | 'de' | 'ar' | 'ja'} BuiltinLocale
 *
 * @typedef {Object} LocaleMessages
 * @property {string} [success] - Default success message
 * @property {string} [error] - Default error message
 * @property {string} [warning] - Default warning message
 * @property {string} [info] - Default information message
 * @property {string} [loading] - Default loading message
 * @property {string} [undo] - Default Undo action label
 * @property {string} [close] - Default Close button aria-label
 */

/** @type {Record<BuiltinLocale, Required<LocaleMessages>>} */
const LOCALES = {
  en: {
    success: "Operation completed successfully!",
    error: "Something went wrong!",
    warning: "Warning message!",
    info: "Information message!",
    loading: "Loading, please wait...",
    undo: "Undo",
    close: "Close notification",
  },
  hi: {
    success: "कार्य सफलतापूर्वक संपन्न हुआ!",
    error: "कुछ गड़बड़ हो गई!",
    warning: "चेतावनी: कृपया ध्यान दें!",
    info: "यहाँ कुछ जानकारी है!",
    loading: "लोड हो रहा है, कृपया प्रतीक्षा करें...",
    undo: "पूर्ववत करें",
    close: "सूचना बंद करें",
  },
  es: {
    success: "¡Operación completada con éxito!",
    error: "¡Algo salió mal!",
    warning: "¡Advertencia!",
    info: "¡Información!",
    loading: "Cargando, por favor espere...",
    undo: "Deshacer",
    close: "Cerrar notificación",
  },
  fr: {
    success: "Opération terminée avec succès !",
    error: "Une erreur est survenue !",
    warning: "Attention !",
    info: "Information !",
    loading: "Chargement, veuillez patienter...",
    undo: "Annuler",
    close: "Fermer la notification",
  },
  de: {
    success: "Vorgang erfolgreich abgeschlossen!",
    error: "Etwas ist schiefgelaufen!",
    warning: "Warnung!",
    info: "Information!",
    loading: "Laden, bitte warten...",
    undo: "Rückgängig",
    close: "Benachrichtigung schließen",
  },
  ar: {
    success: "تمت العملية بنجاح!",
    error: "حدث خطأ ما!",
    warning: "تحذير!",
    info: "معلومات!",
    loading: "جارٍ التحميل، يرجى الانتظار...",
    undo: "تراجع",
    close: "إغلاق الإشعار",
  },
  ja: {
    success: "操作が正常に完了しました！",
    error: "問題が発生しました！",
    warning: "警告メッセージ！",
    info: "お知らせ！",
    loading: "読み込み中、お待ちください...",
    undo: "元に戻す",
    close: "通知を閉じる",
  },
};

/** @type {string} */
let currentLocale = "en";

/** @type {Map<string, LocaleMessages>} */
const customLocales = new Map();

/**
 * Sets the active global locale for toast notifications.
 * @param {string} locale - Locale code (e.g. 'en', 'hi', 'es', 'fr', 'de', 'ar', 'ja')
 * @returns {string} The active locale code
 */
export function setLocale(locale) {
  if (typeof locale !== "string" || !locale.trim()) {
    return currentLocale;
  }
  const normalized = locale.trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(LOCALES, normalized) || customLocales.has(normalized)) {
    currentLocale = normalized;
  }
  return currentLocale;
}

/**
 * Returns the currently active global locale code.
 * @returns {string} Current locale code
 */
export function getLocale() {
  return currentLocale;
}

/**
 * Returns a list of all currently supported locale codes.
 * @returns {string[]} Array of locale codes
 */
export function getAvailableLocales() {
  return [...Object.keys(LOCALES), ...Array.from(customLocales.keys())];
}

/**
 * Registers or overrides localized messages for a given locale code.
 * @param {string} locale - Locale code (e.g. 'it', 'pt', 'zh')
 * @param {LocaleMessages} messages - Dictionary of localized messages
 */
export function registerLocale(locale, messages) {
  if (
    typeof locale !== "string" ||
    !locale.trim() ||
    typeof messages !== "object" ||
    messages === null ||
    Array.isArray(messages)
  ) {
    return;
  }
  const normalized = locale.trim().toLowerCase();
  const existing = customLocales.get(normalized) || LOCALES[normalized] || {};
  customLocales.set(normalized, { ...existing, ...messages });
}

/**
 * Retrieves the localized message for a given toast type or action.
 * @param {string} type - Toast type ('success', 'error', 'warning', 'info', 'loading', 'undo', 'close')
 * @param {string} [fallback] - Fallback message if key not found
 * @returns {string | undefined} Localized message string
 */
export function getLocaleMessage(type, fallback) {
  if (typeof type !== "string") return fallback;
  const custom = customLocales.get(currentLocale);
  if (custom && typeof custom[type] === "string" && custom[type].trim()) {
    return custom[type];
  }
  const builtIn = LOCALES[currentLocale];
  if (builtIn && typeof builtIn[type] === "string") {
    return builtIn[type];
  }
  const en = LOCALES.en;
  if (en && typeof en[type] === "string") {
    return en[type];
  }
  return fallback;
}

/**
 * Determines whether a locale is traditionally written right-to-left (RTL).
 * @param {string} [locale=currentLocale] - Locale code to test
 * @returns {boolean} True if RTL locale
 */
export function isRtlLocale(locale = currentLocale) {
  const norm = String(locale || "").toLowerCase().trim();
  return norm === "ar" || norm === "he" || norm === "fa" || norm === "ur";
}

/**
 * Resets the active locale back to 'en' and clears any registered custom locales.
 */
export function resetLocale() {
  currentLocale = "en";
  customLocales.clear();
}

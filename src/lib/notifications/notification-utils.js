import { NOTIFICATION_META } from "./notification-types";

export function replaceTemplateVariables(template, variables = {}) {
  if (!template) return "";

  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const value = variables[key.trim()];
    return value ?? "";
  });
}

/**
 * Returns notification metadata.
 */
export function getNotificationMeta(type) {
  return (
    NOTIFICATION_META[type] || {
      title: "Notification",
      icon: "Bell",
      color: "blue",
      priority: "LOW",
      action: null,
    }
  );
}

/**
 * Builds action URL.
 */
export function buildActionUrl(action, id) {
  if (!action || !id) return null;

  const routes = {
    VIEW_INVOICE: (id) => `/invoices/${id}`,
    VIEW_CLIENT: (id) => `/clients/${id}`,
    VIEW_PAYMENT: (id) => `/payments/${id}`,
    VIEW_FOLLOWUP: (id) => `/followups/${id}`,
    OPEN_SETTINGS: () => "/settings",
  };

  return routes[action]?.(id) ?? null;
}

/**
 * Format currency.
 */
export function formatCurrency(amount, currency = "INR", locale = "en-IN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(Number(amount || 0));
}

/**
 * Format date.
 */
export function formatDate(
  date,
  locale = "en-IN",
  options = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
) {
  if (!date) return "";

  return new Date(date).toLocaleDateString(locale, options);
}

/**
 * Truncate long text.
 */
export function truncateMessage(text, maxLength = 80) {
  if (!text) return "";

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + "...";
}

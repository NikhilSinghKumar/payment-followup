// ======================================================
// Notification Types
// ======================================================

export const NOTIFICATION_TYPES = {
  // Invoice
  INVOICE_CREATED: "INVOICE_CREATED",
  BILL_SUBMITTED: "BILL_SUBMITTED",
  INVOICE_DUE: "INVOICE_DUE",
  DUE_REMINDER: "DUE_REMINDER",
  OVERDUE_REMINDER: "OVERDUE_REMINDER",
  FINAL_REMINDER: "FINAL_REMINDER",

  // Payment
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  PAYMENT_CLEARED: "PAYMENT_CLEARED",

  // Client
  CLIENT_CREATED: "CLIENT_CREATED",
  CLIENT_UPDATED: "CLIENT_UPDATED",
  CLIENT_OVERDUE: "CLIENT_OVERDUE",
  SERVICE_SUSPENSION_NOTICE: "SERVICE_SUSPENSION_NOTICE",
  SERVICE_SUSPENSION_ALERT: "SERVICE_SUSPENSION_ALERT",

  // Follow-up
  FOLLOWUP_CREATED: "FOLLOWUP_CREATED",
  FOLLOWUP_DUE: "FOLLOWUP_DUE",
  FOLLOWUP_COMPLETED: "FOLLOWUP_COMPLETED",

  // Email
  EMAIL_SENT: "EMAIL_SENT",
  EMAIL_FAILED: "EMAIL_FAILED",

  // System
  SYSTEM: "SYSTEM",
};

// ======================================================
// Notification Priorities
// ======================================================

export const NOTIFICATION_PRIORITIES = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

// ======================================================
// Delivery Channels
// ======================================================

export const DELIVERY_CHANNELS = {
  IN_APP: "IN_APP",
  EMAIL: "EMAIL",
  SMS: "SMS",
  WHATSAPP: "WHATSAPP",
  PUSH: "PUSH",
};

// ======================================================
// Notification Status
// ======================================================

export const NOTIFICATION_STATUS = {
  PENDING: "PENDING",
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  OPENED: "OPENED",
  READ: "READ",
};

// ======================================================
// Template Types
// ======================================================

export const TEMPLATE_TYPES = {
  BILL_SUBMITTED: "BILL_SUBMITTED",
  DUE_REMINDER: "DUE_REMINDER",
  OVERDUE_REMINDER: "OVERDUE_REMINDER",
  FINAL_REMINDER: "FINAL_REMINDER",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  PAYMENT_CLEARED: "PAYMENT_CLEARED",
  INTERNAL_DUE_TODAY: "INTERNAL_DUE_TODAY",
  SERVICE_SUSPENSION_NOTICE: "SERVICE_SUSPENSION_NOTICE",
  SERVICE_SUSPENSION_ALERT: "SERVICE_SUSPENSION_ALERT",
};

// ======================================================
// Notification Icons
// (Lucide React icon names)
// ======================================================

export const NOTIFICATION_ICONS = {
  invoice: "Receipt",

  payment: "CreditCard",

  reminder: "Clock",

  overdue: "TriangleAlert",

  success: "CircleCheck",

  failed: "CircleX",

  email: "Mail",

  followup: "MessageSquare",

  warning: "AlertTriangle",

  system: "Bell",

  blocked: "ShieldAlert",
};

// ======================================================
// Notification Colors
// ======================================================

export const NOTIFICATION_COLORS = {
  BLUE: "blue",

  GREEN: "green",

  YELLOW: "yellow",

  RED: "red",

  ORANGE: "orange",

  GRAY: "gray",
};

// ======================================================
// Notification Actions
// ======================================================

export const NOTIFICATION_ACTIONS = {
  VIEW_INVOICE: "VIEW_INVOICE",

  VIEW_PAYMENT: "VIEW_PAYMENT",

  VIEW_CLIENT: "VIEW_CLIENT",

  VIEW_FOLLOWUP: "VIEW_FOLLOWUP",

  OPEN_SETTINGS: "OPEN_SETTINGS",
};

export const NOTIFICATION_META = {
  [NOTIFICATION_TYPES.BILL_SUBMITTED]: {
    title: "Billed Submitted",
    icon: NOTIFICATION_ICONS.invoice,
    color: NOTIFICATION_COLORS.BLUE,
    priority: NOTIFICATION_PRIORITIES.LOW,
    action: NOTIFICATION_ACTIONS.VIEW_INVOICE,
  },

  [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: {
    title: "Payment Received",
    icon: NOTIFICATION_ICONS.success,
    color: NOTIFICATION_COLORS.GREEN,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    action: NOTIFICATION_ACTIONS.VIEW_PAYMENT,
  },

  [NOTIFICATION_TYPES.OVERDUE_REMINDER]: {
    title: "Overdue Reminder",
    icon: NOTIFICATION_ICONS.overdue,
    color: NOTIFICATION_COLORS.ORANGE,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    action: NOTIFICATION_ACTIONS.VIEW_INVOICE,
  },

  [NOTIFICATION_TYPES.EMAIL_FAILED]: {
    title: "Email Failed",
    icon: NOTIFICATION_ICONS.failed,
    color: NOTIFICATION_COLORS.RED,
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    action: NOTIFICATION_ACTIONS.OPEN_SETTINGS,
  },
  [NOTIFICATION_TYPES.DUE_REMINDER]: {
    title: "Payment Due Soon",
    icon: NOTIFICATION_ICONS.reminder,
    color: NOTIFICATION_COLORS.YELLOW,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    action: NOTIFICATION_ACTIONS.VIEW_INVOICE,
  },

  [NOTIFICATION_TYPES.INVOICE_DUE]: {
    title: "Invoice Due Today",
    icon: NOTIFICATION_ICONS.warning,
    color: NOTIFICATION_COLORS.ORANGE,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    action: NOTIFICATION_ACTIONS.VIEW_INVOICE,
  },

  [NOTIFICATION_TYPES.SERVICE_SUSPENSION_NOTICE]: {
    title: "Service Suspension Notice",
    icon: NOTIFICATION_ICONS.blocked,
    color: NOTIFICATION_COLORS.RED,
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    action: NOTIFICATION_ACTIONS.VIEW_CLIENT,
  },
  [NOTIFICATION_TYPES.SERVICE_SUSPENSION_ALERT]: {
    title: "Service Suspension Required",
    icon: NOTIFICATION_ICONS.blocked,
    color: NOTIFICATION_COLORS.RED,
    priority: NOTIFICATION_PRIORITIES.CRITICAL,
    action: NOTIFICATION_ACTIONS.VIEW_CLIENT,
  },
  [NOTIFICATION_TYPES.PAYMENT_CLEARED]: {
    title: "Payment Cleared",
    icon: NOTIFICATION_ICONS.success,
    color: NOTIFICATION_COLORS.GREEN,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    action: NOTIFICATION_ACTIONS.VIEW_PAYMENT,
  },
};

// ==========================================
// SESSION
// ==========================================

export const SESSION_COOKIE_NAME = "payfolo_session";

export const SESSION_TOKEN_BYTES = 32;

export const SESSION_DURATION_DAYS = 1;

// ==========================================
// USER TYPES
// ==========================================

export const USER_TYPES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  USER: "USER",
};

// ==========================================
// PUBLIC ROUTES
// ==========================================

export const PUBLIC_ROUTES = ["/login"];

// ==========================================
// AUTH MESSAGES
// ==========================================

export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password.",
  ACCOUNT_DISABLED: "Your account has been disabled.",
  LOGIN_REQUIRED: "Please login to continue.",
  EMAIL_REQUIRED: "Email is required.",
  PASSWORD_REQUIRED: "Password is required.",
  INVALID_EMAIL_OR_PASSWORD: "Email or Password is required.",
  LOGIN_CREDENTIALS_REQUIRED: "Login credentials are required",
};

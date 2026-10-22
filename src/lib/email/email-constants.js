export const EMAIL_PROVIDER = {
  SMTP: "SMTP",
};

export const DEFAULT_FROM = {
  name: process.env.SMTP_FROM_NAME || "PAFEX Accounts",
  email: process.env.SMTP_FROM_EMAIL || "accounts@pafex.in",
};

export const DEFAULT_REPLY_TO =
  process.env.SMTP_REPLY_TO || "muskan@pafex.in";

export const DEFAULT_CC = process.env.SMTP_DEFAULT_CC || null;


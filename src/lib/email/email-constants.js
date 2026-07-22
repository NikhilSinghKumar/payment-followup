export const EMAIL_PROVIDER = {
  SMTP: "SMTP",
};

export const DEFAULT_FROM = {
  name: process.env.SMTP_FROM_NAME || "PAFEX",
  email: process.env.SMTP_FROM_EMAIL,
};

import { DEFAULT_FROM } from "./email-constants";

export function buildFromAddress() {
  return `"${DEFAULT_FROM.name}" <${DEFAULT_FROM.email}>`;
}

export function normalizeRecipients(recipients) {
  if (!recipients) return "";

  if (Array.isArray(recipients)) {
    return recipients.join(", ");
  }

  return recipients;
}

export function validateEmailOptions(options) {
  if (!options.to) {
    throw new Error("Email recipient is required.");
  }

  if (!options.subject) {
    throw new Error("Email subject is required.");
  }

  if (!options.html && !options.text) {
    throw new Error("Email body is required.");
  }
}

import { DEFAULT_FROM, DEFAULT_REPLY_TO } from "./email-constants";

export function buildFromAddress(customFrom) {
  if (customFrom) {
    if (typeof customFrom === "string") return customFrom;
    if (customFrom.email) {
      const name = customFrom.name || DEFAULT_FROM.name || "PAFEX Accounts";
      return `"${name}" <${customFrom.email}>`;
    }
  }
  const name = DEFAULT_FROM.name || "PAFEX Accounts";
  const email = DEFAULT_FROM.email || "accounts@pafex.in";
  return `"${name}" <${email}>`;
}

export function buildReplyToAddress(customReplyTo) {
  if (customReplyTo) {
    if (typeof customReplyTo === "string") return customReplyTo;
    if (customReplyTo.email) {
      const name = customReplyTo.name || "Muskan (PAFEX)";
      return `"${name}" <${customReplyTo.email}>`;
    }
  }
  if (!DEFAULT_REPLY_TO) return undefined;
  return `"Muskan (PAFEX)" <${DEFAULT_REPLY_TO}>`;
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

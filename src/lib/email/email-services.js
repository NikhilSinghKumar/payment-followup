import path from "path";
import fs from "fs";
import { transporter } from "./transporter";
import { DEFAULT_CC } from "./email-constants";

import {
  buildFromAddress,
  buildReplyToAddress,
  normalizeRecipients,
  validateEmailOptions,
} from "./email-utils";

/**
 * Send an email.
 *
 * @param {Object} options
 * @param {string|string[]} options.to
 * @param {string} options.subject
 * @param {string} [options.html]
 * @param {string} [options.text]
 * @param {string|string[]} [options.from] - Custom from address or default to accounts@pafex.in
 * @param {string|string[]} [options.replyTo] - Custom reply-to address or default to muskan@pafex.in
 * @param {string|string[]} [options.cc] - Optional CC recipients
 * @param {string|string[]} [options.bcc]
 * @param {Array} [options.attachments]
 *
 * @returns {Promise<Object>}
 */
export async function sendEmail(options) {
  validateEmailOptions(options);

  const attachments = Array.isArray(options.attachments)
    ? [...options.attachments]
    : [];

  // Automatically attach inline PAFEX logo if cid:pafex_logo is referenced in the HTML
  if (options.html && options.html.includes("cid:pafex_logo")) {
    const hasLogoCid = attachments.some((a) => a && a.cid === "pafex_logo");
    if (!hasLogoCid) {
      const logoPath = path.join(process.cwd(), "public", "pafex_logo.png");
      if (fs.existsSync(logoPath)) {
        attachments.push({
          filename: "pafex_logo.png",
          path: logoPath,
          cid: "pafex_logo",
        });
      }
    }
  }

  // Construct deduplicated CC list (only explicit CC recipients)
  const ccSet = new Set();
  if (options.cc) {
    const rawCc = Array.isArray(options.cc) ? options.cc : [options.cc];
    for (const item of rawCc) {
      if (!item) continue;
      String(item)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((e) => ccSet.add(e));
    }
  }

  if (options.includeDefaultCc && DEFAULT_CC) {
    ccSet.add(DEFAULT_CC);
  }

  const mailOptions = {
    from: buildFromAddress(options.from),
    replyTo: buildReplyToAddress(options.replyTo),
    to: normalizeRecipients(options.to),
    cc: normalizeRecipients(Array.from(ccSet)),
    bcc: normalizeRecipients(options.bcc),
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments,
  };

  const result = await transporter.sendMail(mailOptions);

  return {
    success: true,
    id: result?.messageId || result?.id,
    messageId: result?.messageId,
    accepted: result?.accepted || [],
    rejected: result?.rejected || [],
    response: result?.response,
    ...result,
  };
}

/**
 * Verify SMTP connection.
 *
 * Useful for:
 * - Development
 * - Health checks
 * - Admin "Test Email" feature
 *
 * @returns {Promise<boolean>}
 */
export async function verifyEmailConnection() {
  await transporter.verify();
  return true;
}

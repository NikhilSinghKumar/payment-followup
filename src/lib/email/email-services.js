import path from "path";
import fs from "fs";
import { transporter } from "./transporter";

import {
  buildFromAddress,
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
 * @param {string|string[]} [options.cc]
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

  const mailOptions = {
    from: buildFromAddress(),
    to: normalizeRecipients(options.to),
    cc: normalizeRecipients(options.cc),
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

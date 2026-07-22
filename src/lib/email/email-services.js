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

  const mailOptions = {
    from: buildFromAddress(),
    to: normalizeRecipients(options.to),
    cc: normalizeRecipients(options.cc),
    bcc: normalizeRecipients(options.bcc),
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments ?? [],
  };

  const result = await transporter.sendMail(mailOptions);

  return result;
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

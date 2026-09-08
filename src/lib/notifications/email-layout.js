import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Img,
  Preview,
} from "@react-email/components";

/**
 * ------------------------------------------------------------------
 * Pafex React Email Layout Component
 * ------------------------------------------------------------------
 * Clean, standard React JSX layout for all notification and reminder emails
 * built using @react-email/components.
 * ------------------------------------------------------------------
 */
export function EmailLayout({
  title = "Notification",
  previewText = "",
  bannerColor = "#2563EB",
  companyName = "PAFEX",
  logoUrl = "",
  children,
  content = "",
  senderCompany = "",
  senderEmail = "",
  senderPhone = "",
}) {
  const displayCompanyName = senderCompany || companyName || "PAFEX";

  return (
    <Html lang="en">
      <Head>
        <title>{title}</title>
        <style
          type="text/css"
          dangerouslySetInnerHTML={{
            __html: `
              @media only screen and (max-width: 600px) {
                body {
                  padding: 8px 4px !important;
                }
                .email-container-table {
                  width: 100% !important;
                  max-width: 100% !important;
                  border-radius: 6px !important;
                }
                .email-content-cell {
                  padding: 16px 12px !important;
                }
                .email-header-cell {
                  padding: 20px 16px !important;
                }
                .email-footer-cell {
                  padding: 14px 16px !important;
                }
                .responsive-table-scroll {
                  width: 100% !important;
                  max-width: 100% !important;
                  overflow-x: auto !important;
                  -webkit-overflow-scrolling: touch !important;
                  display: block !important;
                }
              }
            `,
          }}
        />
      </Head>
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body
        style={{
          margin: 0,
          padding: "20px 12px",
          background: "#F3F6FB",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          border="0"
          role="presentation"
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  className="email-container-table"
                  width="600"
                  cellPadding="0"
                  cellSpacing="0"
                  border="0"
                  role="presentation"
                  style={{
                    width: "100%",
                    maxWidth: "600px",
                    background: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,.08)",
                    overflow: "hidden",
                  }}
                >
                  <tbody>
                    {/* ====================================================== */}
                    {/* Header Banner */}
                    {/* ====================================================== */}
                    <tr>
                      <td
                        className="email-header-cell"
                        style={{
                          background: bannerColor,
                          padding: "24px 28px",
                          color: "#ffffff",
                        }}
                      >
                        <table
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          border="0"
                          role="presentation"
                        >
                          <tbody>
                            <tr>
                              <td align="left">
                                <div
                                  style={{
                                    fontSize: "26px",
                                    fontWeight: "bold",
                                    color: "#ffffff",
                                    letterSpacing: "-0.02em",
                                  }}
                                >
                                  {displayCompanyName}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ====================================================== */}
                    {/* Body Content */}
                    {/* ====================================================== */}
                    <tr>
                      <td
                        className="email-content-cell"
                        style={{
                          padding: "24px 24px",
                          color: "#334155",
                          fontSize: "15px",
                          lineHeight: "1.5",
                        }}
                      >
                        {children ? (
                          children
                        ) : typeof content === "string" ? (
                          <div dangerouslySetInnerHTML={{ __html: content }} />
                        ) : (
                          content
                        )}
                      </td>
                    </tr>

                    {/* ====================================================== */}
                    {/* Footer */}
                    {/* ====================================================== */}
                    <tr>
                      <td
                        className="email-footer-cell"
                        style={{
                          padding: "18px 24px",
                          background: "#F8FAFC",
                          borderTop: "1px solid #E2E8F0",
                        }}
                      >
                        <div
                          style={{
                            marginTop: "12px",
                            fontSize: "12px",
                            color: "#94A3B8",
                            lineHeight: "1.5",
                          }}
                        >
                          This is system generated email. Please do not reply
                          directly to this email.
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}

export default EmailLayout;

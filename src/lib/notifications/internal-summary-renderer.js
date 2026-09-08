import React from "react";
import { renderEmailLayout } from "./email-renderer";
import { Signature } from "./email-components";

/**
 * React JSX Component for Internal Suspension Summary Email
 */
export function InternalSuspensionSummaryContent({
  clients = [],
  company = {},
  summaryTitle = "Internal Report: Clients Eligible for Service Suspension",
  customNote = "",
}) {
  const totalClients = clients.length;
  const totalOverdueAmount = clients.reduce(
    (sum, c) => sum + Number(c.totalOverdue || c.outstandingAmount || 0),
    0,
  );
  const totalOverdueInvoices = clients.reduce(
    (sum, c) => sum + Number(c.overdueInvoiceCount || c.overdueInvoices || 1),
    0,
  );

  const formattedTotalAmount = totalOverdueAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#0F172A",
            margin: "0 0 6px 0",
          }}
        >
          {summaryTitle}
        </h2>
        <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
          Generated for{" "}
          <strong>
            {company.companyName || "PAFEX Management & Finance Team"}
          </strong>{" "}
          on{" "}
          {new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Alert / Action Banner */}
      <div
        style={{
          background: "#FEF2F2",
          borderLeft: "4px solid #DC2626",
          borderRadius: "8px",
          padding: "14px 16px",
          margin: "18px 0",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "700",
            color: "#991B1B",
            marginBottom: "4px",
          }}
        >
          ⚠️ Service Suspension Action Required ({totalClients} Client
          {totalClients === 1 ? "" : "s"})
        </div>
        <div style={{ fontSize: "12px", color: "#7F1D1D", lineHeight: 1.5 }}>
          The following clients have invoices exceeding the allowable credit
          period (&gt;= 10 days past due date). Review the list below and take
          appropriate suspension or recovery action.
        </div>
      </div>

      {customNote && customNote.trim() && (
        <div
          style={{
            background: "#F1F5F9",
            borderLeft: "4px solid #475569",
            borderRadius: "6px",
            padding: "12px 16px",
            margin: "16px 0",
            fontSize: "13px",
            color: "#334155",
          }}
        >
          <strong>Internal Note:</strong> {customNote}
        </div>
      )}

      {/* High Level Metrics Overview */}
      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        border="0"
        style={{ margin: "20px 0" }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: "32%",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  color: "#64748B",
                  fontWeight: "600",
                }}
              >
                Defaulter Clients
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#0F172A",
                  marginTop: "4px",
                }}
              >
                {totalClients}
              </div>
            </td>
            <td style={{ width: "2%" }}></td>
            <td
              style={{
                width: "32%",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  color: "#64748B",
                  fontWeight: "600",
                }}
              >
                Total Overdue Invoices
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#EA580C",
                  marginTop: "4px",
                }}
              >
                {totalOverdueInvoices}
              </div>
            </td>
            <td style={{ width: "2%" }}></td>
            <td
              style={{
                width: "32%",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  color: "#991B1B",
                  fontWeight: "600",
                }}
              >
                Total Overdue Exposure
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#DC2626",
                  marginTop: "4px",
                }}
              >
                ₹{formattedTotalAmount}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Defaulter Client Breakdown Table */}
      <div
        style={{
          margin: "24px 0 16px 0",
          fontSize: "14px",
          fontWeight: "700",
          color: "#0F172A",
        }}
      >
        Defaulter Breakdown by Client:
      </div>

      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        border="0"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          border: "1px solid #CBD5E1",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ background: "#0F172A", color: "#FFFFFF" }}>
            <th
              style={{
                padding: "10px 12px",
                fontSize: "11px",
                fontWeight: "600",
                textAlign: "left",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Client / Code
            </th>
            <th
              style={{
                padding: "10px 12px",
                fontSize: "11px",
                fontWeight: "600",
                textAlign: "left",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Billing Email
            </th>
            <th
              style={{
                padding: "10px 12px",
                fontSize: "11px",
                fontWeight: "600",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Max Overdue
            </th>
            <th
              style={{
                padding: "10px 12px",
                fontSize: "11px",
                fontWeight: "600",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Oldest Due
            </th>
            <th
              style={{
                padding: "10px 12px",
                fontSize: "11px",
                fontWeight: "600",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Invoices
            </th>
            <th
              style={{
                padding: "10px 12px",
                fontSize: "11px",
                fontWeight: "600",
                textAlign: "right",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Overdue Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: "16px",
                  textAlign: "center",
                  color: "#64748B",
                }}
              >
                No defaulter clients matching suspension criteria.
              </td>
            </tr>
          ) : (
            clients.map((c, index) => {
              const formattedAmount = Number(
                c.totalOverdue || c.outstandingAmount || 0,
              ).toLocaleString("en-IN", { minimumFractionDigits: 2 });

              const oldestDue = c.oldestDueDate
                ? new Date(c.oldestDueDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—";

              const daysOverdue = c.maxOverdueDays || c.overdueDays || "10+";

              return (
                <tr
                  key={c.id || c.clientId || index}
                  style={{
                    borderBottom: "1px solid #E2E8F0",
                    backgroundColor: index % 2 === 1 ? "#F8FAFC" : "#FFFFFF",
                  }}
                >
                  <td
                    style={{
                      padding: "10px 12px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#0F172A",
                    }}
                  >
                    {c.clientName || c.companyName}
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "normal",
                        color: "#64748B",
                        marginTop: "2px",
                      }}
                    >
                      Code: {c.companyCode || "—"} | Contact:{" "}
                      {c.contactName || "Primary Contact"}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontSize: "12px",
                      color: "#475569",
                    }}
                  >
                    {c.email || c.clientEmail || "—"}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontSize: "12px",
                      textAlign: "center",
                      fontWeight: "600",
                      color: "#DC2626",
                    }}
                  >
                    <span
                      style={{
                        background: "#FEE2E2",
                        color: "#991B1B",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                      }}
                    >
                      {daysOverdue} days
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontSize: "12px",
                      textAlign: "center",
                      color: "#64748B",
                    }}
                  >
                    {oldestDue}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontSize: "12px",
                      textAlign: "center",
                      fontWeight: "600",
                      color: "#0F172A",
                    }}
                  >
                    {c.overdueInvoiceCount || c.overdueInvoices || 1}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontSize: "13px",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "#DC2626",
                    }}
                  >
                    ₹{formattedAmount}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr
            style={{
              background: "#F1F5F9",
              borderTop: "2px solid #CBD5E1",
              fontWeight: "700",
            }}
          >
            <td
              colSpan={5}
              style={{
                padding: "10px 12px",
                fontSize: "12px",
                color: "#0F172A",
                textAlign: "right",
              }}
            >
              Total Overdue Sum:
            </td>
            <td
              style={{
                padding: "10px 12px",
                fontSize: "13px",
                color: "#DC2626",
                textAlign: "right",
              }}
            >
              ₹{formattedTotalAmount}
            </td>
          </tr>
        </tfoot>
      </table>

      <div
        style={{
          marginTop: "24px",
          padding: "14px",
          background: "#F8FAFC",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#64748B",
          lineHeight: 1.5,
        }}
      >
        💡 <strong>Action Recommendation:</strong> Operations & Dispatch desks
        should be notified to put bookings on hold for clients highlighted in
        red until payment confirmation / UTR is received.
      </div>

      <Signature
        senderCompany={company.companyName || "PAFEX Logistics"}
        senderEmail={company.email || "accounts@pafex.in"}
        senderPhone={company.phone || ""}
        senderLogo={company.logo || ""}
      />
    </div>
  );
}

/**
 * Render an internal summary email with a list of clients facing service suspension
 */
export function renderInternalSuspensionSummaryEmail({
  clients = [],
  company = {},
  summaryTitle = "Internal Report: Clients Eligible for Service Suspension",
  customNote = "",
}) {
  return renderEmailLayout({
    title: summaryTitle,
    bannerColor: "#DC2626",
    companyName: company.companyName || "PAFEX",
    content: (
      <InternalSuspensionSummaryContent
        clients={clients}
        company={company}
        summaryTitle={summaryTitle}
        customNote={customNote}
      />
    ),
    senderCompany: company.companyName || "PAFEX",
    senderEmail: company.email || "",
    senderPhone: company.phone || "",
    logoUrl: company.logo || "",
  });
}

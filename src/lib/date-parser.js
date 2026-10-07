const MONTH_MAP = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

/**
 * Robust date parser for CSV imports (payments, invoices, etc.)
 * Normalizes all parsed calendar dates to UTC Midnight (00:00:00.000Z)
 * to prevent timezone drift across client/server boundaries.
 */
export function parseImportDate(value) {
  if (!value) return null;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return normalizeToUtcMidnight(value);
  }

  let str = String(value).trim();
  if (!str) return null;

  // 1. Excel 5-digit serial date number (e.g. 45561)
  if (/^\d{5}$/.test(str)) {
    const serial = Number(str);
    const utcDays = Math.floor(serial - 25569);
    const d = new Date(Date.UTC(1970, 0, 1 + utcDays));
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Textual month format: DD-MMM-YYYY or DD-MMM-YY (e.g. 26-Sep-2026, 26-Sept-2026, 26 Sep 26)
  const textMonthMatch = str.match(
    /^(\d{1,2})[-/.\s]+([A-Za-z]+)[-/.\s]+(\d{2,4})/,
  );
  if (textMonthMatch) {
    const d = Number(textMonthMatch[1]);
    const monthKey = textMonthMatch[2].toLowerCase();
    const mo = MONTH_MAP[monthKey];
    let y = Number(textMonthMatch[3]);
    if (y < 100) y = y < 70 ? 2000 + y : 1900 + y;
    if (mo && d >= 1 && d <= 31) {
      return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
    }
  }

  // Strip trailing time components like " 00:00:00", " 14:30:25", "T00:00:00.000Z", " 12:00:00 AM"
  const datePart = str.split(/[T\s]/)[0].trim();

  // 3. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (4-digit year first)
  let m = datePart.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    const y = Number(m[1]),
      mo = Number(m[2]),
      d = Number(m[3]);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
    }
  }

  // 4. DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY (Day first, 4-digit year)
  m = datePart.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const d = Number(m[1]),
      mo = Number(m[2]),
      y = Number(m[3]);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
    }
  }

  // 5. DD-MM-YY or DD/MM/YY (Day first, 2-digit year e.g. 26-09-26)
  m = datePart.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (m) {
    const d = Number(m[1]),
      mo = Number(m[2]);
    let y = Number(m[3]);
    y = y < 70 ? 2000 + y : 1900 + y;
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
    }
  }

  // 6. Fallback to native parser
  const native = new Date(str);
  if (!isNaN(native.getTime())) {
    return normalizeToUtcMidnight(native);
  }

  return null;
}

/**
 * Normalizes a Date to UTC Midnight of its representation in Indian Standard Time (Asia/Kolkata).
 */
function normalizeToUtcMidnight(date) {
  try {
    const dateStr = date.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  } catch {
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
    );
  }
}

/**
 * Formats a Date or string to YYYY-MM-DD for HTML <input type="date"> elements.
 * Evaluates consistently using the Indian Standard Time (Asia/Kolkata) timezone.
 */
export function formatDateForInput(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }

  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";

  try {
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  } catch {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/**
 * Formats a Date or string for display in UI tables (e.g. "26 Sep 2026").
 */
export function formatDateDisplay(value) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";

  try {
    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
}

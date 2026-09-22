export function parseImportDate(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  const str = String(value).trim();
  if (!str) return null;

  // 1. YYYY-MM-DD or YYYY/MM/DD
  let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    const [, yyyy, mm, dd] = match;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(date.getTime())) return date;
  }

  // 2. DD-MM-YYYY or DD/MM/YYYY
  match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(date.getTime())) return date;
  }

  // 3. Excel 5-digit serial date number
  if (/^\d{5}$/.test(str)) {
    const serial = Number(str);
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) return date;
  }

  // 4. Fallback to native Date parser
  const nativeDate = new Date(str);
  if (!isNaN(nativeDate.getTime())) {
    return nativeDate;
  }

  return null;
}

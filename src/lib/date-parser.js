export function parseImportDate(value) {
  if (!value) return null;

  const date = value.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(date);
  }

  // DD/MM/YYYY
  let match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (match) {
    const [, dd, mm, yyyy] = match;

    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  // DD-MM-YYYY

  match = date.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (match) {
    const [, dd, mm, yyyy] = match;

    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  //

  return null;
}

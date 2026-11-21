export type CsvCell = string | number | boolean | null | undefined;

/**
 * Spreadsheet apps execute cells that start with these characters as formulas,
 * so user-controlled text (promo codes, names) is prefixed with `'` to keep it
 * inert. See OWASP "CSV Injection".
 */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

const escapeCell = (cell: CsvCell): string => {
  if (cell === null || cell === undefined) return '';
  let value = String(cell);
  if (typeof cell === 'string' && FORMULA_TRIGGER.test(value)) value = `'${value}`;
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
};

/** Serialise rows to RFC 4180 CSV (CRLF line endings, quoted where needed). */
export const toCsv = (rows: CsvCell[][]): string =>
  rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');

/**
 * Trigger a client-side download of `csv` as `filename`. The BOM makes Excel
 * open the file as UTF-8 instead of guessing the encoding.
 */
export const downloadCsv = (filename: string, csv: string): void => {
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoke on the next tick so the browser has started the download first.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

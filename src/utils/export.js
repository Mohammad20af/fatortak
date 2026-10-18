export function csvCell(value) {
  const text = String(value ?? "");
  // Spreadsheet formula injection protection also applies to user-entered titles.
  return `"${(/^(?:\s*[=+\-@]|[\t\r])/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
}
export const csvText = (rows) =>
  "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
export function downloadCsv(filename, rows) {
  const url = URL.createObjectURL(
    new Blob([csvText(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

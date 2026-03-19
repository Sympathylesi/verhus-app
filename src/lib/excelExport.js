import * as XLSX from 'xlsx';

/**
 * Export filtered+visible rows to Excel.
 * @param {object[]} rows   - flat row objects (from flattenRow)
 * @param {object[]} cols   - visible column defs [{id, header}]
 * @param {string}   filename
 */
export function exportToExcel(rows, cols, filename = 'VERHUS_MainDB') {
  const headers = cols.map(c => c.header);
  const data = rows.map(row => cols.map(c => row[c.id] ?? ''));

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Auto column widths (cap at 30)
  ws['!cols'] = headers.map((h, i) => {
    const maxLen = Math.min(30, Math.max(
      h.length,
      ...data.slice(0, 200).map(r => String(r[i] ?? '').length)
    ));
    return { wch: maxLen + 2 };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Main DB');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

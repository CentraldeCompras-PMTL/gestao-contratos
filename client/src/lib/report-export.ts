import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportColumn = {
  key: string;
  label: string;
};

export function exportRowsToExcel(filename: string, columns: ReportColumn[], rows: Record<string, string | number | null | undefined>[]) {
  const sheetRows = rows.map((row) =>
    Object.fromEntries(columns.map((column) => [column.label, row[column.key] ?? ""])),
  );

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportRowsToPdf(title: string, filename: string, columns: ReportColumn[], rows: Record<string, string | number | null | undefined>[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title, 14, 16);

  autoTable(doc, {
    startY: 22,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => String(row[column.key] ?? ""))),
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [24, 93, 58],
    },
  });

  doc.save(`${filename}.pdf`);
}

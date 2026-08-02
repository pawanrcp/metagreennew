import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = (title: string, headers: string[], data: any[][]) => {
  const doc = new jsPDF();
  doc.text(title, 14, 15);
  
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 20,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] } // emerald-500
  });

  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
};

export const exportToExcel = (title: string, data: object[]) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
};

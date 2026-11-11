import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const displayDate = (value) => {
  const text = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text || '-';
  const date = new Date(`${text}T00:00:00`);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const scheduleLabel = (value) => {
  if (value === 'H') return 'Schedule H';
  if (value === 'H1') return 'Schedule H1';
  if (value === 'X') return 'Schedule X';
  return value || '-';
};

const money = (value) => `Rs ${(Number(value) || 0).toFixed(2)}`;

export const generatePrescriptionRegisterPdf = ({
  title = 'Prescription register',
  schedule = 'H1',
  from = '',
  to = '',
  rows = [],
  pharmacistName = '',
  shop = {},
}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(shop.shopName || 'Pharmacy', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const contact = [
    shop.drugLicenceNumber ? `Drug Licence No: ${shop.drugLicenceNumber}` : '',
    shop.phone ? `Phone: ${shop.phone}` : '',
    shop.gstin ? `GSTIN: ${shop.gstin}` : '',
  ].filter(Boolean).join('  |  ');
  if (contact) doc.text(contact, 14, 22);
  if (shop.address) doc.text(shop.address, 14, 27);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 38);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Schedule: ${schedule === 'all' ? 'All prescription sales' : scheduleLabel(schedule)}`,
    14,
    45
  );
  doc.text(`Period: ${displayDate(from) || 'start'} to ${displayDate(to) || 'today'}`, 14, 50);
  doc.text(`Pharmacist: ${pharmacistName || shop.pharmacistName || '-'}`, 14, 55);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, 45, {
    align: 'right',
  });
  doc.text(`Entries: ${rows.length}`, pageWidth - 14, 50, { align: 'right' });

  autoTable(doc, {
    startY: 62,
    head: [[
      'Date',
      'Invoice',
      'Patient',
      'Prescriber',
      'Medicine',
      'Batch',
      'Qty',
      'Schedule',
      'Rx reference',
    ]],
    body: rows.map((row) => [
      displayDate(row.date),
      row.invoiceNumber || '-',
      row.patientName || '-',
      row.prescriberName || '-',
      row.medicineName || '-',
      row.batchNumber || '-',
      `${row.saleQuantity} ${row.saleUnit || ''}`.trim(),
      scheduleLabel(row.drugSchedule),
      row.prescriptionReference || '-',
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 1.8,
      valign: 'middle',
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 22 },
      2: { cellWidth: 32 },
      3: { cellWidth: 34 },
      4: { cellWidth: 50 },
      5: { cellWidth: 24 },
      6: { cellWidth: 14, halign: 'right' },
      7: { cellWidth: 22 },
      8: { cellWidth: 26 },
    },
    margin: { left: 14, right: 14 },
    theme: 'grid',
  });

  const finalY = doc.lastAutoTable?.finalY || 62;
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    'This register is generated from saved invoice snapshots and is intended for statutory inspection.',
    14,
    Math.min(finalY + 8, doc.internal.pageSize.getHeight() - 10)
  );

  const safeSchedule = String(schedule || 'all').replace(/[^a-z0-9-]+/gi, '-');
  doc.save(`Prescription-Register-${safeSchedule}.pdf`);
};

export const downloadRegisterCsv = ({
  filename = 'prescription-register.csv',
  rows = [],
}) => {
  const headers = [
    'Date',
    'Invoice',
    'Patient',
    'Phone',
    'Prescriber',
    'Medicine',
    'Batch',
    'Qty',
    'Unit',
    'Schedule',
    'Prescription reference',
    'Amount',
  ];

  const escape = (value) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) =>
      [
        String(row.date || '').slice(0, 10),
        row.invoiceNumber || '',
        row.patientName || '',
        row.customerPhone || '',
        row.prescriberName || '',
        row.medicineName || '',
        row.batchNumber || '',
        row.saleQuantity ?? '',
        row.saleUnit || '',
        scheduleLabel(row.drugSchedule),
        row.prescriptionReference || '',
        money(row.lineTotal),
      ]
        .map(escape)
        .join(',')
    ),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

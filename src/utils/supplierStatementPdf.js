import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const money = (value) => Number(value || 0).toFixed(2);

const displayDate = (value) => {
    const text = String(value || "");
    return text.length >= 10 ? text.slice(0, 10) : text;
};

/**
 * Generates and downloads a supplier statement PDF for a date range.
 */
export const generateSupplierStatementPdf = ({
    supplierName,
    supplierDrugLn = "",
    phone = "",
    from,
    to,
    transactions = [],
    summary = {}
}) => {
    const doc = new jsPDF();

    // ── Pharmacy header ─────────────────────────────────────────────────
    doc.setFontSize(22);
    doc.text("SAABIT PHARMACY", 14, 18);

    doc.setFontSize(10);
    doc.text("Drug Licence No: 13351/52", 14, 26);
    doc.text("Phone: +91 9797027047", 14, 32);
    doc.text("Address: Kak Sarai, Karan Nagar, Opp HDFC Bank, Srinagar", 14, 38);

    doc.setDrawColor(180);
    doc.line(14, 43, 196, 43);

    // ── Statement details ───────────────────────────────────────────────
    doc.setFontSize(16);
    doc.text("SUPPLIER STATEMENT", 14, 53);

    doc.setFontSize(10);
    doc.text(`Supplier: ${supplierName || "-"}`, 14, 63);
    if (supplierDrugLn) doc.text(`Drug L/N: ${supplierDrugLn}`, 14, 69);
    if (phone) doc.text(`Phone: ${phone}`, 14, 75);
    doc.text(`Statement Period: ${from} to ${to}`, 14, supplierDrugLn || phone ? 81 : 69);

    const detailY = supplierDrugLn || phone ? 81 : 69;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 130, 63);
    doc.setFontSize(11);
    doc.text(`Opening Balance: Rs ${money(summary.openingBalance)}`, 14, detailY + 8);

    // ── Transactions ────────────────────────────────────────────────────
    autoTable(doc, {
        startY: detailY + 15,
        head: [["Date", "Type", "Invoice", "Bill (Rs)", "Payment (Rs)", "Credit Note (Rs)", "Balance (Rs)"]],
        body: transactions.map((transaction) => [
            displayDate(transaction.date),
            transaction.type,
            transaction.invoice || "-",
            transaction.type === "Bill" ? money(transaction.total) : "",
            transaction.type === "Payment" ? money(transaction.total) : "",
            transaction.type === "Credit Note" ? money(transaction.total) : "",
            money(transaction.balance)
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [55, 65, 81], textColor: 255 },
        alternateRowStyles: { fillColor: [247, 248, 250] },
        columnStyles: {
            3: { halign: "right" },
            4: { halign: "right" },
            5: { halign: "right" },
            6: { halign: "right" }
        },
        margin: { left: 14, right: 14 }
    });

    // ── Totals ──────────────────────────────────────────────────────────
    let y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Total Bills: Rs ${money(summary.totalBills)}`, 14, y);
    doc.text(`Total Payments: Rs ${money(summary.totalPayments)}`, 14, y + 6);
    doc.text(`Total Credit Notes: Rs ${money(summary.totalCreditNotes)}`, 14, y + 12);
    doc.text(`Transactions: ${summary.transactionCount ?? transactions.length}`, 14, y + 18);

    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text(`Closing Balance: Rs ${money(summary.closingBalance)}`, 14, y + 28);
    doc.setFont(undefined, "normal");

    const safeName = String(supplierName || "supplier")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

    doc.save(`statement-${safeName}-${from}-to-${to}.pdf`);
};

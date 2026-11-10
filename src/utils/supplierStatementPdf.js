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
    summary = {},
    shop = {}
}) => {
    const doc = new jsPDF();

    const shopName = shop.shopName || "SAABIT PHARMACY";
    const shopLicence = shop.drugLicenceNumber || "";
    const shopPhone = shop.phone || "";
    const shopAddress = shop.address || "";
    const shopGstin = shop.gstin || "";
    const shopEmail = shop.email || "";

    // ── Pharmacy header ─────────────────────────────────────────────────
    doc.setFontSize(22);
    doc.text(shopName, 14, 18);

    doc.setFontSize(10);
    let headerY = 26;

    const contactBits = [];
    if (shopLicence) contactBits.push(`Drug Licence No: ${shopLicence}`);
    if (shopPhone) contactBits.push(`Phone: ${shopPhone}`);
    if (shopGstin) contactBits.push(`GSTIN: ${shopGstin}`);
    if (contactBits.length > 0) {
        doc.text(contactBits.join("  |  "), 14, headerY);
        headerY += 6;
    }
    if (shopAddress) {
        doc.text(`Address: ${shopAddress}`, 14, headerY);
        headerY += 6;
    }
    if (shopEmail) {
        doc.text(`Email: ${shopEmail}`, 14, headerY);
        headerY += 6;
    }

    const ruleY = headerY + 5;
    doc.setDrawColor(180);
    doc.line(14, ruleY, 196, ruleY);

    // ── Statement details ───────────────────────────────────────────────
    const statementY = ruleY + 10;
    doc.setFontSize(16);
    doc.text("SUPPLIER STATEMENT", 14, statementY);

    doc.setFontSize(10);
    const supplierY = statementY + 10;
    doc.text(`Supplier: ${supplierName || "-"}`, 14, supplierY);

    let periodY = supplierY + 6;
    if (supplierDrugLn) {
        doc.text(`Drug L/N: ${supplierDrugLn}`, 14, periodY);
        periodY += 6;
    }
    if (phone) {
        doc.text(`Phone: ${phone}`, 14, periodY);
        periodY += 6;
    }
    doc.text(`Statement Period: ${from} to ${to}`, 14, periodY);

    doc.text(`Generated: ${new Date().toLocaleString()}`, 130, supplierY);
    doc.setFontSize(11);
    doc.text(`Opening Balance: Rs ${money(summary.openingBalance)}`, 14, periodY + 8);

    // ── Transactions ────────────────────────────────────────────────────
    autoTable(doc, {
        startY: periodY + 15,
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

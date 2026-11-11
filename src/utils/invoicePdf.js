import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const money = (value) => (Number(value) || 0).toFixed(2);

const imageFormat = (dataUrl) => {
    if (/^data:image\/png/i.test(dataUrl)) return "PNG";
    if (/^data:image\/webp/i.test(dataUrl)) return "WEBP";
    return "JPEG";
};

const ONES = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
];

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const twoDigits = (value) => {
    if (value < 20) return ONES[value];
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return `${TENS[tens]}${ones ? ` ${ONES[ones]}` : ""}`;
};

const threeDigits = (value) => {
    const parts = [];
    const hundreds = Math.floor(value / 100);
    const rest = value % 100;

    if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
    if (rest) parts.push(twoDigits(rest));

    return parts.join(" ");
};

/** Indian numbering system, e.g. 1234567 -> "Twelve Lakh Thirty Four Thousand ..." */
const numberToWords = (value) => {
    const amount = Math.max(0, Number(value) || 0);
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let remaining = rupees;
    const parts = [];

    if (remaining >= 10000000) {
        parts.push(`${threeDigits(Math.floor(remaining / 10000000))} Crore`);
        remaining %= 10000000;
    }
    if (remaining >= 100000) {
        parts.push(`${threeDigits(Math.floor(remaining / 100000))} Lakh`);
        remaining %= 100000;
    }
    if (remaining >= 1000) {
        parts.push(`${threeDigits(Math.floor(remaining / 1000))} Thousand`);
        remaining %= 1000;
    }
    if (remaining > 0) parts.push(threeDigits(remaining));

    let words = parts.filter(Boolean).join(" ") || "Zero";
    let result = `${words} Rupees`;

    if (paise > 0) result += ` and ${twoDigits(paise)} Paise`;

    return `${result} Only`;
};

const formatDate = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return String(value || "");

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const formatTime = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });
};

/**
 * Convert a saved invoice (API shape) into the arguments expected by
 * `generateInvoicePdf`. Shared by the dashboard and any future screens.
 */
export const buildInvoicePdfPayload = (invoice = {}, shop = {}) => {
    const items = (invoice.items ?? invoice.medicines ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        qty: Number(item.saleQuantity ?? item.qty ?? item.quantity) || 0,
        saleQuantity: Number(item.saleQuantity ?? item.qty ?? item.quantity) || 0,
        saleUnit: item.saleUnit || "PACK",
        unitsPerPack: Number(item.unitsPerPack) || 1,
        mrp: Number(item.mrp) || 0,
        price: Number(item.saleUnitPrice ?? item.price ?? item.unitPrice ?? item.mrp) || 0,
        discount: Number(item.discount ?? item.discountPercent) || 0,
        discountAmount: Number(item.discountAmount) || 0,
        lineTotal: Number(item.lineTotal) || 0,
        batchNumber: item.batchNumber ?? item.batchNumberSnapshot,
        expiryDate: item.expiryDate ?? item.expiryDateSnapshot
    }));

    return {
        invoiceNumber: invoice.invoiceNumber || "",
        date: invoice.date ?? invoice.createdAt ?? new Date().toISOString(),
        customer: invoice.customer ?? {
            name: invoice.customerName || "Walk-in Customer",
            phone: invoice.customerPhone || "",
            address: invoice.customerAddress || ""
        },
        items,
        subtotal: Number(invoice.subtotal) || 0,
        totalDiscount: Number(invoice.totalDiscount) || 0,
        total: Number(invoice.total) || 0,
        status: invoice.status || "completed",
        prescription: invoice.prescription ?? null,
        prescriberName: invoice.prescriberName || "",
        prescriptionReference: invoice.prescriptionReference || "",
        shop
    };
};

/**
 * Generates a clean, professional sales invoice PDF.
 */
export const generateInvoicePdf = ({
    invoiceNumber = "",
    date = new Date().toISOString(),
    customer = {},
    items = [],
    subtotal = 0,
    totalDiscount = 0,
    total = 0,
    status = "completed",
    prescription = null,
    prescriberName = "",
    prescriptionReference = "",
    shop = {}
}) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const shopName = shop.shopName || "SAABIT PHARMACY";
    const drugLicenceNumber = shop.drugLicenceNumber || "";
    const shopPhone = shop.phone || "";
    const shopAddress = shop.address || "";
    const shopGstin = shop.gstin || "";
    const shopEmail = shop.email || "";
    const pharmacistName = shop.pharmacistName || "Authorised Signature";
    const invoiceFooter = shop.invoiceFooter || "Thank you for choosing Saabit Pharmacy. Get well soon!";

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const right = pageWidth - margin;

    // ── Header band ────────────────────────────────────────────────────
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(shopName, margin, 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);

    const contactBits = [];
    if (drugLicenceNumber) contactBits.push(`Drug Licence No: ${drugLicenceNumber}`);
    if (shopPhone) contactBits.push(`Phone: ${shopPhone}`);
    if (shopGstin) contactBits.push(`GSTIN: ${shopGstin}`);
    if (contactBits.length > 0) doc.text(contactBits.join("  |  "), margin, 21);

    const addressLine = [shopAddress, shopEmail].filter(Boolean).join("  |  ");
    if (addressLine) doc.text(addressLine, margin, 26);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("INVOICE", right, 14, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(invoiceNumber || "-", right, 21, { align: "right" });
    doc.text(`Date: ${formatDate(date)}`, right, 26, { align: "right" });

    // ── Customer and invoice details ───────────────────────────────────
    doc.setTextColor(17, 24, 39);
    let y = 42;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text("BILLED TO", margin, y);

    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(customer.name || "Walk-in Customer", margin, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);

    let leftY = y + 11;
    if (customer.phone) {
        doc.text(`Phone: ${customer.phone}`, margin, leftY);
        leftY += 5;
    }
    if (customer.address) {
        const addressLines = doc.splitTextToSize(customer.address, 88);
        doc.text(addressLines, margin, leftY);
        leftY += addressLines.length * 4.5;
    }

    const detailsX = 122;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text("INVOICE DETAILS", detailsX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text(`Invoice No: ${invoiceNumber || "-"}`, detailsX, y + 6);
    doc.text(`Date: ${formatDate(date)}`, detailsX, y + 11);
    doc.text(`Time: ${formatTime(date)}`, detailsX, y + 16);

    const paid = String(status).toLowerCase() === "completed";
    doc.setFont("helvetica", "bold");
    doc.setTextColor(paid ? 21 : 185, paid ? 128 : 28, paid ? 61 : 28);
    doc.text(`Status: ${paid ? "PAID" : "PENDING"}`, detailsX, y + 21);
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "normal");

    const prescriberLine = [
        prescriberName ? `Prescriber: ${prescriberName}` : "",
        prescriptionReference ? `Rx: ${prescriptionReference}` : ""
    ].filter(Boolean).join("  |  ");

    if (prescriberLine) {
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(doc.splitTextToSize(prescriberLine, 80), detailsX, y + 26);
        doc.setFontSize(9);
        doc.setTextColor(55, 65, 81);
    }

    const detailsBottom = Math.max(leftY, y + (prescriberLine ? 31 : 24));
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, detailsBottom + 4, right, detailsBottom + 4);

    // ── Items table ────────────────────────────────────────────────────
    autoTable(doc, {
        startY: detailsBottom + 9,
        head: [[
            "#",
            "Medicine",
            "Batch No.",
            "Expiry",
            "Qty / Unit",
            "Rate (Rs)",
            "Disc.",
            "Amount (Rs)"
        ]],
        body: items.map((item, index) => {
            const saleQuantity = Number(item.saleQuantity ?? item.qty ?? item.quantity) || 0;
            const saleUnit = item.saleUnit || "PACK";
            const price = Number(item.saleUnitPrice ?? item.price ?? item.unitPrice ?? item.mrp) || 0;
            const discount = Math.min(100, Math.max(0, Number(item.discount) || 0));
            const amount = Number(item.lineTotal);

            return [
                index + 1,
                item.name || "-",
                item.batchNumber || "-",
                item.expiryDate ? String(item.expiryDate).slice(0, 10) : "-",
                `${saleQuantity} ${saleUnit}`,
                money(price),
                discount > 0 ? `${discount}%` : "-",
                money(Number.isFinite(amount) ? amount : price * saleQuantity * (1 - discount / 100))
            ];
        }),
        styles: {
            font: "helvetica",
            fontSize: 8.5,
            cellPadding: 2.4,
            valign: "middle",
            textColor: [31, 41, 55],
            lineColor: [229, 231, 235],
            lineWidth: 0.1
        },
        headStyles: {
            fillColor: [30, 64, 175],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 8.5,
            halign: "left"
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { cellWidth: 8, halign: "center" },
            1: { cellWidth: 46 },
            2: { cellWidth: 30 },
            3: { cellWidth: 20 },
            4: { cellWidth: 18, halign: "center" },
            5: { cellWidth: 20, halign: "right" },
            6: { cellWidth: 14, halign: "right" },
            7: { cellWidth: 26, halign: "right" }
        },
        margin: { left: margin, right: margin },
        theme: "grid"
    });

    // ── Totals ─────────────────────────────────────────────────────────
    let summaryY = doc.lastAutoTable.finalY + 12;

    if (summaryY > pageHeight - 70) {
        doc.addPage();
        summaryY = 22;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text("AMOUNT IN WORDS", margin, summaryY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);

    const words = doc.splitTextToSize(numberToWords(total), 88);
    doc.text(words, margin, summaryY + 5);

    const boxWidth = 74;
    const boxX = right - boxWidth;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(boxX, summaryY - 7, boxWidth, 40, 2, 2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text("Subtotal", boxX + 4, summaryY);
    doc.text(`Rs ${money(subtotal)}`, right - 4, summaryY, { align: "right" });

    doc.setTextColor(185, 28, 28);
    doc.text("Discount", boxX + 4, summaryY + 7);
    doc.text(`- Rs ${money(totalDiscount)}`, right - 4, summaryY + 7, { align: "right" });

    doc.setDrawColor(229, 231, 235);
    doc.line(boxX + 4, summaryY + 12, right - 4, summaryY + 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text("Grand Total", boxX + 4, summaryY + 21);
    doc.text(`Rs ${money(total)}`, right - 4, summaryY + 21, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`${items.length} item${items.length === 1 ? "" : "s"} on this invoice`, boxX + 4, summaryY + 28);

    // ── Prescription attachment ────────────────────────────────────────
    const footerY = pageHeight - 34;

    if (prescription?.dataUrl) {
        const sourceWidth = Number(prescription.width) || 0;
        const sourceHeight = Number(prescription.height) || 0;
        const ratio = sourceWidth > 0 && sourceHeight > 0 ? sourceHeight / sourceWidth : 1.4;

        const maxImageWidth = 112;
        const maxImageHeight = 125;
        let drawWidth = maxImageWidth;
        let drawHeight = drawWidth * ratio;

        if (drawHeight > maxImageHeight) {
            drawHeight = maxImageHeight;
            drawWidth = drawHeight / ratio;
        }

        const padding = 4;
        const blockHeight = 6 + drawHeight + padding * 2;
        let blockY = summaryY + 40;

        if (blockY + blockHeight > footerY - 8) {
            doc.addPage();
            blockY = 22;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text("ATTACHED PRESCRIPTION", margin, blockY);

        const frameX = margin;
        const frameY = blockY + 4;

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(frameX, frameY, drawWidth + padding * 2, drawHeight + padding * 2, 2, 2, "FD");

        try {
            doc.addImage(
                prescription.dataUrl,
                imageFormat(prescription.dataUrl),
                frameX + padding,
                frameY + padding,
                drawWidth,
                drawHeight,
                undefined,
                "FAST"
            );
        } catch (error) {
            console.error("Could not embed prescription image:", error);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(107, 114, 128);
            doc.text("Prescription image could not be rendered.", frameX + padding, frameY + 10);
        }

        const noteX = frameX + drawWidth + padding * 2 + 10;
        const noteWidth = right - noteX;

        if (noteWidth > 32) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(17, 24, 39);
            doc.text("Prescription on file", noteX, frameY + 6);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(107, 114, 128);
            const noteLines = doc.splitTextToSize(
                "The image above was attached to this sale and is stored with the invoice record. Please retain it for your records.",
                noteWidth
            );
            doc.text(noteLines, noteX, frameY + 12);
            doc.setTextColor(17, 24, 39);
        }
    }

    // ── Footer ─────────────────────────────────────────────────────────
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, footerY, right, footerY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    const footerLines = doc.splitTextToSize(invoiceFooter, 118);
    doc.text(footerLines, margin, footerY + 6);
    doc.text(
        "This is a computer-generated invoice.",
        margin,
        footerY + 6 + footerLines.length * 4.5
    );

    doc.text(pharmacistName, right, footerY + 6, { align: "right" });
    doc.setDrawColor(156, 163, 175);
    doc.line(right - 38, footerY + 1, right, footerY + 1);

    // ── Page numbers ───────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();

    for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Page ${page} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    const safeName = String(invoiceNumber || "invoice").replace(/[^a-z0-9-]+/gi, "-");
    doc.save(`Invoice-${safeName}.pdf`);
};

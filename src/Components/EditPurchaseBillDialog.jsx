import React, { useEffect, useMemo, useState } from 'react';
import { updateBillSql } from '../services/medicineService.js';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog.jsx';

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const dateValue = (value) => (
    typeof value === 'string' ? value.slice(0, 10) : ''
);

const buildForm = (bill) => ({
    invoice: bill?.invoice ?? '',
    date: dateValue(bill?.date),
    products: (bill?.products ?? []).map((product) => ({
        id: product.id,
        name: product.name ?? '',
        category: product.category ?? '',
        batchNumber: product.batchNumber ?? '',
        expiryDate: dateValue(product.expiryDate),
        stock: product.stock ?? 0,
        free: product.free ?? 0,
        unitPrice: product.unitPrice ?? 0,
        mrp: product.mrp ?? 0,
        discount: product.discount ?? 0,
        gstPercentage: product.gstPercentage ?? 0,
        availableStock: product.availableStock ?? null,
    })),
});

const lineAmount = (product) => {
    const subtotal = toNumber(product.unitPrice) * toNumber(product.stock);
    const discount = subtotal * (toNumber(product.discount) / 100);
    const gst = (subtotal - discount) * (toNumber(product.gstPercentage) / 100);
    return subtotal - discount + gst;
};

const EditPurchaseBillDialog = ({ bill, open, onOpenChange, onSaved }) => {
    const [form, setForm] = useState(() => buildForm(null));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && bill) {
            setForm(buildForm(bill));
            setError('');
        }
    }, [open, bill]);

    const totals = useMemo(() => {
        let subtotal = 0;
        let discount = 0;
        let gst = 0;

        for (const product of form.products) {
            const lineSubtotal = toNumber(product.unitPrice) * toNumber(product.stock);
            const lineDiscount = lineSubtotal * (toNumber(product.discount) / 100);
            const lineGst = (lineSubtotal - lineDiscount) * (toNumber(product.gstPercentage) / 100);

            subtotal += lineSubtotal;
            discount += lineDiscount;
            gst += lineGst;
        }

        const roundedSubtotal = round2(subtotal);
        const roundedDiscount = round2(discount);
        const roundedGst = round2(gst);

        return {
            subtotal: roundedSubtotal,
            discount: roundedDiscount,
            gst: roundedGst,
            total: Math.round(roundedSubtotal - roundedDiscount + roundedGst),
        };
    }, [form.products]);

    const handleBillChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleProductChange = (productId, field, value) => {
        setForm((prev) => ({
            ...prev,
            products: prev.products.map((product) => (
                product.id === productId
                    ? { ...product, [field]: value }
                    : product
            )),
        }));
    };

    const handleSave = async () => {
        if (!bill || saving) return;

        const invoice = form.invoice.trim();

        if (!invoice) {
            setError('Invoice number is required.');
            return;
        }

        if (!form.date) {
            setError('Bill date is required.');
            return;
        }

        const products = form.products.map((product) => ({
            id: product.id,
            name: String(product.name ?? '').trim(),
            category: String(product.category ?? '').trim(),
            batchNumber: String(product.batchNumber ?? '').trim(),
            expiryDate: product.expiryDate,
            stock: toNumber(product.stock),
            free: toNumber(product.free),
            unitPrice: toNumber(product.unitPrice),
            mrp: toNumber(product.mrp),
            discount: toNumber(product.discount),
            gstPercentage: toNumber(product.gstPercentage),
        }));

        if (products.some((product) => !product.name)) {
            setError('Every medicine line needs a name.');
            return;
        }

        if (products.some((product) => product.stock <= 0)) {
            setError('Every medicine quantity must be greater than 0.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            await updateBillSql(bill.id, {
                invoice,
                date: form.date,
                products,
            });

            await onSaved?.({
                billId: bill.id,
                supplierName: bill.supplierName,
            });

            onOpenChange?.(false);
            alert('Bill updated successfully!');
        } catch (saveError) {
            console.error('Error updating bill:', saveError);
            setError(
                saveError.response?.data?.error
                || 'Failed to update the bill. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!saving) onOpenChange?.(nextOpen);
            }}
        >
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[1500px]">
                <DialogHeader>
                    <DialogTitle>Edit Purchase Bill</DialogTitle>
                    <DialogDescription>
                        Change the bill details or medicine values. Quantity edits apply a stock
                        delta and are rejected if those units have already been sold.
                    </DialogDescription>
                </DialogHeader>

                {bill && (
                    <p className="text-xs text-muted-foreground">
                        Supplier: <span className="font-medium">{bill.supplierName}</span>
                        {bill.supplierDrugLn ? ` · D.L. ${bill.supplierDrugLn}` : ''}
                        {bill.supplierContact ? ` · ${bill.supplierContact}` : ''}
                    </p>
                )}

                <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                        <Label htmlFor="edit-bill-invoice">Invoice Number</Label>
                        <Input
                            id="edit-bill-invoice"
                            name="invoice"
                            value={form.invoice}
                            onChange={handleBillChange}
                            className="bg-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="edit-bill-date">Bill Date</Label>
                        <Input
                            id="edit-bill-date"
                            name="date"
                            type="date"
                            value={form.date}
                            onChange={handleBillChange}
                            className="bg-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="edit-bill-supplier">Supplier</Label>
                        <Input
                            id="edit-bill-supplier"
                            value={bill?.supplierName ?? ''}
                            readOnly
                            disabled
                            className="bg-gray-100"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full min-w-[1180px] border-collapse bg-white text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-3 py-2">Medicine</th>
                                <th className="px-3 py-2">Category</th>
                                <th className="px-3 py-2">Batch No.</th>
                                <th className="px-3 py-2">Expiry</th>
                                <th className="px-3 py-2">Qty</th>
                                <th className="px-3 py-2">Free</th>
                                <th className="px-3 py-2">Rate</th>
                                <th className="px-3 py-2">MRP</th>
                                <th className="px-3 py-2">Disc %</th>
                                <th className="px-3 py-2">GST %</th>
                                <th className="px-3 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {form.products.map((product) => (
                                <tr key={product.id}>
                                    <td className="w-[200px] px-3 py-2">
                                        <Input
                                            aria-label={`Medicine name for line ${product.id}`}
                                            className="h-8 min-w-[170px] bg-white text-black"
                                            value={product.name}
                                            onChange={(event) => handleProductChange(product.id, 'name', event.target.value)}
                                        />
                                    </td>
                                    <td className="w-[140px] px-3 py-2">
                                        <Input
                                            aria-label={`Category for ${product.name}`}
                                            className="h-8 min-w-[110px] bg-white text-black"
                                            value={product.category}
                                            onChange={(event) => handleProductChange(product.id, 'category', event.target.value)}
                                        />
                                    </td>
                                    <td className="w-[130px] px-3 py-2">
                                        <Input
                                            aria-label={`Batch number for ${product.name}`}
                                            className="h-8 min-w-[100px] bg-white text-black"
                                            value={product.batchNumber}
                                            onChange={(event) => handleProductChange(product.id, 'batchNumber', event.target.value)}
                                        />
                                    </td>
                                    <td className="w-[150px] px-3 py-2">
                                        <Input
                                            aria-label={`Expiry date for ${product.name}`}
                                            type="date"
                                            className="h-8 min-w-[130px] bg-white text-black"
                                            value={product.expiryDate}
                                            onChange={(event) => handleProductChange(product.id, 'expiryDate', event.target.value)}
                                        />
                                    </td>
                                    <td className="w-[90px] px-3 py-2">
                                        <Input
                                            aria-label={`Quantity for ${product.name}`}
                                            type="number"
                                            min="1"
                                            step="1"
                                            title={product.availableStock !== null ? `Currently in stock: ${product.availableStock}` : undefined}
                                            className="h-8 min-w-[70px] bg-white text-black"
                                            value={product.stock}
                                            onChange={(event) => handleProductChange(product.id, 'stock', event.target.value)}
                                        />
                                    </td>
                                    <td className="w-[80px] px-3 py-2">
                                        <Input
                                            aria-label={`Free quantity for ${product.name}`}
                                            type="number"
                                            min="0"
                                            step="1"
                                            title="Optional free quantity. Free units are added to stock but not charged."
                                            className="h-8 min-w-[60px] bg-white text-black"
                                            value={product.free}
                                            onChange={(event) => handleProductChange(product.id, 'free', event.target.value)}
                                        />
                                    </td>
                                    <td className="w-[100px] px-3 py-2">
                                        <Input
                                            aria-label={`Rate for ${product.name}`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="h-8 min-w-[80px] bg-white text-black"
                                            value={product.unitPrice}
                                            onChange={(event) => handleProductChange(product.id, 'unitPrice', event.target.value)}
                                        />
                                    </td>
                                    <td className="w-[100px] px-3 py-2">
                                        <Input
                                            aria-label={`MRP for ${product.name}`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="h-8 min-w-[80px] bg-white text-black"
                                            value={product.mrp}
                                            onChange={(event) => handleProductChange(product.id, 'mrp', event.target.value)}
                                        />
                                    </td>
                                    <td className="w-[90px] px-3 py-2">
                                        <Input
                                            aria-label={`Discount percentage for ${product.name}`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="h-8 min-w-[70px] bg-white text-black"
                                            value={product.discount}
                                            onChange={(event) => handleProductChange(product.id, 'discount', event.target.value)}
                                        />
                                    </td>
                                    <td className="w-[90px] px-3 py-2">
                                        <Input
                                            aria-label={`GST percentage for ${product.name}`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="h-8 min-w-[70px] bg-white text-black"
                                            value={product.gstPercentage}
                                            onChange={(event) => handleProductChange(product.id, 'gstPercentage', event.target.value)}
                                        />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-black">
                                        ₹ {lineAmount(product).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {form.products.length === 0 && (
                    <p className="rounded-md border bg-gray-50 p-4 text-sm text-muted-foreground">
                        This bill has no medicine lines.
                    </p>
                )}

                <div className="grid gap-2 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-4">
                    <div>
                        <p className="text-muted-foreground">Subtotal</p>
                        <p className="font-semibold">₹ {totals.subtotal.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Discount</p>
                        <p className="font-semibold text-red-700">- ₹ {totals.discount.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">GST</p>
                        <p className="font-semibold">₹ {totals.gst.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="text-lg font-extrabold">₹ {totals.total.toFixed(2)}</p>
                    </div>
                </div>

                {error && (
                    <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange?.(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditPurchaseBillDialog;

import React from 'react';
import {
    ArrowRight,
    CornerDownLeft,
    Keyboard,
    Plus,
    ReceiptText,
    Save,
    Trash2,
    Truck,
} from 'lucide-react';
import { Label } from '../ui/label.jsx';
import { Input } from '../ui/input.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import SelectList from '../SelectList.jsx';
import SaltEditor from '../SaltEditor.jsx';

const inputClass =
    'h-9 border-slate-200 bg-white text-sm text-slate-900 shadow-none transition focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20';

const formatMoney = (value) => {
    const number = Number(value) || 0;
    const rounded = Math.round(number);
    return `₹ ${rounded.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
};

const ShortcutRow = ({ keys, label }) => (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="flex shrink-0 items-center gap-1">
            {keys.map((key) => (
                <kbd
                    key={key}
                    className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-slate-200 bg-white px-1 font-sans text-[10px] font-semibold text-slate-500 shadow-[0_1px_0_rgba(15,23,42,0.06)]"
                >
                    {key}
                </kbd>
            ))}
        </span>
    </div>
);

const SectionHeading = ({ icon, title, description, tone = 'blue' }) => {
    const tones = {
        blue: 'bg-blue-50 text-blue-600',
        violet: 'bg-violet-50 text-violet-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };

    return (
        <div className="mb-4 flex items-start gap-3">
            <div className={`rounded-lg p-2 ${tones[tone] || tones.blue}`}>
                {React.createElement(icon, { className: 'h-4 w-4' })}
            </div>
            <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            </div>
        </div>
    );
};

const TabContentAddPurchase = ({
    formData,
    handleChange,
    handleSupplierSelect,
    allSuppliersSql,
    setFormData,
    products,
    handleInputChangeSearch,
    searchedMed,
    handleInputChange,
    handleDelete,
    onAddProduct,
    onSaltsChange,
    setProducts,
    totalAmount,
    totalDiscount,
    totalGst,
    addNewBill,
}) => {
    const grandTotal = (Number(totalAmount) || 0) - (Number(totalDiscount) || 0) + (Number(totalGst) || 0);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                        Purchase entry
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                        Record purchases
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Enter the bill and supplier details, then add each line item.
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
                    <Keyboard className="h-4 w-4 text-slate-400" />
                    <span>
                        Use <span className="font-semibold text-slate-700">Alt + ↑ / ↓</span> to move between
                        product rows
                    </span>
                </div>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <SectionHeading
                    icon={ReceiptText}
                    title="Bill details"
                    description="Invoice number and purchase date from the supplier bill."
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="purchase-invoice" className="mb-1.5 block text-xs font-medium text-slate-600">
                            Bill / Invoice number
                        </Label>
                        <Input
                            id="purchase-invoice"
                            name="invoice"
                            value={formData.invoice}
                            type="text"
                            className={inputClass}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="purchase-date" className="mb-1.5 block text-xs font-medium text-slate-600">
                            Bill date
                        </Label>
                        <Input
                            id="purchase-date"
                            name="date"
                            value={formData.date}
                            type="date"
                            className={inputClass}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <SectionHeading
                    icon={Truck}
                    title="Supplier details"
                    description="Select an existing supplier or type a new name."
                    tone="violet"
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <Label htmlFor="supplier-name" className="mb-1.5 block text-xs font-medium text-slate-600">
                            Supplier name
                        </Label>
                        <Input
                            id="supplier-name"
                            list="supplierList"
                            name="supplierName"
                            value={formData.supplierName}
                            className={inputClass}
                            onChange={(e) => handleSupplierSelect(e, allSuppliersSql, setFormData, true)}
                            placeholder="Search suppliers"
                        />
                        <datalist id="supplierList">
                            {allSuppliersSql.map((s, index) => (
                                <option key={index} value={s.supplierName} />
                            ))}
                        </datalist>
                    </div>

                    <div>
                        <Label htmlFor="supplier-drug" className="mb-1.5 block text-xs font-medium text-slate-600">
                            Supplier drug licence
                        </Label>
                        <Input
                            id="supplier-drug"
                            name="supplierDrugLn"
                            value={formData.supplierDrugLn}
                            className={inputClass}
                            type="text"
                            onChange={handleChange}
                            placeholder="D.L. number"
                        />
                    </div>

                    <div>
                        <Label htmlFor="supplier-contact" className="mb-1.5 block text-xs font-medium text-slate-600">
                            Supplier contact
                        </Label>
                        <Input
                            id="supplier-contact"
                            name="supplierContact"
                            value={formData.supplierContact}
                            className={inputClass}
                            type="tel"
                            onChange={handleChange}
                            placeholder="Phone number"
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <SectionHeading
                        icon={Plus}
                        title="Product details"
                        description="Press Alt + ↓ on the last row to append a new line."
                        tone="emerald"
                    />
                    <Badge variant="secondary" className="mb-4 bg-slate-100 text-slate-600">
                        {products.length} line{products.length === 1 ? '' : 's'}
                    </Badge>
                </div>

                <div className="mx-5 mb-0 overflow-hidden rounded-lg border border-slate-200">
                    <div className="max-h-[52vh] overflow-auto">
                        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-2 py-2.5 font-semibold">Product name</th>
                                    <th className="px-2 py-2.5 font-semibold">Category</th>
                                    <th className="px-2 py-2.5 font-semibold">Batch</th>
                                    <th className="px-2 py-2.5 font-semibold">Expiry</th>
                                    <th className="px-2 py-2.5 font-semibold">Qty</th>
                                    <th className="px-2 py-2.5 font-semibold">Rate</th>
                                    <th className="px-2 py-2.5 font-semibold">MRP</th>
                                    <th className="px-2 py-2.5 font-semibold">Disc %</th>
                                    <th className="px-2 py-2.5 font-semibold">GST %</th>
                                    <th className="px-3 py-2.5 text-right font-semibold">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 bg-white">
                                {products.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                    <tr
                                        data-product-row
                                        className="group transition focus-within:bg-blue-50/40 hover:bg-slate-50/60"
                                    >
                                        <td className="px-2 py-2">
                                            <Input
                                                type="text"
                                                aria-label={`Product name for line ${index + 1}`}
                                                data-product-input
                                                data-product-field="name"
                                                className={`${inputClass} min-w-[145px] font-semibold`}
                                                value={(item.name || '').toUpperCase()}
                                                list="searchedMedList"
                                                placeholder="Medicine name"
                                                onChange={(e) =>
                                                    handleInputChangeSearch(
                                                        item.id,
                                                        'name',
                                                        e.target.value.toUpperCase()
                                                    )
                                                }
                                            />
                                        </td>

                                        <td className="px-2 py-2">
                                            <SelectList
                                                handleInputChange={handleInputChange}
                                                itemId={item.id}
                                                selectedCategory={item.category}
                                                data-product-input
                                                data-product-field="category"
                                            />
                                        </td>

                                        <td className="px-2 py-2">
                                            <Input
                                                type="text"
                                                aria-label={`Batch number for line ${index + 1}`}
                                                data-product-input
                                                data-product-field="batchNumber"
                                                className={`${inputClass} min-w-[80px]`}
                                                value={(item.batchNumber || '').toUpperCase()}
                                                placeholder="Batch"
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        item.id,
                                                        'batchNumber',
                                                        e.target.value.toUpperCase()
                                                    )
                                                }
                                            />
                                        </td>

                                        <td className="px-2 py-2">
                                            <Input
                                                type="date"
                                                aria-label={`Expiry date for line ${index + 1}`}
                                                data-product-input
                                                data-product-field="expiryDate"
                                                className={`${inputClass} min-w-[122px]`}
                                                value={item.expiryDate}
                                                onChange={(e) =>
                                                    handleInputChange(item.id, 'expiryDate', e.target.value)
                                                }
                                            />
                                        </td>

                                        <td className="px-2 py-2">
                                            <Input
                                                type="number"
                                                aria-label={`Quantity for line ${index + 1}`}
                                                data-product-input
                                                data-product-field="stock"
                                                className={`${inputClass} min-w-[70px]`}
                                                value={item.stock}
                                                min="0"
                                                onChange={(e) =>
                                                    handleInputChange(item.id, 'stock', e.target.value)
                                                }
                                            />
                                        </td>

                                        <td className="px-2 py-2">
                                            <Input
                                                type="number"
                                                aria-label={`Unit price for line ${index + 1}`}
                                                data-product-input
                                                data-product-field="unitPrice"
                                                className={`${inputClass} min-w-[85px]`}
                                                value={item.unitPrice}
                                                min="0"
                                                onChange={(e) =>
                                                    handleInputChange(item.id, 'unitPrice', e.target.value)
                                                }
                                            />
                                        </td>

                                        <td className="px-2 py-2">
                                            <Input
                                                type="number"
                                                aria-label={`MRP for line ${index + 1}`}
                                                data-product-input
                                                data-product-field="mrp"
                                                className={`${inputClass} min-w-[85px]`}
                                                value={item.mrp}
                                                min="0"
                                                onChange={(e) => handleInputChange(item.id, 'mrp', e.target.value)}
                                            />
                                        </td>

                                        <td className="px-2 py-2">
                                            <Input
                                                type="number"
                                                aria-label={`Discount percentage for line ${index + 1}`}
                                                data-product-input
                                                data-product-field="discount"
                                                className={`${inputClass} min-w-[75px]`}
                                                value={item.discount}
                                                min="0"
                                                max="100"
                                                onChange={(e) =>
                                                    handleInputChange(item.id, 'discount', e.target.value)
                                                }
                                            />
                                        </td>

                                        <td className="px-2 py-2">
                                            <Input
                                                type="number"
                                                aria-label={`GST percentage for line ${index + 1}`}
                                                data-product-input
                                                data-product-field="gstPercentage"
                                                className={`${inputClass} min-w-[75px]`}
                                                value={item.gstPercentage}
                                                min="0"
                                                onChange={(e) =>
                                                    handleInputChange(item.id, 'gstPercentage', e.target.value)
                                                }
                                            />
                                        </td>

                                        <td className="px-2 py-2 text-right">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(item.id)}
                                                aria-label={`Delete line ${index + 1}`}
                                                className="h-8 w-8 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>

                                    {String(item.name ?? '').trim() !== '' && (
                                        <tr className="bg-slate-50/40">
                                            <td colSpan={10} className="px-3 pb-3 pt-1">
                                                <SaltEditor
                                                    id={`purchase-salts-${item.id}`}
                                                    value={item.salts ?? []}
                                                    onChange={(salts) => onSaltsChange?.(item.id, salts)}
                                                    label={`Salts for ${item.name} (optional)`}
                                                    hint="Shared by every batch of this medicine. Leave empty if the composition is unknown."
                                                />
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <datalist id="searchedMedList">
                        {searchedMed.map((s, index) => (
                            <option key={index} value={s.name} />
                        ))}
                    </datalist>
                </div>

                <div className="m-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            onClick={onAddProduct}
                            className="gap-2 bg-slate-900 text-white shadow-sm hover:bg-slate-800"
                        >
                            <Plus className="h-4 w-4" />
                            Add product
                        </Button>

                        <span className="hidden items-center gap-1 text-xs text-slate-400 sm:flex">
                            <kbd className="inline-flex h-5 items-center rounded border border-slate-200 bg-white px-1 font-sans text-[10px] font-semibold text-slate-500">
                                Ctrl
                            </kbd>
                            <span>+</span>
                            <kbd className="inline-flex h-5 items-center rounded border border-slate-200 bg-white px-1 font-sans text-[10px] font-semibold text-slate-500">
                                Enter
                            </kbd>
                        </span>
                    </div>

                    <p className="text-xs text-slate-400">
                        Tip: press{' '}
                        <span className="font-semibold text-slate-600">Alt + ↓</span> inside the last row to add
                        another product.
                    </p>
                </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                            <Keyboard className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Keyboard shortcuts</h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Move through the bill without reaching for the mouse.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <ShortcutRow keys={['Alt', '↑', '↓']} label="Move between product rows" />
                        <ShortcutRow keys={['Alt', '←', '→']} label="Move between product fields" />
                        <ShortcutRow keys={['Ctrl', 'Enter']} label="Add a product line" />
                        <ShortcutRow keys={['Ctrl', 'Shift', 'A']} label="Add a product line" />
                        <ShortcutRow keys={['Ctrl', 'Shift', 'S']} label="Save purchase bill" />
                        <ShortcutRow keys={['Ctrl', 'K']} label="Open command palette" />
                    </div>

                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-700">
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <p>
                            Use <span className="font-semibold">Alt + ↑ / ↓</span> first; the browser keeps normal
                            Tab behaviour intact for accessibility.
                        </p>
                    </div>
                </section>

                <aside className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-900 p-5 text-white shadow-md shadow-slate-900/10">
                    <div>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Bill summary
                                </p>
                                <h3 className="mt-1 text-lg font-semibold">Payment details</h3>
                            </div>
                            <Badge className="border-white/10 bg-white/10 text-slate-200">
                                {products.length} line{products.length === 1 ? '' : 's'}
                            </Badge>
                        </div>

                        <div className="mt-5 space-y-2.5 text-sm">
                            <div className="flex items-center justify-between text-slate-300">
                                <span>Subtotal</span>
                                <span className="font-medium text-white">{formatMoney(totalAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-300">
                                <span>Discount amount</span>
                                <span className="font-medium text-rose-300">− {formatMoney(totalDiscount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-300">
                                <span>GST amount</span>
                                <span className="font-medium text-emerald-300">+ {formatMoney(totalGst)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-4">
                        <div className="flex items-end justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Total payable
                                </p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight">{formatMoney(grandTotal)}</p>
                            </div>
                            <Save className="h-5 w-5 text-slate-500" />
                        </div>

                        <Button
                            type="button"
                            onClick={() =>
                                addNewBill(
                                    formData,
                                    products,
                                    setFormData,
                                    setProducts,
                                    totalAmount,
                                    totalDiscount,
                                    totalGst
                                )
                            }
                            className="mt-4 w-full gap-2 bg-white text-slate-900 shadow-sm hover:bg-slate-100"
                        >
                            <Save className="h-4 w-4" />
                            Save purchase
                        </Button>

                        <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-400">
                            <CornerDownLeft className="h-3 w-3" />
                            or press Ctrl + Shift + S
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default TabContentAddPurchase;

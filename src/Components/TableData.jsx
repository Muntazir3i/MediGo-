import React from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  Info,
  Loader2,
  Package,
  PackageSearch,
  Pencil,
  Pill,
  Save,
  Trash2,
} from 'lucide-react';
import { Button } from './ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Badge } from './ui/badge.jsx';
import SaltEditor from './SaltEditor.jsx';

const inputClass =
  'h-9 border-slate-200 bg-white text-sm text-slate-900 shadow-none transition focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';

const CATEGORY_OPTIONS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Suspension',
  'Drops',
  'Injection',
  'Ointment',
  'Cream',
  'Gel',
  'Powder',
  'Suppository',
  'Inhaler',
  'Patch',
  'Lozenge',
  'Spray',
  'Test Kit',
  'Diaper',
  'Sanitary Pads',
  'Sanitizer',
  'Granules',
  'Baby Food',
  'Lotion',
  'Cosmetics',
  'Sachet',
  'Mouth Wash',
  'Soap',
  'Oil',
  'Wipes',
  'Hair Product',
];

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const fieldLabelClass = 'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300';

const Field = ({ label, htmlFor, children, className = '' }) => (
  <div className={className}>
    <Label htmlFor={htmlFor} className={fieldLabelClass}>
      {label}
    </Label>
    {children}
  </div>
);

function TableData({
  medicines,
  handleDelete,
  handleEditClick,
  handleAdjustClick,
  isOpen,
  setIsOpen,
  selectedMedicine,
  handleChange,
  handleUpdate,
  formData,
  isSaving = false,
  error = '',
  onSaltsChange,
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Product catalogue</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Edit batch, pricing and supplier details. Use Adjust stock for quantity changes.
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            {medicines.length} shown
          </Badge>
        </div>

        <div className="max-h-[62vh] overflow-auto">
          <table className="w-full min-w-0 border-collapse text-left text-sm sm:min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold sm:px-4">Name</th>
                <th className="hidden px-3 py-3 font-semibold md:table-cell">Category</th>
                <th className="hidden px-3 py-3 font-semibold lg:table-cell">Supplier</th>
                <th className="hidden px-3 py-3 font-semibold xl:table-cell">Batch</th>
                <th className="hidden px-3 py-3 font-semibold md:table-cell">Expiry</th>
                <th className="px-2 py-3 font-semibold sm:px-3">Stock</th>
                <th className="hidden px-3 py-3 text-right font-semibold sm:table-cell">Price</th>
                <th className="px-3 py-3 text-right font-semibold sm:px-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {medicines.length > 0 ? (
                medicines.map((med) => {
                  const stock = toNumber(med.stock);
                  const expired = Boolean(med.expiryDate) && med.expiryDate < today;
                  const stockTone =
                    stock <= 0
                      ? 'bg-rose-50 text-rose-600'
                      : stock < 5
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700';

                  return (
                    <tr key={med.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{med.name}</div>
                        {med.saltSummary && (
                          <div className="mt-0.5 text-[11px] font-medium text-blue-600">
                            {med.saltSummary}
                          </div>
                        )}
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 sm:hidden">
                          {med.batchNumber && <span>Batch {med.batchNumber}</span>}
                          {med.expiryDate && (
                            <span className={expired ? 'font-medium text-rose-600' : ''}>
                              Exp {med.expiryDate}
                            </span>
                          )}
                          <span className="whitespace-nowrap">
                            ₹ {toNumber(med.mrp).toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-3 py-3 md:table-cell">
                        {med.category ? (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                            {med.category}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="hidden px-3 py-3 text-slate-600 lg:table-cell">
                        {med.supplier || '—'}
                      </td>

                      <td className="hidden px-3 py-3 font-mono text-xs text-slate-600 xl:table-cell">
                        {med.batchNumber || '—'}
                      </td>

                      <td className="hidden px-3 py-3 md:table-cell">
                        <span
                          className={
                            expired
                              ? 'font-medium text-rose-600'
                              : 'text-slate-600'
                          }
                        >
                          {med.expiryDate || '—'}
                        </span>
                      </td>

                      <td className="px-2 py-3 sm:px-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${stockTone}`}
                        >
                          {stock}
                        </span>
                      </td>

                      <td className="hidden whitespace-nowrap px-3 py-3 text-right font-semibold text-slate-900 sm:table-cell">
                        ₹ {toNumber(med.mrp).toFixed(2)}
                      </td>

                      <td className="px-3 py-3 sm:px-4">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdjustClick?.(med)}
                            aria-label={`Adjust stock for ${med.name}`}
                            className="h-8 gap-1.5 border-slate-200 bg-white px-2.5 text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            <ArrowUpDown className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Adjust</span>
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(med)}
                            aria-label={`Edit ${med.name}`}
                            className="h-8 gap-1.5 border-slate-200 bg-white px-2.5 text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(med.id)}
                            aria-label={`Delete ${med.name}`}
                            className="h-8 w-8 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <PackageSearch className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-800">No medicines found</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try a different name or batch number.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[720px]">
          <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-6 py-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 text-white shadow-sm shadow-blue-600/25">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold tracking-tight text-slate-900">
                    Edit medicine
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs text-slate-500">
                    Update batch, pricing and supplier details. Quantity is managed separately.
                  </DialogDescription>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      ID {selectedMedicine?.id ?? '—'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Bill {formData.billNumber || selectedMedicine?.billNumber || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="max-h-[60vh] overflow-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Medicine name" htmlFor="edit-name" className="sm:col-span-2">
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name ?? ''}
                  onChange={handleChange}
                  placeholder="Medicine name"
                  className={inputClass}
                  required
                />
              </Field>

              <Field label="Category" htmlFor="edit-category">
                <Input
                  id="edit-category"
                  name="category"
                  list="medicine-category-options"
                  value={formData.category ?? ''}
                  onChange={handleChange}
                  placeholder="Select or type a category"
                  className={inputClass}
                />
                <datalist id="medicine-category-options">
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </Field>

              <Field label="Supplier" htmlFor="edit-supplier">
                <Input
                  id="edit-supplier"
                  name="supplier"
                  value={formData.supplier ?? ''}
                  onChange={handleChange}
                  placeholder="Supplier name"
                  className={inputClass}
                />
              </Field>

              <Field label="Bill number" htmlFor="edit-bill-number">
                <Input
                  id="edit-bill-number"
                  name="billNumber"
                  value={formData.billNumber ?? ''}
                  onChange={handleChange}
                  placeholder="Supplier bill number"
                  className={`${inputClass} font-mono`}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Stored against this batch. New purchases fill it automatically.
                </p>
              </Field>

              <Field label="Batch number" htmlFor="edit-batch">
                <Input
                  id="edit-batch"
                  name="batchNumber"
                  value={formData.batchNumber ?? ''}
                  onChange={handleChange}
                  placeholder="Batch number"
                  className={`${inputClass} font-mono`}
                />
              </Field>

              <Field label="Expiry date" htmlFor="edit-expiry">
                <Input
                  id="edit-expiry"
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate ?? ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>

              <Field label="Stock quantity" htmlFor="edit-stock">
                <Input
                  id="edit-stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock ?? ''}
                  readOnly
                  disabled
                  placeholder="0"
                  className={`${inputClass} bg-slate-50 text-slate-500`}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Use “Adjust stock” to change quantity with an audit trail.
                </p>
              </Field>

              <Field label="Unit price (₹)" htmlFor="edit-unit-price">
                <Input
                  id="edit-unit-price"
                  name="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitPrice ?? ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={inputClass}
                />
              </Field>

              <Field label="MRP (₹)" htmlFor="edit-mrp">
                <Input
                  id="edit-mrp"
                  name="mrp"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.mrp ?? ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={inputClass}
                />
              </Field>

              <Field label="Discount (%)" htmlFor="edit-discount">
                <Input
                  id="edit-discount"
                  name="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount ?? ''}
                  onChange={handleChange}
                  placeholder="0"
                  className={inputClass}
                />
              </Field>

              <Field label="GST (%)" htmlFor="edit-gst">
                <Input
                  id="edit-gst"
                  name="gstPercentage"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.gstPercentage ?? ''}
                  onChange={handleChange}
                  placeholder="0"
                  className={inputClass}
                />
              </Field>

              <div className="sm:col-span-2">
                <SaltEditor
                  id="edit-salts"
                  value={formData.salts ?? []}
                  onChange={onSaltsChange}
                  disabled={isSaving}
                  label="Salts (optional)"
                  hint="Shared by every batch of this medicine. Leave empty if the composition is unknown."
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>Name, category and salt composition are shared by all batches of this medicine. Prices, expiry and batch details belong to this batch only.</p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/70 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleUpdate}
              disabled={isSaving}
              className="gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TableData;

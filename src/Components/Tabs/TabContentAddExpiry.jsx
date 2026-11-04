import React from 'react';
import {
  CalendarClock,
  Plus,
  Save,
  Trash2,
  Truck,
} from 'lucide-react';
import { Label } from '../ui/label.jsx';
import { Input } from '../ui/input.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';

const inputClass =
  'h-9 border-slate-200 bg-white text-sm text-slate-900 shadow-none transition focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20';

const TabContentAddExpiry = ({
  expiryFormData,
  handleChangeExpiry,
  handleSupplierSelect,
  allSuppliersSql,
  setExpiryFormData,
  expiryProducts,
  handleInputChangeExpiry,
  handleDeleteExpiry,
  handleAddProduct,
  setExpiryProducts,
  handleExpiryData,
}) => {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Expiry</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Record expiry</h2>
        <p className="mt-1 text-sm text-slate-500">
          Track expired or returned stock against the supplier it came from.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Bill and supplier</h3>
            <p className="mt-0.5 text-xs text-slate-500">Capture the expiry date and supplier details.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label htmlFor="expiry-date" className="mb-1.5 block text-xs font-medium text-slate-600">
              Bill date
            </Label>
            <Input
              id="expiry-date"
              name="date"
              value={expiryFormData.date}
              className={inputClass}
              type="date"
              onChange={handleChangeExpiry}
            />
          </div>

          <div>
            <Label htmlFor="expiry-supplier" className="mb-1.5 block text-xs font-medium text-slate-600">
              Supplier name
            </Label>
            <Input
              id="expiry-supplier"
              list="expirySupplierList"
              className={inputClass}
              name="supplierName"
              placeholder="Search suppliers"
              value={expiryFormData.supplierName}
              onChange={(e) => handleSupplierSelect(e, allSuppliersSql, setExpiryFormData, true)}
            />
            <datalist id="expirySupplierList">
              {allSuppliersSql.map((s) => (
                <option key={s.id ?? s.supplierName} value={s.supplierName} />
              ))}
            </datalist>
          </div>

          <div>
            <Label htmlFor="expiry-drug" className="mb-1.5 block text-xs font-medium text-slate-600">
              Supplier drug licence
            </Label>
            <Input
              id="expiry-drug"
              name="supplierDrugLn"
              value={expiryFormData.supplierDrugLn}
              className={inputClass}
              type="text"
              placeholder="D.L. number"
              onChange={handleChangeExpiry}
            />
          </div>

          <div>
            <Label htmlFor="expiry-contact" className="mb-1.5 block text-xs font-medium text-slate-600">
              Supplier contact
            </Label>
            <Input
              id="expiry-contact"
              name="supplierContact"
              value={expiryFormData.supplierContact}
              className={inputClass}
              type="tel"
              placeholder="Phone number"
              onChange={handleChangeExpiry}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Expired products</h3>
              <p className="mt-0.5 text-xs text-slate-500">Add every product included in this expiry record.</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            {expiryProducts.length} line{expiryProducts.length === 1 ? '' : 's'}
          </Badge>
        </div>

        <div className="mx-5 overflow-hidden rounded-lg border border-slate-200">
          <div className="max-h-[48vh] overflow-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Product name</th>
                  <th className="px-3 py-2.5 font-semibold">Batch</th>
                  <th className="px-3 py-2.5 font-semibold">Expiry</th>
                  <th className="px-3 py-2.5 font-semibold">Quantity</th>
                  <th className="px-3 py-2.5 font-semibold">MRP</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {expiryProducts.map((item, index) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/60">
                    <td className="px-3 py-2">
                      <Input
                        type="text"
                        aria-label={`Expired product name for line ${index + 1}`}
                        className={`${inputClass} min-w-[190px] font-semibold`}
                        value={item.name}
                        placeholder="Medicine name"
                        onChange={(e) => handleInputChangeExpiry(item.id, 'name', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="text"
                        aria-label={`Batch for line ${index + 1}`}
                        className={`${inputClass} min-w-[120px]`}
                        value={item.batchNumber}
                        placeholder="Batch"
                        onChange={(e) => handleInputChangeExpiry(item.id, 'batchNumber', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="date"
                        aria-label={`Expiry date for line ${index + 1}`}
                        className={`${inputClass} min-w-[140px]`}
                        value={item.expiryDate}
                        onChange={(e) => handleInputChangeExpiry(item.id, 'expiryDate', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        aria-label={`Quantity for line ${index + 1}`}
                        className={`${inputClass} min-w-[90px]`}
                        value={item.stock}
                        min="0"
                        onChange={(e) => handleInputChangeExpiry(item.id, 'stock', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        aria-label={`MRP for line ${index + 1}`}
                        className={`${inputClass} min-w-[100px]`}
                        value={item.mrp}
                        min="0"
                        onChange={(e) => handleInputChangeExpiry(item.id, 'mrp', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExpiry(item.id)}
                        aria-label={`Delete line ${index + 1}`}
                        className="h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="m-5 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            onClick={() => handleAddProduct(setExpiryProducts)}
            className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add product
          </Button>

          <Button
            type="button"
            onClick={handleExpiryData}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            Save expiry
          </Button>
        </div>
      </section>
    </div>
  );
};

export default TabContentAddExpiry;

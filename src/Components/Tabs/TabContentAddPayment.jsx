import React, { useEffect, useRef } from 'react';
import { CreditCard, Receipt, Save, Wallet } from 'lucide-react';
import { Label } from '../ui/label.jsx';
import { Input } from '../ui/input.jsx';
import { Button } from '../ui/button.jsx';

const inputClass =
  'h-9 border-slate-200 bg-white text-sm text-slate-900 shadow-none transition focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20';

// Returns today's date in local timezone as YYYY-MM-DD
// (the format <input type="date"> expects)
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TabContentAddPayment = ({
  newPaymentDetails,
  setNewPaymentDetails,
  handleChangePayment,
  handleSupplierSelect,
  allSuppliersSql,
  addNewPayment,
}) => {
  const receiptInputRef = useRef(null);

  // Auto-fill today's date on mount (only if empty, so it doesn't
  // overwrite a date the user already picked or one loaded for editing)
  useEffect(() => {
    if (!newPaymentDetails.date) {
      setNewPaymentDetails((prev) => ({
        ...prev,
        date: getTodayDate(),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After a successful save, reset the form but keep today's date
  const handleSave = async (e) => {
    e.preventDefault();

    const saved = await addNewPayment(e, newPaymentDetails, setNewPaymentDetails);

    if (!saved) return;

    // Reset for the next entry — date defaults back to today, still editable
    setNewPaymentDetails({
      date: getTodayDate(),
      invoice: '',
      supplierName: '',
      drugLicenseNumber: '',
      total: '',
    });

    // Put the cursor back on the receipt number for the next payment.
    requestAnimationFrame(() => {
      receiptInputRef.current?.focus();
      receiptInputRef.current?.select?.();
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Payments</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Record a payment</h2>
        <p className="mt-1 text-sm text-slate-500">
          Log an amount paid to a supplier and keep their ledger balance up to date.
        </p>
      </div>

      <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Payment details</h3>
            <p className="mt-0.5 text-xs text-slate-500">The receipt date defaults to today.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="payment-date" className="mb-1.5 block text-xs font-medium text-slate-600">
              Receipt date
            </Label>
            <Input
              id="payment-date"
              className={inputClass}
              type="date"
              name="date"
              value={newPaymentDetails.date}
              onChange={handleChangePayment}
              required
            />
          </div>

          <div>
            <Label htmlFor="payment-invoice" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Receipt className="h-3.5 w-3.5 text-slate-400" />
              Receipt number
            </Label>
            <Input
              id="payment-invoice"
              ref={receiptInputRef}
              className={inputClass}
              type="text"
              name="invoice"
              placeholder="Invoice or receipt reference"
              value={newPaymentDetails.invoice}
              onChange={handleChangePayment}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="payment-supplier" className="mb-1.5 block text-xs font-medium text-slate-600">
              Supplier name
            </Label>
            <Input
              id="payment-supplier"
              list="paymentSupplierList"
              className={inputClass}
              name="supplierName"
              placeholder="Search suppliers"
              value={newPaymentDetails.supplierName}
              onChange={(e) =>
                handleSupplierSelect(e, allSuppliersSql, setNewPaymentDetails, false)
              }
            />
            <datalist id="paymentSupplierList">
              {allSuppliersSql.map((s) => (
                <option key={s.id ?? s.supplierName} value={s.supplierName} />
              ))}
            </datalist>
          </div>

          <div>
            <Label htmlFor="payment-drug" className="mb-1.5 block text-xs font-medium text-slate-600">
              Drug licence number
            </Label>
            <Input
              id="payment-drug"
              className={inputClass}
              type="text"
              name="drugLicenseNumber"
              placeholder="D.L. number"
              value={newPaymentDetails.drugLicenseNumber}
              onChange={handleChangePayment}
            />
          </div>

          <div>
            <Label htmlFor="payment-total" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Wallet className="h-3.5 w-3.5 text-slate-400" />
              Amount paid (₹)
            </Label>
            <Input
              id="payment-total"
              className={inputClass}
              type="number"
              name="total"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={newPaymentDetails.total}
              onChange={handleChangePayment}
              required
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
          <Button type="submit" className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <Save className="h-4 w-4" />
            Save payment
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TabContentAddPayment;

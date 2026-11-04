import React from 'react';
import { Building2, Phone, Save, Scale } from 'lucide-react';
import { Label } from '../ui/label.jsx';
import { Input } from '../ui/input.jsx';
import { Button } from '../ui/button.jsx';

const inputClass =
  'h-9 border-slate-200 bg-white text-sm text-slate-900 shadow-none transition focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20';

const TabContentAddSupplier = ({
  newSupplierDetails,
  handleChangeAddSupplier,
  addNewSupplier,
  setNewSupplierDetails,
}) => {
  const handleSubmit = (event) => {
    addNewSupplier(event, newSupplierDetails, setNewSupplierDetails);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Supplier</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Add a supplier</h2>
        <p className="mt-1 text-sm text-slate-500">
          Create a supplier account so purchases and payments can be tracked correctly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Supplier details</h3>
            <p className="mt-0.5 text-xs text-slate-500">All fields are required.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="new-supplier-name" className="mb-1.5 block text-xs font-medium text-slate-600">
              Supplier name
            </Label>
            <Input
              id="new-supplier-name"
              className={inputClass}
              type="text"
              name="supplierName"
              placeholder="Business or supplier name"
              value={newSupplierDetails.supplierName}
              onChange={handleChangeAddSupplier}
              required
            />
          </div>

          <div>
            <Label htmlFor="new-supplier-phone" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              Phone number
            </Label>
            <Input
              id="new-supplier-phone"
              className={inputClass}
              type="tel"
              name="phoneNumber"
              placeholder="Contact number"
              value={newSupplierDetails.phoneNumber}
              onChange={handleChangeAddSupplier}
              required
            />
          </div>

          <div>
            <Label htmlFor="new-supplier-drug" className="mb-1.5 block text-xs font-medium text-slate-600">
              Drug licence number
            </Label>
            <Input
              id="new-supplier-drug"
              className={inputClass}
              type="text"
              name="drugLn"
              placeholder="D.L. number"
              value={newSupplierDetails.drugLn}
              onChange={handleChangeAddSupplier}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="new-supplier-balance" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Scale className="h-3.5 w-3.5 text-slate-400" />
              Opening balance
            </Label>
            <Input
              id="new-supplier-balance"
              className={inputClass}
              type="text"
              name="supplierBalance"
              placeholder="0.00"
              value={newSupplierDetails.supplierBalance}
              onChange={handleChangeAddSupplier}
              required
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
          <Button type="submit" className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <Save className="h-4 w-4" />
            Save supplier
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TabContentAddSupplier;

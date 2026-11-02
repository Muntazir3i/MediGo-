import React, { useEffect } from 'react';
import { Label } from '../ui/label.jsx';
import { Input } from '../ui/input.jsx';

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

    // Call the parent's save handler (it may or may not return a value)
    await addNewPayment(e, newPaymentDetails, setNewPaymentDetails);

    // Reset for the next entry — date defaults back to today, still editable
    setNewPaymentDetails({
      date: getTodayDate(),
      invoice: '',
      supplierName: '',
      drugLicenseNumber: '',
      total: '',
    });
  };

  return (
    <div>
      <form className="flex flex-col gap-3" onSubmit={handleSave}>
        <label htmlFor="date">Receipt Date</label>
        <input
          className="border-1"
          type="date"
          name="date"
          value={newPaymentDetails.date}
          onChange={handleChangePayment}
          required
        />

        <label htmlFor="invoice">Receipt Number</label>
        <input
          className="border-1"
          type="tel"
          name="invoice"
          value={newPaymentDetails.invoice}
          onChange={handleChangePayment}
          required
        />

        <div className="w-[100%]">
          <Label htmlFor="supplierDrugLn">Supplier Name</Label>
          <Input
            list="supplierList"
            className="border p-2 w-full border-black"
            name="supplierName"
            value={newPaymentDetails.supplierName}
            onChange={(e) =>
              handleSupplierSelect(
                e,
                allSuppliersSql,
                setNewPaymentDetails,
                false
              )
            }
          />
          <datalist id="supplierList">
            {allSuppliersSql.map((s) => (
              <option key={s.id} value={s.supplierName} />
            ))}
          </datalist>
        </div>

        <label htmlFor="drugLicenseNumber">Drug License Number</label>
        <input
          className="border-1"
          type="text"
          name="drugLicenseNumber"
          value={newPaymentDetails.drugLicenseNumber}
          onChange={handleChangePayment}
          required
        />

        <label htmlFor="total">Amount Paid</label>
        <input
          className="border-1"
          type="number"
          name="total"
          value={newPaymentDetails.total}
          onChange={handleChangePayment}
          required
        />

        <input
          className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          type="submit"
          value="Save"
        />
      </form>
    </div>
  );
};

export default TabContentAddPayment;
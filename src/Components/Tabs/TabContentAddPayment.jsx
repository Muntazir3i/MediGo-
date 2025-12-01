import React from 'react'
import { Label } from '../ui/label.jsx';
import { Input } from '../ui/input.jsx';

const TabContentAddPayment = ({
  newPaymentDetails,
  setNewPaymentDetails,
  handleChangePayment,
  handleSupplierSelect,
  allSuppliersSql,
  addNewPayment,
}) => {
  return (
    <div>
      <form className="flex flex-col gap-3" >
        <label htmlFor="date">Receipt Date</label>
        <input className="border-1" type="date" name="date" value={newPaymentDetails.date} onChange={handleChangePayment} required />

        <label htmlFor="invoice">Receipt Number</label>
        <input className="border-1" type="tel" name="invoice" value={newPaymentDetails.invoice} onChange={handleChangePayment} required />


        <div className='w-[100%]'>
          <Label htmlFor='supplierDrugLn'>Supplier Name</Label>
          <Input
            list="supplierList"
            className="border p-2 w-full border-black"
            name="supplierName"
            value={newPaymentDetails.supplierName}
            onChange={(e) => handleSupplierSelect(e, allSuppliersSql, setNewPaymentDetails, false)}
          />
          <datalist id="supplierList">
            {allSuppliersSql.map(s => (
              <option key={s.id} value={s.supplierName} />
            ))}
          </datalist>
        </div>

        <label htmlFor="drugLicenseNumber">Drug License Number</label>
        <input className="border-1" type="text" name="drugLicenseNumber" value={newPaymentDetails.drugLicenseNumber} onChange={handleChangePayment} required />

        <label htmlFor="total">Amount Paid</label>
        <input className="border-1" type="number" name="total" value={newPaymentDetails.total} onChange={handleChangePayment} required />


        <input
          className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          type="submit"
          value="Save"
          onClick={(e) => addNewPayment(e, newPaymentDetails, setNewPaymentDetails)}
        />
      </form>
    </div>
  )
}

export default TabContentAddPayment
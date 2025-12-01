import React from 'react'

const TabContentAddSupplier = ({
  newSupplierDetails,
  handleChangeAddSupplier,
  addNewSupplier,
  setNewSupplierDetails
}) => {
  return (
     <div>
                <form className="flex flex-col gap-3" >
                  <label htmlFor="supplier-name">Supplier Name</label>
                  <input className="border-1" type="text" name="supplierName" value={newSupplierDetails.supplierName} onChange={handleChangeAddSupplier} required />
    
                  <label htmlFor="phone-number">Phone Number</label>
                  <input className="border-1" type="tel" name="phoneNumber" value={newSupplierDetails.phoneNumber} onChange={handleChangeAddSupplier} required />
    
                  <label htmlFor="drug-license-number">Drug License Number</label>
                  <input className="border-1" type="text" name="drugLn" value={newSupplierDetails.drugLn} onChange={handleChangeAddSupplier} required />
    
                  <label htmlFor="drug-license-number">Balance</label>
                  <input className="border-1" type="text" name="supplierBalance" value={newSupplierDetails.supplierBalance} onChange={handleChangeAddSupplier} required />
    
    
                  <input
                    className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                    type="submit"
                    value="Save"
                    onClick={(e) => addNewSupplier(e, newSupplierDetails, setNewSupplierDetails)}
                  />
                </form>
              </div>
  )
}

export default TabContentAddSupplier
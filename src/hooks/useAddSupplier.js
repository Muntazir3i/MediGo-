import { addNewSuppliersql } from "@/services/medicineService.js"; 
 
export const addNewSupplier = async (e,newSupplierDetails,setNewSupplierDetails) => {
    e.preventDefault();
    let newSupplier = { ...newSupplierDetails }
    setNewSupplierDetails(newSupplier);
    try {
      const response = await addNewSuppliersql(newSupplier);
      setNewSupplierDetails({
        supplierName: '',
        phoneNumber: '',
        drugLn: '',
        supplierBalance: ''
      })
    } catch (error) {
      console.error('Error Adding Supplier to the database', error)
    }
  }
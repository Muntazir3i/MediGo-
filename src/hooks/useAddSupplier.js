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
      alert("Supplier Added Successfully")
    } catch (error) {
      console.error('Error Adding Supplier to the database', error);
      alert("Failed To Add New Supplier")
    }
  }
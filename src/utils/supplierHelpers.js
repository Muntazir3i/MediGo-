export const handleSupplierSelect = (e, supplierData, setFormData, notPayment) => {
  const supplierName = e.target.value;
  const supplier = supplierData.find(s => s.supplierName === supplierName);

  if (notPayment) {
    if (supplier) {
      setFormData(prev => ({
        ...prev,
        supplierName: supplier.supplierName,
        supplierContact: supplier.phoneNumber,
        supplierDrugLn: supplier.drugLn
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        supplierName,
        supplierContact: '',
        supplierDrugLn: ''
      }));
    }
  } else {
    if (supplier) {
      setFormData(prev => ({
        ...prev,
        supplierName: supplier.supplierName,
        drugLicenseNumber: supplier.drugLn,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        supplierName,
        drugLicenseNumber: ''
      }));
    }
  }
};

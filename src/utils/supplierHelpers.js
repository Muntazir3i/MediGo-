export const handleSupplierSelect = (e,supplierData,setFromData) => {
    const supplierName = e.target.value;
    const supplier = supplierData.find(s => s.supplierName === supplierName);

    if (supplier) {
      setFromData(prev => ({
        ...prev,
        supplierName: supplier.supplierName,
        supplierContact: supplier.phoneNumber,
        supplierDrugLn: supplier.drugLn
      }));
    } else {
      setFromData(prev => ({
        ...prev,
        supplierName,
        supplierContact: '',
        supplierDrugLn: ''
      }));
    }
  };
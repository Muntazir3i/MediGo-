import { addBillSql } from "@/services/medicineService.js";
export const addNewBill = async (formData,products,setFormData,setProducts,totalAmount,totalDiscount,totalGst) => {
    if (!formData.invoice.trim() || !formData.date.trim()) {
      alert("Bill Number and Bill Date are required.");
      return;
    }

    const validProducts = products.filter(product =>
      product.name.trim() &&
      product.batchNumber.trim() &&
      product.expiryDate.trim() &&
      product.stock > 0
    );

    if (validProducts.length === 0) {
      alert("At least one valid product is required.");
      return;
    }

    try {
      let billData = {
        id: Date.now(),
        ...formData,
        products: validProducts,
        totalAmount: totalAmount.toFixed(2),
        totalGst: totalGst.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        total: Math.round(totalAmount + totalGst - totalDiscount),
        type: 'Bill'
      };

      const billResponse = await addBillSql(billData);
      
      alert('Bill added successfully!');

      // Reset state
      setFormData({
        invoice: '',
        date: '',
        supplierName: '',
        supplierGstin: '',
        supplierContact: '',
      });

      setProducts([
        {
          id: Date.now(),
          name: "",
          batchNumber: "",
          expiryDate: "",
          stock: 0,
          unitPrice: 0,
          mrp: 0,
          discount: 0,
          gstPercentage: 0,
        },
      ]);

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add the bill. Please try again.');
    }
  };
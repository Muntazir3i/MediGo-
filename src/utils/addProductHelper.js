// In your helper file
export const handleAddProduct = (setProducts) => {
    setProducts((prevProducts) => [
        ...prevProducts,
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
};
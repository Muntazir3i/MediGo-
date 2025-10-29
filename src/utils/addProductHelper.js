export const handleAddProduct = (products,setProducts) => {
    setProducts([
        ...products,
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
    ])
}
export const calculateBillTotals = (products) => {
    const totalAmount = products.reduce((acc, item) => {
        const price = item.unitPrice * item.stock;
        return acc + price;
    }, 0);

    const totalDiscount = products.reduce((acc, item) => {
        const price = item.unitPrice * item.stock;
        const discount = price * (item.discount || 0) / 100;
        return acc + discount;
    }, 0);

    const totalGst = products.reduce((acc, item) => {
        const price = item.unitPrice * item.stock;
        const discount = price * (item.discount || 0) / 100;
        const priceAfterDiscount = price - discount;
        const gst = priceAfterDiscount * (item.gstPercentage || 0) / 100;
        return acc + gst;
    }, 0);

    return {totalAmount,totalDiscount,totalGst}
}
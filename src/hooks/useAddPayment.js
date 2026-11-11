import { addPaymentSql } from "@/services/medicineService.js";
export const addNewPayment = async (e, newPaymentDetails, setNewPaymentDetails) => {
    e.preventDefault();
    if (!confirm("Do You Want To Add This Payment")) return false;

    let newPayment = { ...newPaymentDetails, id: Date.now(), type: 'Payment' }
    setNewPaymentDetails(newPayment);
    try {
        const response = await addPaymentSql(newPayment);
        console.log(response);
        alert('Payment Added Successfully!');
        return true;
    } catch (error) {
        console.error('Error Adding Payment to the database', error);
        const message =
            error.response?.data?.error || 'Failed To Add Payment';
        alert(message);
        return false;
    }
}
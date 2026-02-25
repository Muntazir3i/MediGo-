import { addPaymentSql } from "@/services/medicineService.js";
export const addNewPayment = async (e,newPaymentDetails,setNewPaymentDetails) => {
    e.preventDefault();
    if(!confirm("Do You Want To Add This Payment")) return;
    
    let newPayment = { ...newPaymentDetails, id: Date.now(), type: 'Payment' }
    setNewPaymentDetails(newPayment);
    try {
        const response = await addPaymentSql(newPayment);
        console.log(response);
        setNewPaymentDetails({
            date: '',
            invoice: '',
            supplierName: '',
            drugLicenseNumber: '',
            total: ''
        })

        alert('Payment Added Successfully!');


    } catch (error) {
        console.error('Error Adding Payment to the database', error);
        alert('Failed To Add Payment');
    }


}
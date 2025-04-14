import axios from "axios";

const API_BASE_URL = 'http://192.168.0.104:8000/api/medicines'
const API_BASE_URL_BILL = 'http://192.168.0.104:8000:8000/api/bills'
const API_BASE_URL_PURCHASE = 'http://192.168.0.104:8000/api/purchase'
const API_BASE_URL_PAYMENT = 'http://192.168.0.104:8000/api/payment'
const API_BASE_URL_SUPPLIER = 'http://192.168.0.104:8000/api/addSupplier'


//get all suppliers

export const getSupplier = async()=>{
    const response = await axios.get(`${API_BASE_URL_SUPPLIER}/all-supplier`);
    return response
}

//add supplier

export const addNewSupplier = async(supplierData) => {
   try {
     const response = await axios.post(`${API_BASE_URL_SUPPLIER}/add-supplier`, supplierData);
     return response
   } catch (error) {
    console.log('Error adding Supplier',error);
   }
}

//get all medicine
export const getMedicines = async()=>{
    const response = await axios.get(`${API_BASE_URL}/all-medi`);
    return response
}

// add medicine
export const addMedicines = async(medicineData)=>{
    const response = await axios.post(`${API_BASE_URL}/add-medi`,medicineData);
    return response
}

//del medicine
export const deleteMedicine = async (id) => {
    return await axios.delete(`${API_BASE_URL}/del-medi/${id}`);
  };

  // decrease stock 
  export const decreaseStock = async (id) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/dec-stock/${id}`);
      return response.data;
    } catch (error) {
      console.log('Failed to decrease stock:', error);
      throw error;
    }
  };

  //increase stock 
    // decrease stock 
    export const increaseStock = async (id) => {
        try {
          const response = await axios.put(`${API_BASE_URL}/inc-stock/${id}`);
          return response.data;
        } catch (error) {
          console.log('Failed to increase stock:', error);
          throw error;
        }
      };


// update medicine
export const updateMedicine = async (id, updatedData) => {
    try {
      const response = await axios.put(
        `http://localhost:8000/api/medicines/upt-medi/${id}`,
        updatedData, // Send the updated medicine data
        { headers: { "Content-Type": "application/json" } } // Ensure JSON format
      );
      return response.data;
    } catch (error) {
      console.error("Error updating medicine:", error);
      throw error;
    }
};


// add bill

export const addBill = async(billData)=>{
    try {
        const response = axios.post(`${API_BASE_URL_BILL}/add-bills`,billData);
        return response
    } catch (error) {
        console.error("Error adding bill:", error);
        throw error;
    }
}

//get all bills

export const showAllBills = async()=>{
    try {
        const response = axios.get(`${API_BASE_URL_BILL}/all-bills`);
        return response
    } catch (error) {
        console.log('Error Fetching the bills:', error);
        throw error
        
    }
}

//get all purchases
export const getPurchase = async()=>{
    const response = await axios.get(`${API_BASE_URL_PURCHASE}/all-purchase`);
    return response
}

//add purchases

export const addPurchase = async(purchaseData)=>{
    try {
        const response = axios.post(`${API_BASE_URL_PURCHASE}/add-purchase`,purchaseData);
        return response
    } catch (error) {
        console.error("Error adding bill:", error);
        throw error;
    }
}

// get all payments

export const getPayments = async()=>{
    const response = await axios.get(`${API_BASE_URL_PAYMENT}/all-payments`);
    return response
}

// add payments
export const addPayment = async(paymentData)=>{
    try {
        const response = axios.post(`${API_BASE_URL_PAYMENT}/add-payment`,paymentData);
        return response
    } catch (error) {
        console.error("Error adding payment:", error);
        throw error;
    }
}

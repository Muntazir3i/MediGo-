import axios from "axios";

const API_BASE_URL = 'http://localhost:8000/api/medicines'
const API_BASE_URL_BILL = 'http://localhost:8000:8000/api/bills'
const API_BASE_URL_PURCHASE = 'http://localhost:8000/api/purchase'
const API_BASE_URL_PAYMENT = 'http://localhost8000/api/payment'
const API_BASE_URL_SUPPLIER = 'http://localhost:8000/api/addSupplier'
const API_BASE_URL_EXPIRY = 'http://localhost:8000/api/expiry'


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

//fetch low stock 
export const getLowStock = async()=>{
  const response = await axios.get(`${API_BASE_URL}/low-stock`);
  return response
}

//fetch out-of-stock

export const getOutOfStock = async()=>{
  const response = await axios.get(`${API_BASE_URL}/out-of-stock`);
  return response
}

//fetch expity stock 
export const getExpiry = async()=>{
 try {
   const response = await axios.get(`${API_BASE_URL}/expiry-stock`);
   return response
 } catch (error) {
  console.log(error);
 }
}


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

//find transactions 

export const findSupplierTransaction = async (name) => {
  try {
    // Make the POST request and wait for the response
    const response = await axios.post(`${API_BASE_URL_PURCHASE}/find-trans/${name}`);
    return response.data; // Return the response data
  } catch (error) {
    console.error("Error fetching supplier transactions:", error.message);
    throw new Error("Failed to fetch supplier transactions. Please try again."); // Throw the error with a meaningful message
  }
};

//find payment by date

export const findPaymentByDate = async (date) => {
  try {
    // Make the POST request to fetch payments by date
    const response = await axios.post(`${API_BASE_URL_PURCHASE}/find-day-payment/${date}`);
    return response.data; // Return the response data
  } catch (error) {
    console.error("Error fetching payments for the date:", error.message); // Log the error message
    throw new Error("Failed to fetch payments for the specified date. Please try again."); // Throw a descriptive error
  }
};

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


//get all expiry

export const getAllExpiry = async () => {
  try {
    // Make the GET request to fetch all expiry data
    const response = await axios.get(`${API_BASE_URL_EXPIRY}/all-expiry`);
    return response.data; // Return only the response data for easier consumption
  } catch (error) {
    console.error("Error fetching all expiry data:", error.message); // Log the error for debugging
    throw new Error("Failed to fetch expiry data. Please try again."); // Throw a descriptive error
  }
};
//add expiry

export const addNewExpiry = async (expiryData) => {
  try {
    // Make the POST request to add new expiry data
    const response = await axios.post(`${API_BASE_URL_EXPIRY}/add-expiry`, expiryData);
    return response.data; // Return only the response data for easier consumption
  } catch (error) {
    console.error('Error adding new expiry:', error.message); // Log the error message for debugging
    throw new Error('Failed to add new expiry. Please try again.'); // Throw a descriptive error for the caller
  }
};


import axios from "axios";

const API_BASE_URL = 'http://localhost:8008/api/medicines'
const API_BASE_URL_EXPIRY = 'http://localhost:8008/api/expiry'
const API_BASE_URL_SUPPLIER_SQL = 'http://localhost:8008/api/supplier'
const API_BASE_URL_BILL_SQL = 'http://localhost:8008/api/sqlbills'
const API_BASE_URL_PAYMENT_SQL = 'http://localhost:8008/api/sqlpayment'
const API_BASE_URL_BILL_PAYMENT_SQL = 'http://localhost:8008/api/sqlbillpayment'


//get all bills and payment dql

export const getBillPaymentSql = async (supplierName) => {
  try {
    const response = await axios.get(`${API_BASE_URL_BILL_PAYMENT_SQL}/all-data`, {
      params: { supplierName }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching bills and payments from SQL:', error.message);
    return [];
  }
};

//add bill sql


export const addBillSql = async(billData)=>{
  try {
      const response = axios.post(`${API_BASE_URL_BILL_SQL}/bills`,billData);
      return response
  } catch (error) {
      console.error("Error adding bill:", error);
      throw error;
  }
}

//get bills with products

export const fetchBillsProductsSql = async()=>{
  try {
      const response = axios.get(`${API_BASE_URL_BILL_SQL}/bills`);
      return response
  } catch (error) {
      console.error("Error fetching bill with product:", error);
      throw error;
  }
}


//get all supplier sqlite

export const getsupplierSql = async()=>{
  try {
    const response = await axios.get(`${API_BASE_URL_SUPPLIER_SQL}/suppliers`)
    return response
  } catch (error) {
    console.log('Error Fetching the supplier from sql', error)
  }
}

//add new supplier sqlite
export const addNewSuppliersql = async(supplierData) => {
  try {
    const response = await axios.post(`${API_BASE_URL_SUPPLIER_SQL}/suppliers`, supplierData);
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


//get all payments

export const getAllPaymentsSql = async()=>{
  try {
    const response = await axios.get(`${API_BASE_URL_PAYMENT_SQL}/payments`)
    return response.data
  } catch (error) {
    console.log('Error Fetching payments',error);
  }
}


// add new payment sql

export const addPaymentSql = async(payment)=>{
  try {
    const response = await axios.post(`${API_BASE_URL_PAYMENT_SQL}/payments`,payment)
    return response
  } catch (error) {
    console.log('Error adding payment',error);
  }
}


//find payment by data sql

export const findPaymentByDateSql = async(date)=>{
  try {
    const response = await axios.get(`${API_BASE_URL_PAYMENT_SQL}/payments/date/${date}`)
    return response.data
  } catch (error) {
    console.error("Error fetching payments for the date:", error.message); // Log the error message
    throw new Error("Failed to fetch payments for the specified date. Please try again."); // Throw a descriptive error
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
// find expiry based on supplier name
export const findSupplierExpiry = async (name) => {
  try {
    // Make the POST request and wait for the response
    const response = await axios.post(`${API_BASE_URL_EXPIRY}/find-exp/${name}`);
    return response.data; // Return the response data
  } catch (error) {
    console.error("Error fetching supplier expiry:", error.message);
    throw new Error("Failed to fetch supplier expiry. Please try again."); // Throw the error with a meaningful message
  }
};


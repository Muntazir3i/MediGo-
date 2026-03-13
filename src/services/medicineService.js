import axios from "axios";

// ─── Base URLs ────────────────────────────────────────────────────────────────
const API_BASE_URL = 'http://localhost:8008/api/medicines';
const API_BASE_URL_EXPIRY = 'http://localhost:8008/api/expiry';
const API_BASE_URL_SUPPLIER_SQL = 'http://localhost:8008/api/supplier';
const API_BASE_URL_BILL_SQL = 'http://localhost:8008/api/sqlbills';
const API_BASE_URL_PAYMENT_SQL = 'http://localhost:8008/api/sqlpayment';
const API_BASE_URL_BILL_PAYMENT_SQL = 'http://localhost:8008/api/sqlbillpayment';
const API_BASE_URL_MEDICINES_SQL = 'http://localhost:8008/api/sqlmedicines';
const API_BASE_URL_SEARCH_MEDICINE = 'http://localhost:8008/api/searchMedicine';


// ─── Medicine Search ──────────────────────────────────────────────────────────

/** Search medicines by name. Returns [] for empty input. */
export const findmedicineByName = async (medName) => {
  try {
    if (!medName || medName.trim() === '') return [];
    const formattedName = medName.trim().toUpperCase();
    const response = await axios.get(`${API_BASE_URL_SEARCH_MEDICINE}/medicines/search/${formattedName}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching searched medicine:", error.message);
    throw new Error("Error fetching searched medicine");
  }
};

// ─── Bill + Payment (Combined) ────────────────────────────────────────────────

/** Get all bills and payments for a supplier from SQL. */
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

// ─── Bills (SQL) ──────────────────────────────────────────────────────────────

/** Add a new bill to SQL. */
export const addBillSql = async (billData) => {
  try {
    const response = await axios.post(`${API_BASE_URL_BILL_SQL}/bills`, billData);
    return response.data;
  } catch (error) {
    console.error("Error adding bill:", error.message);
    throw error;
  }
};

/** Fetch all bills with their products from SQL. */
export const fetchBillsProductsSql = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL_BILL_SQL}/bills`);
    return response.data;
  } catch (error) {
    console.error("Error fetching bills with products:", error.message);
    throw error;
  }
};

// ─── Suppliers (SQL) ──────────────────────────────────────────────────────────

/** Get all suppliers from SQL. */
export const getsupplierSql = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL_SUPPLIER_SQL}/suppliers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching suppliers from SQL:', error.message);
    throw error;
  }
};

/** Add a new supplier to SQL. */
export const addNewSuppliersql = async (supplierData) => {
  try {
    const response = await axios.post(`${API_BASE_URL_SUPPLIER_SQL}/suppliers`, supplierData);
    return response.data;
  } catch (error) {
    console.error('Error adding supplier:', error.message);
    throw error;
  }
};

// ─── Medicines (SQL) ──────────────────────────────────────────────────────────

/** Get all medicines from SQL. */
export const getAllMedicines = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL_MEDICINES_SQL}/medicines`);
    return response.data;
  } catch (error) {
    console.error('Error fetching medicines from SQL:', error.message);
    throw error;
  }
};

// ─── Medicines (Legacy API) ───────────────────────────────────────────────────

/** Get all medicines. */
export const getMedicines = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/all-medi`);
    return response.data;
  } catch (error) {
    console.error('Error fetching medicines:', error.message);
    throw error;
  }
};

/** Add a new medicine. */
export const addMedicines = async (medicineData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/add-medi`, medicineData);
    return response.data;
  } catch (error) {
    console.error('Error adding medicine:', error.message);
    throw error;
  }
};

/** Delete a medicine by ID. */
export const deleteMedicine = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/del-medi/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting medicine:', error.message);
    throw error;
  }
};

/** Decrease stock count for a medicine by ID. */
export const decreaseStock = async (id) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/dec-stock/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to decrease stock:', error.message);
    throw error;
  }
};

/** Increase stock count for a medicine by ID. */
export const increaseStock = async (id) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/inc-stock/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to increase stock:', error.message);
    throw error;
  }
};

/** Update medicine details by ID. */
export const updateMedicine = async (id, updatedData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/upt-medi/${id}`,
      updatedData,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating medicine:", error.message);
    throw error;
  }
};

/** Get medicines with low stock. */
export const getLowStock = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/low-stock`);
    return response.data;
  } catch (error) {
    console.error('Error fetching low stock medicines:', error.message);
    throw error;
  }
};

/** Get medicines that are out of stock. */
export const getOutOfStock = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/out-of-stock`);
    return response.data;
  } catch (error) {
    console.error('Error fetching out-of-stock medicines:', error.message);
    throw error;
  }
};

/** Get medicines nearing expiry. */
export const getExpiry = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/expiry-stock`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expiry stock:', error.message);
    throw error;
  }
};

// ─── Payments (SQL) ───────────────────────────────────────────────────────────

/** Get all payments from SQL. */
export const getAllPaymentsSql = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL_PAYMENT_SQL}/payments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payments:', error.message);
    throw error;
  }
};

/** Add a new payment to SQL. */
export const addPaymentSql = async (payment) => {
  try {
    const response = await axios.post(`${API_BASE_URL_PAYMENT_SQL}/payments`, payment);
    return response.data;
  } catch (error) {
    console.error('Error adding payment:', error.message);
    throw error;
  }
};

/** Find payments by date. */
export const findPaymentByDateSql = async (date) => {
  try {
    const response = await axios.get(`${API_BASE_URL_PAYMENT_SQL}/payments/date/${date}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching payments for the date:", error.message);
    throw new Error("Failed to fetch payments for the specified date. Please try again.");
  }
};

/** Delete a payment by ID. */
export const deletePaymentSql = async (paymentId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL_PAYMENT_SQL}/payments/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting payment:", error.message);
    throw new Error("Failed to delete payment. Please try again.");
  }
};

/** Update a payment by ID. */
export const updatePaymentSql = async (paymentId, updatedPayment) => {
  try {
    const response = await axios.put(`${API_BASE_URL_PAYMENT_SQL}/payments/${paymentId}`, updatedPayment);
    return response.data;
  } catch (error) {
    console.error("Error updating payment:", error.message);
    throw new Error("Failed to update payment. Please try again.");
  }
};

/** Load more payments */
export const loadMorePaymentsSql = async (lastId) => {
  try {
    const response = await axios.get(`${API_BASE_URL_PAYMENT_SQL}/payments/loadMore/${lastId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching payments:", error.message);
    throw new Error("Failed to fetch payments. Please try again.");
  }
};

// ─── Expiry ───────────────────────────────────────────────────────────────────

/** Get all expiry records. */
export const getAllExpiry = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL_EXPIRY}/all-expiry`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all expiry data:", error.message);
    throw new Error("Failed to fetch expiry data. Please try again.");
  }
};

/** Add a new expiry record. */
export const addNewExpiry = async (expiryData) => {
  try {
    const response = await axios.post(`${API_BASE_URL_EXPIRY}/add-expiry`, expiryData);
    return response.data;
  } catch (error) {
    console.error('Error adding new expiry:', error.message);
    throw new Error('Failed to add new expiry. Please try again.');
  }
};

/** Find expiry records by supplier name. */
export const findSupplierExpiry = async (name) => {
  try {
    const response = await axios.get(`${API_BASE_URL_EXPIRY}/find-exp/${name}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching supplier expiry:", error.message);
    throw new Error("Failed to fetch supplier expiry. Please try again.");
  }
};

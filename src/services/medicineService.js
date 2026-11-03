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
const API_BASE_URL_INVOICE = "http://localhost:8008/api/invoice";



export const saveInvoice = async (invoiceData) => {

  try {

    const response = await axios.post(
      `${API_BASE_URL_INVOICE}/save`,
      invoiceData
    );

    return response.data;

  } catch (error) {

    console.error(error);

    throw error;
  }
};

// SEARCH INVOICE
export const searchInvoices = async (date, customer) => {

  try {

    const response = await axios.get(
      `${API_BASE_URL_INVOICE}/search`,
      {
        params: {
          date,
          customer
        }
      }
    );

    return response.data;

  } catch (error) {

    console.error(error);

    throw error;
  }
};


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

/**
 * Get a supplier's bills and payments from SQL, optionally within a date range.
 * Returns { transactions, summary }.
 */
export const getBillPaymentSql = async (supplierName, { from = '', to = '' } = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL_BILL_PAYMENT_SQL}/all-data`, {
      params: {
        supplierName,
        ...(from ? { from } : {}),
        ...(to ? { to } : {})
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching bills and payments from SQL:', error.message);
    return { transactions: [], summary: null };
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

/** Update an existing purchase bill and its medicine rows. */
export const updateBillSql = async (billId, billData) => {
  try {
    const response = await axios.put(`${API_BASE_URL_BILL_SQL}/bills/${billId}`, billData);
    return response.data;
  } catch (error) {
    console.error("Error updating bill:", error.response?.data?.error || error.message);
    throw error;
  }
};

/** Delete a purchase bill and all of its related product rows. */
export const deleteBillSql = async (billId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL_BILL_SQL}/bills/${billId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting bill:", error.message);
    throw error;
  }
};

/**
 * Fetch a page of bills with their products from SQL.
 * Defaults to 5 bills. Filters: supplierName (exact), supplierSearch (partial),
 * date, invoice.
 */
export const fetchBillsProductsSql = async ({ limit = 5, offset = 0, supplierName = '', supplierSearch = '', date = '', invoice = '' } = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL_BILL_SQL}/bills`, {
      params: {
        limit,
        offset,
        ...(supplierName ? { supplierName } : {}),
        ...(supplierSearch ? { supplierSearch } : {}),
        ...(date ? { date } : {}),
        ...(invoice ? { invoice } : {})
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching bills with products:", error.message);
    throw error;
  }
};

/**
 * Fetch all bill suppliers with their bill count and total amount.
 * Accepts an options object (or a plain search string for backwards compatibility).
 *
 * @param {{search?: string, date?: string, invoice?: string}|string} [options]
 */
export const getBillSuppliers = async (options = {}) => {
  try {
    const opts = typeof options === 'string' ? { search: options } : (options || {});
    const params = {};
    if (opts.search) params.search = opts.search;
    if (opts.date) params.date = opts.date;
    if (opts.invoice) params.invoice = opts.invoice;

    const response = await axios.get(`${API_BASE_URL_BILL_SQL}/bills/suppliers`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching bill suppliers:", error.message);
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

/** Get the first page of payments, optionally filtered by invoice number. */
export const getAllPaymentsSql = async (invoice = '') => {
  try {
    const response = await axios.get(`${API_BASE_URL_PAYMENT_SQL}/payments`, {
      params: invoice ? { invoice } : {}
    });
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

/** Load the next page of payments, optionally filtered by invoice number. */
export const loadMorePaymentsSql = async (lastId, invoice = '') => {
  try {
    const response = await axios.get(`${API_BASE_URL_PAYMENT_SQL}/payments/loadMore/${lastId}`, {
      params: invoice ? { invoice } : {}
    });
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

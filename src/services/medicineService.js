import axios from "axios";

// ─── Base URLs ────────────────────────────────────────────────────────────────
const API_BASE_URL = 'http://localhost:8008/api/medicines';
const API_BASE_URL_EXPIRY = 'http://localhost:8008/api/expiry';
const API_BASE_URL_CREDIT_NOTES = 'http://localhost:8008/api/credit-notes';
const API_BASE_URL_INSIGHTS = 'http://localhost:8008/api/insights';
const API_BASE_URL_SETTINGS = 'http://localhost:8008/api/settings';
const API_BASE_URL_SUPPLIER_SQL = 'http://localhost:8008/api/supplier';
const API_BASE_URL_BILL_SQL = 'http://localhost:8008/api/sqlbills';
const API_BASE_URL_PAYMENT_SQL = 'http://localhost:8008/api/sqlpayment';
const API_BASE_URL_BILL_PAYMENT_SQL = 'http://localhost:8008/api/sqlbillpayment';
const API_BASE_URL_MEDICINES_SQL = 'http://localhost:8008/api/sqlmedicines';
const API_BASE_URL_SEARCH_MEDICINE = 'http://localhost:8008/api/searchMedicine';
const API_BASE_URL_INVOICE = "http://localhost:8008/api/invoice";
const API_BASE_URL_SALES = "http://localhost:8008/api/sales";



export const saveInvoice = async (invoiceData) => {

  try {

    const response = await axios.post(
      `${API_BASE_URL_SALES}/invoices`,
      invoiceData
    );

    return response.data;

  } catch (error) {

    console.error(error);

    throw error;
  }
};

/** Void a finalized sale and restore its stock. */
export const voidSaleInvoice = async (invoiceId) => {
  try {
    const response = await axios.post(`${API_BASE_URL_SALES}/invoices/${invoiceId}/void`);
    return response.data;
  } catch (error) {
    console.error('Error voiding invoice:', error.response?.data?.message || error.message);
    throw error;
  }
};

/** Delete a customer invoice and restore each line's exact stock quantity. */
export const deleteSaleInvoice = async (invoiceId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL_SALES}/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting invoice:', error.response?.data?.message || error.message);
    throw error;
  }
};

/** Fetch one sale invoice with its immutable line snapshots. */
export const getSaleInvoice = async (invoiceId) => {
  try {
    const response = await axios.get(`${API_BASE_URL_SALES}/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice:', error.message);
    throw error;
  }
};

/** Edit a finalized sale. Stock is reconciled by the backend. */
export const updateSaleInvoice = async (invoiceId, invoiceData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL_SALES}/invoices/${invoiceId}`,
      invoiceData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating invoice:', error.response?.data?.message || error.message);
    throw error;
  }
};

// SEARCH INVOICE
export const searchInvoices = async ({
  date = '',
  customer = '',
  invoice = '',
  q = '',
  medicine = '',
  from = '',
  to = ''
} = {}) => {

  try {

    const response = await axios.get(
      `${API_BASE_URL_INVOICE}/search`,
      {
        params: {
          date,
          customer,
          invoice,
          q,
          medicine,
          from,
          to
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

/** Aggregate ledger balance and totals for one supplier. */
export const getLedgerSummary = async (supplierName, { from = '', to = '' } = {}) => {
  const response = await axios.get(`${API_BASE_URL_BILL_PAYMENT_SQL}/summary`, {
    params: {
      supplierName,
      ...(from ? { from } : {}),
      ...(to ? { to } : {})
    }
  });
  return response.data;
};

/** Newest-first ledger transactions with cursor pagination. */
export const getLedgerTransactions = async (
  supplierName,
  { from = '', to = '', limit = 50, cursor = '' } = {}
) => {
  const response = await axios.get(`${API_BASE_URL_BILL_PAYMENT_SQL}/transactions`, {
    params: {
      supplierName,
      limit,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(cursor ? { cursor } : {})
    }
  });
  return response.data;
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

/** Search the salt catalogue. */
export const searchSalts = async (term = '') => {
  try {
    const response = await axios.get(`${API_BASE_URL_MEDICINES_SQL}/salts`, {
      params: { search: term },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching salts:', error.message);
    throw error;
  }
};

/** Create a salt, or reuse the existing one with the same name. */
export const createSalt = async (name) => {
  try {
    const response = await axios.post(`${API_BASE_URL_MEDICINES_SQL}/salts`, { name });
    return response.data;
  } catch (error) {
    console.error('Error creating salt:', error.response?.data?.error || error.message);
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
    const response = await axios.delete(`${API_BASE_URL_MEDICINES_SQL}/medicines/${id}`);
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

/** Fetch one inventory batch by ID. */
export const getInventoryItem = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL_MEDICINES_SQL}/medicines/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory item:', error.message);
    throw error;
  }
};

/** Apply an audited stock adjustment to one inventory batch. */
export const adjustMedicineStock = async (id, { delta, quantity, reason = '' } = {}) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL_MEDICINES_SQL}/medicines/${id}/adjust`,
      { delta, quantity, reason }
    );
    return response.data;
  } catch (error) {
    console.error('Error adjusting stock:', error.response?.data?.error || error.message);
    throw error;
  }
};

/** Update medicine details by ID. */
export const updateMedicine = async (id, updatedData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL_MEDICINES_SQL}/medicines/${id}`,
      updatedData,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating medicine:", error.message);
    throw error;
  }
};

/** Get medicines with low stock (total across active batches). */
export const getLowStock = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL_MEDICINES_SQL}/low-stock`);
    return response.data;
  } catch (error) {
    console.error('Error fetching low stock medicines:', error.message);
    throw error;
  }
};

/** Get medicines that are out of stock. */
export const getOutOfStock = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL_MEDICINES_SQL}/out-of-stock`);
    return response.data;
  } catch (error) {
    console.error('Error fetching out-of-stock medicines:', error.message);
    throw error;
  }
};

/** Get batches expiring within the next 3 months. */
export const getExpiry = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL_MEDICINES_SQL}/expiry-stock`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expiry stock:', error.message);
    throw error;
  }
};

// ─── Payments (SQL) ───────────────────────────────────────────────────────────

/** Get the first page of payments, optionally filtered by invoice number and date range. */
export const getAllPaymentsSql = async (invoice = '', { from = '', to = '' } = {}) => {
  try {
    const params = {};
    if (invoice) params.invoice = invoice;
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await axios.get(`${API_BASE_URL_PAYMENT_SQL}/payments`, { params });
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
export const loadMorePaymentsSql = async (lastId, invoice = '', { from = '', to = '' } = {}) => {
  try {
    const params = {};
    if (invoice) params.invoice = invoice;
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await axios.get(`${API_BASE_URL_PAYMENT_SQL}/payments/loadMore/${lastId}`, {
      params
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
    const message = error.response?.data?.error || 'Failed to add new expiry. Please try again.';
    throw new Error(message);
  }
};

/** Delete an expiry record and its medicine lines. */
export const deleteExpiryRecord = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL_EXPIRY}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting expiry record:', error.message);
    throw new Error(error.response?.data?.error || 'Failed to delete expiry record. Please try again.');
  }
};
export const findSupplierExpiry = async (name) => {
  try {
    const response = await axios.get(`${API_BASE_URL_EXPIRY}/find-exp/${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching supplier expiry:", error.message);
    throw new Error("Failed to fetch supplier expiry. Please try again.");
  }
};

// ─── Credit notes ─────────────────────────────────────────────────────────────

const getApiErrorMessage = (error, fallback) =>
  error.response?.data?.error || fallback;

/** List credit notes with optional search and date filters. */
export const getCreditNotes = async ({ search = '', from = '', to = '', supplierName = '' } = {}) => {
  try {
    const params = {};
    if (search) params.search = search;
    if (from) params.from = from;
    if (to) params.to = to;
    if (supplierName) params.supplierName = supplierName;

    const response = await axios.get(API_BASE_URL_CREDIT_NOTES, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching credit notes:', error.message);
    throw new Error(getApiErrorMessage(error, 'Failed to fetch credit notes. Please try again.'));
  }
};

/** Get one credit note with its medicine lines. */
export const getCreditNoteById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL_CREDIT_NOTES}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching credit note:', error.message);
    throw new Error(getApiErrorMessage(error, 'Failed to fetch credit note. Please try again.'));
  }
};

/** Create a credit note line. */
export const addCreditNote = async (creditNote) => {
  try {
    const response = await axios.post(API_BASE_URL_CREDIT_NOTES, creditNote);
    return response.data;
  } catch (error) {
    console.error('Error adding credit note:', error.message);
    throw new Error(getApiErrorMessage(error, 'Failed to add credit note. Please try again.'));
  }
};

/** Update an existing credit note line. */
export const updateCreditNote = async (id, creditNote) => {
  try {
    const response = await axios.put(`${API_BASE_URL_CREDIT_NOTES}/${id}`, creditNote);
    return response.data;
  } catch (error) {
    console.error('Error updating credit note:', error.message);
    throw new Error(getApiErrorMessage(error, 'Failed to update credit note. Please try again.'));
  }
};

/** Delete a credit note line. */
export const deleteCreditNote = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL_CREDIT_NOTES}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting credit note:', error.message);
    throw new Error(getApiErrorMessage(error, 'Failed to delete credit note. Please try again.'));
  }
};

// ─── Hidden insights ─────────────────────────────────────────────────────────

export const getInsights = async () => {
  try {
    const response = await axios.get(API_BASE_URL_INSIGHTS);
    return response.data;
  } catch (error) {
    console.error('Error fetching insights:', error.message);
    throw new Error(getApiErrorMessage(error, 'Failed to load insights. Please try again.'));
  }
};

export const getMedicinePurchaseStats = async (search = '') => {
  try {
    const response = await axios.get(`${API_BASE_URL_INSIGHTS}/medicines`, {
      params: { search },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching medicine purchase stats:', error.message);
    throw new Error(
      getApiErrorMessage(error, 'Failed to load medicine purchase stats. Please try again.'),
    );
  }
};

export const getMedicinePriceHistory = async ({ search = '', productId = null, name = '' } = {}) => {
  try {
    const params = {};
    if (search) params.search = search;
    if (productId) params.productId = productId;
    if (name) params.name = name;

    const response = await axios.get(`${API_BASE_URL_INSIGHTS}/price-history`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching medicine price history:', error.message);
    throw new Error(
      getApiErrorMessage(error, 'Failed to load medicine price history. Please try again.'),
    );
  }
};

// ─── Shop settings ───────────────────────────────────────────────────────────

export const getShopSettings = async () => {
  try {
    const response = await axios.get(API_BASE_URL_SETTINGS);
    return response.data;
  } catch (error) {
    console.error('Error fetching shop settings:', error.message);
    throw new Error(getApiErrorMessage(error, 'Failed to load shop settings.'));
  }
};

export const updateShopSettings = async (settings) => {
  try {
    const response = await axios.put(API_BASE_URL_SETTINGS, settings);
    return response.data;
  } catch (error) {
    console.error('Error saving shop settings:', error.message);
    throw new Error(getApiErrorMessage(error, 'Failed to save shop settings.'));
  }
};

// ─── Backups ─────────────────────────────────────────────────────────────────

const API_BASE_URL_BACKUPS = 'http://localhost:8008/api/backups';

export const getBackups = async () => {
  try {
    const response = await axios.get(API_BASE_URL_BACKUPS);
    return response.data;
  } catch (error) {
    console.error('Error fetching backups:', error.message);
    throw new Error(getApiErrorMessage(error, 'Failed to load backups.'));
  }
};

export const createBackup = async () => {
  try {
    const response = await axios.post(API_BASE_URL_BACKUPS);
    return response.data;
  } catch (error) {
    console.error('Error creating backup:', error.message);
    throw new Error(getApiErrorMessage(error, 'Failed to create a backup.'));
  }
};

export const restoreBackup = async (name) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL_BACKUPS}/${encodeURIComponent(name)}/restore`,
    );
    return response.data;
  } catch (error) {
    console.error('Error restoring backup:', error.message);
    throw new Error(getApiErrorMessage(error, 'Failed to prepare the restore.'));
  }
};

export const backupDownloadUrl = (name) =>
  `${API_BASE_URL_BACKUPS}/${encodeURIComponent(name)}/download`;

// ─── Statutory registers ─────────────────────────────────────────────────────

export const getPrescriptionRegister = async ({ schedule = 'H1', from = '', to = '' } = {}) => {
  try {
    const response = await axios.get('http://localhost:8008/api/registers/prescriptions', {
      params: { schedule, from, to },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching prescription register:', error.message);
    throw new Error(
      getApiErrorMessage(error, 'Failed to load the prescription register.'),
    );
  }
};


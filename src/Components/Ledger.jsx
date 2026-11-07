import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { BookOpen, CalendarClock, FileText, Landmark, Loader2, Pencil, Wallet } from 'lucide-react';
import { findSupplierExpiry, getsupplierSql, getBillPaymentSql, getLedgerSummary, getLedgerTransactions, deletePaymentSql, updatePaymentSql, getAllPaymentsSql, loadMorePaymentsSql, deleteExpiryRecord } from '@/services/medicineService.js';
import { generateSupplierStatementPdf } from '@/utils/supplierStatementPdf.js';
import { focusWhenPaletteClosed } from '@/utils/focusWhenPaletteClosed.js';
import { TabContentGeneralLedger, TabContentExpiryLedger, TabContentShowAllPayments, TabContentCreditNotes } from './Tabs/index.js';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from "./ui/label.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

const paymentFieldConfig = {
  date: { label: 'Payment date', type: 'date' },
  invoice: { label: 'Invoice number', type: 'text' },
  supplierName: { label: 'Supplier', type: 'text', fullWidth: true },
  drugLicenseNumber: { label: 'Drug licence number', type: 'text' },
  total: { label: 'Amount (₹)', type: 'number', step: '0.01' },
  type: { label: 'Payment type', type: 'text' },
};

// <input type="date"> uses the local calendar date, so build the string from
// local getters instead of toISOString() (which can shift the day in IST).
const formatInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPaymentQuickRange = (range) => {
  const today = new Date();
  const to = formatInputDate(today);

  if (range === 'today') return { from: to, to };

  if (range === 'week') {
    const monday = new Date(today);
    const offset = (today.getDay() + 6) % 7; // Monday = 0
    monday.setDate(today.getDate() - offset);
    return { from: formatInputDate(monday), to };
  }

  if (range === 'month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: formatInputDate(first), to };
  }

  return null;
};


const Ledger = () => {
  const [allSupplier, setAllSupplier] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [allPayments, setAllPayments] = useState([]);
  const [paymentInvoiceSearch, setPaymentInvoiceSearch] = useState('');
  const [paymentFromDate, setPaymentFromDate] = useState(() => getPaymentQuickRange('today').from);
  const [paymentToDate, setPaymentToDate] = useState(() => getPaymentQuickRange('today').to);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsLoadingMore, setPaymentsLoadingMore] = useState(false);
  const [paymentsHasMore, setPaymentsHasMore] = useState(false);
  const [paymentsError, setPaymentsError] = useState('');
  const [paymentsReloadKey, setPaymentsReloadKey] = useState(0);
  const [filteredBill, setFilteredBill] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsLoadingMore, setTransactionsLoadingMore] = useState(false);
  const [transactionsCursor, setTransactionsCursor] = useState(null);
  const [transactionsHasMore, setTransactionsHasMore] = useState(false);
  const [fileredExpiry, setFilteredExpiry] = useState([]);
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [filteredSupplier, setFilteredSupplier] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [selectedSupplierBalance, setSelectedSupplierBalance] = useState(0);
  const [statementFrom, setStatementFrom] = useState('');
  const [statementTo, setStatementTo] = useState('');
  const [statementSummary, setStatementSummary] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);

  const paymentsRequestRef = useRef(0);
  const transactionsRequestRef = useRef(0);
  const expiryRequestRef = useRef(0);
  const ledgerFocusRef = useRef(null);

  //tabs
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') || 'general-ledger'
  );

  // Sync tab when the URL changes (e.g. palette navigation while already on /ledger)
  useEffect(() => {
    const next = searchParams.get('tab') || 'general-ledger';
    if (next !== activeTab) setActiveTab(next);
  }, [searchParams, activeTab]);

  const focusRequest = location.state?.focusPrimary;
  const requestedFocus = location.state?.focusTarget;

  // The command palette can request a specific search field after navigation.
  useEffect(() => {
    if (!focusRequest || !requestedFocus) return undefined;
    if (ledgerFocusRef.current === focusRequest) return undefined;

    const selectors = {
      'supplier-search': '#supplier-search',
      'payment-invoice-search': '#payment-invoice-search',
    };

    const selector = selectors[requestedFocus];
    if (!selector) return undefined;

    return focusWhenPaletteClosed(selector, {
      onFocused: () => {
        ledgerFocusRef.current = focusRequest;
      },
    });
  }, [focusRequest, requestedFocus, activeTab]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    fetchAllSupplier();
  }, []);

  // Load payments on mount and whenever the invoice/date filters change.
  useEffect(() => {
    // Invalidate any in-flight payment request immediately.
    paymentsRequestRef.current += 1;
    const requestId = paymentsRequestRef.current;

    const timer = setTimeout(async () => {
      setPaymentsLoading(true);
      setPaymentsError('');

      try {
        const response = await getAllPaymentsSql(paymentInvoiceSearch.trim(), {
          from: paymentFromDate,
          to: paymentToDate
        });

        if (requestId !== paymentsRequestRef.current) return;

        const list = Array.isArray(response) ? response : [];
        setAllPayments(list);
        setPaymentsHasMore(list.length >= 50);
      } catch (error) {
        if (requestId === paymentsRequestRef.current) {
          console.error('Error fetching all payments:', error);
          setAllPayments([]);
          setPaymentsHasMore(false);
          setPaymentsError('Failed to load payments. Please try again.');
        }
      } finally {
        if (requestId === paymentsRequestRef.current) {
          setPaymentsLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [paymentInvoiceSearch, paymentFromDate, paymentToDate, paymentsReloadKey]);

  async function loadMore() {
    if (allPayments.length === 0 || paymentsLoadingMore) return;

    const requestId = paymentsRequestRef.current;
    setPaymentsLoadingMore(true);

    try {
      const lastId = allPayments[allPayments.length - 1].id;
      const response = await loadMorePaymentsSql(lastId, paymentInvoiceSearch.trim(), {
        from: paymentFromDate,
        to: paymentToDate
      });

      if (requestId !== paymentsRequestRef.current) return;

      const list = Array.isArray(response) ? response : [];
      setAllPayments((prev) => [...prev, ...list]);
      setPaymentsHasMore(list.length >= 50);
    } catch (error) {
      console.error("Error Fetching More Payments:", error);
    } finally {
      setPaymentsLoadingMore(false);
    }
  }

  const applyPaymentQuickRange = (range) => {
    if (range === 'all') {
      setPaymentFromDate('');
      setPaymentToDate('');
      return;
    }

    if (range === 'clear') {
      const today = getPaymentQuickRange('today');
      setPaymentFromDate(today.from);
      setPaymentToDate(today.to);
      return;
    }

    const next = getPaymentQuickRange(range);
    if (!next) return;

    setPaymentFromDate(next.from);
    setPaymentToDate(next.to);
  };

  const clearPaymentDateFilter = () => {
    const today = getPaymentQuickRange('today');
    setPaymentFromDate(today.from);
    setPaymentToDate(today.to);
  };



  const handleDeletePaymentSql = async (paymentId) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;

    try {
      const response = await deletePaymentSql(paymentId);
      console.log(response);
      // After deletion, you might want to refresh the payments list or update the state accordingly
      setAllPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== paymentId));
      setPaymentsReloadKey((key) => key + 1);
      alert('Payment Deleted Successfully!');

    } catch (error) {
      console.error('Error deleting payment from the database', error);
      alert('Failed To Delete Payment');
    }
  };


  const fetchAllSupplier = async () => {
    setSuppliersLoading(true);
    try {
      const response = await getsupplierSql();
      setAllSupplier(response);
      setFilteredSupplier(response);
    } catch (error) {
      console.error('Error fetching the Supplier:', error);
    } finally {
      setSuppliersLoading(false);
    }
  };

  function handleEditClick(item) {
    setFormData(item)
    setIsOpen(true);
  }

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData((prev) => (
      {
        ...prev,
        [name]: value
      }
    ))
  }

  const handlePaymentEditSave = async () => {
    if (paymentSaving) return;

    setPaymentSaving(true);

    try {
      const response = await updatePaymentSql(
        formData.id,
        formData
      );

      alert("Payment Updated Successfully!");
      setIsOpen(false);
      console.log(response);


      setAllPayments((prevPayments) =>
        prevPayments.map((payment) =>
          payment.id === formData.id
            ? { ...payment, ...formData }
            : payment
        )
      );

      // Re-query so an edited invoice/date also respects the active filter.
      setPaymentsReloadKey((key) => key + 1);


    } catch (error) {
      console.error(error);
      alert("Failed To Update Payment");
    } finally {
      setPaymentSaving(false);
    }
  }





  const handleSearchChange = (e) => {
    const keyword = e.target.value;
    setSearch(keyword);
    const filtered = allSupplier.filter((supplier) =>
      supplier.supplierName.toLowerCase().includes(keyword.toLowerCase())
    );
    setFilteredSupplier(filtered);
  };

  const handleClearSupplierSearch = () => {
    setSearch('');
    setFilteredSupplier(allSupplier);
  };


  const showNameFn = async (name) => {
    const requestId = ++transactionsRequestRef.current;
    setTransactionsLoading(true);
    setTransactionsLoadingMore(false);

    try {
      setSelectedSupplierName(name);
      setStatementSummary(null);
      setFilteredBill([]);
      setTransactionsCursor(null);
      setTransactionsHasMore(false);

      const selectedSupplier = allSupplier.find((item) => item.supplierName === name);

      if (selectedSupplier) {
        setSelectedSupplierBalance(Number(selectedSupplier.supplierBalance));
      }

      const [summary, page] = await Promise.all([
        getLedgerSummary(name),
        getLedgerTransactions(name, { limit: 50 })
      ]);

      if (requestId !== transactionsRequestRef.current) return;

      setStatementSummary(summary || null);
      setFilteredBill(page.transactions || []);
      setTransactionsCursor(page.nextCursor || null);
      setTransactionsHasMore(Boolean(page.hasMore));
    } catch (error) {
      console.error('Error fetching supplier transactions:', error.message);
    } finally {
      if (requestId === transactionsRequestRef.current) {
        setTransactionsLoading(false);
      }
    }
  };

  const loadMoreTransactions = async () => {
    if (!selectedSupplierName || !transactionsCursor || transactionsLoadingMore) return;

    const requestId = transactionsRequestRef.current;
    setTransactionsLoadingMore(true);

    try {
      const page = await getLedgerTransactions(selectedSupplierName, {
        limit: 50,
        cursor: transactionsCursor
      });

      if (requestId !== transactionsRequestRef.current) return;

      setFilteredBill((previous) => [...previous, ...(page.transactions || [])]);
      setTransactionsCursor(page.nextCursor || null);
      setTransactionsHasMore(Boolean(page.hasMore));
    } catch (error) {
      console.error('Error loading older transactions:', error);
    } finally {
      if (requestId === transactionsRequestRef.current) {
        setTransactionsLoadingMore(false);
      }
    }
  };


  const generateStatementPdf = async () => {
    if (!selectedSupplierName) {
      alert('Select a supplier first.');
      return;
    }

    if (!statementFrom || !statementTo) {
      alert('Please select both From and To dates.');
      return;
    }

    if (statementFrom > statementTo) {
      alert('The From date must be before the To date.');
      return;
    }

    setStatementLoading(true);

    try {
      const response = await getBillPaymentSql(selectedSupplierName, {
        from: statementFrom,
        to: statementTo
      });

      const supplier = allSupplier.find((item) => item.supplierName === selectedSupplierName);

      generateSupplierStatementPdf({
        supplierName: selectedSupplierName,
        supplierDrugLn: supplier?.drugLn || '',
        phone: supplier?.phoneNumber || '',
        from: statementFrom,
        to: statementTo,
        transactions: response.transactions || [],
        summary: response.summary || {}
      });
    } catch (error) {
      console.error('Error generating supplier statement:', error);
      alert('Failed to generate the PDF statement.');
    } finally {
      setStatementLoading(false);
    }
  };


  const findExpiryFn = async (name) => {
    const requestId = ++expiryRequestRef.current;
    setExpiryLoading(true);

    try {
      // Set the selected supplier name
      setSelectedSupplierName(name);
      setFilteredExpiry([]);

      // Find the selected supplier from the list of all suppliers
      const selectedSupplier = allSupplier.find((item) => item.supplierName === name);

      if (selectedSupplier) {
        // Set the supplier's balance
        setSelectedSupplierBalance(Number(selectedSupplier.supplierBalance));

        // Fetch the supplier expiry from the server
        const supplierExpiry = await findSupplierExpiry(name);

        if (requestId !== expiryRequestRef.current) return;

        // Set the filtered and sorted expiry
        setFilteredExpiry(supplierExpiry);

      }
    } catch (error) {
      console.error("Error fetching supplier expiry", error.message);
      // Handle the error (e.g., show a toast or alert to the user)
    } finally {
      if (requestId === expiryRequestRef.current) {
        setExpiryLoading(false);
      }
    }
  };

  const handleDeleteExpiryRecord = async (record) => {
    if (!record?.id) return;
    if (!window.confirm(`Delete this expiry record for ${record.supplierName}?`)) return;

    try {
      await deleteExpiryRecord(record.id);
      alert('Expiry record deleted successfully.');
      if (selectedSupplierName) {
        await findExpiryFn(selectedSupplierName);
      }
    } catch (error) {
      console.error('Error deleting expiry record:', error);
      alert(error.message || 'Failed to delete the expiry record.');
    }
  };

  const editFields = Object.keys(formData || {}).filter(
    (key) => key !== 'id' && paymentFieldConfig[key]
  );

  return (
    <main id='main-top-container' className="h-full min-w-0 flex-1 overflow-auto bg-slate-50 p-4 pb-24 md:p-6 lg:pb-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-6 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                <Landmark className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                  Finance
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ledger</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  Track supplier balances, daily payments, account statements and credit notes.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="min-w-[110px] rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Suppliers
                </p>
                <p className="mt-0.5 text-xl font-semibold">
                  {suppliersLoading ? '—' : allSupplier.length}
                </p>
              </div>

            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full gap-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <TabsTrigger
              value="general-ledger"
              className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] justify-start gap-2 rounded-lg px-3 py-2 text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm sm:flex-none sm:basis-auto sm:px-4"
            >
              <BookOpen className="h-4 w-4" />
              General ledger
            </TabsTrigger>
            <TabsTrigger
              value="all-payment"
              className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] justify-start gap-2 rounded-lg px-3 py-2 text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm sm:flex-none sm:basis-auto sm:px-4"
            >
              <Wallet className="h-4 w-4" />
              All payments
            </TabsTrigger>
            <TabsTrigger
              value="expiry-ledger"
              className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] justify-start gap-2 rounded-lg px-3 py-2 text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm sm:flex-none sm:basis-auto sm:px-4"
            >
              <CalendarClock className="h-4 w-4" />
              Expiry ledger
            </TabsTrigger>
            <TabsTrigger
              value="credit-notes"
              className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] justify-start gap-2 rounded-lg px-3 py-2 text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm sm:flex-none sm:basis-auto sm:px-4"
            >
              <FileText className="h-4 w-4" />
              Credit notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general-ledger">
            <TabContentGeneralLedger
              search={search}
              handleSearchChange={handleSearchChange}
              onClearSearch={handleClearSupplierSearch}
              filteredSupplier={filteredSupplier}
              suppliersLoading={suppliersLoading}
              showNameFn={showNameFn}

              selectedSupplierName={selectedSupplierName}
              selectedSupplierBalance={selectedSupplierBalance}
              filteredBill={filteredBill}
              transactionsLoading={transactionsLoading}
              transactionsLoadingMore={transactionsLoadingMore}
              transactionsHasMore={transactionsHasMore}
              onLoadMoreTransactions={loadMoreTransactions}

              statementFrom={statementFrom}
              statementTo={statementTo}
              handleStatementFromChange={(e) => setStatementFrom(e.target.value)}
              handleStatementToChange={(e) => setStatementTo(e.target.value)}
              generateStatementPdf={generateStatementPdf}
              statementLoading={statementLoading}
              statementSummary={statementSummary}
            />
          </TabsContent>

          <TabsContent value="all-payment">
            <TabContentShowAllPayments
              allPayments={allPayments}
              handleDeletePaymentSql={handleDeletePaymentSql}
              handleEditClick={handleEditClick}
              loadMore={loadMore}
              invoiceSearch={paymentInvoiceSearch}
              onInvoiceSearchChange={(e) => setPaymentInvoiceSearch(e.target.value)}
              onClearInvoiceSearch={() => setPaymentInvoiceSearch('')}
              fromDate={paymentFromDate}
              toDate={paymentToDate}
              onFromDateChange={(e) => setPaymentFromDate(e.target.value)}
              onToDateChange={(e) => setPaymentToDate(e.target.value)}
              onQuickRange={applyPaymentQuickRange}
              onClearDateFilter={clearPaymentDateFilter}
              loading={paymentsLoading}
              loadingMore={paymentsLoadingMore}
              hasMore={paymentsHasMore}
              error={paymentsError}
              onRetry={() => setPaymentsReloadKey((key) => key + 1)}
            />
          </TabsContent>

          <TabsContent value="expiry-ledger">
            <TabContentExpiryLedger
              search={search}
              handleSearchChange={handleSearchChange}
              onClearSearch={handleClearSupplierSearch}
              filteredSupplier={filteredSupplier}
              suppliersLoading={suppliersLoading}
              findExpiryFn={findExpiryFn}
              allSupplier={allSupplier}
              selectedSupplierName={selectedSupplierName}
              selectedSupplierBalance={selectedSupplierBalance}
              fileredExpiry={fileredExpiry}
              expiryLoading={expiryLoading}
              onDeleteExpiry={handleDeleteExpiryRecord}
            />
          </TabsContent>

          <TabsContent value="credit-notes">
            <TabContentCreditNotes
              search={search}
              handleSearchChange={handleSearchChange}
              onClearSearch={handleClearSupplierSearch}
              filteredSupplier={filteredSupplier}
              allSupplier={allSupplier}
              suppliersLoading={suppliersLoading}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Pencil className="h-5 w-5" />
              </div>
              <DialogTitle>Edit payment</DialogTitle>
              <DialogDescription>
                Update the payment details below, then save your changes.
              </DialogDescription>
            </DialogHeader>

            {formData.id && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Payment reference: <span className="font-mono text-slate-700">#{formData.id}</span>
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {editFields.map((key) => {
                const config = paymentFieldConfig[key];

                return (
                  <div key={key} className={config.fullWidth ? 'sm:col-span-2' : ''}>
                    <Label htmlFor={`payment-${key}`} className="mb-1.5 block text-xs font-medium text-slate-600">
                      {config.label}
                    </Label>
                    <Input
                      id={`payment-${key}`}
                      name={key}
                      type={config.type}
                      step={config.step}
                      value={formData[key] ?? ''}
                      onChange={handleInputChange}
                      className="bg-slate-50 focus-visible:bg-white"
                    />
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={paymentSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePaymentEditSave}
                disabled={paymentSaving}
                className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                {paymentSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {paymentSaving ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
};

export default Ledger;

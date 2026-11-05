import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, CalendarClock, FileText, Landmark, Loader2, Pencil, Wallet } from 'lucide-react';
import { findSupplierExpiry, getsupplierSql, findPaymentByDateSql, getBillPaymentSql, deletePaymentSql, updatePaymentSql, getAllPaymentsSql, loadMorePaymentsSql } from '@/services/medicineService.js';
import { generateSupplierStatementPdf } from '@/utils/supplierStatementPdf.js';
import { TabContentGeneralLedger, TabContentExpiryLedger, TabContentShowAllPayments } from './Tabs/index.js';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
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


const Ledger = () => {
  const [allSupplier, setAllSupplier] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [allPayments, setAllPayments] = useState([]);
  const [paymentInvoiceSearch, setPaymentInvoiceSearch] = useState('');
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsLoadingMore, setPaymentsLoadingMore] = useState(false);
  const [paymentsHasMore, setPaymentsHasMore] = useState(false);
  const [paymentsError, setPaymentsError] = useState('');
  const [paymentsReloadKey, setPaymentsReloadKey] = useState(0);
  const [filteredBill, setFilteredBill] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [fileredExpiry, setFilteredExpiry] = useState([]);
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [filteredSupplier, setFilteredSupplier] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyPayments, setDailyPayments] = useState([]);
  const [dailyPaymentSummary, setDailyPaymentSummary] = useState(null);
  const [dailyPaymentsLoading, setDailyPaymentsLoading] = useState(false);
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [selectedSupplierBalance, setSelectedSupplierBalance] = useState(0);
  const [statementFrom, setStatementFrom] = useState('');
  const [statementTo, setStatementTo] = useState('');
  const [statementSummary, setStatementSummary] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);

  const dailyPaymentsRequestRef = useRef(0);
  const paymentsRequestRef = useRef(0);
  const transactionsRequestRef = useRef(0);
  const expiryRequestRef = useRef(0);

  //tabs
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') || 'general-ledger'
  );

  // Sync tab when the URL changes (e.g. palette navigation while already on /ledger)
  useEffect(() => {
    const next = searchParams.get('tab');
    if (next && next !== activeTab) setActiveTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  const loadPaymentsForDate = async (date, { showLoading = true } = {}) => {
    const requestId = ++dailyPaymentsRequestRef.current;
    if (showLoading) setDailyPaymentsLoading(true);

    try {
      const response = await findPaymentByDateSql(date);

      // Ignore responses for a date that is no longer selected.
      if (requestId !== dailyPaymentsRequestRef.current) return;

      setDailyPayments(response.payments || []);
      setDailyPaymentSummary(response.summary || null);
    } catch (error) {
      console.error("Error fetching payments by date:", error.message);
    } finally {
      if (requestId === dailyPaymentsRequestRef.current) {
        setDailyPaymentsLoading(false);
      }
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);

    if (!date) {
      // Invalidate any in-flight request.
      dailyPaymentsRequestRef.current += 1;
      setDailyPayments([]);
      setDailyPaymentSummary(null);
      setDailyPaymentsLoading(false);
      return;
    }

    loadPaymentsForDate(date);
  };

  const handleClearDate = () => {
    dailyPaymentsRequestRef.current += 1;
    setSelectedDate('');
    setDailyPayments([]);
    setDailyPaymentSummary(null);
    setDailyPaymentsLoading(false);
  };

  const totalDailyPayment = dailyPaymentSummary
    ? Number(dailyPaymentSummary.total) || 0
    : dailyPayments.reduce((sum, item) => sum + Number(item.total), 0);


  useEffect(() => {
    fetchAllSupplier();
  }, []);

  // Load payments on mount and whenever the invoice search changes.
  useEffect(() => {
    // Invalidate any in-flight payment request immediately.
    paymentsRequestRef.current += 1;
    const requestId = paymentsRequestRef.current;

    const timer = setTimeout(async () => {
      setPaymentsLoading(true);
      setPaymentsError('');

      try {
        const response = await getAllPaymentsSql(paymentInvoiceSearch.trim());

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
  }, [paymentInvoiceSearch, paymentsReloadKey]);

  async function loadMore() {
    if (allPayments.length === 0 || paymentsLoadingMore) return;

    const requestId = paymentsRequestRef.current;
    setPaymentsLoadingMore(true);

    try {
      const lastId = allPayments[allPayments.length - 1].id;
      const response = await loadMorePaymentsSql(lastId, paymentInvoiceSearch.trim());

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




  const handleDeletePaymentSql = async (paymentId) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;

    try {
      const response = await deletePaymentSql(paymentId);
      console.log(response);
      // After deletion, you might want to refresh the payments list or update the state accordingly
      setDailyPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== paymentId));
      setAllPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== paymentId));
      setPaymentsReloadKey((key) => key + 1);
      alert('Payment Deleted Successfully!');

      // Keep the selected date's list and totals in sync.
      if (selectedDate) {
        loadPaymentsForDate(selectedDate, { showLoading: false });
      }
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


      setDailyPayments((prevPayments) =>
        prevPayments.map((payment) =>
          payment.id === formData.id
            ? { ...payment, ...formData }
            : payment
        )
      );

      setAllPayments((prevPayments) =>
        prevPayments.map((payment) =>
          payment.id === formData.id
            ? { ...payment, ...formData }
            : payment
        )
      );

      // Re-query so an edited invoice/date also respects the active filter.
      setPaymentsReloadKey((key) => key + 1);

      // Keep the selected date's list and totals in sync.
      if (selectedDate) {
        loadPaymentsForDate(selectedDate, { showLoading: false });
      }

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

    try {
      setSelectedSupplierName(name);
      setStatementSummary(null);
      setFilteredBill([]);

      const selectedSupplier = allSupplier.find((item) => item.supplierName === name);

      if (selectedSupplier) {
        setSelectedSupplierBalance(Number(selectedSupplier.supplierBalance));
      }

      const response = await getBillPaymentSql(name);

      if (requestId !== transactionsRequestRef.current) return;

      setFilteredBill(response.transactions || []);
      setStatementSummary(response.summary || null);
    } catch (error) {
      console.error('Error fetching supplier transactions:', error.message);
      // Handle the error (e.g., show a toast or alert to the user)
    } finally {
      if (requestId === transactionsRequestRef.current) {
        setTransactionsLoading(false);
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
                  Track supplier balances, daily payments, account statements and expiry credits.
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

              selectedDate={selectedDate}
              handleDateChange={handleDateChange}
              onClearDate={handleClearDate}
              dailyPayments={dailyPayments}
              dailyPaymentsLoading={dailyPaymentsLoading}
              dailyPaymentSummary={dailyPaymentSummary}
              totalDailyPayment={totalDailyPayment}
              handleDeletePaymentSql={handleDeletePaymentSql}
              handleEditClick={handleEditClick}

              selectedSupplierName={selectedSupplierName}
              selectedSupplierBalance={selectedSupplierBalance}
              filteredBill={filteredBill}
              transactionsLoading={transactionsLoading}

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
            />
          </TabsContent>

          <TabsContent value="credit-notes">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FileText className="h-6 w-6" />
              </div>
              <Badge variant="secondary" className="mt-4 bg-slate-100 text-slate-600">
                No records
              </Badge>
              <h2 className="mt-3 text-lg font-semibold text-slate-900">Credit notes</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Supplier return credit notes will appear here once they are recorded.
              </p>
            </div>
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

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  Boxes,
  PackageCheck,
  PackageX,
  Package,
  ReceiptText,
  Search,
  FileText,
  CalendarDays,
  Loader2,
  Truck,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  adjustMedicineStock,
  deleteMedicine,
  updateMedicine,
  fetchBillsProductsSql,
  getBillSuppliers,
  deleteBillSql,
  getAllMedicines,
  findmedicineByName,
} from '../services/medicineService.js';
import { Input } from './ui/input';
import { Badge } from './ui/badge.jsx';
import './inventory.css';
import TableData from './TableData.jsx';
import EditPurchaseBillDialog from './EditPurchaseBillDialog.jsx';
import { Button } from './ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
  TableFooter,
} from './ui/table.jsx';
import { focusWhenPaletteClosed } from '../utils/focusWhenPaletteClosed.js';

// How many bills to show when a supplier accordion is opened / "Load more" is clicked.
const PURCHASE_BILL_PAGE_SIZE = 5;

function Inventory() {
  // ----- Medicines state -----
  const [medicines, setMedicines] = useState([]);
  const [filterMedicine, setFilterMedicine] = useState([]);
  const [medicineSearch, setMedicineSearch] = useState('');

  // ----- Purchases state -----
  const [billSuppliers, setBillSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState('');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [openSupplier, setOpenSupplier] = useState('');
  const [deletingBillId, setDeletingBillId] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  // Per-supplier paginated bills: { [supplierName]: { bills, total, hasMore, ... } }
  const [supplierBills, setSupplierBills] = useState({});

  // ----- Edit dialog state -----
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [formData, setFormData] = useState({});
  const [updateSaving, setUpdateSaving] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // ----- Stock adjustment dialog state -----
  const [adjustingMedicine, setAdjustingMedicine] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: '', reason: '' });
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  //tab 
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'all-product');

  useEffect(() => {
    const next = searchParams.get('tab');
    if (next && next !== activeTab) setActiveTab(next);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const requested = location.state?.focusTarget;

    if (requested === 'inventory-search' && activeTab !== 'all-product') return undefined;
    if (requested === 'inventory-purchase-search' && activeTab !== 'all-purchase') return undefined;

    const selector =
      requested === 'inventory-purchase-search' ||
      (!requested && activeTab === 'all-purchase')
        ? '#inventory-purchase-search'
        : '#inventory-product-search';

    return focusWhenPaletteClosed(selector);
  }, [location.key, location.state?.focusTarget, activeTab]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    // keep URL shareable / back-button friendly
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  // ----- Initial fetch -----
  useEffect(() => {
    fetchMedicinesSql();
  }, []);

  // ----- Medicine search (debounced) -----
  useEffect(() => {
    const run = async () => {
      try {
        if (medicineSearch.trim() === '') {
          setFilterMedicine(medicines.slice(0, 50));
          return;
        }
        const response = await findmedicineByName(medicineSearch);
        // normalize in case service returns { data: [...] }
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
        setFilterMedicine(list);
      } catch (error) {
        console.error('Search error:', error);
        setFilterMedicine([]);
      }
    };
    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [medicineSearch, medicines]);

  // ----- Purchase filters (debounced) -----
  const loadSuppliers = useCallback(async () => {
    setSuppliersLoading(true);
    setSuppliersError('');
    try {
      const response = await getBillSuppliers({
        search: purchaseSearch.trim(),
        date: purchaseDate,
        invoice: invoiceSearch.trim(),
      });
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setBillSuppliers(list);
      return list;
    } catch (error) {
      console.error('Error fetching purchase suppliers:', error);
      setBillSuppliers([]);
      setSuppliersError('Could not load suppliers. Please try again.');
      return [];
    } finally {
      setSuppliersLoading(false);
    }
  }, [purchaseSearch, purchaseDate, invoiceSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Filters changed: drop previously loaded bills and collapse any open accordion.
      setSupplierBills({});
      setOpenSupplier('');
      loadSuppliers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadSuppliers]);

  const clearPurchaseFilters = () => {
    setPurchaseSearch('');
    setInvoiceSearch('');
    setPurchaseDate('');
  };

  // ----- Bills for a supplier (paged, 3 at a time) -----
  const loadSupplierBills = async (supplierName, { reset = false } = {}) => {
    const existing = supplierBills[supplierName];
    const offset = reset ? 0 : (existing?.bills?.length ?? 0);

    if (!reset && (!existing || existing.loading || existing.loadingMore || !existing.hasMore)) {
      return;
    }

    setSupplierBills((prev) => ({
      ...prev,
      [supplierName]: {
        bills: reset ? [] : (prev[supplierName]?.bills ?? []),
        total: reset ? 0 : (prev[supplierName]?.total ?? 0),
        hasMore: reset ? false : (prev[supplierName]?.hasMore ?? false),
        loading: reset,
        loadingMore: !reset,
        loaded: false,
        error: '',
      },
    }));

    try {
      const response = await fetchBillsProductsSql({
        supplierName,
        limit: PURCHASE_BILL_PAGE_SIZE,
        offset,
        date: purchaseDate,
        invoice: invoiceSearch.trim(),
      });

      const list = Array.isArray(response?.bills)
        ? response.bills
        : Array.isArray(response)
          ? response
          : [];
      const total = Number(response?.total ?? (offset + list.length));
      const hasMore = typeof response?.hasMore === 'boolean'
        ? response.hasMore
        : offset + list.length < total;

      setSupplierBills((prev) => {
        const previousBills = prev[supplierName]?.bills ?? [];
        const seen = new Set(previousBills.map((bill) => bill.id));
        const merged = reset
          ? list
          : [...previousBills, ...list.filter((bill) => !seen.has(bill.id))];

        return {
          ...prev,
          [supplierName]: {
            bills: merged,
            total,
            hasMore,
            loading: false,
            loadingMore: false,
            loaded: true,
            error: '',
          },
        };
      });
    } catch (error) {
      console.error('Error fetching bills for supplier:', error);
      setSupplierBills((prev) => ({
        ...prev,
        [supplierName]: {
          ...(prev[supplierName] || { bills: [], total: 0, hasMore: false }),
          loading: false,
          loadingMore: false,
          loaded: true,
          error: 'Could not load bills for this supplier.',
        },
      }));
    }
  };

  // Single accordion root -> opening one supplier automatically closes the previous one.
  const handleSupplierToggle = (value) => {
    setOpenSupplier(value);
    const state = supplierBills[value];
    if (value && !state?.loaded && !state?.loading) {
      loadSupplierBills(value, { reset: true });
    }
  };

  // ----- Fetch medicines (normalized to array) -----
  const fetchMedicinesSql = async () => {
    try {
      const response = await getAllMedicines();
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setMedicines(list);
      setFilterMedicine(list.slice(0, 50));
    } catch (error) {
      console.error('Error fetching Sql medicines:', error);
    }
  };

  // ----- Void a purchase bill and reverse its stock when possible -----
  const handleDeleteBill = async (supplierName, bill) => {
    const label = bill.invoice || `#${bill.id}`;
    const productCount = bill.products?.length ?? 0;

    const confirmed = window.confirm(
      `Void bill ${label} and reverse stock for ${productCount} medicine line(s)?\n\nVoiding only works while all purchased units are still in stock. The bill stays in history as a voided record.`
    );

    if (!confirmed || deletingBillId !== null) return;

    setDeletingBillId(bill.id);

    try {
      await deleteBillSql(bill.id);

      // Refresh the All Products tab because its rows come from bill_products.
      await fetchMedicinesSql();

      const updatedSuppliers = await loadSuppliers();
      const supplierStillExists = updatedSuppliers.some(
        (supplier) => supplier.supplierName === supplierName
      );

      if (supplierStillExists) {
        // Reload from the first page so the gap left by the deleted bill is filled.
        await loadSupplierBills(supplierName, { reset: true });
      } else {
        setOpenSupplier('');
        setSupplierBills((prev) => {
          const next = { ...prev };
          delete next[supplierName];
          return next;
        });
      }

      alert(`Bill ${label} voided successfully.`);
    } catch (error) {
      console.error('Error voiding bill:', error);
      alert(
        error?.response?.data?.error
        || 'Failed to void the bill. Please try again.'
      );
    } finally {
      setDeletingBillId(null);
    }
  };

  // ----- Refresh the views after a purchase bill is edited -----
  const handleBillUpdated = async ({ supplierName }) => {
    // Medicine rows come from bill_products, so refresh All Products too.
    await fetchMedicinesSql();

    const updatedSuppliers = await loadSuppliers();
    const supplierStillExists = updatedSuppliers.some(
      (supplier) => supplier.supplierName === supplierName
    );

    if (supplierStillExists) {
      // Reload from the first page so invoice/date/rate changes are reflected.
      await loadSupplierBills(supplierName, { reset: true });
    } else {
      setOpenSupplier('');
      setSupplierBills((prev) => {
        const next = { ...prev };
        delete next[supplierName];
        return next;
      });
    }
  };

  // ----- Deactivate (soft delete) -----
  const handleDelete = async (id) => {
    if (!window.confirm(
      'Deactivate this inventory batch?\n\nIt will be hidden from inventory and billing, but historical purchase and sales records are preserved.'
    )) return;
    try {
      await deleteMedicine(id);
      setMedicines((prev) => prev.filter((m) => m.id !== id));
      setFilterMedicine((prev) => prev.filter((m) => m.id !== id));
      alert('Medicine deactivated successfully.');
    } catch (error) {
      console.error('Error deactivating medicine:', error);
      alert(error?.response?.data?.error || 'Failed to deactivate medicine.');
    }
  };

  // ----- Edit -----
  const handleEditClick = (medicine) => {
    setSelectedMedicine(medicine);
    setUpdateError('');
    setUpdateSaving(false);
    // Prefill every editable field so the dialog always shows all details.
    setFormData({
      name: medicine?.name ?? '',
      category: medicine?.category ?? '',
      supplier: medicine?.supplier ?? '',
      batchNumber: medicine?.batchNumber ?? '',
      expiryDate: medicine?.expiryDate ?? '',
      stock: medicine?.stock ?? '',
      unitPrice: medicine?.unitPrice ?? '',
      mrp: medicine?.mrp ?? '',
      discount: medicine?.discount ?? '',
      gstPercentage: medicine?.gstPercentage ?? '',
      salts: Array.isArray(medicine?.salts) ? medicine.salts : [],
    });
    setIsOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaltsChange = (salts) => {
    setFormData((prev) => ({ ...prev, salts: Array.isArray(salts) ? salts : [] }));
  };

  const handleUpdate = async () => {
    if (!selectedMedicine) return;

    if (!String(formData.name ?? '').trim()) {
      setUpdateError('Medicine name is required.');
      return;
    }

    // Quantity is intentionally not sent here. Stock changes go through the
    // audited "Adjust stock" action so they can never be confused with a
    // purchase-history edit.
    const payload = {
      name: String(formData.name ?? '').trim(),
      category: String(formData.category ?? '').trim(),
      supplier: String(formData.supplier ?? '').trim(),
      batchNumber: String(formData.batchNumber ?? '').trim(),
      expiryDate: String(formData.expiryDate ?? '').trim(),
      unitPrice: Number(formData.unitPrice) || 0,
      mrp: Number(formData.mrp) || 0,
      discount: Number(formData.discount) || 0,
      gstPercentage: Number(formData.gstPercentage) || 0,
      // Optional: [] clears the composition, and a populated list replaces it.
      salts: Array.isArray(formData.salts) ? formData.salts : [],
    };

    setUpdateSaving(true);
    setUpdateError('');

    try {
      const response = await updateMedicine(selectedMedicine.id, payload);
      const saved = response?.medicine ?? { ...selectedMedicine, ...payload };

      const merge = (list) =>
        list.map((m) => (m.id === selectedMedicine.id ? { ...m, ...saved } : m));
      setMedicines(merge);
      setFilterMedicine(merge);

      setIsOpen(false);
      setSelectedMedicine(null);
      setFormData({});
    } catch (error) {
      console.error('Error updating medicine:', error);
      setUpdateError(
        error?.response?.data?.error || 'Failed to update medicine. Please try again.'
      );
    } finally {
      setUpdateSaving(false);
    }
  };

  // ----- Adjust stock (audited) -----
  const handleAdjustClick = (medicine) => {
    setAdjustingMedicine(medicine);
    setAdjustForm({ quantity: medicine?.stock ?? 0, reason: '' });
    setAdjustError('');
    setAdjustSaving(false);
  };

  const handleAdjustSave = async () => {
    if (!adjustingMedicine || adjustSaving) return;

    const quantity = Number(adjustForm.quantity);

    if (!Number.isFinite(quantity) || quantity < 0) {
      setAdjustError('Enter a stock quantity of zero or greater.');
      return;
    }

    setAdjustSaving(true);
    setAdjustError('');

    try {
      const response = await adjustMedicineStock(adjustingMedicine.id, {
        quantity,
        reason: String(adjustForm.reason ?? '').trim() || 'Manual stock adjustment',
      });
      const saved = response?.medicine;

      if (saved) {
        const merge = (list) =>
          list.map((m) => (m.id === saved.id ? { ...m, ...saved } : m));
        setMedicines(merge);
        setFilterMedicine(merge);
      }

      setAdjustingMedicine(null);
      setAdjustForm({ quantity: '', reason: '' });
      alert('Stock adjusted successfully.');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setAdjustError(
        error?.response?.data?.error
        || 'Failed to adjust stock. Please try again.'
      );
    } finally {
      setAdjustSaving(false);
    }
  };

  // ----- Group purchases by supplier (defensive) -----
  const hasPurchaseFilters =
    purchaseSearch.trim() !== '' ||
    invoiceSearch.trim() !== '' ||
    purchaseDate !== '';

  return (
    <main className="h-full min-w-0 flex-1 overflow-auto bg-slate-50 p-4 pb-24 md:p-6 lg:pb-6">
      <div className="mx-auto max-w-[1500px] space-y-5">

        <header className="relative overflow-hidden rounded-2xl border border-slate-300/80 bg-white px-6 py-5 shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-indigo-100/60 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 text-white shadow-md shadow-blue-600/20">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">
                  Stock control
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Inventory</h1>
                <p className="mt-1 max-w-xl text-sm text-slate-500">
                  Track medicines, edit product details and review every purchase bill.
                </p>
              </div>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full gap-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-slate-300/80 bg-white p-1.5 shadow-sm">
            <TabsTrigger
              value="all-product"
              className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] justify-start gap-2 rounded-lg px-3 py-2 text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm sm:flex-none sm:basis-auto sm:px-4"
            >
              <Package className="h-4 w-4" />
              All Products
            </TabsTrigger>
            <TabsTrigger
              value="all-purchase"
              className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] justify-start gap-2 rounded-lg px-3 py-2 text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm sm:flex-none sm:basis-auto sm:px-4"
            >
              <ReceiptText className="h-4 w-4" />
              All Purchases
            </TabsTrigger>
          </TabsList>

          {/* ============== ALL PRODUCTS ============== */}
          <TabsContent value="all-product" className="mt-1">
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                    Catalogue
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                    All products
                  </h2>
                </div>

                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="inventory-product-search"
                    aria-label="Search medicines"
                    className="h-10 rounded-xl border-slate-300/80 bg-white pl-10 text-sm shadow-sm"
                    placeholder="Search medicine name or batch number…"
                    value={medicineSearch}
                    onChange={(e) => setMedicineSearch(e.target.value)}
                  />
                </div>
              </div>

              <TableData
                medicines={filterMedicine}
                handleDelete={handleDelete}
                handleEditClick={handleEditClick}
                handleAdjustClick={handleAdjustClick}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                selectedMedicine={selectedMedicine}
                handleChange={handleChange}
                handleUpdate={handleUpdate}
                formData={formData}
                isSaving={updateSaving}
                error={updateError}
                onSaltsChange={handleSaltsChange}
              />
            </div>
          </TabsContent>

          {/* ============== ALL PURCHASES ============== */}
          <TabsContent value="all-purchase" className="mt-1">
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Purchase history
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  All purchases
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Browse supplier bills, review line items and edit purchase records.
                </p>
              </div>

              <section className="rounded-xl border border-slate-300/80 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="inventory-purchase-search"
                      aria-label="Search purchase suppliers"
                      className="h-10 rounded-xl border-slate-300/80 bg-white pl-10 text-sm shadow-sm"
                      placeholder="Search supplier…"
                      value={purchaseSearch}
                      onChange={(e) => setPurchaseSearch(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="h-10 rounded-xl border-slate-300/80 bg-white pl-10 text-sm shadow-sm"
                      placeholder="Search invoice / bill no.…"
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="h-10 rounded-xl border-slate-300/80 bg-white pl-10 text-sm shadow-sm"
                      type="date"
                      aria-label="Filter bills by date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500">
                    {suppliersLoading ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading suppliers…
                      </span>
                    ) : (
                      `${billSuppliers.length} supplier${billSuppliers.length === 1 ? '' : 's'} found`
                    )}
                  </p>

                  {hasPurchaseFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearPurchaseFilters}
                      className="h-8 border-slate-300/80 bg-white text-slate-600 hover:bg-slate-50"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </section>

              {suppliersError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {suppliersError}
                </div>
              )}

              {!suppliersLoading && !suppliersError && billSuppliers.length === 0 && (
                <div className="rounded-xl border border-slate-300/80 bg-white px-6 py-14 text-center shadow-sm">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">No purchases found</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Try adjusting the supplier, invoice or date filters.
                  </p>
                </div>
              )}

              {billSuppliers.length > 0 && (
                <Accordion
                  type="single"
                  collapsible
                  value={openSupplier}
                  onValueChange={handleSupplierToggle}
                >
                  {billSuppliers.map((supplier) => {
                    const supplierName = supplier.supplierName;
                    const state = supplierBills[supplierName];
                    const bills = state?.bills ?? [];
                    const billCount = Number(supplier.billCount ?? 0);
                    const totalAmount = Number(supplier.total ?? 0);
                    const isLoaded = state?.loaded ?? false;

                    return (
                      <AccordionItem
                        value={supplierName}
                        key={supplierName}
                        className="mb-3 overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-sm"
                      >
                        <AccordionTrigger className="px-5 py-4 hover:bg-slate-50 hover:no-underline">
                          <div className="flex flex-1 flex-col gap-3 pr-3 text-left md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                <Truck className="h-4 w-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-slate-900">{supplierName}</h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  D.L. {supplier.supplierDrugLn || '—'}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                                Bills: {billCount}
                              </span>
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                                Total: ₹ {totalAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent>
                          <div className="px-5 pb-5">
                            {state?.loading && (
                              <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading bills…
                              </div>
                            )}

                            {!state?.loading && state?.error && (
                              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                                <p className="text-sm text-rose-700">{state.error}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => loadSupplierBills(supplierName, { reset: true })}
                                  className="h-8 border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
                                >
                                  Retry
                                </Button>
                              </div>
                            )}

                            {!state?.loading && !state?.error && isLoaded && bills.length === 0 && (
                              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                No bills found for this supplier.
                              </div>
                            )}

                            {!state?.loading && !state?.error && bills.length > 0 && (
                              <>
                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                  <div className="max-h-[50vh] overflow-auto">
                                    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                                      <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                                        <tr>
                                          <th className="px-4 py-3 font-semibold">Bill no.</th>
                                          <th className="px-3 py-3 font-semibold">Bill date</th>
                                          <th className="px-3 py-3 font-semibold">Products</th>
                                          <th className="px-3 py-3 font-semibold">Type</th>
                                          <th className="px-3 py-3 text-right font-semibold">Total</th>
                                          <th className="px-4 py-3 text-right font-semibold">Actions</th>
                                        </tr>
                                      </thead>

                                      <tbody className="divide-y divide-slate-100">
                                        {bills.map((purchase) => (
                                          <tr key={purchase.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-4 py-3">
                                              <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-sm font-bold text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                                                {purchase.invoice}
                                              </span>
                                            </td>
                                            <td className="px-3 py-3 text-slate-600">
                                              {new Date(purchase.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-3 py-3 text-slate-600">
                                              {purchase.products?.length ?? '-'}
                                            </td>
                                            <td className="px-3 py-3">
                                              <Badge
                                                variant="secondary"
                                                className="bg-blue-50 text-blue-700"
                                              >
                                                {purchase.type}
                                              </Badge>
                                            </td>
                                            <td className="px-3 py-3 text-right font-semibold text-slate-900">
                                              ₹ {Number(purchase.total || 0).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                                <Dialog>
                                                  <DialogTrigger asChild>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      className="h-8 gap-1.5 border-slate-300/80 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                                                    >
                                                      <Eye className="h-3.5 w-3.5" />
                                                      View
                                                    </Button>
                                                  </DialogTrigger>

                                                  <DialogContent className="sm:max-w-[1200px]">
                                                    <DialogHeader>
                                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                          <DialogTitle className="text-lg font-semibold text-slate-900">
                                                            {purchase.supplierName}
                                                          </DialogTitle>
                                                          <DialogDescription className="mt-1 text-xs text-slate-500">
                                                            Purchase bill {purchase.invoice}
                                                          </DialogDescription>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2 text-[11px]">
                                                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-slate-600">
                                                            Bill {purchase.invoice}
                                                          </span>
                                                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                                            D.L. {purchase.supplierDrugLn || '—'}
                                                          </span>
                                                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                                            Contact {purchase.supplierContact || '—'}
                                                          </span>
                                                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                                            {purchase.date}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </DialogHeader>

                                                    <div className="max-h-[60vh] overflow-auto">
                                                      <Table>
                                                        <TableHeader>
                                                          <TableRow>
                                                            <TableHead className="w-[120px]">Name</TableHead>
                                                            <TableHead>Category</TableHead>
                                                            <TableHead>EXP</TableHead>
                                                            <TableHead>Qty</TableHead>
                                                            <TableHead>Free</TableHead>
                                                            <TableHead>Batch no.</TableHead>
                                                            <TableHead className="text-right">Rate</TableHead>
                                                            <TableHead className="text-right">MRP</TableHead>
                                                            <TableHead className="text-right">Discount</TableHead>
                                                            <TableHead className="text-right">GST %</TableHead>
                                                          </TableRow>
                                                        </TableHeader>

                                                        <TableBody>
                                                          {(purchase.products ?? []).map((item, idx) => (
                                                            <TableRow key={idx}>
                                                              <TableCell className="font-medium text-slate-800">
                                                                {item.name}
                                                              </TableCell>
                                                              <TableCell className="text-slate-500">
                                                                {item.category}
                                                              </TableCell>
                                                              <TableCell className="text-slate-500">
                                                                {item.expiryDate}
                                                              </TableCell>
                                                              <TableCell className="text-slate-500">
                                                                {item.stock}
                                                              </TableCell>
                                                              <TableCell className="text-slate-500">
                                                                {item.free ?? 0}
                                                              </TableCell>
                                                              <TableCell>
                                                                <span className="inline-flex rounded-md border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                                                  {item.batchNumber || '—'}
                                                                </span>
                                                              </TableCell>
                                                              <TableCell className="text-right text-slate-600">
                                                                ₹ {Number(item.unitPrice || 0).toFixed(2)}
                                                              </TableCell>
                                                              <TableCell className="text-right text-slate-600">
                                                                ₹ {Number(item.mrp || 0).toFixed(2)}
                                                              </TableCell>
                                                              <TableCell className="text-right text-slate-600">
                                                                {item.discount}%
                                                              </TableCell>
                                                              <TableCell className="text-right text-slate-600">
                                                                {item.gstPercentage}%
                                                              </TableCell>
                                                            </TableRow>
                                                          ))}
                                                        </TableBody>

                                                        <TableFooter>
                                                          <TableRow>
                                                            <TableCell colSpan={3} className="text-slate-500">
                                                              Sub total
                                                            </TableCell>
                                                            <TableCell
                                                              colSpan={7}
                                                              className="text-right text-base font-semibold text-slate-900"
                                                            >
                                                              ₹ {Number(purchase.totalAmount || 0).toFixed(2)}
                                                            </TableCell>
                                                          </TableRow>
                                                          <TableRow>
                                                            <TableCell colSpan={3} className="text-slate-500">
                                                              Sub GST
                                                            </TableCell>
                                                            <TableCell
                                                              colSpan={7}
                                                              className="text-right text-base font-semibold text-slate-900"
                                                            >
                                                              ₹ {Number(purchase.totalGst || 0).toFixed(2)}
                                                            </TableCell>
                                                          </TableRow>
                                                          <TableRow>
                                                            <TableCell colSpan={3} className="text-slate-500">
                                                              Total
                                                            </TableCell>
                                                            <TableCell
                                                              colSpan={7}
                                                              className="text-right text-lg font-bold text-slate-900"
                                                            >
                                                              ₹ {Number(purchase.total || 0).toFixed(2)}
                                                            </TableCell>
                                                          </TableRow>
                                                        </TableFooter>
                                                      </Table>
                                                    </div>

                                                    <DialogFooter />
                                                  </DialogContent>
                                                </Dialog>

                                                <Button
                                                  variant="secondary"
                                                  size="sm"
                                                  onClick={() => setEditingBill(purchase)}
                                                  className="h-8 gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                >
                                                  <Pencil className="h-3.5 w-3.5" />
                                                  Edit
                                                </Button>

                                                <Button
                                                  variant="destructive"
                                                  size="sm"
                                                  disabled={deletingBillId === purchase.id}
                                                  onClick={() => handleDeleteBill(supplierName, purchase)}
                                                  className="h-8 gap-1.5"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                  {deletingBillId === purchase.id ? 'Voiding…' : 'Void'}
                                                </Button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                                  <span className="text-xs text-slate-500">
                                    Showing {bills.length} of {state?.total ?? billCount} bills
                                  </span>
                                  {state?.hasMore ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={state?.loadingMore}
                                      onClick={() => loadSupplierBills(supplierName)}
                                      className="h-8 border-slate-300/80 bg-white text-slate-600 hover:bg-slate-100"
                                    >
                                      {state?.loadingMore ? 'Loading…' : 'Load more bills'}
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-slate-400">All bills loaded</span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog
          open={Boolean(adjustingMedicine)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen && !adjustSaving) {
              setAdjustingMedicine(null);
              setAdjustError('');
            }
          }}
        >
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Adjust stock</DialogTitle>
              <DialogDescription>
                {adjustingMedicine?.name}
                {adjustingMedicine?.batchNumber ? ` · Batch ${adjustingMedicine.batchNumber}` : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Current stock:{' '}
                <span className="font-semibold text-slate-900">
                  {Number(adjustingMedicine?.stock) || 0}
                </span>
              </div>

              <div>
                <label
                  htmlFor="adjust-quantity"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  New stock quantity
                </label>
                <Input
                  id="adjust-quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={adjustForm.quantity}
                  onChange={(event) =>
                    setAdjustForm((prev) => ({ ...prev, quantity: event.target.value }))
                  }
                  className="h-9 border-slate-300/80 bg-white text-sm shadow-none"
                />
              </div>

              <div>
                <label
                  htmlFor="adjust-reason"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  Reason
                </label>
                <Input
                  id="adjust-reason"
                  value={adjustForm.reason}
                  onChange={(event) =>
                    setAdjustForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  placeholder="Physical count, damage, expiry…"
                  className="h-9 border-slate-300/80 bg-white text-sm shadow-none"
                />
              </div>

              <p className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-blue-700">
                Every adjustment is recorded in the stock movement ledger. Zero stock keeps the
                batch visible in inventory.
              </p>

              {adjustError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {adjustError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={adjustSaving}
                onClick={() => setAdjustingMedicine(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={adjustSaving}
                onClick={handleAdjustSave}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {adjustSaving ? 'Adjusting…' : 'Save adjustment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <EditPurchaseBillDialog
          bill={editingBill}
          open={Boolean(editingBill)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setEditingBill(null);
          }}
          onSaved={handleBillUpdated}
        />
      </div>
    </main>
  );
}

export default Inventory;

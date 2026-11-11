import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileDown,
  FileText,
  Loader2,
  PackageSearch,
  Pencil,
  Receipt,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Input } from './ui/input.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.jsx';
import InvoiceEditDialog from './InvoiceEditDialog.jsx';
import {
  deleteSaleInvoice,
  getSaleInvoice,
  searchInvoices,
} from '../services/medicineService.js';
import { buildInvoicePdfPayload, generateInvoicePdf } from '../utils/invoicePdf.js';
import { formatCurrency, formatLedgerDate } from '../utils/ledgerFormat.js';
import { useShopSettings } from '../context/SettingsContext.jsx';

const isoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const invoiceTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const itemCount = (invoice) => (invoice.items ?? invoice.medicines ?? []).length;

const statusLabel = (status) => (status === 'pending' ? 'Pending' : 'Completed');

const statusClass = (status) =>
  status === 'pending'
    ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300';

const SalesStatCard = ({ label, value, hint, icon, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>
        </div>
        <span className={`rounded-lg p-2 ${tones[tone] || tones.blue}`}>
          {React.createElement(icon, { className: 'h-4 w-4' })}
        </span>
      </div>
    </div>
  );
};

const SalesDashboard = () => {
  const { settings: shopSettings } = useShopSettings();
  const today = isoDate(new Date());

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState('');
  const [medicineQuery, setMedicineQuery] = useState('');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [activeRange, setActiveRange] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewInvoice, setViewInvoice] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const timer = setTimeout(async () => {
      try {
        const response = await searchInvoices({
          q: query.trim(),
          medicine: medicineQuery.trim(),
          from: fromDate,
          to: toDate,
        });

        if (!cancelled) setInvoices(Array.isArray(response) ? response : []);
      } catch (requestError) {
        if (!cancelled) {
          console.error('Error fetching invoices:', requestError);
          setInvoices([]);
          setError(
            requestError?.response?.data?.message
            || requestError.message
            || 'Could not load invoices.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query.trim() ? 250 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, medicineQuery, fromDate, toDate, refreshKey]);

  const filteredInvoices = useMemo(
    () =>
      statusFilter === 'all'
        ? invoices
        : invoices.filter((invoice) => invoice.status === statusFilter),
    [invoices, statusFilter],
  );

  const stats = useMemo(() => {
    const total = filteredInvoices.reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
    const completed = filteredInvoices
      .filter((invoice) => invoice.status !== 'pending')
      .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
    const pending = filteredInvoices
      .filter((invoice) => invoice.status === 'pending')
      .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);

    return {
      total,
      completed,
      pending,
      average: filteredInvoices.length ? total / filteredInvoices.length : 0,
      count: filteredInvoices.length,
    };
  }, [filteredInvoices]);

  const setQuickRange = (range) => {
    const end = new Date();
    const start = new Date();

    if (range === 'today') {
      setFromDate(isoDate(end));
      setToDate(isoDate(end));
    } else if (range === '7') {
      start.setDate(start.getDate() - 6);
      setFromDate(isoDate(start));
      setToDate(isoDate(end));
    } else if (range === '30') {
      start.setDate(start.getDate() - 29);
      setFromDate(isoDate(start));
      setToDate(isoDate(end));
    } else {
      setFromDate('');
      setToDate('');
    }

    setActiveRange(range);
  };

  const clearFilters = () => {
    setQuery('');
    setMedicineQuery('');
    setFromDate(today);
    setToDate(today);
    setStatusFilter('all');
    setActiveRange('today');
  };

  const handleMedicineChange = (value) => {
    setMedicineQuery(value);

    // Searching by medicine usually means "show every bill that included it".
    // If the dashboard is still on the default Today range, widen it to all
    // dates so older bills are included.
    if (value.trim() && activeRange === 'today') {
      setFromDate('');
      setToDate('');
      setActiveRange('all');
    }
  };

  const handlePdf = (invoice) => {
    if (!invoice) return;
    generateInvoicePdf(buildInvoicePdfPayload(invoice, shopSettings));
  };

  const openView = (invoice) => {
    setViewInvoice(invoice);
    setViewOpen(true);
  };

  const openEdit = async (invoice) => {
    if (loadingInvoiceId !== null) return;

    if (Number(invoice.stockDeducted) !== 1 || Number(invoice.legacyRecord) === 1) {
      setNotice({
        type: 'error',
        text: 'This legacy invoice cannot be edited because it never deducted stock.',
      });
      return;
    }

    setLoadingInvoiceId(invoice.id);
    setNotice(null);

    try {
      const fresh = await getSaleInvoice(invoice.id);
      setEditInvoice(fresh);
      setEditOpen(true);
    } catch (requestError) {
      setNotice({
        type: 'error',
        text:
          requestError?.response?.data?.message
          || requestError.message
          || 'Could not load the invoice for editing.',
      });
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handleDelete = async (invoice) => {
    if (deletingId !== null) return;

    const label = invoice.invoiceNumber || `#${invoice.id}`;
    const confirmed = window.confirm(
      `Delete invoice ${label} and restore stock for ${itemCount(invoice)} medicine line(s)?\n\n` +
      'The medicines will be returned to the exact batches recorded on this invoice.',
    );

    if (!confirmed) return;

    setDeletingId(invoice.id);
    setNotice(null);

    try {
      const response = await deleteSaleInvoice(invoice.id);
      setInvoices((prev) => prev.filter((item) => item.id !== invoice.id));
      setNotice({ type: 'success', text: response?.message || `Invoice ${label} deleted.` });
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setNotice({
        type: 'error',
        text:
          requestError?.response?.data?.message
          || requestError.message
          || 'Could not delete the invoice.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const hasFilters = Boolean(
    query.trim()
    || medicineQuery.trim()
    || fromDate !== today
    || toDate !== today
    || statusFilter !== 'all',
  );
  const viewedItems = viewInvoice?.items ?? viewInvoice?.medicines ?? [];

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-6 py-6 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                Sales control
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Sales & invoices</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Find any invoice quickly, review its items, edit quantities, or download a fresh PDF.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                Invoices
              </p>
              <p className="mt-1 text-sm font-semibold">{stats.count}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                Sales
              </p>
              <p className="mt-1 text-sm font-semibold">{formatCurrency(stats.total)}</p>
            </div>
            <div className="col-span-2 rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10 sm:col-span-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                Average
              </p>
              <p className="mt-1 text-sm font-semibold">{formatCurrency(stats.average)}</p>
            </div>
          </div>
        </div>
      </header>

      {notice && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded p-0.5 opacity-60 transition hover:opacity-100"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setRefreshKey((key) => key + 1)}
            className="gap-1.5 border-rose-200 bg-white text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(190px,1fr)_minmax(170px,1fr)_140px_140px_150px]">
            <div>
              <label htmlFor="sales-search" className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="sales-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Invoice number, customer or phone"
                  className="border-slate-300 bg-white pl-9 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sales-medicine" className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Medicine
              </label>
              <div className="relative">
                <PackageSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="sales-medicine"
                  value={medicineQuery}
                  onChange={(event) => handleMedicineChange(event.target.value)}
                  placeholder="Medicine name or batch"
                  className="border-slate-300 bg-white pl-9 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sales-from" className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                From
              </label>
              <Input
                id="sales-from"
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  setActiveRange('custom');
                }}
                className="border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="sales-to" className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                To
              </label>
              <Input
                id="sales-to"
                type="date"
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                  setActiveRange('custom');
                }}
                className="border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="sales-status" className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Status
              </label>
              <select
                id="sales-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="all">All statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All dates' },
              { id: 'today', label: 'Today' },
              { id: '7', label: '7 days' },
              { id: '30', label: '30 days' },
            ].map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => setQuickRange(range.id)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  activeRange === range.id
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {range.label}
              </button>
            ))}

            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading}
              className="gap-1.5 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SalesStatCard
          label="Total sales"
          value={formatCurrency(stats.total)}
          hint={`${stats.count} invoice${stats.count === 1 ? '' : 's'} in view`}
          icon={Wallet}
          tone="blue"
        />
        <SalesStatCard
          label="Completed"
          value={formatCurrency(stats.completed)}
          hint="Paid invoices"
          icon={CheckCircle2}
          tone="emerald"
        />
        <SalesStatCard
          label="Pending"
          value={formatCurrency(stats.pending)}
          hint="Awaiting payment"
          icon={Clock3}
          tone="amber"
        />
        <SalesStatCard
          label="Average invoice"
          value={formatCurrency(stats.average)}
          hint="Across the current view"
          icon={TrendingUp}
          tone="violet"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Invoice list
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              {loading
                ? 'Loading invoices…'
                : `${filteredInvoices.length} invoice${filteredInvoices.length === 1 ? '' : 's'} found`}
              {fromDate || toDate ? ` · ${fromDate || 'start'} to ${toDate || today}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />
            Newest first
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-950">
              <tr>
                <th className="px-5 py-3 font-semibold">Invoice</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 text-center font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading invoices…
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14">
                    <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                        <FileText className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        No invoices found
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Try a different invoice number, customer, medicine, status or a wider
                        date range.
                      </p>
                      {hasFilters && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="mt-3 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => openView(invoice)}
                        className="text-left"
                      >
                        <span className="font-mono text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
                          {invoice.invoiceNumber}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-400">
                          {formatLedgerDate(invoice.date ?? invoice.createdAt)}
                          {invoiceTime(invoice.date ?? invoice.createdAt)
                            ? ` · ${invoiceTime(invoice.date ?? invoice.createdAt)}`
                            : ''}
                        </span>
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {invoice.customer?.name || invoice.customerName || 'Walk-in customer'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {invoice.customer?.phone || invoice.customerPhone || 'No phone'}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                      {itemCount(invoice)}
                    </td>

                    <td className="px-4 py-3">
                      <Badge className={`border ${statusClass(invoice.status)}`}>
                        {statusLabel(invoice.status)}
                      </Badge>
                      {(Number(invoice.legacyRecord) === 1 || Number(invoice.stockDeducted) !== 1) && (
                        <span className="mt-1 block text-[10px] font-medium text-slate-400">
                          Legacy · stock not tracked
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(invoice.total)}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="View invoice"
                          onClick={() => openView(invoice)}
                          className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title={
                            Number(invoice.stockDeducted) === 1 && Number(invoice.legacyRecord) !== 1
                              ? 'Edit invoice and adjust stock'
                              : 'Legacy invoices cannot be edited'
                          }
                          onClick={() => openEdit(invoice)}
                          disabled={
                            loadingInvoiceId === invoice.id
                            || Number(invoice.stockDeducted) !== 1
                            || Number(invoice.legacyRecord) === 1
                          }
                          className="h-8 w-8 text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"
                        >
                          {loadingInvoiceId === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Pencil className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Download invoice PDF"
                          onClick={() => handlePdf(invoice)}
                          className="h-8 w-8 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Delete invoice and restore stock"
                          onClick={() => handleDelete(invoice)}
                          disabled={deletingId === invoice.id}
                          className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                        >
                          {deletingId === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[860px]">
          <DialogHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-xl">
                  {shopSettings.shopName || 'Invoice'}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Invoice {viewInvoice?.invoiceNumber || '—'} ·{' '}
                  {formatLedgerDate(viewInvoice?.date ?? viewInvoice?.createdAt)}
                </DialogDescription>
              </div>
              <Badge className={`border ${statusClass(viewInvoice?.status)}`}>
                {statusLabel(viewInvoice?.status)}
              </Badge>
            </div>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Billed to
              </p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {viewInvoice?.customer?.name || 'Walk-in customer'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {viewInvoice?.customer?.phone || 'No phone'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {viewInvoice?.customer?.address || 'No address'}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Invoice details
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Items: <span className="font-semibold">{viewedItems.length}</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                Status: <span className="font-semibold">{statusLabel(viewInvoice?.status)}</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                Time: <span className="font-semibold">{invoiceTime(viewInvoice?.date ?? viewInvoice?.createdAt) || '—'}</span>
              </p>
            </div>
          </div>

          <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Disc.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewedItems.map((item, index) => (
                  <TableRow key={`${item.inventoryItemId ?? item.id}-${index}`}>
                    <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-slate-500">{item.batchNumber || '—'}</TableCell>
                    <TableCell className="text-center text-slate-600 dark:text-slate-300">
                      {item.qty} {item.saleUnit || 'PACK'}
                    </TableCell>
                    <TableCell className="text-right text-slate-600 dark:text-slate-300">
                      {formatCurrency(item.price ?? item.unitPrice ?? item.mrp)}
                    </TableCell>
                    <TableCell className="text-right text-slate-600 dark:text-slate-300">
                      {Number(item.discount) > 0 ? `${Number(item.discount)}%` : '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.lineTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="ml-auto w-full max-w-xs space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-950/50">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatCurrency(viewInvoice?.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Discount</span>
              <span className="font-medium text-rose-600">
                − {formatCurrency(viewInvoice?.totalDiscount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>GST</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                + {formatCurrency(viewInvoice?.totalGst)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900 dark:border-slate-700 dark:text-slate-100">
              <span>Grand total</span>
              <span>{formatCurrency(viewInvoice?.total)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewOpen(false)}
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Close
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setViewOpen(false);
                  openEdit(viewInvoice);
                }}
                disabled={
                  !viewInvoice
                  || Number(viewInvoice.stockDeducted) !== 1
                  || Number(viewInvoice.legacyRecord) === 1
                }
                className="gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Pencil className="h-4 w-4" />
                Edit invoice
              </Button>
              <Button
                type="button"
                onClick={() => handlePdf(viewInvoice)}
                className="gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <FileDown className="h-4 w-4" />
                Generate PDF
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceEditDialog
        invoice={editInvoice}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => {
          setEditOpen(false);
          setNotice({ type: 'success', text: 'Invoice updated and stock adjusted.' });
          setRefreshKey((key) => key + 1);
        }}
      />
    </div>
  );
};

export default SalesDashboard;

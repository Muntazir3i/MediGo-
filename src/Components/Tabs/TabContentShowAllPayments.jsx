import React from 'react';
import {
    CalendarDays,
    CircleDollarSign,
    Loader2,
    Pencil,
    ReceiptText,
    RotateCcw,
    Search,
    Trash2,
    Wallet,
    X,
} from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Input } from '../ui/input.jsx';
import { formatCurrency, formatLedgerDate, getInitials } from '../../utils/ledgerFormat.js';

const formatInputDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const quickRangeBounds = (range) => {
    const today = new Date();
    const to = formatInputDate(today);

    if (range === 'today') return { from: to, to };

    if (range === 'week') {
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        return { from: formatInputDate(monday), to };
    }

    if (range === 'month') {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: formatInputDate(first), to };
    }

    return null;
};

const QUICK_RANGES = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
];

const TabContentShowAllPayments = ({
    allPayments,
    handleDeletePaymentSql,
    handleEditClick,
    loadMore,
    invoiceSearch = '',
    onInvoiceSearchChange,
    onClearInvoiceSearch,
    fromDate = '',
    toDate = '',
    onFromDateChange,
    onToDateChange,
    onQuickRange,
    onClearDateFilter,
    loading = false,
    loadingMore = false,
    hasMore = false,
    error = '',
    onRetry,
}) => {
    const loadedTotal = allPayments.reduce(
        (sum, payment) => sum + (Number(payment.total) || 0),
        0
    );

    const hasDateFilter = Boolean(fromDate || toDate);

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">All payments</h2>
                            <p className="mt-0.5 text-sm text-slate-500">
                                Search by invoice or narrow the list to a date range.
                            </p>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:w-auto">
                        <div className="relative min-w-0 flex-1 sm:w-80">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="payment-invoice-search"
                                aria-label="Search payments by invoice"
                                className="bg-slate-50 pl-9 pr-9 focus-visible:bg-white"
                                placeholder="Search by invoice number"
                                value={invoiceSearch}
                                onChange={onInvoiceSearchChange}
                            />
                            {invoiceSearch && (
                                <button
                                    type="button"
                                    onClick={onClearInvoiceSearch}
                                    aria-label="Clear invoice search"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {loading && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Searching…
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            Date range
                        </span>

                        <Input
                            type="date"
                            aria-label="Payment start date"
                            value={fromDate}
                            max={toDate || undefined}
                            onChange={onFromDateChange}
                            className="h-9 w-[145px] bg-white text-sm shadow-none"
                        />
                        <span className="text-xs text-slate-400">to</span>
                        <Input
                            type="date"
                            aria-label="Payment end date"
                            value={toDate}
                            min={fromDate || undefined}
                            onChange={onToDateChange}
                            className="h-9 w-[145px] bg-white text-sm shadow-none"
                        />

                        <div className="flex flex-wrap items-center gap-1.5">
                            {QUICK_RANGES.map((range) => {
                                const bounds = quickRangeBounds(range.id);
                                const active =
                                    Boolean(bounds) &&
                                    bounds.from === fromDate &&
                                    bounds.to === toDate;

                                return (
                                    <Button
                                        key={range.id}
                                        type="button"
                                        variant={active ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => onQuickRange?.(range.id)}
                                        className={
                                            active
                                                ? 'h-8 bg-slate-900 px-2.5 text-xs text-white hover:bg-slate-800'
                                                : 'h-8 border-slate-200 bg-white px-2.5 text-xs text-slate-600 hover:bg-slate-50'
                                        }
                                    >
                                        {range.label}
                                    </Button>
                                );
                            })}

                            {hasDateFilter && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClearDateFilter}
                                    className="h-8 gap-1 px-2 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {allPayments.length > 0 && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                            <CircleDollarSign className="h-3.5 w-3.5 text-emerald-500" />
                            {allPayments.length} loaded · {formatCurrency(loadedTotal)}
                        </p>
                    )}
                </div>
            </div>

            {loading && (
                <div className="space-y-3 p-5">
                    {[0, 1, 2, 3, 4].map((item) => (
                        <div key={item} className="animate-pulse rounded-lg border border-slate-100 p-4">
                            <div className="h-4 w-1/2 rounded bg-slate-100" />
                            <div className="mt-2 h-3 w-1/4 rounded bg-slate-100" />
                        </div>
                    ))}
                </div>
            )}

            {!loading && error && (
                <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="rounded-full bg-rose-50 p-3 text-rose-500">
                        <ReceiptText className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-800">Could not load payments</p>
                    <p className="mt-1 max-w-sm text-sm text-slate-500">{error}</p>
                    {onRetry && (
                        <Button variant="outline" className="mt-4" onClick={onRetry}>
                            Try again
                        </Button>
                    )}
                </div>
            )}

            {!loading && !error && allPayments.length > 0 && (
                <div className="max-h-[55vh] overflow-auto">
                    <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-5 py-3 font-semibold">#</th>
                                <th className="px-5 py-3 font-semibold">Supplier</th>
                                <th className="px-5 py-3 font-semibold">Invoice</th>
                                <th className="px-5 py-3 font-semibold">Date</th>
                                <th className="px-5 py-3 text-right font-semibold">Amount</th>
                                <th className="px-5 py-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allPayments.map((item, index) => (
                                <tr key={item.id ?? index} className="transition hover:bg-slate-50/80">
                                    <td className="px-5 py-3 text-xs font-medium text-slate-400">
                                        {index + 1}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                                                {getInitials(item.supplierName)}
                                            </div>
                                            <span className="max-w-[260px] truncate font-semibold text-slate-900">
                                                {item.supplierName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                                            {item.invoice || '—'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                                        {formatLedgerDate(item.date)}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-emerald-700">
                                        {formatCurrency(item.total)}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex justify-end gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditClick(item)}
                                                className="h-8 gap-1 px-2.5 text-xs"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeletePaymentSql(item.id)}
                                                className="h-8 gap-1 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && !error && allPayments.length === 0 && (
                <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="rounded-full bg-slate-100 p-3 text-slate-400">
                        <ReceiptText className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-800">No payments found</p>
                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                        {invoiceSearch
                            ? `There are no payments for invoice “${invoiceSearch}”.`
                            : hasDateFilter
                                ? `No payments recorded between ${fromDate || 'the beginning'} and ${toDate || 'today'}.`
                                : 'No payment entries are available yet.'}
                    </p>
                    {(invoiceSearch || hasDateFilter) && (
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => {
                                onClearInvoiceSearch?.();
                                onClearDateFilter?.();
                            }}
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
            )}

            {!loading && !error && allPayments.length > 0 && hasMore && (
                <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                    <p className="text-xs text-slate-500">
                        Showing {allPayments.length} loaded payment{allPayments.length === 1 ? '' : 's'}
                        {invoiceSearch ? ` for invoice “${invoiceSearch}”` : ''}
                        {hasDateFilter
                            ? ` between ${fromDate || 'the beginning'} and ${toDate || 'today'}`
                            : ''}
                    </p>
                    <Button
                        className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
                        size="sm"
                        onClick={loadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loadingMore ? 'Loading…' : 'Load more'}
                    </Button>
                </div>
            )}
        </section>
    );
};

export default TabContentShowAllPayments;

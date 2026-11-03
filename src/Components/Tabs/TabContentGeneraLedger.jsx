import React from 'react';
import {
    ArrowDownRight,
    ArrowUpRight,
    CalendarDays,
    CircleDollarSign,
    FileDown,
    Landmark,
    Pencil,
    ReceiptText,
    Trash2,
    Wallet,
    X,
} from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Input } from '../ui/input.jsx';
import LedgerSupplierList from '../LedgerSupplierList.jsx';
import { formatCurrency, formatLedgerDate } from '../../utils/ledgerFormat.js';

const summaryToneClasses = {
    slate: 'bg-slate-100 text-slate-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
};

const SummaryTile = ({ label, value, icon, tone = 'slate' }) => (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className={`rounded-lg p-2 ${summaryToneClasses[tone] || summaryToneClasses.slate}`}>
            {React.createElement(icon, { className: 'h-4 w-4' })}
        </div>
        <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-1 truncate text-lg font-bold text-slate-900">{value}</p>
        </div>
    </div>
);

const TabContentGeneraLedger = ({
    search,
    handleSearchChange,
    onClearSearch,
    filteredSupplier,
    showNameFn,
    suppliersLoading = false,

    selectedDate,
    handleDateChange,
    onClearDate,
    dailyPayments,
    dailyPaymentsLoading,
    dailyPaymentSummary,
    totalDailyPayment,
    handleEditClick,
    handleDeletePaymentSql,

    selectedSupplierName,
    selectedSupplierBalance,
    filteredBill,
    transactionsLoading = false,

    statementFrom,
    statementTo,
    handleStatementFromChange,
    handleStatementToChange,
    generateStatementPdf,
    statementLoading,
    statementSummary,
}) => {
    const dailyCount = dailyPaymentSummary?.count ?? dailyPayments.length;

    return (
        <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
                <LedgerSupplierList
                    title="Supplier directory"
                    description="Search and open a supplier account."
                    actionLabel="View ledger"
                    footerText={`${filteredSupplier.length} supplier${filteredSupplier.length === 1 ? '' : 's'} shown`}
                    suppliers={filteredSupplier}
                    search={search}
                    onSearchChange={handleSearchChange}
                    onClearSearch={onClearSearch}
                    selectedSupplierName={selectedSupplierName}
                    onSelect={showNameFn}
                    loading={suppliersLoading}
                />

                <section className="flex h-[430px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600">
                                    <CalendarDays className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">Daily payments</h2>
                                    <p className="mt-0.5 text-sm text-slate-500">
                                        Review payments recorded on a specific date.
                                    </p>
                                </div>
                            </div>
                            {selectedDate && (
                                <Badge variant="secondary" className="shrink-0 bg-violet-50 text-violet-700">
                                    {dailyCount} payment{dailyCount === 1 ? '' : 's'}
                                </Badge>
                            )}
                        </div>

                        <div className="mt-4">
                            <div className="flex items-end gap-2">
                                <div className="min-w-0 flex-1">
                                    <label htmlFor="ledger-payment-date" className="mb-1 block text-xs font-medium text-slate-500">
                                        Payment date
                                    </label>
                                    <Input
                                        id="ledger-payment-date"
                                        type="date"
                                        value={selectedDate}
                                        onChange={handleDateChange}
                                        className="bg-slate-50 focus-visible:bg-white"
                                    />
                                </div>
                                {selectedDate && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClearDate}
                                        className="mb-0.5 gap-1 text-slate-500 hover:text-slate-800"
                                    >
                                        <X className="h-4 w-4" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-5">
                        {!selectedDate && (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <div className="rounded-full bg-slate-100 p-3 text-slate-400">
                                    <CalendarDays className="h-6 w-6" />
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-800">Choose a date</p>
                                <p className="mt-1 max-w-xs text-sm text-slate-500">
                                    Select a payment date to see the suppliers and amounts paid.
                                </p>
                            </div>
                        )}

                        {selectedDate && dailyPaymentsLoading && (
                            <div className="space-y-3">
                                {[0, 1, 2].map((item) => (
                                    <div key={item} className="animate-pulse rounded-lg border border-slate-100 p-3">
                                        <div className="h-4 w-2/3 rounded bg-slate-100" />
                                        <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedDate && !dailyPaymentsLoading && dailyPayments.length > 0 && (
                            <>
                                <div className="mb-3 grid grid-cols-2 gap-2">
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            Payments
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-slate-900">{dailyCount}</p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-50 p-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                                            Total paid
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-emerald-800">
                                            {formatCurrency(totalDailyPayment)}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {dailyPayments.map((item, index) => (
                                        <div
                                            key={item.id ?? index}
                                            className="rounded-lg border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50/70"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                        {item.supplierName}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        Invoice <span className="font-mono">{item.invoice || '—'}</span>
                                                        <span className="mx-1.5 text-slate-300">•</span>
                                                        #{index + 1}
                                                    </p>
                                                </div>
                                                <p className="whitespace-nowrap text-sm font-bold text-emerald-700">
                                                    {formatCurrency(item.total)}
                                                </p>
                                            </div>

                                            <div className="mt-2 flex justify-end gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditClick(item)}
                                                    className="h-7 gap-1 px-2 text-xs"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeletePaymentSql(item.id)}
                                                    className="h-7 gap-1 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {selectedDate && !dailyPaymentsLoading && dailyPayments.length === 0 && (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <div className="rounded-full bg-slate-100 p-3 text-slate-400">
                                    <ReceiptText className="h-6 w-6" />
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-800">No payments on this date</p>
                                <p className="mt-1 max-w-xs text-sm text-slate-500">
                                    Nothing was recorded on {formatLedgerDate(selectedDate)}.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                                    <Landmark className="h-4 w-4" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900">Account activity</h2>
                                {selectedSupplierName && (
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                        {selectedSupplierName}
                                    </Badge>
                                )}
                            </div>
                            <p className="mt-2 text-sm text-slate-500">
                                {selectedSupplierName
                                    ? `Showing ${filteredBill.length} transaction${filteredBill.length === 1 ? '' : 's'} · Stored balance ${formatCurrency(selectedSupplierBalance)}`
                                    : 'Select a supplier above to view their transaction history and statement.'}
                            </p>
                        </div>

                        {selectedSupplierName && (
                            <div className="flex flex-wrap items-end gap-2">
                                <div>
                                    <label htmlFor="statement-from" className="mb-1 block text-xs font-medium text-slate-500">
                                        From
                                    </label>
                                    <Input
                                        id="statement-from"
                                        type="date"
                                        value={statementFrom}
                                        onChange={handleStatementFromChange}
                                        className="w-40 bg-slate-50 focus-visible:bg-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="statement-to" className="mb-1 block text-xs font-medium text-slate-500">
                                        To
                                    </label>
                                    <Input
                                        id="statement-to"
                                        type="date"
                                        value={statementTo}
                                        onChange={handleStatementToChange}
                                        className="w-40 bg-slate-50 focus-visible:bg-white"
                                    />
                                </div>
                                <Button
                                    onClick={generateStatementPdf}
                                    disabled={statementLoading}
                                    className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    <FileDown className="h-4 w-4" />
                                    {statementLoading ? 'Generating…' : 'Download statement'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {selectedSupplierName && statementSummary && (
                    <div className="grid gap-3 border-b border-slate-100 bg-slate-50/50 p-5 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryTile
                            label="Opening balance"
                            value={formatCurrency(statementSummary.openingBalance)}
                            icon={Wallet}
                            tone="slate"
                        />
                        <SummaryTile
                            label="Total bills"
                            value={formatCurrency(statementSummary.totalBills)}
                            icon={ReceiptText}
                            tone="rose"
                        />
                        <SummaryTile
                            label="Total payments"
                            value={formatCurrency(statementSummary.totalPayments)}
                            icon={CircleDollarSign}
                            tone="emerald"
                        />
                        <SummaryTile
                            label="Closing balance"
                            value={formatCurrency(statementSummary.closingBalance)}
                            icon={Landmark}
                            tone="blue"
                        />
                    </div>
                )}

                {!selectedSupplierName && (
                    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                        <div className="rounded-full bg-slate-100 p-3 text-slate-400">
                            <Landmark className="h-6 w-6" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-800">No supplier selected</p>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            Choose a supplier from the directory to see bills, payments and the running balance.
                        </p>
                    </div>
                )}

                {selectedSupplierName && transactionsLoading && (
                    <div className="space-y-3 p-5">
                        {[0, 1, 2, 3].map((item) => (
                            <div key={item} className="animate-pulse rounded-lg border border-slate-100 p-4">
                                <div className="h-4 w-1/2 rounded bg-slate-100" />
                                <div className="mt-2 h-3 w-1/4 rounded bg-slate-100" />
                            </div>
                        ))}
                    </div>
                )}

                {selectedSupplierName && !transactionsLoading && filteredBill.length > 0 && (
                    <div className="max-h-[45vh] overflow-auto">
                        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Date</th>
                                    <th className="px-5 py-3 font-semibold">Supplier</th>
                                    <th className="px-5 py-3 font-semibold">Type</th>
                                    <th className="px-5 py-3 font-semibold">Invoice</th>
                                    <th className="px-5 py-3 text-right font-semibold">Amount</th>
                                    <th className="px-5 py-3 text-right font-semibold">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredBill.map((bill, index) => {
                                    const isBill = bill.type === 'Bill';

                                    return (
                                        <tr key={`${bill.invoice}-${index}`} className="transition hover:bg-slate-50/80">
                                            <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-700">
                                                {formatLedgerDate(bill.date)}
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">{bill.supplierName}</td>
                                            <td className="px-5 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={isBill
                                                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${isBill ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                    {bill.type}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3 font-mono text-xs text-slate-600">
                                                {bill.invoice || '—'}
                                            </td>
                                            <td className={`whitespace-nowrap px-5 py-3 text-right font-semibold ${
                                                isBill ? 'text-rose-600' : 'text-emerald-700'
                                            }`}>
                                                <span className="inline-flex items-center gap-1">
                                                    {isBill ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                                    {isBill ? '+' : '-'} {formatCurrency(bill.total)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-slate-900">
                                                {formatCurrency(bill.balance)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {selectedSupplierName && !transactionsLoading && filteredBill.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                        <div className="rounded-full bg-slate-100 p-3 text-slate-400">
                            <ReceiptText className="h-6 w-6" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-800">No transactions found</p>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            This supplier has no bills or payments in the ledger.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default TabContentGeneraLedger;

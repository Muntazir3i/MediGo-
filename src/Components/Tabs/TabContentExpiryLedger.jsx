import React from 'react';
import {
    Building2,
    CalendarClock,
    Landmark,
    PackageSearch,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table.jsx';
import LedgerSupplierList from '../LedgerSupplierList.jsx';
import { formatCurrency, formatLedgerDate } from '../../utils/ledgerFormat.js';

const StatCard = ({ label, children, icon, tone = 'slate' }) => {
    const tones = {
        slate: 'bg-slate-100 text-slate-600',
        blue: 'bg-blue-50 text-blue-600',
        rose: 'bg-rose-50 text-rose-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
                <div className={`rounded-lg p-1.5 ${tones[tone] || tones.slate}`}>
                    {React.createElement(icon, { className: 'h-4 w-4' })}
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                </p>
            </div>
            <div className="mt-2">{children}</div>
        </div>
    );
};

const TabContentExpiryLedger = ({
    search,
    handleSearchChange,
    onClearSearch,
    filteredSupplier,
    findExpiryFn,
    allSupplier,
    selectedSupplierName,
    selectedSupplierBalance,
    fileredExpiry,
    expiryLoading = false,
    suppliersLoading = false,
}) => {
    return (
        <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
                <LedgerSupplierList
                    title="Supplier directory"
                    description="Open a supplier to review their expiry records."
                    actionLabel="View expiry"
                    footerText={`${filteredSupplier.length} supplier${filteredSupplier.length === 1 ? '' : 's'} shown`}
                    suppliers={filteredSupplier}
                    search={search}
                    onSearchChange={handleSearchChange}
                    onClearSearch={onClearSearch}
                    selectedSupplierName={selectedSupplierName}
                    onSelect={findExpiryFn}
                    loading={suppliersLoading}
                />

                <section className="flex h-[430px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-start gap-3 border-b border-slate-100 p-5">
                        <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
                            <CalendarClock className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Expiry overview</h2>
                            <p className="mt-0.5 text-sm text-slate-500">
                                Track supplier-related expiry records.
                            </p>
                        </div>
                    </div>

                    <div className="grid flex-1 content-start gap-3 overflow-y-auto p-5 sm:grid-cols-2">
                        <StatCard label="Suppliers" icon={Building2} tone="blue">
                            <p className="text-2xl font-bold text-slate-900">{allSupplier.length}</p>
                        </StatCard>

                        <StatCard label="Expiry records" icon={PackageSearch} tone="rose">
                            <p className="text-2xl font-bold text-slate-900">
                                {selectedSupplierName ? fileredExpiry.length : '—'}
                            </p>
                        </StatCard>

                        <div className="sm:col-span-2">
                            <StatCard label="Selected supplier" icon={Landmark} tone="slate">
                                {selectedSupplierName ? (
                                    <>
                                        <p className="truncate text-sm font-bold text-slate-900">
                                            {selectedSupplierName}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Stored balance {formatCurrency(selectedSupplierBalance)}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-500">
                                        Choose a supplier to see their expiry history.
                                    </p>
                                )}
                            </StatCard>
                        </div>

                        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 sm:col-span-2">
                            Expiry records list returned or expired products linked to the selected supplier.
                            Use the supplier list to switch accounts.
                        </p>
                    </div>
                </section>
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                            <CalendarClock className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Expiry history</h2>
                            <p className="mt-0.5 text-sm text-slate-500">
                                {selectedSupplierName
                                    ? `Showing ${fileredExpiry.length} record${fileredExpiry.length === 1 ? '' : 's'} for ${selectedSupplierName}`
                                    : 'Select a supplier to load expiry records.'}
                            </p>
                        </div>
                    </div>

                    {selectedSupplierName && (
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                            {fileredExpiry.length} record{fileredExpiry.length === 1 ? '' : 's'}
                        </Badge>
                    )}
                </div>

                {!selectedSupplierName && (
                    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                        <div className="rounded-full bg-slate-100 p-3 text-slate-400">
                            <CalendarClock className="h-6 w-6" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-800">No supplier selected</p>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            Pick a supplier from the directory to see their expiry records.
                        </p>
                    </div>
                )}

                {selectedSupplierName && expiryLoading && (
                    <div className="space-y-3 p-5">
                        {[0, 1, 2].map((item) => (
                            <div key={item} className="animate-pulse rounded-lg border border-slate-100 p-4">
                                <div className="h-4 w-1/2 rounded bg-slate-100" />
                                <div className="mt-2 h-3 w-1/4 rounded bg-slate-100" />
                            </div>
                        ))}
                    </div>
                )}

                {selectedSupplierName && !expiryLoading && fileredExpiry.length > 0 && (
                    <div className="max-h-[45vh] overflow-auto">
                        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Date</th>
                                    <th className="px-5 py-3 font-semibold">Supplier</th>
                                    <th className="px-5 py-3 font-semibold">Type</th>
                                    <th className="px-5 py-3 font-semibold">Products</th>
                                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {fileredExpiry.map((bill, index) => (
                                    <tr key={`${bill.date}-${index}`} className="transition hover:bg-slate-50/80">
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-700">
                                            {formatLedgerDate(bill.date)}
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">{bill.supplierName}</td>
                                        <td className="px-5 py-3">
                                            <Badge
                                                variant="outline"
                                                className="border-amber-200 bg-amber-50 text-amber-700"
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                {bill.type}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">
                                            {(bill.products ?? []).length} item{(bill.products ?? []).length === 1 ? '' : 's'}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="h-8 text-xs">
                                                        View details
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[1000px]">
                                                    <DialogHeader>
                                                        <DialogTitle>{bill.supplierName}</DialogTitle>
                                                        <DialogDescription asChild>
                                                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                                                                <span>Date: {formatLedgerDate(bill.date)}</span>
                                                                <span>D.L.: {bill.supplierDrugLn || '—'}</span>
                                                                <span>Contact: {bill.supplierContact || '—'}</span>
                                                            </div>
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-14">No.</TableHead>
                                                                <TableHead>Medicine</TableHead>
                                                                <TableHead>Expiry</TableHead>
                                                                <TableHead>Qty</TableHead>
                                                                <TableHead>Batch</TableHead>
                                                                <TableHead className="text-right">MRP</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {(bill.products ?? []).map((item, productIndex) => (
                                                                <TableRow key={`${item.id ?? item.name}-${productIndex}`}>
                                                                    <TableCell className="text-slate-500">
                                                                        {productIndex + 1}
                                                                    </TableCell>
                                                                    <TableCell className="font-medium text-slate-900">
                                                                        {item.name}
                                                                    </TableCell>
                                                                    <TableCell>{formatLedgerDate(item.expiryDate)}</TableCell>
                                                                    <TableCell>{item.stock}</TableCell>
                                                                    <TableCell className="font-mono text-xs">
                                                                        {item.batchNumber || '—'}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {formatCurrency(item.mrp)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>

                                                    <DialogFooter />
                                                </DialogContent>
                                            </Dialog>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {selectedSupplierName && !expiryLoading && fileredExpiry.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                        <div className="rounded-full bg-slate-100 p-3 text-slate-400">
                            <PackageSearch className="h-6 w-6" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-800">No expiry records</p>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            There are no expiry records for {selectedSupplierName}.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default TabContentExpiryLedger;

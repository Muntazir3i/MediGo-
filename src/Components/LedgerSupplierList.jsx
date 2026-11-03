import React from 'react';
import { Building2, ChevronRight, Search, X } from 'lucide-react';
import { Input } from './ui/input.jsx';
import { Badge } from './ui/badge.jsx';
import { formatCurrency, getInitials } from '../utils/ledgerFormat.js';

const LedgerSupplierList = ({
    title = 'Suppliers',
    description = 'Choose a supplier to view their account.',
    actionLabel = 'View',
    footerText = 'Select a supplier to load their transactions.',
    suppliers = [],
    search,
    onSearchChange,
    onClearSearch,
    selectedSupplierName,
    onSelect,
    loading = false,
}) => {
    return (
        <section className="flex h-[430px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 bg-slate-100 text-slate-600">
                        {suppliers.length}
                    </Badge>
                </div>

                <div className="relative mt-4">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        value={search}
                        onChange={onSearchChange}
                        placeholder="Search suppliers"
                        className="bg-slate-50 pl-9 pr-9 focus-visible:bg-white"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            aria-label="Clear supplier search"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {loading ? (
                    <div className="space-y-3 p-5">
                        {[0, 1, 2, 3, 4].map((item) => (
                            <div key={item} className="flex animate-pulse items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-slate-100" />
                                <div className="flex-1">
                                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                                    <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : suppliers.length > 0 ? (
                    <ul className="divide-y divide-slate-100">
                        {suppliers.map((supplier, index) => {
                            const isSelected = selectedSupplierName === supplier.supplierName;

                            return (
                                <li key={`${supplier.supplierName}-${index}`}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(supplier.supplierName)}
                                        className={`group flex w-full items-center gap-3 px-5 py-3 text-left transition ${
                                            isSelected
                                                ? 'bg-blue-50/80'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                            isSelected
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                                        }`}>
                                            {getInitials(supplier.supplierName)}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className={`truncate text-sm font-semibold ${
                                                isSelected ? 'text-blue-700' : 'text-slate-900'
                                            }`}>
                                                {supplier.supplierName}
                                            </p>
                                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                                                {supplier.drugLn && (
                                                    <span className="max-w-[180px] truncate">D.L. {supplier.drugLn}</span>
                                                )}
                                                
                                            </div>
                                        </div>

                                        <span className="hidden text-xs font-medium text-slate-400 group-hover:text-blue-600 sm:inline">
                                            {actionLabel}
                                        </span>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
                        <div className="rounded-full bg-slate-100 p-3 text-slate-400">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-800">No suppliers found</p>
                        <p className="mt-1 max-w-xs text-sm text-slate-500">
                            Try a different search term or clear the filter.
                        </p>
                    </div>
                )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-2.5 text-xs text-slate-500">
                {loading ? 'Loading suppliers…' : footerText}
            </div>
        </section>
    );
};

export default LedgerSupplierList;

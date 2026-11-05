import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
    ArrowRight,
    BookOpen,
    Boxes,
    CalendarClock,
    CornerDownLeft,
    CreditCard,
    FilePlus2,
    LayoutDashboard,
    PackagePlus,
    PlusCircle,
    Receipt,
    Search,
    Users,
} from 'lucide-react';

const kbdClass =
    'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-slate-200 bg-white px-1 font-sans text-[10px] font-semibold text-slate-500 shadow-[0_1px_0_rgba(15,23,42,0.06)]';

const navigateCommands = [
    {
        id: 'add',
        title: 'Add Section',
        description: 'Record purchases, suppliers, payments and expiry',
        keywords: 'add new purchase item supplier payment expiry create',
        to: '/add',
        icon: PlusCircle,
    },
    {
        id: 'ledger',
        title: 'Ledger',
        description: 'Supplier balances, statements and payments',
        keywords: 'ledger accounts finance supplier balance payment statement',
        to: '/ledger',
        icon: BookOpen,
    },
    {
        id: 'inventory',
        title: 'Inventory',
        description: 'Stock, products and purchase history',
        keywords: 'inventory stock products purchase bills',
        to: '/inventory',
        icon: Boxes,
    },
    {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Sales overview and business insights',
        keywords: 'dashboard home overview sales analytics',
        to: '/',
        icon: LayoutDashboard,
    },
    {
        id: 'billing',
        title: 'Billing',
        description: 'Create invoices and print bills',
        keywords: 'billing invoice sales cart checkout bill',
        to: '/billing',
        icon: Receipt,
    },
];

const actionCommands = [
    {
        id: 'add-item',
        title: 'Add item',
        description: 'Add products to a new purchase bill',
        keywords: 'add item items product medicine purchase bill stock new entry',
        to: '/add?tab=add-purchase',
        icon: PackagePlus,
    },
    {
        id: 'add-payment',
        title: 'Add payment',
        description: 'Record a payment made to a supplier',
        keywords: 'add payment paid supplier invoice record new',
        to: '/add?tab=add-payment',
        icon: CreditCard,
    },
    {
        id: 'add-supplier',
        title: 'Add supplier',
        description: 'Create a new supplier account',
        keywords: 'add supplier vendor party create new',
        to: '/add?tab=add-supplier',
        icon: Users,
    },
    {
        id: 'add-expiry',
        title: 'Add expiry',
        description: 'Record expired or returned stock',
        keywords: 'add expiry expired return stock new',
        to: '/add?tab=add-expiry',
        icon: CalendarClock,
    },
    {
        id: 'new-invoice',
        title: 'Create invoice',
        description: 'Start a new billing invoice',
        keywords: 'create invoice bill sale billing new',
        to: '/billing',
        icon: FilePlus2,
    },
    {
        id: 'all-purchase',
        title: 'View All Purchases',
        description: 'View Purchases From Suppliers',
        keywords: 'view purchases view purchases',
        to: '/inventory?tab=all-purchase',
        icon: FilePlus2,
    },
    {
        id: 'all-payment',
        title: 'View All Payment',
        description: 'View All Payments To Suppliers',
        keywords: 'view payment payment',
        to: '/ledger?tab=all-payment',
        icon: FilePlus2,
    },
];

const CommandRow = ({ item, onSelect }) => {
    const Icon = item.icon;

    return (
        <Command.Item
            value={`${item.title} ${item.description} ${item.keywords}`}
            onSelect={() => onSelect(item.to)}
            className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-900"
        >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition group-data-[selected=true]:border-blue-200 group-data-[selected=true]:bg-blue-600 group-data-[selected=true]:text-white">
                <Icon className="h-4 w-4" />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900 group-data-[selected=true]:text-blue-900">
                    {item.title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500 group-data-[selected=true]:text-blue-700/80">
                    {item.description}
                </span>
            </span>

            <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition group-data-[selected=true]:text-blue-500 group-data-[selected=true]:opacity-100" />
        </Command.Item>
    );
};

const rankItems = (items, query) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    const tokens = normalized.split(/\s+/).filter(Boolean);

    return items
        .map((item, index) => {
            const title = item.title.toLowerCase();
            const haystack = `${title} ${item.description} ${item.keywords}`.toLowerCase();

            if (!tokens.every((token) => haystack.includes(token))) {
                return { item, index, score: -1 };
            }

            let score = 0;
            if (title === normalized) score += 100;
            else if (title.startsWith(normalized)) score += 80;
            else if (title.includes(normalized)) score += 60;

            tokens.forEach((token) => {
                if (title.startsWith(token)) score += 12;
                else if (title.includes(token)) score += 8;
            });

            return { item, index, score };
        })
        .filter(({ score }) => score >= 0)
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map(({ item }) => item);
};

const groupHeadingClass =
    '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-slate-400';

const CommandPalette = ({ open, onOpenChange }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const close = useCallback(() => onOpenChange(false), [onOpenChange]);

    useEffect(() => {
        if (!open) setQuery('');
    }, [open]);

    useEffect(() => {
        const handleShortcut = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                onOpenChange(!open);
                return;
            }

            if (event.key === 'Escape' && open) {
                event.preventDefault();
                onOpenChange(false);
            }
        };

        document.addEventListener('keydown', handleShortcut);
        return () => document.removeEventListener('keydown', handleShortcut);
    }, [open, onOpenChange]);

    const handleSelect = useCallback(
        (to) => {
            close();
            navigate(to);
        },
        [close, navigate]
    );

    const quickActionsLabel = useMemo(
        () => (typeof navigator !== 'undefined' && /mac/i.test(navigator.platform) ? '⌘K' : 'Ctrl K'),
        []
    );

    const isSearching = query.trim().length > 0;

    const filteredNavigate = useMemo(() => rankItems(navigateCommands, query), [query]);
    const filteredActions = useMemo(() => rankItems(actionCommands, query), [query]);
    const searchResults = useMemo(
        () => rankItems([...navigateCommands, ...actionCommands], query),
        [query]
    );

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />

                <DialogPrimitive.Content className="fixed left-1/2 top-[9vh] z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-950/20 outline-none backdrop-blur-xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
                    <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">
                        Search for a page or action and press Enter to open it.
                    </DialogPrimitive.Description>

                    <Command loop shouldFilter={false} className="bg-transparent">
                        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
                            <Search className="h-4 w-4 shrink-0 text-slate-400" />
                            <Command.Input
                                autoFocus
                                value={query}
                                onValueChange={setQuery}
                                placeholder="Search pages and actions…"
                                className="h-14 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                            />
                            <button
                                type="button"
                                onClick={close}
                                className={`${kbdClass} shrink-0 transition hover:border-slate-300 hover:text-slate-700`}
                                aria-label="Close command palette"
                            >
                                ESC
                            </button>
                        </div>

                        <Command.List key={query} className="max-h-[min(430px,55vh)] overflow-y-auto overscroll-contain p-2">
                            <Command.Empty className="flex flex-col items-center justify-center px-6 py-12 text-center">
                                <div className="rounded-full bg-slate-100 p-3 text-slate-400">
                                    <Search className="h-5 w-5" />
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-800">No results found</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Try searching for “add”, “payment” or “ledger”.
                                </p>
                            </Command.Empty>

                            {isSearching ? (
                                searchResults.length > 0 && (
                                    <Command.Group heading="Results" className={groupHeadingClass}>
                                        {searchResults.map((item) => (
                                            <CommandRow key={item.id} item={item} onSelect={handleSelect} />
                                        ))}
                                    </Command.Group>
                                )
                            ) : (
                                <>
                                    <Command.Group heading="Navigate" className={groupHeadingClass}>
                                        {filteredNavigate.map((item) => (
                                            <CommandRow key={item.id} item={item} onSelect={handleSelect} />
                                        ))}
                                    </Command.Group>

                                    <Command.Separator className="mx-2 my-1 h-px bg-slate-100" />

                                    <Command.Group heading="Quick actions" className={groupHeadingClass}>
                                        {filteredActions.map((item) => (
                                            <CommandRow key={item.id} item={item} onSelect={handleSelect} />
                                        ))}
                                    </Command.Group>
                                </>
                            )}
                        </Command.List>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-[11px] text-slate-500">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <kbd className={kbdClass}>↑</kbd>
                                    <kbd className={kbdClass}>↓</kbd>
                                    navigate
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className={kbdClass}>
                                        <CornerDownLeft className="h-3 w-3" />
                                    </kbd>
                                    open
                                </span>
                                <span className="hidden items-center gap-1 sm:flex">
                                    <kbd className={kbdClass}>esc</kbd>
                                    close
                                </span>
                            </div>
                            <span className="flex items-center gap-1 text-slate-400">
                                MediGo palette
                                <kbd className={kbdClass}>{quickActionsLabel}</kbd>
                            </span>
                        </div>
                    </Command>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export default CommandPalette;

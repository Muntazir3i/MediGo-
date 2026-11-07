import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    BookOpen,
    Boxes,
    LayoutDashboard,
    Pill,
    PlusCircle,
    Receipt,
    Search,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';

const navGroups = [
    {
        label: 'Overview',
        items: [
            { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
            { to: '/billing', label: 'Billing', icon: Receipt },
        ],
    },
    {
        label: 'Operations',
        items: [
            { to: '/add', label: 'Add', icon: PlusCircle },
            { to: '/inventory', label: 'Inventory', icon: Boxes },
        ],
    },
    {
        label: 'Finance',
        items: [{ to: '/ledger', label: 'Ledger', icon: BookOpen }],
    },
];

const mobileItems = navGroups.flatMap((group) => group.items);

const Sidebar = ({ onOpenPalette }) => {
    return (
        <>
            <aside className="hidden w-[248px] shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 lg:flex">
                <div className="flex items-center gap-3 px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20">
                        <Pill className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tracking-tight text-slate-900">MediGo</p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Pharmacy ERP
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onOpenPalette}
                    className="mt-6 flex w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                >
                    <Search className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="flex-1 truncate">Search…</span>
                    <kbd className="inline-flex h-5 items-center rounded border border-slate-200 bg-white px-1.5 font-sans text-[10px] font-semibold text-slate-400">
                        Ctrl K
                    </kbd>
                </button>

                <nav className="mt-6 flex flex-1 flex-col gap-6 overflow-y-auto">
                    {navGroups.map((group) => (
                        <div key={group.label}>
                            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                {group.label}
                            </p>

                            <ul className="mt-2 space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <li key={item.to}>
                                            <NavLink
                                                to={item.to}
                                                end={item.end}
                                                className={({ isActive }) =>
                                                    `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                                        isActive
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                    }`
                                                }
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <span
                                                            className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                                                                isActive
                                                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                                                                    : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700'
                                                            }`}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                        </span>
                                                        <span className="flex-1 truncate">{item.label}</span>
                                                        {isActive && (
                                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                                        )}
                                                    </>
                                                )}
                                            </NavLink>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                <ThemeToggle
                    showLabel
                    className="mt-4 w-full border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
                />

                <div className="mt-3 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 dark:from-slate-900 dark:to-slate-950">
                    <p className="text-xs font-semibold text-slate-700">Quick tip</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        Press{' '}
                        <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-sans text-[10px] font-semibold text-slate-500">
                            Ctrl
                        </kbd>{' '}
                        +{' '}
                        <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-sans text-[10px] font-semibold text-slate-500">
                            K
                        </kbd>{' '}
                        anywhere to jump between pages.
                    </p>
                </div>
            </aside>

            <ThemeToggle className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-[4.25rem] z-40 h-11 w-11 rounded-full border-slate-200 bg-white text-slate-600 shadow-lg shadow-slate-900/10 hover:bg-slate-50 lg:hidden" />

            <button
                type="button"
                onClick={onOpenPalette}
                aria-label="Open command palette"
                className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/25 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 lg:hidden"
            >
                <Search className="h-5 w-5" />
            </button>

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">
                <div className="grid grid-cols-5">
                    {mobileItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition ${
                                        isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span
                                            className={`relative flex h-7 w-9 items-center justify-center rounded-lg transition ${
                                                isActive ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <Icon className="h-4.5 w-4.5" />
                                            {isActive && (
                                                <span className="absolute -top-1 h-1 w-1 rounded-full bg-blue-600" />
                                            )}
                                        </span>
                                        {item.label}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </nav>
        </>
    );
};

export default Sidebar;

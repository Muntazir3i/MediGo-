import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  Download,
  FileDown,
  Loader2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Input } from './ui/input.jsx';
import { getPrescriptionRegister } from '../services/medicineService.js';
import { useShopSettings } from '../context/SettingsContext.jsx';
import { formatCurrency, formatLedgerDate } from '../utils/ledgerFormat.js';
import {
  downloadRegisterCsv,
  generatePrescriptionRegisterPdf,
} from '../utils/registerPdf.js';

const isoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const firstDayOfMonth = () => {
  const now = new Date();
  return isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

const scheduleLabel = (value) => {
  if (value === 'H') return 'Schedule H';
  if (value === 'H1') return 'Schedule H1';
  if (value === 'X') return 'Schedule X';
  return 'All prescription sales';
};

const registerTitle = (schedule) => {
  if (schedule === 'H1') return 'Schedule H1 register';
  if (schedule === 'X') return 'Schedule X register';
  if (schedule === 'H') return 'Schedule H register';
  return 'Prescription sales register';
};

const Registers = () => {
  const { settings: shopSettings } = useShopSettings();
  const [schedule, setSchedule] = useState('H1');
  const [from, setFrom] = useState(firstDayOfMonth);
  const [to, setTo] = useState(() => isoDate(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    getPrescriptionRegister({ schedule, from, to })
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((requestError) => {
        if (!cancelled) {
          console.error(requestError);
          setData(null);
          setError(requestError.message || 'Could not load the prescription register.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [schedule, from, to]);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const summary = data?.summary ?? {};

  const grouped = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      const key = row.invoiceId;
      if (!map.has(key)) {
        map.set(key, {
          invoiceId: row.invoiceId,
          invoiceNumber: row.invoiceNumber,
          date: row.date,
          patientName: row.patientName,
          customerPhone: row.customerPhone,
          prescriberName: row.prescriberName,
          prescriptionReference: row.prescriptionReference,
          items: [],
        });
      }
      map.get(key).items.push(row);
    }
    return [...map.values()];
  }, [rows]);

  const handlePdf = () => {
    generatePrescriptionRegisterPdf({
      title: registerTitle(schedule),
      schedule,
      from,
      to,
      rows,
      pharmacistName: data?.pharmacistName || shopSettings.pharmacistName || '',
      shop: shopSettings,
    });
  };

  const handleCsv = () => {
    downloadRegisterCsv({
      filename: `Prescription-Register-${schedule}-${from}-${to}.csv`,
      rows,
    });
  };

  const scheduleTabs = [
    { id: 'H', label: 'Schedule H' },
    { id: 'H1', label: 'Schedule H1' },
    { id: 'X', label: 'Schedule X' },
    { id: 'all', label: 'All prescription sales' },
  ];

  return (
    <main className="h-full min-w-0 flex-1 overflow-auto bg-slate-50 p-4 pb-24 md:p-6 lg:pb-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-6 py-6 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                  Statutory compliance
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                  Prescription registers
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  Schedule H1 and Schedule X sales with patient, prescriber and batch details for
                  inspection.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCsv}
                disabled={rows.length === 0}
                className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                type="button"
                onClick={handlePdf}
                disabled={rows.length === 0}
                className="gap-2 bg-white text-slate-900 hover:bg-slate-100"
              >
                <FileDown className="h-4 w-4" />
                Register PDF
              </Button>
            </div>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {scheduleTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSchedule(tab.id)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    schedule === tab.id
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="register-from"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                >
                  From
                </label>
                <Input
                  id="register-from"
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className="border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label
                  htmlFor="register-to"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                >
                  To
                </label>
                <Input
                  id="register-to"
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className="border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Register entries
            </p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.entries ?? 0}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {scheduleLabel(schedule)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Patients
            </p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.patients ?? 0}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">Distinct patients in this period</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              H1 / X entries
            </p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.h1 ?? 0} / {summary.x ?? 0}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">Schedule H1 / Schedule X</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Prescription value
            </p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(summary.totalValue ?? 0)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">Scheduled medicine sales</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {registerTitle(schedule)}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {formatLedgerDate(from)} to {formatLedgerDate(to)} · Pharmacist:{' '}
                {data?.pharmacistName || shopSettings.pharmacistName || 'Not set'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {rows.length} entr{rows.length === 1 ? 'y' : 'ies'}
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-950">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Invoice</th>
                  <th className="px-4 py-3 font-semibold">Patient</th>
                  <th className="px-4 py-3 font-semibold">Prescriber</th>
                  <th className="px-4 py-3 font-semibold">Medicine</th>
                  <th className="px-4 py-3 font-semibold">Batch</th>
                  <th className="px-4 py-3 text-right font-semibold">Qty</th>
                  <th className="px-4 py-3 font-semibold">Schedule</th>
                  <th className="px-4 py-3 font-semibold">Rx ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12">
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading register…
                      </div>
                    </td>
                  </tr>
                ) : grouped.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-14">
                      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                          No register entries
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Scheduled medicine sales will appear here after billing.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  grouped.map((invoice) =>
                    invoice.items.map((row, index) => (
                      <tr
                        key={`${invoice.invoiceId}-${row.invoiceItemId}`}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                          {index === 0 ? formatLedgerDate(invoice.date) : ''}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-700 dark:text-blue-300">
                          {index === 0 ? invoice.invoiceNumber : ''}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {index === 0 ? invoice.patientName || '—' : ''}
                          </p>
                          {index === 0 && invoice.customerPhone && (
                            <p className="text-[10px] text-slate-400">{invoice.customerPhone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {index === 0 ? invoice.prescriberName || '—' : ''}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {row.medicineName}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {row.batchNumber || '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                          {row.saleQuantity} {row.saleUnit}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              row.drugSchedule === 'X'
                                ? 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300'
                                : 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
                            }
                          >
                            {scheduleLabel(row.drugSchedule)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {row.prescriptionReference || '—'}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <Users className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Entries are generated from saved invoice snapshots. Verify the register format and
            retention period with your drug inspector before using it for inspection.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Registers;

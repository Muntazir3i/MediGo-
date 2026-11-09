import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Building2,
  CalendarClock,
  CircleDollarSign,
  Flame,
  Loader2,
  PackageSearch,
  ReceiptText,
  Repeat2,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Input } from './ui/input.jsx';
import { formatCurrency, formatLedgerDate } from '../utils/ledgerFormat.js';
import { getInsights, getMedicinePurchaseStats } from '../services/medicineService.js';

const StatCard = ({ label, value, hint, icon, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="rounded-xl border border-slate-300/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        <div className={`rounded-lg p-2 ${tones[tone] || tones.blue}`}>
          {React.createElement(icon, { className: 'h-4 w-4' })}
        </div>
      </div>
    </div>
  );
};

const formatQuantity = (value) =>
  Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const Insights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [medicineQuery, setMedicineQuery] = useState('');
  const [medicineResults, setMedicineResults] = useState([]);
  const [medicineLoading, setMedicineLoading] = useState(true);
  const [medicineError, setMedicineError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    getInsights()
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((requestError) => {
        if (!cancelled) {
          console.error(requestError);
          setError(requestError.message || 'Could not load insights.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      setMedicineLoading(true);
      setMedicineError('');

      getMedicinePurchaseStats(medicineQuery.trim())
        .then((response) => {
          if (!cancelled) setMedicineResults(response?.medicines ?? []);
        })
        .catch((requestError) => {
          if (!cancelled) {
            console.error(requestError);
            setMedicineResults([]);
            setMedicineError(
              requestError.message || 'Could not load medicine purchase history.',
            );
          }
        })
        .finally(() => {
          if (!cancelled) setMedicineLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [medicineQuery]);

  const derived = useMemo(() => {
    if (!data) return null;

    const series = data.monthlySeries || [];
    const maxTrend = Math.max(
      1,
      ...series.flatMap((month) => [
        Number(month.purchases) || 0,
        Number(month.payments) || 0,
        Number(month.sales) || 0,
      ])
    );
    const maxSupplier = Math.max(
      1,
      ...(data.topSuppliers || []).map((supplier) => Number(supplier.amount) || 0)
    );
    const lastYearTop = data.lastYearSameMonth?.topProducts?.[0];
    const rediscover = data.rediscover || [];
    const topSupplier = data.topSuppliers?.[0];
    const priceMoves = data.priceMoves || [];
    const reorderCandidates = data.reorderCandidates || [];
    const currentMonth = data.currentMonth;
    const outstanding = data.outstanding;
    const frequentProducts = data.frequentProducts || [];
    const dataQuality = data.dataQuality;
    const showSales = Number(data.totals?.salesCount) > 0;

    const purchaseValues = series.map((month) => Number(month.purchases) || 0);
    const purchaseMean = purchaseValues.length
      ? purchaseValues.reduce((sum, value) => sum + value, 0) / purchaseValues.length
      : 0;
    const variance = purchaseValues.length
      ? purchaseValues.reduce((sum, value) => sum + ((value - purchaseMean) ** 2), 0) / purchaseValues.length
      : 0;
    const volatility = purchaseMean
      ? Math.round((Math.sqrt(variance) / purchaseMean) * 1000) / 10
      : 0;

    const topPriceMove = priceMoves[0];
    const topReorder = reorderCandidates[0];

    const signals = [
      lastYearTop
        ? `Last ${data.lastYearSameMonth.label}, ${lastYearTop.name} was your most purchased medicine with ${lastYearTop.quantity} units across ${lastYearTop.orders} bill${lastYearTop.orders === 1 ? '' : 's'}.`
        : `No purchase lines were recorded in ${data.lastYearSameMonth?.label}.`,
      rediscover.length > 0
        ? `${rediscover.length} medicine${rediscover.length === 1 ? '' : 's'} from last ${data.lastYearSameMonth?.label} have not been purchased in the last 90 days.`
        : 'Every medicine from last year’s same month has been purchased again recently.',
      topSupplier
        ? `${topSupplier.supplierName} accounted for ${data.ratios.supplierConcentration}% of purchase value in the last 12 months.`
        : 'No supplier concentration data is available yet.',
      `Payments covered ${data.ratios.paymentCoverage}% of purchase value over the last 12 months.`,
      `Your strongest purchase month was ${data.bestMonth.purchases.label} at ${formatCurrency(data.bestMonth.purchases.amount)}.`,
      data.totals.sales > 0
        ? `Average monthly sales are ${formatCurrency(data.averages.monthlySales)} across ${data.totals.salesCount} invoices.`
        : 'No sales invoices have been recorded yet, so sales averages are waiting for billing data.',
      topPriceMove && topPriceMove.changePercent > 0
        ? `${topPriceMove.name} purchase rate rose ${topPriceMove.changePercent}% versus the previous 90 days.`
        : null,
      topReorder
        ? `${topReorder.name} has ${topReorder.stockOnHand} units left against an average monthly purchase of ${topReorder.averageMonthly}.`
        : null,
      currentMonth?.purchaseChangePercent !== null && currentMonth?.purchaseChangePercent !== undefined
        ? `${currentMonth.label} purchases are ${currentMonth.purchaseChangePercent >= 0 ? 'up' : 'down'} ${Math.abs(currentMonth.purchaseChangePercent)}% versus last month.`
        : `${currentMonth?.label || 'This month'} has ${formatCurrency(currentMonth?.purchases || 0)} in purchases so far.`,
      outstanding?.total > 0
        ? `${formatCurrency(outstanding.total)} is still payable across ${outstanding.supplierCount || 0} supplier${(outstanding.supplierCount || 0) === 1 ? '' : 's'}.`
        : 'No positive supplier payable balance is currently outstanding.',
      frequentProducts[0]
        ? `${frequentProducts[0].name} appears on the most purchase bills: ${frequentProducts[0].bills} bills in the last 12 months.`
        : null,
      dataQuality?.duplicateGroups > 0
        ? `${dataQuality.duplicateGroups} medicine name group${dataQuality.duplicateGroups === 1 ? '' : 's'} look like duplicates. Review naming for cleaner analytics.`
        : null,
      dataQuality?.missingBatch > 0 || dataQuality?.missingExpiry > 0
        ? `${dataQuality.missingBatch} purchase lines are missing batch numbers and ${dataQuality.missingExpiry} are missing expiry dates.`
        : null,
    ].filter(Boolean);

    return {
      maxTrend,
      maxSupplier,
      lastYearTop,
      rediscover,
      topSupplier,
      signals,
      priceMoves,
      reorderCandidates,
      volatility,
      currentMonth,
      outstanding,
      frequentProducts,
      dataQuality,
      showSales,
    };
  }, [data]);

  if (loading) {
    return (
      <main className="h-full min-w-0 flex-1 overflow-auto bg-slate-50 p-4 pb-24 md:p-6 lg:pb-6">
        <div className="mx-auto flex max-w-[1500px] items-center justify-center rounded-2xl border border-slate-300/80 bg-white px-6 py-24 text-sm text-slate-500 shadow-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Building insights…
        </div>
      </main>
    );
  }

  if (error || !data || !derived) {
    return (
      <main className="h-full min-w-0 flex-1 overflow-auto bg-slate-50 p-4 pb-24 md:p-6 lg:pb-6">
        <div className="mx-auto max-w-[700px] rounded-2xl border border-rose-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Brain className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Could not build insights</h1>
          <p className="mt-1 text-sm text-slate-500">{error || 'No data available.'}</p>
          <Button variant="outline" className="mt-4" onClick={() => setReloadKey((key) => key + 1)}>
            Try again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full min-w-0 flex-1 overflow-auto bg-slate-50 p-4 pb-24 md:p-6 lg:pb-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950 px-6 py-6 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200">
                    Hidden intelligence
                  </p>
                  <Badge className="border-white/10 bg-white/10 text-slate-200">Command palette only</Badge>
                </div>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">Insights & suggestions</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  Monthly averages, buying patterns and medicines worth revisiting.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Window</p>
                <p className="mt-1 text-sm font-semibold">{data.period.label}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Purchases</p>
                <p className="mt-1 text-sm font-semibold">{formatCurrency(data.totals.purchases)}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Payments</p>
                <p className="mt-1 text-sm font-semibold">{formatCurrency(data.totals.payments)}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Outstanding</p>
                <p className="mt-1 text-sm font-semibold">{formatCurrency(data.outstanding?.total)}</p>
              </div>
            </div>
          </div>
        </header>

        {!derived.showSales && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Sales insights are paused.</span>{' '}
            They will activate automatically after the first billing invoice is recorded.
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Avg monthly purchases"
            value={formatCurrency(data.averages.monthlyPurchases)}
            hint={`${data.totals.purchaseCount} bills in ${data.period.months} months`}
            icon={ArrowUpRight}
            tone="blue"
          />
          <StatCard
            label="Avg monthly payments"
            value={formatCurrency(data.averages.monthlyPayments)}
            hint={`${data.totals.paymentCount} payments recorded`}
            icon={Wallet}
            tone="emerald"
          />
          <StatCard
            label="Current month spend"
            value={formatCurrency(derived.currentMonth?.purchases)}
            hint={
              derived.currentMonth?.purchaseChangePercent === null ||
              derived.currentMonth?.purchaseChangePercent === undefined
                ? 'No previous-month comparison yet'
                : `${derived.currentMonth.purchaseChangePercent >= 0 ? 'Up' : 'Down'} ${Math.abs(derived.currentMonth.purchaseChangePercent)}% vs last month`
            }
            icon={TrendingUp}
            tone="violet"
          />
          <StatCard
            label="Outstanding payable"
            value={formatCurrency(derived.outstanding?.total)}
            hint={`${derived.outstanding?.supplierCount || 0} suppliers with a positive balance`}
            icon={Wallet}
            tone="rose"
          />
          <StatCard
            label="Avg monthly credit notes"
            value={formatCurrency(data.averages.monthlyCreditNotes)}
            hint={`${data.totals.creditNoteCount} credit notes`}
            icon={ArrowDownRight}
            tone="rose"
          />
          <StatCard
            label="Average bill value"
            value={formatCurrency(data.averages.billValue)}
            hint={`Best month: ${data.bestMonth.purchases.label}`}
            icon={CircleDollarSign}
            tone="amber"
          />
          <StatCard
            label="Payment coverage"
            value={`${data.ratios.paymentCoverage}%`}
            hint="Payments as a share of purchases"
            icon={TrendingUp}
            tone="emerald"
          />
          <StatCard
            label="Purchase volatility"
            value={`${derived.volatility}%`}
            hint="Lower means more predictable monthly buying"
            icon={Flame}
            tone="amber"
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Medicine order lookup</h2>
                <p className="mt-0.5 max-w-2xl text-xs text-slate-500">
                  Search any medicine to see how many purchase bills included it, how much you
                  bought, and the total purchase value. All non-voided bills are included.
                </p>
              </div>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                aria-label="Search medicine purchase history"
                placeholder="Search medicine, e.g. Dolo 650"
                value={medicineQuery}
                onChange={(event) => setMedicineQuery(event.target.value)}
                className="bg-slate-50 pl-9 focus-visible:bg-white"
              />
            </div>
          </div>

          {medicineLoading ? (
            <div className="flex items-center gap-2 px-5 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading medicine purchase history…
            </div>
          ) : medicineError ? (
            <div className="flex items-start gap-2 px-5 py-10 text-sm text-rose-600">
              <Brain className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{medicineError}</span>
            </div>
          ) : medicineResults.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No medicine purchases found
              {medicineQuery.trim() ? ` for “${medicineQuery.trim()}”` : ''}.
            </div>
          ) : (
            <div className="max-h-[430px] overflow-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Medicine</th>
                    <th className="px-4 py-3 text-right font-semibold">Orders</th>
                    <th className="px-4 py-3 text-right font-semibold">Total qty</th>
                    <th className="px-4 py-3 text-right font-semibold">Free</th>
                    <th className="px-4 py-3 text-right font-semibold">Total amount</th>
                    <th className="px-4 py-3 text-right font-semibold">Avg rate</th>
                    <th className="px-5 py-3 text-right font-semibold">Last ordered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicineResults.map((medicine, index) => (
                    <tr
                      key={`${medicine.productId ?? medicine.name}-${index}`}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{medicine.name}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {medicine.lineCount} purchase line
                          {medicine.lineCount === 1 ? '' : 's'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {medicine.orderCount}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatQuantity(medicine.totalQuantity)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatQuantity(medicine.freeQuantity)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(medicine.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(medicine.averageRate)}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-600">
                        {formatLedgerDate(medicine.lastOrderedDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] text-slate-500">
            {medicineQuery.trim()
              ? `Showing matches for “${medicineQuery.trim()}”.`
              : 'Showing the most frequently ordered medicines.'}{' '}
            Total amount includes discount and GST; free units are not charged.
          </div>
        </section>

        <section className="rounded-xl border border-slate-300/80 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">12-month movement</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {derived.showSales ? 'Purchases, payments and sales by month.' : 'Purchases and payments by month.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-blue-500" /> Purchases</span>
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Payments</span>
              {derived.showSales && (
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-violet-500" /> Sales</span>
              )}
            </div>
          </div>

          <div className="mt-5 flex h-56 items-end gap-2 overflow-x-auto pb-1">
            {data.monthlySeries.map((month) => {
              const bars = [
                { value: month.purchases, color: 'bg-blue-500', label: 'Purchases' },
                { value: month.payments, color: 'bg-emerald-500', label: 'Payments' },
                ...(derived.showSales
                  ? [{ value: month.sales, color: 'bg-violet-500', label: 'Sales' }]
                  : []),
              ];

              return (
                <div key={month.month} className="flex min-w-[54px] flex-1 flex-col items-center gap-2">
                  <div className="flex h-44 w-full items-end justify-center gap-1 rounded-lg bg-slate-50 px-1">
                    {bars.map((bar) => (
                      <div
                        key={bar.label}
                        title={`${bar.label}: ${formatCurrency(bar.value)}`}
                        className={`w-2.5 rounded-t ${bar.color}`}
                        style={{ height: `${Math.max(2, (Number(bar.value) / derived.maxTrend) * 100)}%` }}
                      />
                    ))}
                  </div>
                  <span className="whitespace-nowrap text-[10px] font-medium text-slate-500">
                    {month.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm dark:border-violet-900 dark:from-violet-950/40 dark:to-slate-950">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-violet-100 p-2 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Signals worth noticing</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Automatic observations from the current ledger data.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {derived.signals.map((signal) => (
              <div key={signal} className="flex items-start gap-2 rounded-lg border border-violet-100 bg-white/80 p-3 text-sm text-slate-700 dark:border-violet-900/70 dark:bg-slate-900/80 dark:text-slate-200">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500 dark:text-violet-300" />
                <span>{signal}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <section className="overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-100 p-5">
              <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Purchase price increases</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Similar names are grouped, but different forms such as tablet, syrup and nano shot stay separate.
                </p>
              </div>
            </div>

            {derived.priceMoves.length > 0 ? (
              <div className="max-h-[340px] overflow-auto">
                <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Medicine</th>
                      <th className="px-4 py-3 text-right font-semibold">Prev rate</th>
                      <th className="px-4 py-3 text-right font-semibold">Current</th>
                      <th className="px-5 py-3 text-right font-semibold">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {derived.priceMoves.map((product) => (
                      <tr key={product.name} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          {product.matchedNames?.length > 1 && (
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              Grouped: {product.matchedNames.slice(0, 3).join(' · ')}
                              {product.matchedNames.length > 3 ? ` +${product.matchedNames.length - 3}` : ''}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatCurrency(product.previousPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatCurrency(product.recentPrice)}
                        </td>
                        <td className={`px-5 py-3 text-right font-semibold ${
                          product.changePercent > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {product.changePercent > 0 ? '+' : ''}{product.changePercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-8 text-sm text-slate-500">Not enough price history yet.</p>
            )}
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-100 p-5">
              <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Outstanding payable</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Supplier balances after purchases, payments and credit notes.
                </p>
              </div>
            </div>

            <div className="p-5">
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(derived.outstanding?.total)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {derived.outstanding?.supplierCount || 0} suppliers with a positive payable balance
              </p>

              <div className="mt-4 space-y-3">
                {derived.outstanding?.suppliers?.length > 0 ? derived.outstanding.suppliers.map((supplier) => (
                  <div key={supplier.supplierName}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-semibold text-slate-800">{supplier.supplierName}</span>
                      <span className="shrink-0 text-slate-600">{formatCurrency(supplier.balance)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${(supplier.balance / Math.max(1, derived.outstanding.total)) * 100}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No positive outstanding supplier balance.</p>
                )}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-100 p-5">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <ReceiptText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Most frequently purchased</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Medicines appearing on the most purchase bills in the last 12 months.
                </p>
              </div>
            </div>

            {derived.frequentProducts.length > 0 ? (
              <div className="max-h-[340px] overflow-auto">
                <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Medicine</th>
                      <th className="px-4 py-3 text-right font-semibold">Bills</th>
                      <th className="px-5 py-3 text-right font-semibold">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {derived.frequentProducts.map((product) => (
                      <tr key={product.name} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-3 font-semibold text-slate-900">{product.name}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{product.bills}</td>
                        <td className="px-5 py-3 text-right text-slate-600">{product.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-8 text-sm text-slate-500">No purchase frequency data yet.</p>
            )}
          </section>
        </div>

        {derived.showSales && (
        <section className="overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 p-5">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <PackageSearch className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Reorder watchlist</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Stock on hand compared with the average monthly purchase quantity.
              </p>
            </div>
          </div>

          {derived.reorderCandidates.length > 0 ? (
            <div className="max-h-[340px] overflow-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Medicine</th>
                    <th className="px-4 py-3 text-right font-semibold">Stock on hand</th>
                    <th className="px-4 py-3 text-right font-semibold">Avg monthly purchase</th>
                    <th className="px-5 py-3 text-right font-semibold">Last 90d qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {derived.reorderCandidates.map((product) => (
                    <tr key={product.name} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-3 font-semibold text-slate-900">{product.name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-rose-600">
                        {product.stockOnHand}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{product.averageMonthly}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{product.recentQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-500">
              No reorder pressure detected from recent purchasing patterns.
            </p>
          )}
        </section>

        )}

        <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
          <section className="overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-100 p-5">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <CalendarClock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Last {data.lastYearSameMonth.label}: what you bought most
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {data.lastYearSameMonth.billCount} bills · {data.lastYearSameMonth.productCount} medicines ·{' '}
                  {formatCurrency(data.lastYearSameMonth.amount)}
                </p>
              </div>
            </div>

            {data.lastYearSameMonth.topProducts.length > 0 ? (
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Medicine</th>
                      <th className="px-4 py-3 text-right font-semibold">Qty</th>
                      <th className="px-4 py-3 text-right font-semibold">Bills</th>
                      <th className="px-5 py-3 text-right font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.lastYearSameMonth.topProducts.map((product) => (
                      <tr key={product.name} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-3 font-semibold text-slate-900">{product.name}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{product.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{product.orders}</td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-900">
                          {formatCurrency(product.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-14 text-center text-sm text-slate-500">
                No purchase lines were recorded in {data.lastYearSameMonth.label}.
              </div>
            )}
          </section>

          <div className="space-y-5">
            <section className="overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-sm">
              <div className="flex items-start gap-3 border-b border-slate-100 p-5">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Supplier concentration</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Top purchase suppliers in the last 12 months.</p>
                </div>
              </div>

              <div className="space-y-3 p-5">
                {data.topSuppliers.length > 0 ? data.topSuppliers.map((supplier) => (
                  <div key={supplier.supplierName}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-semibold text-slate-800">{supplier.supplierName}</span>
                      <span className="shrink-0 text-slate-600">{formatCurrency(supplier.amount)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${(supplier.amount / derived.maxSupplier) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{supplier.bills} bills</p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No supplier purchase data yet.</p>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
              <div className="flex items-start gap-3 border-b border-emerald-100 p-5">
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <Repeat2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Worth revisiting</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Bought last {data.lastYearSameMonth.label}, but not in the last 90 days.
                  </p>
                </div>
              </div>

              {derived.rediscover.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {derived.rediscover.map((product) => (
                    <div key={product.name} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {product.quantity} units · {product.orders} bills · last {formatLedgerDate(product.lastPurchased)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 bg-emerald-50 text-emerald-700">
                        Revisit
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-8 text-sm text-slate-500">
                  No stale medicines found from last year’s same month.
                </p>
              )}
            </section>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 p-5">
            <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
              <PackageSearch className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Top purchased medicines</h2>
              <p className="mt-0.5 text-xs text-slate-500">Highest purchase value in the last 12 months.</p>
            </div>
          </div>

          {data.topProducts.length > 0 ? (
            <div className="max-h-[360px] overflow-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Medicine</th>
                    <th className="px-4 py-3 text-right font-semibold">Quantity</th>
                    <th className="px-5 py-3 text-right font-semibold">Purchase value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topProducts.map((product) => (
                    <tr key={product.name} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-3 font-semibold text-slate-900">{product.name}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{product.quantity}</td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(product.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-500">No purchase lines yet.</p>
          )}
        </section>

        <p className="text-center text-[11px] text-slate-400">
          Generated {new Date(data.generatedAt).toLocaleString()} · This page is only reachable from the command palette.
        </p>
      </div>
    </main>
  );
};

export default Insights;

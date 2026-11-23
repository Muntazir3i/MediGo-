import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgePercent,
  CheckCircle2,
  Info,
  Loader2,
  PackageSearch,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { Input } from './ui/input.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { findmedicineByName } from '../services/medicineService.js';
import { formatCurrency, formatLedgerDate } from '../utils/ledgerFormat.js';
import {
  calculateDiscountRange,
  calculateDiscountScenario,
  formatMarginPercent,
} from '../utils/profitMargin.js';

const formatQty = (value) =>
  Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const formatDiscount = (value) => `${Number(value || 0).toFixed(2)}%`;

const MetricCard = ({ label, value, hint, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
      <span className={`mt-3 inline-flex rounded-full p-1.5 ${tones[tone] || tones.blue}`}>
        <BadgePercent className="h-3.5 w-3.5" />
      </span>
    </div>
  );
};

const DiscountAdvisor = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [targetMargin, setTargetMargin] = useState(10);
  const [competitorDiscount, setCompetitorDiscount] = useState(18);
  const competitorPercent = Math.min(100, Math.max(0, Number(competitorDiscount) || 0));

  useEffect(() => {
    const term = query.trim();

    if (!term) {
      setResults([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    const timer = setTimeout(() => {
      findmedicineByName(term)
        .then((response) => {
          if (cancelled) return;
          const list = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : [];
          setResults(list);
        })
        .catch((requestError) => {
          if (cancelled) return;
          console.error(requestError);
          setResults([]);
          setError(requestError.message || 'Could not search medicines.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const range = useMemo(() => {
    if (!selected) return null;
    return calculateDiscountRange({
      rate: selected.unitPrice,
      gstPercentage: selected.gstPercentage,
      mrp: selected.mrp,
      targetMarginPercent: targetMargin,
    });
  }, [selected, targetMargin]);

  const competitor = useMemo(() => {
    if (!selected) return null;
    return calculateDiscountScenario({
      rate: selected.unitPrice,
      gstPercentage: selected.gstPercentage,
      mrp: selected.mrp,
      discountPercent: competitorPercent,
    });
  }, [selected, competitorPercent]);

  const recommended = useMemo(() => {
    if (!selected || !range) return null;
    return calculateDiscountScenario({
      rate: selected.unitPrice,
      gstPercentage: selected.gstPercentage,
      mrp: selected.mrp,
      discountPercent: range.recommendedDiscountPercent,
    });
  }, [selected, range]);

  const scenarios = useMemo(() => {
    if (!selected || !range) return [];

    const discounts = new Set([
      0,
      5,
      10,
      15,
      18,
      20,
      range.recommendedDiscountPercent,
      range.maxDiscountPercent,
      competitorPercent,
    ]);

    return [...discounts]
      .map((discount) => Number(discount))
      .filter((discount) => Number.isFinite(discount) && discount >= 0 && discount <= 100)
      .sort((a, b) => a - b)
      .map((discount) => ({
        discount,
        ...calculateDiscountScenario({
          rate: selected.unitPrice,
          gstPercentage: selected.gstPercentage,
          mrp: selected.mrp,
          discountPercent: discount,
        }),
      }));
  }, [selected, range, competitorPercent]);

  const recommendation = useMemo(() => {
    if (!range || !competitor) return null;

    if (!range.hasValidMrp) {
      return {
        tone: 'rose',
        title: 'MRP is missing',
        text: 'Update the MRP in Inventory before using the discount advisor.',
      };
    }

    if (!range.hasValidCost) {
      return {
        tone: 'rose',
        title: 'Purchase rate is missing',
        text: 'Update the purchase rate in Inventory before using the discount advisor.',
      };
    }

    if (range.maxDiscountPercent <= 0) {
      return {
        tone: 'rose',
        title: 'No room for discount',
        text: `At the current cost of ${formatCurrency(range.costWithGst)}, the MRP of ${formatCurrency(range.mrp)} is already at or below break-even. Do not offer a discount on this batch.`,
      };
    }

    if (competitorPercent > range.maxDiscountPercent) {
      return {
        tone: 'rose',
        title: `${formatDiscount(competitorPercent)} is a loss`,
        text: `At ${formatDiscount(competitorPercent)} the customer pays ${formatCurrency(competitor.sellingPrice)}, which is ${formatCurrency(Math.abs(competitor.profit))} below your cost. The maximum safe discount is ${formatDiscount(range.maxDiscountPercent)}.`,
      };
    }

    if (!range.canOfferTarget) {
      return {
        tone: 'amber',
        title: 'Target margin is below at MRP',
        text: `At full MRP the margin is ${formatMarginPercent(range.marginPercent)}, below your ${formatDiscount(range.targetMarginPercent)} target. You can still discount up to ${formatDiscount(range.maxDiscountPercent)} before losing money, but any discount lowers the margin further.`,
      };
    }

    if (competitorPercent > range.recommendedDiscountPercent) {
      return {
        tone: 'amber',
        title: 'Below your target margin',
        text: `You can offer ${formatDiscount(competitorPercent)}, but the margin drops to ${formatMarginPercent(competitor.marginPercent)} — below your ${formatDiscount(range.targetMarginPercent)} target. To keep your target, offer at most ${formatDiscount(range.recommendedDiscountPercent)}.`,
      };
    }

    return {
      tone: 'emerald',
      title: 'Safe to match',
      text: `You can offer ${formatDiscount(competitorPercent)} and still keep ${formatMarginPercent(competitor.marginPercent)} margin. Your target-margin limit is ${formatDiscount(range.recommendedDiscountPercent)}.`,
    };
  }, [range, competitor, competitorPercent]);

  const selectItem = (item) => {
    setSelected(item);
    window.setTimeout(() => {
      document.getElementById('discount-analysis')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  };

  const toneClass = {
    emerald:
      'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    amber:
      'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
    rose:
      'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
  };

  return (
    <main className="h-full min-w-0 flex-1 overflow-auto bg-slate-50 p-4 pb-24 md:p-6 lg:pb-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-6 py-6 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <BadgePercent className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                Hidden tool · command palette only
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Discount advisor</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Search a medicine, see your real cost after GST, and find the highest discount
                you can give without giving away the shop.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search medicine
            </p>
          </div>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search medicine name, company or batch…"
              className="h-11 border-slate-300 bg-white pl-9 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            The calculator uses purchase rate + GST and compares it with MRP. Purchase discount
            is not included.
          </p>
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!query.trim() ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <PackageSearch className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              Search a medicine to begin
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              You will see the cost after GST, break-even discount, recommended discount and
              profit at the competitor’s discount.
            </p>
          </section>
        ) : results.length > 0 ? (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Search results
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Select the exact batch you are selling.
                </p>
              </div>
              <Badge className="border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {results.length} batch{results.length === 1 ? '' : 'es'}
              </Badge>
            </div>

            <div className="max-h-[360px] overflow-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-950">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Medicine</th>
                    <th className="px-4 py-3 font-semibold">Batch</th>
                    <th className="px-4 py-3 font-semibold">Expiry</th>
                    <th className="px-4 py-3 text-right font-semibold">Stock</th>
                    <th className="px-4 py-3 text-right font-semibold">Rate</th>
                    <th className="px-4 py-3 text-right font-semibold">GST</th>
                    <th className="px-4 py-3 text-right font-semibold">MRP</th>
                    <th className="px-4 py-3 text-right font-semibold">Margin</th>
                    <th className="px-5 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((item) => {
                    const margin = calculateDiscountRange({
                      rate: item.unitPrice,
                      gstPercentage: item.gstPercentage,
                      mrp: item.mrp,
                      targetMarginPercent: targetMargin,
                    });

                    return (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {item.manufacturer || item.category || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {item.batchNumber || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {item.expiryDate ? formatLedgerDate(item.expiryDate) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                          {formatQty(item.stock)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                          {formatDiscount(item.gstPercentage)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.mrp)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-semibold ${
                              margin.isLoss
                                ? 'text-rose-600 dark:text-rose-300'
                                : 'text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {formatMarginPercent(margin.marginPercent)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => selectItem(item)}
                            className="gap-1.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                          >
                            Analyze
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : !loading ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <Search className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              No medicines found
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Try a different medicine name, company or batch number.
            </p>
          </section>
        ) : null}

        {selected && range && competitor && recommended && (
          <section id="discount-analysis" className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Selected medicine
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {selected.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Batch {selected.batchNumber || '—'} · Exp{' '}
                    {selected.expiryDate ? formatLedgerDate(selected.expiryDate) : '—'} · Stock{' '}
                    {formatQty(selected.stock)} · {selected.manufacturer || selected.category || '—'}
                  </p>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label
                      htmlFor="target-margin"
                      className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                    >
                      Target margin %
                    </label>
                    <Input
                      id="target-margin"
                      type="number"
                      min="0"
                      max="90"
                      step="0.5"
                      value={targetMargin}
                      onChange={(event) => setTargetMargin(event.target.value)}
                      className="h-9 w-28 border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="competitor-discount"
                      className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                    >
                      Competitor discount %
                    </label>
                    <Input
                      id="competitor-discount"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={competitorDiscount}
                      onChange={(event) => setCompetitorDiscount(event.target.value)}
                      className="h-9 w-32 border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelected(null)}
                    className="h-9 gap-1.5 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                label="Cost + GST"
                value={formatCurrency(range.costWithGst)}
                hint={`Rate ${formatCurrency(range.purchaseRate)} + ${formatDiscount(range.gst)} GST`}
                tone="blue"
              />
              <MetricCard
                label="MRP"
                value={formatCurrency(range.mrp)}
                hint="Selling price before discount"
                tone="violet"
              />
              <MetricCard
                label="Profit at MRP"
                value={formatCurrency(range.profit)}
                hint={`Margin ${formatMarginPercent(range.marginPercent)}`}
                tone={range.isLoss ? 'rose' : 'emerald'}
              />
              <MetricCard
                label="Maximum discount"
                value={formatDiscount(range.maxDiscountPercent)}
                hint="Break-even — profit becomes zero"
                tone="amber"
              />
              <MetricCard
                label={range.canOfferTarget ? 'Recommended discount' : 'Discount room at target'}
                value={formatDiscount(range.recommendedDiscountPercent)}
                hint={
                  range.canOfferTarget
                    ? `Keeps your ${formatDiscount(range.targetMarginPercent)} target margin`
                    : `MRP is already below your ${formatDiscount(range.targetMarginPercent)} target`
                }
                tone={range.canOfferTarget ? 'emerald' : 'amber'}
              />
              <MetricCard
                label={`At ${formatDiscount(competitorPercent)} discount`}
                value={formatCurrency(competitor.profit)}
                hint={`Margin ${formatMarginPercent(competitor.marginPercent)}`}
                tone={competitor.isLoss ? 'rose' : competitor.marginPercent < range.targetMarginPercent ? 'amber' : 'emerald'}
              />
            </div>

            {recommendation && (
              <div
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${toneClass[recommendation.tone] || toneClass.amber}`}
              >
                {recommendation.tone === 'emerald' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : recommendation.tone === 'rose' ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <div>
                  <p className="font-semibold">{recommendation.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed opacity-90">
                    {recommendation.text}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Discount scenarios
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Every row is one possible discount. The recommended row keeps your target
                    margin; the break-even row earns zero profit.
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Per unit / pack
                </span>
              </div>

              <div className="mt-4 overflow-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-950">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Discount</th>
                      <th className="px-4 py-3 text-right font-semibold">Customer pays</th>
                      <th className="px-4 py-3 text-right font-semibold">Profit</th>
                      <th className="px-4 py-3 text-right font-semibold">Margin</th>
                      <th className="px-4 py-3 text-right font-semibold">Markup</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {scenarios.map((scenario) => {
                      const isRecommended =
                        range.canOfferTarget &&
                        Math.abs(scenario.discount - range.recommendedDiscountPercent) < 0.005;
                      const isCompetitor =
                        Math.abs(scenario.discount - competitorPercent) < 0.005;
                      const isBreakEven =
                        Math.abs(scenario.discount - range.maxDiscountPercent) < 0.005;

                      const status = scenario.isLoss
                        ? 'Loss'
                        : isBreakEven
                          ? 'Break-even'
                          : scenario.marginPercent < range.targetMarginPercent
                            ? 'Below target'
                            : 'Safe';

                      const statusTone = scenario.isLoss
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                        : isBreakEven
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          : scenario.marginPercent < range.targetMarginPercent
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';

                      return (
                        <tr
                          key={scenario.discount}
                          className={
                            isRecommended
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                              : isCompetitor
                                ? 'bg-blue-50/40 dark:bg-blue-950/20'
                                : ''
                          }
                        >
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {formatDiscount(scenario.discount)}
                              </span>
                              {isRecommended && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Recommended
                                </span>
                              )}
                              {isCompetitor && !isRecommended && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                  Competitor
                                </span>
                              )}
                              {isBreakEven && !isRecommended && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                  Break-even
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                            {formatCurrency(scenario.sellingPrice)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${
                              scenario.isLoss
                                ? 'text-rose-600 dark:text-rose-300'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {formatCurrency(scenario.profit)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                            {formatMarginPercent(scenario.marginPercent)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                            {formatMarginPercent(scenario.markupPercent)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusTone}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Use this as a guide, not a rule. The calculation uses purchase rate + GST and
                ignores purchase discount. Always check the batch cost and your expenses before
                offering a large discount.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default DiscountAdvisor;

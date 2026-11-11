import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Minus,
  PackageSearch,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.jsx';
import { findmedicineByName, updateSaleInvoice } from '../services/medicineService.js';
import { formatCurrency } from '../utils/ledgerFormat.js';

const PACK_UNIT_PATTERN = /^(PACK|PACKS|STRIP|STRIPS|BOX|BOXES|BOTTLE|BOTTLES|PIECE|PIECES|UNIT|UNITS)$/i;

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const formatQty = (value) => {
  const num = Number(value) || 0;
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(2).replace(/\.?0+$/, '');
};

const isPackUnit = (item) => PACK_UNIT_PATTERN.test(String(item.saleUnit || 'PACK'));

const maxSaleQty = (item) => {
  const availablePack = Math.max(0, Number(item.availablePack) || 0);
  return isPackUnit(item) ? availablePack : availablePack * Math.max(1, Number(item.unitsPerPack) || 1);
};

const itemPackQty = (item) => {
  const qty = Number(item.qty) || 0;
  return isPackUnit(item) ? qty : qty / Math.max(1, Number(item.unitsPerPack) || 1);
};

const itemLineTotal = (item) => {
  const subtotal = round2((Number(item.price) || 0) * itemPackQty(item));
  const discount = round2(subtotal * ((Number(item.discount) || 0) / 100));
  const gst = round2((subtotal - discount) * ((Number(item.gstPercentage) || 0) / 100));
  return round2(subtotal - discount + gst);
};

const fieldClass =
  'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

const selectClass =
  'h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

const InvoiceEditDialog = ({ invoice, open, onOpenChange, onSaved }) => {
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [status, setStatus] = useState('completed');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const originalPackByItem = useRef(new Map());

  useEffect(() => {
    if (!invoice || !open) return;

    const nextOriginal = new Map();
    const nextItems = (invoice.items ?? invoice.medicines ?? []).map((item, index) => {
      const inventoryItemId = item.inventoryItemId ?? item.id;
      const soldPack = Number(item.stockQuantity ?? item.quantity) || 0;
      const liveStock = item.liveStock === null || item.liveStock === undefined
        ? soldPack
        : Number(item.liveStock);
      const unitsPerPack = Math.max(1, Number(item.unitsPerPack) || 1);
      const saleUnit = String(item.saleUnit || 'PACK').toUpperCase();

      nextOriginal.set(
        String(inventoryItemId),
        (nextOriginal.get(String(inventoryItemId)) || 0) + soldPack,
      );

      return {
        key: `${inventoryItemId}-${item.invoiceItemId ?? index}`,
        inventoryItemId,
        productId: item.productId,
        name: item.name,
        batchNumber: item.batchNumber ?? item.batchNumberSnapshot,
        expiryDate: item.expiryDate ?? item.expiryDateSnapshot,
        unitsPerPack,
        unitLabel: String(item.unitLabel || saleUnit || 'UNIT').toUpperCase(),
        saleUnit,
        qty: Number(item.saleQuantity ?? item.qty ?? item.quantity) || 0,
        price: Number(item.saleUnitPrice ?? item.price ?? item.unitPrice ?? item.mrp) || 0,
        discount: Number(item.discount ?? item.discountPercent) || 0,
        gstPercentage: Number(item.gstPercentage ?? item.gstPercent) || 0,
        mrp: Number(item.mrp) || 0,
        availablePack: Math.max(0, liveStock + soldPack),
      };
    });

    originalPackByItem.current = nextOriginal;
    setCustomer({
      name: invoice.customer?.name ?? invoice.customerName ?? '',
      phone: invoice.customer?.phone ?? invoice.customerPhone ?? '',
      address: invoice.customer?.address ?? invoice.customerAddress ?? '',
    });
    setStatus(invoice.status === 'pending' ? 'pending' : 'completed');
    setItems(nextItems);
    setSearch('');
    setSearchResults([]);
    setError('');
  }, [invoice, open]);

  useEffect(() => {
    const term = search.trim();

    if (!open || term.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }

    let cancelled = false;
    setSearchLoading(true);

    const timer = setTimeout(() => {
      findmedicineByName(term)
        .then((results) => {
          if (!cancelled) {
            setSearchResults(Array.isArray(results) ? results.slice(0, 12) : []);
          }
        })
        .catch(() => {
          if (!cancelled) setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, open]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let gst = 0;

    for (const item of items) {
      const lineSubtotal = round2((Number(item.price) || 0) * itemPackQty(item));
      const lineDiscount = round2(lineSubtotal * ((Number(item.discount) || 0) / 100));
      const lineGst = round2((lineSubtotal - lineDiscount) * ((Number(item.gstPercentage) || 0) / 100));
      subtotal += lineSubtotal;
      discount += lineDiscount;
      gst += lineGst;
    }

    return {
      subtotal: round2(subtotal),
      discount: round2(discount),
      gst: round2(gst),
      total: round2(subtotal - discount + gst),
    };
  }, [items]);

  const updateItem = (key, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  };

  const changeQty = (key, delta) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const nextQty = round2((Number(item.qty) || 0) + delta);
        return { ...item, qty: Math.max(0.01, Math.min(nextQty, maxSaleQty(item))) };
      }),
    );
  };

  const changeSaleUnit = (key, nextUnit) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;

        const packQty = itemPackQty(item);
        const nextIsPack = PACK_UNIT_PATTERN.test(nextUnit);
        const nextQty = nextIsPack
          ? packQty
          : packQty * Math.max(1, Number(item.unitsPerPack) || 1);

        return {
          ...item,
          saleUnit: String(nextUnit).toUpperCase(),
          qty: round2(Math.max(0.01, Math.min(nextQty, nextIsPack ? item.availablePack : item.availablePack * item.unitsPerPack))),
        };
      }),
    );
  };

  const removeItem = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const addMedicine = (medicine) => {
    const inventoryItemId = medicine.inventoryItemId ?? medicine.id;
    const liveStock = Math.max(0, Number(medicine.stock) || 0);
    const originalPack = originalPackByItem.current.get(String(inventoryItemId)) || 0;
    const availablePack = liveStock + originalPack;

    if (availablePack <= 0) {
      setError(`${medicine.name} is out of stock.`);
      return;
    }

    setItems((prev) => {
      const existing = prev.find(
        (item) => String(item.inventoryItemId) === String(inventoryItemId),
      );

      if (existing) {
        const max = maxSaleQty(existing);
        if (Number(existing.qty) + 1 > max + 1e-9) {
          setError(`Only ${formatQty(max)} ${existing.saleUnit} of ${existing.name} available.`);
          return prev;
        }

        return prev.map((item) =>
          item.key === existing.key
            ? { ...item, qty: round2(Number(item.qty) + 1) }
            : item,
        );
      }

      const unitsPerPack = Math.max(1, Number(medicine.unitsPerPack) || 1);

      return [
        ...prev,
        {
          key: `${inventoryItemId}-${Date.now()}-${Math.random()}`,
          inventoryItemId,
          productId: medicine.productId,
          name: medicine.name,
          batchNumber: medicine.batchNumber,
          expiryDate: medicine.expiryDate,
          unitsPerPack,
          unitLabel: String(medicine.unitLabel || 'UNIT').toUpperCase(),
          saleUnit: 'PACK',
          qty: 1,
          price: Number(medicine.sellingPrice ?? medicine.mrp ?? 0) || 0,
          discount: 0,
          gstPercentage: Number(medicine.gstPercentage) || 0,
          mrp: Number(medicine.mrp) || 0,
          availablePack,
        },
      ];
    });

    setError('');
    setSearch('');
    setSearchResults([]);
  };

  const handleSave = async () => {
    if (saving) return;

    if (!String(customer.name ?? '').trim()) {
      setError('Customer name is required.');
      return;
    }
    if (items.length === 0) {
      setError('Add at least one medicine before saving.');
      return;
    }

    const invalidQty = items.find((item) => !Number.isFinite(Number(item.qty)) || Number(item.qty) <= 0);
    if (invalidQty) {
      setError(`Enter a quantity greater than zero for ${invalidQty.name}.`);
      return;
    }

    const overStock = items.find((item) => Number(item.qty) > maxSaleQty(item) + 1e-9);
    if (overStock) {
      setError(
        `Only ${formatQty(maxSaleQty(overStock))} ${overStock.saleUnit} of ${overStock.name} available.`,
      );
      return;
    }

    const invalidPrice = items.find(
      (item) => !Number.isFinite(Number(item.price)) || Number(item.price) < 0,
    );
    if (invalidPrice) {
      setError(`Enter a valid price for ${invalidPrice.name}.`);
      return;
    }

    const invalidDiscount = items.find((item) => {
      const value = Number(item.discount || 0);
      return !Number.isFinite(value) || value < 0 || value > 100;
    });
    if (invalidDiscount) {
      setError(`Discount for ${invalidDiscount.name} must be between 0 and 100.`);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await updateSaleInvoice(invoice.id, {
        customer: {
          name: String(customer.name).trim(),
          phone: String(customer.phone ?? '').trim(),
          address: String(customer.address ?? '').trim(),
        },
        status,
        items: items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          qty: Number(item.qty),
          saleUnit: item.saleUnit,
          unitsPerPack: item.unitsPerPack,
          price: Number(item.price) || 0,
          discount: Number(item.discount) || 0,
          gstPercentage: Number(item.gstPercentage) || 0,
        })),
      });

      onSaved?.(response?.invoice ?? null);
      onOpenChange(false);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
        || requestError.message
        || 'Could not update the invoice.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[1080px]">
        <DialogHeader>
          <DialogTitle>Edit invoice {invoice?.invoiceNumber || ''}</DialogTitle>
          <DialogDescription>
            Change quantities, remove lines or add another medicine. Stock is reconciled when you
            save, and the original quantities are restored first.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="edit-invoice-customer" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Customer name
            </Label>
            <Input
              id="edit-invoice-customer"
              value={customer.name}
              onChange={(event) => setCustomer((prev) => ({ ...prev, name: event.target.value }))}
              className={fieldClass}
            />
          </div>
          <div>
            <Label htmlFor="edit-invoice-phone" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Phone
            </Label>
            <Input
              id="edit-invoice-phone"
              value={customer.phone}
              onChange={(event) => setCustomer((prev) => ({ ...prev, phone: event.target.value }))}
              className={fieldClass}
            />
          </div>
          <div>
            <Label htmlFor="edit-invoice-status" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Payment status
            </Label>
            <select
              id="edit-invoice-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={selectClass}
            >
              <option value="completed">Completed / paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <Label htmlFor="edit-invoice-address" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Address
            </Label>
            <Input
              id="edit-invoice-address"
              value={customer.address}
              onChange={(event) => setCustomer((prev) => ({ ...prev, address: event.target.value }))}
              className={fieldClass}
            />
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Invoice items
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Available stock already includes the quantity currently on this invoice.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {items.length} line{items.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="max-h-[42vh] overflow-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Medicine</th>
                  <th className="px-3 py-2.5 font-semibold">Qty</th>
                  <th className="px-3 py-2.5 font-semibold">Unit</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Price</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Disc %</th>
                  <th className="px-3 py-2.5 text-right font-semibold">GST %</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                      No items left. Add a medicine below or cancel the edit.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const max = maxSaleQty(item);
                    const over = Number(item.qty) > max + 1e-9;

                    return (
                      <tr key={item.key} className="align-top">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Batch {item.batchNumber || '—'}
                            {item.expiryDate ? ` · Exp ${String(item.expiryDate).slice(0, 10)}` : ''}
                          </p>
                          <p className={`mt-0.5 text-[10px] ${over ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>
                            Available {formatQty(max)} {item.saleUnit}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => changeQty(item.key, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                              aria-label={`Decrease quantity for ${item.name}`}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <Input
                              type="number"
                              min="0.01"
                              step={isPackUnit(item) ? '0.01' : '1'}
                              value={item.qty}
                              onChange={(event) => updateItem(item.key, 'qty', event.target.value)}
                              className={`h-8 w-20 text-center ${fieldClass}`}
                            />
                            <button
                              type="button"
                              onClick={() => changeQty(item.key, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                              aria-label={`Increase quantity for ${item.name}`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {item.unitsPerPack > 1 ? (
                            <select
                              value={item.saleUnit}
                              onChange={(event) => changeSaleUnit(item.key, event.target.value)}
                              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                            >
                              <option value="PACK">PACK</option>
                              <option value={item.unitLabel}>{item.unitLabel}</option>
                            </select>
                          ) : (
                            <span className="text-xs font-medium text-slate-500">{item.saleUnit}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(event) => updateItem(item.key, 'price', event.target.value)}
                            className={`h-8 w-24 text-right ${fieldClass}`}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.discount}
                            onChange={(event) => updateItem(item.key, 'discount', event.target.value)}
                            className={`h-8 w-20 text-right ${fieldClass}`}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.gstPercentage}
                            onChange={(event) => updateItem(item.key, 'gstPercentage', event.target.value)}
                            className={`h-8 w-20 text-right ${fieldClass}`}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(itemLineTotal(item))}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            aria-label={`Remove ${item.name} from the invoice`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <PackageSearch className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Add another medicine
            </h3>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search medicine, batch or salt"
              className={`pl-9 ${fieldClass}`}
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            )}
          </div>

          {search.trim().length >= 2 && (
            <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
              {searchResults.length === 0 && !searchLoading ? (
                <p className="px-3 py-4 text-center text-xs text-slate-500">
                  No medicines found for “{search.trim()}”.
                </p>
              ) : (
                searchResults.map((medicine) => {
                  const inventoryItemId = medicine.inventoryItemId ?? medicine.id;
                  const originalPack = originalPackByItem.current.get(String(inventoryItemId)) || 0;
                  const availablePack = Math.max(0, Number(medicine.stock) || 0) + originalPack;
                  const disabled = availablePack <= 0;

                  return (
                    <button
                      key={`${inventoryItemId}-${medicine.batchNumber || ''}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => addMedicine(medicine)}
                      className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left text-xs last:border-b-0 dark:border-slate-800 ${
                        disabled
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-900 dark:text-slate-100">
                          {medicine.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-slate-400">
                          Batch {medicine.batchNumber || '—'}
                          {medicine.expiryDate ? ` · Exp ${String(medicine.expiryDate).slice(0, 10)}` : ''}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className={`block font-semibold ${disabled ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          {formatQty(availablePack)} PACK
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          MRP {formatCurrency(medicine.mrp)}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-2 rounded-xl bg-slate-900 p-4 text-white sm:flex-row sm:items-end sm:justify-between">
          <div className="grid grid-cols-3 gap-4 text-xs text-slate-300">
            <div>
              <p className="uppercase tracking-wide text-slate-400">Subtotal</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(totals.subtotal)}</p>
            </div>
            <div>
              <p className="uppercase tracking-wide text-slate-400">Discount</p>
              <p className="mt-1 text-sm font-semibold text-rose-300">− {formatCurrency(totals.discount)}</p>
            </div>
            <div>
              <p className="uppercase tracking-wide text-slate-400">GST</p>
              <p className="mt-1 text-sm font-semibold text-emerald-300">+ {formatCurrency(totals.gst)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              New total
            </p>
            <p className="mt-0.5 text-2xl font-semibold">{formatCurrency(totals.total)}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving changes…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceEditDialog;

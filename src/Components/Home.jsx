import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Boxes,
  CheckCircle2,
  Clock3,
  ImagePlus,
  Loader2,
  Minus,
  PackageSearch,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';

import { Input } from './ui/input.jsx';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Label } from './ui/label.jsx';

import {
  getAllMedicines,
  findmedicineByName,
  saveInvoice
} from '../services/medicineService.js';

import { generateInvoicePdf } from '../utils/invoicePdf.js';
import { focusWhenPaletteClosed } from '../utils/focusWhenPaletteClosed.js';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog.jsx";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table.jsx";

import './home.css';

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

// Stock can be fractional (for example 1.5 strips), so keep the decimal part
// when showing quantities but drop meaningless trailing zeros.
const formatQty = (value) => {
  const num = Number(value) || 0;
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(2).replace(/\.?0+$/, '');
};

const itemPrice = (item) => {
  const value = Number(item.price);
  if (Number.isFinite(value)) return Math.max(0, value);
  return Math.max(0, Number(item.mrp) || 0);
};

const itemDiscount = (item) => {
  const value = Number(item.discount);
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
};

const PACK_UNIT_PATTERN = /^(PACK|PACKS|STRIP|STRIPS|BOX|BOXES|BOTTLE|BOTTLES|PIECE|PIECES|UNIT|UNITS)$/i;

const itemUnitsPerPack = (item) => Math.max(1, Number(item.unitsPerPack) || 1);

const itemSaleUnit = (item) => String(item.saleUnit || 'PACK').toUpperCase();

const itemIsLooseSale = (item) =>
  itemUnitsPerPack(item) > 1 && !PACK_UNIT_PATTERN.test(itemSaleUnit(item));

const itemPackQty = (item) => {
  const qty = Number(item.qty) || 0;
  const unitsPerPack = itemUnitsPerPack(item);
  return itemIsLooseSale(item) ? qty / unitsPerPack : qty;
};

const itemSaleUnitPrice = (item) => {
  const unitsPerPack = itemUnitsPerPack(item);
  return itemIsLooseSale(item) ? itemPrice(item) / unitsPerPack : itemPrice(item);
};

const lineSubtotal = (item) => itemPrice(item) * itemPackQty(item);

const lineDiscountAmount = (item) => lineSubtotal(item) * (itemDiscount(item) / 100);

const lineTotal = (item) => lineSubtotal(item) - lineDiscountAmount(item);

const createInvoiceNumber = () => `INV-${Math.floor(100000 + Math.random() * 900000)}`;

const MAX_PRESCRIPTION_BYTES = 8 * 1024 * 1024;
const PRESCRIPTION_MAX_DIMENSION = 1600;

const formatFileSize = (bytes) => {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Reads the selected image, downscales it and re-encodes it as JPEG so the
 * preview, stored invoice and PDF stay reasonably small.
 */
const preparePrescriptionImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Could not read the selected image.'));

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error('That file is not a valid image.'));

      image.onload = () => {
        const scale = Math.min(
          1,
          PRESCRIPTION_MAX_DIMENSION / Math.max(image.width, image.height)
        );
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.88),
          name: file.name,
          mimeType: 'image/jpeg',
          size: file.size,
          width,
          height
        });
      };

      image.src = String(reader.result || '');
    };

    reader.readAsDataURL(file);
  });

function Home() {

  const location = useLocation();
  const [open, setOpen] = useState(false);

  const [medicines, setMedicines] = useState([]);
  const [filterMedicine, setFilterMedicine] = useState([]);

  const [search, setSearch] = useState('');

  const [cart, setCart] = useState([]);

  const [status, setStatus] = useState('completed');

  const [saving, setSaving] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const [prescription, setPrescription] = useState(null);
  const [prescriptionError, setPrescriptionError] = useState('');
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [prescriptionDragging, setPrescriptionDragging] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState(createInvoiceNumber);

  const searchRequestRef = useRef(0);
  const prescriptionInputRef = useRef(null);

  useEffect(() => {
    return focusWhenPaletteClosed('#billing-search');
  }, [location.key]);

  useEffect(() => {
    fetchMedicinesSql();
  }, []);

  const fetchMedicinesSql = async () => {

    try {

      const data = await getAllMedicines();

      const validData = Array.isArray(data) ? data : [];

      setMedicines(validData);

      setFilterMedicine(validData);

    } catch (error) {

      console.error('Error fetching medicines:', error);

      setMedicines([]);
      setFilterMedicine([]);
    }
  };

  // Re-sync stock whenever the user returns to the tab so quantities sold in
  // another window are reflected before the next checkout.
  useEffect(() => {
    const refreshOnFocus = () => fetchMedicinesSql();
    window.addEventListener('focus', refreshOnFocus);
    return () => window.removeEventListener('focus', refreshOnFocus);
  }, []);

  useEffect(() => {
    const term = search.trim();

    if (!term) {
      searchRequestRef.current += 1;
      setFilterMedicine(medicines);
      setSearchLoading(false);
      return undefined;
    }
    const requestId = ++searchRequestRef.current;
    const timer = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const response = await findmedicineByName(term);

        // Ignore responses for a search term that is no longer current.
        if (requestId !== searchRequestRef.current) return;

        setFilterMedicine(Array.isArray(response) ? response : []);
      } catch (error) {
        if (requestId === searchRequestRef.current) {
          console.error("Search Error:", error);
          setFilterMedicine([]);
        }
      } finally {
        if (requestId === searchRequestRef.current) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, medicines]);

  // Keep bill lines aligned with the latest catalogue stock after a refetch
  // (for example when another till sells the same batch).
  useEffect(() => {
    if (medicines.length === 0) return;

    setCart((prevCart) => {
      let changed = false;

      const nextCart = prevCart.map((item) => {
        const latest = medicines.find((med) => String(med.id) === String(item.id));
        if (!latest) return item;

        const latestStock = Math.max(0, Number(latest.stock) || 0);
        if (latestStock === Number(item.stock)) return item;

        changed = true;
        return { ...item, stock: latestStock };
      });

      return changed ? nextCart : prevCart;
    });
  }, [medicines]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleCustomerChange = (e) => {

    const { name, value } = e.target;

    setCustomer((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const statusCheck = (e) => {
    setStatus(e.target.value);
  };

  const handlePrescriptionFile = async (file) => {
    if (!file || prescriptionLoading) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPrescriptionError('Please choose a JPG, PNG or WebP image.');
      return;
    }

    if (file.size > MAX_PRESCRIPTION_BYTES) {
      setPrescriptionError('Use an image smaller than 8 MB.');
      return;
    }

    setPrescriptionLoading(true);
    setPrescriptionError('');

    try {
      const prepared = await preparePrescriptionImage(file);
      setPrescription(prepared);
    } catch (error) {
      setPrescriptionError(error.message || 'Could not attach that image.');
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const handlePrescriptionChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    handlePrescriptionFile(file);
  };

  const handlePrescriptionDrop = (event) => {
    event.preventDefault();
    setPrescriptionDragging(false);
    handlePrescriptionFile(event.dataTransfer.files?.[0]);
  };

  const removePrescription = () => {
    setPrescription(null);
    setPrescriptionError('');
    if (prescriptionInputRef.current) prescriptionInputRef.current.value = '';
  };

  // Quantity currently reserved by the bill, keyed by inventory item id. Stock
  // shown to the cashier is the catalogue stock minus whatever is in the cart,
  // so adding/removing lines updates availability immediately.
  const cartQtyByItemId = useMemo(() => {
    const map = new Map();
    cart.forEach((item) => {
      map.set(String(item.id), itemPackQty(item));
    });
    return map;
  }, [cart]);

  const availableStockFor = (med) => {
    const total = Math.max(0, Number(med?.stock) || 0);
    const reserved = cartQtyByItemId.get(String(med?.id)) || 0;
    return Math.max(0, total - reserved);
  };

  const onAddClick = (med) => {
    const totalStock = Math.max(0, Number(med?.stock) || 0);
    const reserved = cartQtyByItemId.get(String(med?.id)) || 0;
    const available = Math.max(0, totalStock - reserved);
    const unitsPerPack = itemUnitsPerPack(med);
    const unitLabel = String(med.unitLabel || 'UNIT').toUpperCase();

    // One "Add" reserves a whole pack/strip. Loose units are entered in the
    // current bill line after adding the medicine.
    if (available < 1) {
      if (totalStock <= 0) {
        alert(`${med.name} is out of stock.`);
      } else if (reserved > 0) {
        alert(
          `Only ${formatQty(totalStock)} pack${totalStock === 1 ? '' : 's'} of ${med.name} in stock; ${formatQty(reserved)} ${reserved === 1 ? 'is' : 'are'} already in the bill.`
        );
      } else {
        alert(
          `Only ${formatQty(available)} pack${available === 1 ? '' : 's'} of ${med.name} available in stock.`
        );
      }
      return;
    }

    setCart((prevCart) => {
      const existingMed = prevCart.find(
        (item) => String(item.id) === String(med.id)
      );

      if (existingMed) {
        const currentPackQty = itemPackQty(existingMed);

        if (currentPackQty + 1 > totalStock) {
          return prevCart;
        }

        return prevCart.map((item) =>
          String(item.id) === String(med.id)
            ? {
              ...item,
              qty: round2(currentPackQty + 1),
              saleUnit: 'PACK',
              unitsPerPack,
              unitLabel
            }
            : item
        );
      }

      return [
        ...prevCart,
        {
          ...med,
          qty: 1,
          saleUnit: 'PACK',
          unitsPerPack,
          unitLabel,
          price: Number(med.mrp) || 0,
          discount: 0
        }
      ];
    });
  };

  const updateCartItem = (id, field, value) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        String(item.id) === String(id)
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const changeQty = (id, delta) => {
    const item = cart.find((entry) => String(entry.id) === String(id));
    if (!item) return;

    const totalStock = Math.max(0, Number(item.stock) || 0);
    const unitsPerPack = itemUnitsPerPack(item);
    const unitLabel = String(item.unitLabel || 'UNIT').toUpperCase();
    const nextQty = round2((Number(item.qty) || 0) + delta);

    if (nextQty <= 0) {
      setCart((prevCart) => prevCart.filter((entry) => String(entry.id) !== String(id)));
      return;
    }

    const nextPackQty = itemIsLooseSale(item)
      ? nextQty / unitsPerPack
      : nextQty;

    if (nextPackQty > totalStock + 1e-9) {
      alert(
        totalStock <= 0
          ? `${item.name} is out of stock.`
          : `Only ${formatQty(totalStock)} pack${totalStock === 1 ? '' : 's'} (${formatQty(totalStock * unitsPerPack)} ${unitLabel}) of ${item.name} available in stock.`
      );
      return;
    }

    setCart((prevCart) =>
      prevCart.map((entry) =>
        String(entry.id) === String(id)
          ? { ...entry, qty: nextQty }
          : entry
      )
    );
  };

  const increaseQty = (id) => changeQty(id, 1);

  const decreaseQty = (id) => changeQty(id, -1);

  const updateQty = (id, value) => {
    const item = cart.find((entry) => String(entry.id) === String(id));
    if (!item) return;

    const nextQty = Number(value);
    if (!Number.isFinite(nextQty) || nextQty <= 0) {
      updateCartItem(id, 'qty', value);
      return;
    }

    const totalStock = Math.max(0, Number(item.stock) || 0);
    const unitsPerPack = itemUnitsPerPack(item);
    const unitLabel = String(item.unitLabel || 'UNIT').toUpperCase();
    const nextPackQty = itemIsLooseSale(item)
      ? nextQty / unitsPerPack
      : nextQty;

    if (nextPackQty > totalStock + 1e-9) {
      alert(
        `Only ${formatQty(totalStock)} pack${totalStock === 1 ? '' : 's'} (${formatQty(totalStock * unitsPerPack)} ${unitLabel}) of ${item.name} available in stock.`
      );
      return;
    }

    updateCartItem(id, 'qty', value);
  };

  const updateSaleUnit = (id, nextUnit) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (String(item.id) !== String(id)) return item;

        const unitsPerPack = itemUnitsPerPack(item);
        const packQty = itemPackQty(item);
        const stock = Math.max(0, Number(item.stock) || 0);
        const packSale = PACK_UNIT_PATTERN.test(nextUnit);
        const maxQty = packSale ? stock : stock * unitsPerPack;
        const nextQty = Math.min(packSale ? packQty : packQty * unitsPerPack, maxQty);

        return {
          ...item,
          saleUnit: String(nextUnit).toUpperCase(),
          unitsPerPack,
          qty: round2(Math.max(0.01, nextQty))
        };
      })
    );
  };

  const onDeleteClick = (id) => {

    setCart((prevCart) =>

      prevCart.filter(
        (item) => String(item.id) !== String(id)
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    removePrescription();
  };

  const subtotal = round2(
    cart.reduce((acc, item) => acc + lineSubtotal(item), 0)
  );

  const totalDiscount = round2(
    cart.reduce((acc, item) => acc + lineDiscountAmount(item), 0)
  );

  const totalAmount = round2(subtotal - totalDiscount);

  const addBillFn = async () => {

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    if (saving) return;

    const invalidPrice = cart.find((item) => {
      const value = Number(item.price);
      return !Number.isFinite(value) || value < 0;
    });

    if (invalidPrice) {
      alert(`Enter a valid price for ${invalidPrice.name}.`);
      return;
    }

    const invalidDiscount = cart.find((item) => {
      const value = Number(item.discount || 0);
      return !Number.isFinite(value) || value < 0 || value > 100;
    });

    if (invalidDiscount) {
      alert(`Discount for ${invalidDiscount.name} must be between 0 and 100.`);
      return;
    }

    const invalidQty = cart.find((item) => {
      const qty = Number(item.qty);
      return !Number.isFinite(qty) || qty <= 0;
    });

    if (invalidQty) {
      alert(`Enter a quantity greater than 0 for ${invalidQty.name}.`);
      return;
    }

    // Final guard against stale stock: the catalogue may have changed since the
    // line was added (another till, a cancelled invoice, etc.).
    const overStockItem = cart.find((item) => {
      const stock = Number(item.stock);
      const qty = itemPackQty(item);
      return !Number.isFinite(stock) || qty > stock + 1e-9;
    });

    if (overStockItem) {
      const stock = Math.max(0, Number(overStockItem.stock) || 0);
      const unitsPerPack = itemUnitsPerPack(overStockItem);
      const unitLabel = String(overStockItem.unitLabel || 'UNIT').toUpperCase();
      alert(
        `Only ${formatQty(stock)} pack${stock === 1 ? '' : 's'} (${formatQty(stock * unitsPerPack)} ${unitLabel}) of ${overStockItem.name} available in stock. Reduce the quantity before checkout.`
      );
      return;
    }

    const invoiceDate = new Date().toISOString();

    const invoicePayload = {
      invoiceNumber,
      // Retrying the same checkout must not deduct stock twice.
      idempotencyKey: invoiceNumber,
      customer: {
        ...customer,
        name: customer.name.trim()
      },
      items: cart.map((item) => ({
        inventoryItemId: item.inventoryItemId ?? item.id,
        qty: Number(item.qty) || 0,
        saleUnit: item.saleUnit || 'PACK',
        unitsPerPack: itemUnitsPerPack(item),
        price: itemPrice(item),
        discount: itemDiscount(item)
      })),
      subtotal,
      totalDiscount,
      total: totalAmount,
      status,
      date: invoiceDate,
      prescription: prescription
        ? {
            name: prescription.name,
            mimeType: prescription.mimeType,
            width: prescription.width,
            height: prescription.height,
            dataUrl: prescription.dataUrl
          }
        : null
    };

    setSaving(true);

    try {

      // The server snapshots the lines, validates stock and deducts quantity
      // inside one transaction. The PDF is built from that saved snapshot.
      const response = await saveInvoice(invoicePayload);
      const savedInvoice = response?.invoice;

      if (!savedInvoice) {
        throw new Error('The invoice was saved without a server snapshot.');
      }

      const pdfItems = (savedInvoice.items ?? savedInvoice.medicines ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        qty: Number(item.saleQuantity ?? item.qty ?? item.quantity) || 0,
        saleQuantity: Number(item.saleQuantity ?? item.qty ?? item.quantity) || 0,
        saleUnit: item.saleUnit || 'PACK',
        unitsPerPack: Number(item.unitsPerPack) || 1,
        mrp: Number(item.mrp) || 0,
        price: Number(item.saleUnitPrice ?? item.price ?? item.unitPrice ?? item.mrp) || 0,
        discount: Number(item.discount ?? item.discountPercent) || 0,
        discountAmount: Number(item.discountAmount) || 0,
        lineTotal: Number(item.lineTotal) || 0,
        batchNumber: item.batchNumber ?? item.batchNumberSnapshot,
        expiryDate: item.expiryDate ?? item.expiryDateSnapshot
      }));

      generateInvoicePdf({
        invoiceNumber: savedInvoice.invoiceNumber ?? invoiceNumber,
        date: savedInvoice.date ?? invoiceDate,
        customer: savedInvoice.customer ?? invoicePayload.customer,
        items: pdfItems,
        subtotal: savedInvoice.subtotal ?? subtotal,
        totalDiscount: savedInvoice.totalDiscount ?? totalDiscount,
        total: savedInvoice.total ?? totalAmount,
        status: savedInvoice.status ?? status,
        prescription: savedInvoice.prescription ?? prescription
      });

      // RESET
      setCart([]);

      setCustomer({
        name: '',
        phone: '',
        address: ''
      });

      setStatus('completed');

      setSearch('');

      removePrescription();

      setOpen(false);

      setInvoiceNumber(createInvoiceNumber());

      // REFRESH
      fetchMedicinesSql();

      alert("Invoice Saved Successfully");

    } catch (error) {

      console.error("Error saving invoice:", error);

      const message =
        error?.response?.data?.message
        || error?.response?.data?.error
        || "Failed to save invoice";

      if (error?.response?.status === 409) {
        // Stock changed while the bill was open. Refresh the catalogue so the
        // cashier can correct quantities before retrying.
        await fetchMedicinesSql();
        alert(`${message}\n\nThe product list has been refreshed.`);
      } else {
        alert(message);
      }

    } finally {

      setSaving(false);
    }
  };

  return (

    <main
      id='main-top-container'
      className="h-full min-w-0 flex-1 overflow-auto bg-slate-50 p-4 pb-24 md:p-6 lg:pb-6"
    >
      <div className="mx-auto max-w-[1500px] space-y-5">

        <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-indigo-100/60 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 text-white shadow-md shadow-blue-600/20">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">
                  Point of sale
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Billing</h1>
                <p className="mt-1 max-w-xl text-sm text-slate-500">
                  Search stock, build the current bill and generate an invoice in a few clicks.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <Receipt className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">Invoice</span>
                <span className="font-mono text-[11px] text-slate-500">{invoiceNumber}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <ShoppingCart className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">
                  {cart.length} item{cart.length === 1 ? '' : 's'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-slate-700">₹ {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">

          {/* PRODUCTS */}

          <div className="min-w-0 space-y-5">

            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="billing-search"
                className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-28 text-sm shadow-sm"
                placeholder="Search medicine, salt or batch number…"
                value={search}
                onChange={handleSearchChange}
              />
              {searchLoading && (
                <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Searching
                </span>
              )}
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Available products</h2>

                  </div>
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  {cart.length} in cart
                </Badge>
              </div>

              <div className="max-h-[62vh] overflow-auto">
                <table className="w-full min-w-[340px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-3 font-semibold sm:px-4">Medicine</th>
                      <th className="px-2 py-3 font-semibold sm:px-3">Available</th>
                      <th className="hidden px-2 py-3 text-right font-semibold sm:table-cell sm:px-3">Price</th>
                      <th className="px-3 py-3 text-right font-semibold sm:px-4">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filterMedicine.length > 0 ? (
                      filterMedicine.map((med) => {
                        const totalStock = Math.max(0, Number(med.stock) || 0);
                        const reservedQty = cartQtyByItemId.get(String(med.id)) || 0;
                        const availableStock = availableStockFor(med);
                        const inStock = totalStock > 0;
                        const canAdd = availableStock >= 1;
                        const inCart = reservedQty > 0;

                        return (
                          <tr key={med.id} className="transition hover:bg-slate-50/70">
                            <td className="px-3 py-3 sm:px-4">
                              <div className="font-semibold text-slate-900">{med.name}</div>
                              {med.saltSummary && (
                                <div className="mt-0.5 text-[11px] font-medium text-blue-600">
                                  {med.saltSummary}
                                </div>
                              )}
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                <span>Batch {med.batchNumber || '—'}</span>
                                <span className="text-slate-300">·</span>
                                <span className="whitespace-nowrap">Exp {med.expiryDate || '—'}</span>
                                <span className="whitespace-nowrap sm:hidden">
                                  ₹ {Number(med.mrp).toFixed(2)}
                                </span>
                                {inCart && (
                                  <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                                    {formatQty(reservedQty)} in bill
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-3 sm:px-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  canAdd
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : inStock
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-rose-50 text-rose-600'
                                }`}
                              >
                                {formatQty(availableStock)}
                              </span>
                              {reservedQty > 0 && (
                                <p className="mt-1 whitespace-nowrap text-[10px] font-medium text-slate-400">
                                  {formatQty(totalStock)} total
                                </p>
                              )}
                            </td>
                            <td className="hidden whitespace-nowrap px-2 py-3 text-right font-semibold text-slate-900 sm:table-cell sm:px-3">
                              ₹ {Number(med.mrp).toFixed(2)}
                            </td>
                            <td className="px-3 py-3 text-right sm:px-4">
                              {inStock ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => onAddClick(med)}
                                  aria-disabled={!canAdd}
                                  title={canAdd ? undefined : 'Stock limit reached'}
                                  className={
                                    canAdd
                                      ? 'gap-1.5 bg-slate-900 text-white shadow-sm hover:bg-slate-800'
                                      : 'gap-1.5 border border-amber-200 bg-amber-50 text-amber-700 shadow-none hover:bg-amber-100'
                                  }
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  {canAdd ? 'Add' : 'Max'}
                                </Button>
                              ) : (
                                <Badge variant="secondary" className="bg-rose-50 text-rose-600">
                                  <span className="sm:hidden">Out</span>
                                  <span className="hidden sm:inline">Out of stock</span>
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-14 text-center">
                          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <PackageSearch className="h-5 w-5" />
                          </div>
                          <p className="mt-3 text-sm font-semibold text-slate-800">No medicines found</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Try a different name, salt or batch number.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

          </div>

          {/* CURRENT BILL */}

          <div className="min-w-0 space-y-5">

            <section
              id="cart-container"
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Current bill</h2>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">{invoiceNumber}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  {cart.length} item{cart.length === 1 ? '' : 's'}
                </Badge>
              </div>

              <div className="max-h-[46vh] space-y-2.5 overflow-auto p-4">
                {cart.length > 0 ? (
                  cart.map((med) => (
                    <article
                      key={med.id}
                      className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{med.name}</p>
                          {med.saltSummary && (
                            <p className="mt-0.5 text-[11px] font-medium text-blue-600">
                              {med.saltSummary}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-slate-500">
                            Batch {med.batchNumber || '—'} · Stock {formatQty(med.stock)}
                            {Number(med.unitsPerPack) > 1 && (
                              <span className="text-slate-400">
                                {' '}({formatQty(Number(med.stock) * Number(med.unitsPerPack))} {String(med.unitLabel || 'UNIT').toUpperCase()})
                              </span>
                            )}
                            {Number(med.stock) > 0 && (
                              <span className="text-slate-400">
                                {' '}· {formatQty(Math.max(0, (Number(med.stock) || 0) - itemPackQty(med)))} pack{(Number(med.stock) || 0) - itemPackQty(med) === 1 ? '' : 's'} left after this bill
                              </span>
                            )}
                          </p>
                          {Number(med.unitsPerPack) <= 1 &&
                            med.unitLabel &&
                            !['UNIT', 'PACK'].includes(String(med.unitLabel).toUpperCase()) && (
                              <p className="mt-1 text-[10px] font-medium text-amber-600">
                                Set units per pack in Inventory to sell loose{' '}
                                {String(med.unitLabel).toUpperCase()}.
                              </p>
                            )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            ₹ {lineTotal(med).toFixed(2)}
                          </p>
                          {lineDiscountAmount(med) > 0 && (
                            <p className="text-[11px] font-medium text-rose-500">
                              − ₹ {lineDiscountAmount(med).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <div>
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Qty
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                              <button
                                type="button"
                                onClick={() => decreaseQty(med.id)}
                                aria-label={`Decrease quantity for ${med.name}`}
                                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <Input
                                type="number"
                                min="0.01"
                                step={itemIsLooseSale(med) ? '1' : '0.01'}
                                value={med.qty ?? ''}
                                onChange={(event) => updateQty(med.id, event.target.value)}
                                aria-label={`Quantity for ${med.name}`}
                                className="h-6 w-14 border-0 bg-transparent px-0 text-center text-sm font-semibold text-slate-900 shadow-none focus-visible:ring-0"
                              />
                              <button
                                type="button"
                                onClick={() => increaseQty(med.id)}
                                aria-label={`Increase quantity for ${med.name}`}
                                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {Number(med.unitsPerPack) > 1 && med.unitLabel && (
                              <select
                                value={itemSaleUnit(med)}
                                onChange={(event) => updateSaleUnit(med.id, event.target.value)}
                                aria-label={`Selling unit for ${med.name}`}
                                className="h-8 rounded-lg border border-slate-200 bg-white px-1.5 text-xs font-medium text-slate-700 shadow-none outline-none focus:border-blue-500"
                              >
                                <option value="PACK">PACK</option>
                                <option value={String(med.unitLabel).toUpperCase()}>
                                  {String(med.unitLabel).toUpperCase()}
                                </option>
                              </select>
                            )}
                          </div>
                        </div>

                        <div className="min-w-[86px] flex-1">
                          <label
                            htmlFor={`price-${med.id}`}
                            className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                          >
                            Pack price ₹
                          </label>
                          <Input
                            id={`price-${med.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={med.price}
                            onChange={(e) => updateCartItem(med.id, 'price', e.target.value)}
                            className="h-8 rounded-lg border-slate-200 bg-white px-2 text-right text-sm shadow-none"
                          />
                          {itemIsLooseSale(med) && (
                            <p className="mt-1 text-[10px] text-slate-400">
                              ₹ {itemSaleUnitPrice(med).toFixed(2)} / {itemSaleUnit(med)}
                            </p>
                          )}
                        </div>

                        <div className="min-w-[74px] flex-1">
                          <label
                            htmlFor={`discount-${med.id}`}
                            className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                          >
                            Disc %
                          </label>
                          <Input
                            id={`discount-${med.id}`}
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={med.discount}
                            onChange={(e) => updateCartItem(med.id, 'discount', e.target.value)}
                            className="h-8 rounded-lg border-slate-200 bg-white px-2 text-right text-sm shadow-none"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteClick(med.id)}
                          aria-label={`Remove ${med.name} from bill`}
                          className="h-8 w-8 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-800">Your bill is empty</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Add products from the list to start billing.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {cart.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Customer details</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      The customer name is required before checkout.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label
                      htmlFor="customer-name"
                      className="mb-1.5 block text-xs font-medium text-slate-600"
                    >
                      Customer name
                    </Label>
                    <Input
                      id="customer-name"
                      name="name"
                      placeholder="Customer name"
                      value={customer.name}
                      onChange={handleCustomerChange}
                      className="h-9 border-slate-200 bg-white text-sm shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="customer-phone"
                      className="mb-1.5 block text-xs font-medium text-slate-600"
                    >
                      Phone number
                    </Label>
                    <Input
                      id="customer-phone"
                      name="phone"
                      type="tel"
                      placeholder="Phone number"
                      value={customer.phone}
                      onChange={handleCustomerChange}
                      className="h-9 border-slate-200 bg-white text-sm shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">Status</span>
                    <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                      <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-slate-500 transition has-[:checked]:bg-white has-[:checked]:text-emerald-700 has-[:checked]:shadow-sm">
                        <input
                          type="radio"
                          value="completed"
                          checked={status === 'completed'}
                          onChange={statusCheck}
                          className="sr-only"
                        />
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Paid
                      </label>

                      <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-slate-500 transition has-[:checked]:bg-white has-[:checked]:text-amber-700 has-[:checked]:shadow-sm">
                        <input
                          type="radio"
                          value="pending"
                          checked={status === 'pending'}
                          onChange={statusCheck}
                          className="sr-only"
                        />
                        <Clock3 className="h-3.5 w-3.5" />
                        Pending
                      </label>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <Label
                      htmlFor="customer-address"
                      className="mb-1.5 block text-xs font-medium text-slate-600"
                    >
                      Address
                    </Label>
                    <Input
                      id="customer-address"
                      name="address"
                      placeholder="Address"
                      value={customer.address}
                      onChange={handleCustomerChange}
                      className="h-9 border-slate-200 bg-white text-sm shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ImagePlus className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">
                        Prescription image
                        <span className="ml-1 font-normal text-slate-400">(optional)</span>
                      </span>
                    </div>

                    {prescription && (
                      <button
                        type="button"
                        onClick={removePrescription}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <X className="h-3 w-3" />
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    ref={prescriptionInputRef}
                    id="prescription-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={prescriptionLoading}
                    onChange={handlePrescriptionChange}
                    className="sr-only"
                  />

                  {prescription ? (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                      <img
                        src={prescription.dataUrl}
                        alt="Prescription preview"
                        className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-white object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-800">
                          {prescription.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {formatFileSize(prescription.size)} · attached to this invoice and its PDF
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={prescriptionLoading}
                            onClick={() => prescriptionInputRef.current?.click()}
                            className="h-7 gap-1.5 border-slate-200 bg-white px-2 text-[11px] text-slate-600 hover:bg-slate-100"
                          >
                            {prescriptionLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ImagePlus className="h-3 w-3" />
                            )}
                            Replace
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => prescriptionInputRef.current?.click()}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setPrescriptionDragging(true);
                      }}
                      onDragLeave={() => setPrescriptionDragging(false)}
                      onDrop={handlePrescriptionDrop}
                      disabled={prescriptionLoading}
                      className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition ${
                        prescriptionDragging
                          ? 'border-blue-400 bg-blue-50/70 ring-2 ring-blue-500/15'
                          : 'border-slate-300 bg-slate-50/40 hover:border-blue-300 hover:bg-blue-50/40'
                      }`}
                    >
                      {prescriptionLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      ) : (
                        <UploadCloud className="h-5 w-5 text-slate-400" />
                      )}
                      <span className="text-xs font-medium text-slate-700">
                        {prescriptionLoading
                          ? 'Adding prescription…'
                          : 'Drop a prescription image here or browse'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        JPG, PNG or WebP · up to 8 MB
                      </span>
                    </button>
                  )}

                  {prescriptionError && (
                    <p className="mt-2 text-xs font-medium text-rose-600">{prescriptionError}</p>
                  )}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-slate-900 bg-slate-900 p-5 text-white shadow-md shadow-slate-900/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Bill summary
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">Payment details</h3>
                </div>
                <Badge className="border-white/10 bg-white/10 text-slate-200">
                  {cart.length} item{cart.length === 1 ? '' : 's'}
                </Badge>
              </div>

              <div className="mt-5 space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-medium text-white">₹ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Discount</span>
                  <span className="font-medium text-rose-300">− ₹ {totalDiscount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Total payable
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                      ₹ {totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <Receipt className="h-5 w-5 text-slate-500" />
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      disabled={cart.length === 0 || customer.name.trim() === '' || saving}
                      className="mt-4 w-full gap-2 bg-white text-slate-900 shadow-sm hover:bg-slate-100"
                    >
                      <Receipt className="h-4 w-4" />
                      Review & checkout
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[860px] [&>button]:text-white/70 [&>button]:hover:text-white">
                    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-5 text-white">
                      <DialogHeader>
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl border border-white/10 bg-white/10 p-2 text-white">
                            <Receipt className="h-5 w-5" />
                          </div>
                          <div>
                            <DialogTitle className="text-lg font-semibold tracking-tight text-white">
                              SAABIT PHARMACY
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-xs text-slate-300">
                              Review the invoice before saving and generating the PDF.
                            </DialogDescription>
                          </div>
                        </div>
                      </DialogHeader>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 font-mono">
                          Invoice {invoiceNumber}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1">
                          Customer: {customer.name || '—'}
                        </span>
                        {customer.phone && (
                          <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1">
                            Phone: {customer.phone}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2.5 py-1 font-medium ${
                            status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {status === 'completed' ? 'Paid' : 'Pending'}
                        </span>
                        {prescription && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/15 px-2.5 py-1 font-medium text-blue-200">
                            <ImagePlus className="h-3 w-3" />
                            Prescription attached
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-[46vh] overflow-auto px-6 py-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Batch</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Disc.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {cart.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium text-slate-800">
                                {item.name}
                              </TableCell>
                              <TableCell className="text-slate-500">{item.batchNumber}</TableCell>
                              <TableCell className="text-slate-500">
                                {formatQty(item.qty)} {itemSaleUnit(item)}
                              </TableCell>
                              <TableCell className="text-right text-slate-600">
                                ₹ {itemSaleUnitPrice(item).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-slate-600">
                                {itemDiscount(item) > 0 ? `${itemDiscount(item)}%` : '—'}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-slate-900">
                                ₹ {lineTotal(item).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                      <div className="ml-auto w-full max-w-[280px] space-y-1.5 text-sm">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Subtotal</span>
                          <span className="font-medium text-slate-800">₹ {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Discount</span>
                          <span className="font-medium text-rose-500">
                            − ₹ {totalDiscount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                          <span>Grand total</span>
                          <span>₹ {totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      <DialogFooter className="mt-4 gap-2 sm:justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpen(false)}
                          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        >
                          Cancel
                        </Button>

                        <Button
                          type="button"
                          onClick={addBillFn}
                          disabled={saving}
                          className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving…
                            </>
                          ) : (
                            <>
                              <Receipt className="h-4 w-4" />
                              Save & generate PDF
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-400">
                    {customer.name.trim() === ''
                      ? 'Add a customer name to enable checkout.'
                      : 'Ready to save and generate the PDF.'}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="h-7 shrink-0 px-2 text-[11px] text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    Clear cart
                  </Button>
                </div>
              </div>
            </section>

          </div>

        </div>

      </div>

    </main>
  );
}


export default Home;
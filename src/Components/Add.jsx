import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  CreditCard,
  FileText,
  Keyboard,
  PackagePlus,
  PlusCircle,
  Users,
} from 'lucide-react';
import './add.css';
import { TabContentAddPurchase, TabContentAddSupplier, TabContentAddPayment, TabContentAddExpiry, TabContentAddCreditNote } from './Tabs/index.js'
import { addNewExpiry } from '../services/medicineService.js';
import { fetchAllSuppliers } from '@/hooks/useSupplier.js';
import { addNewSupplier } from '@/hooks/useAddSupplier.js';
import { addNewPayment } from '@/hooks/useAddPayment.js';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch.js';
import { addNewBill } from '@/hooks/useAddBill.js';
import { handleSupplierSelect } from '@/utils/supplierHelpers.js';
import { focusWhenPaletteClosed } from '@/utils/focusWhenPaletteClosed.js';
import { handleAddProduct } from '@/utils/addProductHelper.js';
import { calculateBillTotals } from '@/utils/billingCalculationsHelper.js';
import { getExpiryStatus, parseIsoDate, todayIsoDate } from '@/utils/expiryHelpers.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.jsx"
import { Button } from './ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.jsx';
import BillImageUpload from './BillImageUpload.jsx';

const ADD_TABS = [
  { value: 'add-purchase', label: 'Add Item', icon: PackagePlus },
  { value: 'add-supplier', label: 'Add Supplier', icon: Users },
  { value: 'add-payment', label: 'Add Payment', icon: CreditCard },
  { value: 'add-expiry', label: 'Add Expiry', icon: CalendarClock },
  { value: 'add-credit-note', label: 'Credit Note', icon: FileText },
];

const VALID_TABS = ADD_TABS.map((tab) => tab.value);

const kbdClass =
  'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-slate-300/80 bg-white px-1 font-sans text-[10px] font-semibold text-slate-500 shadow-[0_1px_0_rgba(15,23,42,0.06)]';

const SHORTCUTS = [
  { keys: ['Alt', '↑', '↓'], label: 'Move between product rows' },
  { keys: ['Alt', '←', '→'], label: 'Move between product fields' },
  { keys: ['Ctrl', 'Enter'], label: 'Add a product line' },
  { keys: ['Ctrl', 'Shift', 'A'], label: 'Add a product line' },
  { keys: ['Ctrl', 'Shift', 'Backspace'], label: 'Delete the focused product line' },
  { keys: ['Ctrl', 'Shift', 'S'], label: 'Save purchase bill' },
  { keys: ['Ctrl', 'K'], label: 'Open command palette' },
];

const ShortcutRow = ({ keys, label }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
    <span className="text-xs text-slate-600">{label}</span>
    <span className="flex shrink-0 items-center gap-1">
      {keys.map((key) => (
        <kbd key={key} className={kbdClass}>
          {key}
        </kbd>
      ))}
    </span>
  </div>
);

function Add() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const location = useLocation();
  const requestedTab = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(requestedTab) ? requestedTab : 'add-purchase';

  const handleTabChange = (value) => {
    if (value === 'add-purchase') {
      setSearchParams({}, { replace: true });
      return;
    }

    setSearchParams({ tab: value }, { replace: true });
  };

  // Command Palette navigation sets this flag so the section's primary input
  // is focused as soon as the tab is on screen.
  const focusPrimary = location.state?.focusPrimary;
  const requestedFocus = location.state?.focusTarget;
  const handledFocusRef = useRef(null);

  useEffect(() => {
    if (!focusPrimary || handledFocusRef.current === focusPrimary) return undefined;

    const selectors = {
      'add-purchase': '#purchase-invoice',
      'add-payment': '#payment-invoice',
      'add-supplier': '#new-supplier-name',
      'add-expiry': '#expiry-supplier',
      'add-credit-note': '#credit-note-number',
      'purchase-invoice': '#purchase-invoice',
      'payment-invoice': '#payment-invoice',
      'new-supplier-name': '#new-supplier-name',
      'expiry-supplier': '#expiry-supplier',
      'credit-note-number': '#credit-note-number',
    };

    const selector = selectors[requestedFocus] || selectors[activeTab];
    if (!selector) return undefined;

    return focusWhenPaletteClosed(selector, {
      onFocused: () => {
        handledFocusRef.current = focusPrimary;
      },
    });
  }, [activeTab, focusPrimary, requestedFocus]);


  const [formData, setFormData] = useState({
    invoice: '',
    date: '',
    supplierName: '',
    supplierDrugLn: '',
    supplierContact: '',
    products: []
  });
  const [searchedMedTxt, setSearchedMedTxt] = useState('');
  //for expiry
  const [expiryFormData, setExpiryFormData] = useState({
    date: todayIsoDate(),
    supplierName: '',
    supplierDrugLn: '',
    supplierContact: '',
    products: []
  })
  //for expiry
  const [expiryProducts, setExpiryProducts] = useState([
    {
      id: Date.now(),
      name: "",
      batchNumber: "",
      expiryDate: "",
      stock: 0,
      mrp: 0,
    },
  ])
  const [products, setProducts] = useState([
    {
      id: Date.now(),
      name: "",
      batchNumber: "",
      expiryDate: "",
      stock: 0,
      unitPrice: 0,
      mrp: 0,
      discount: 0,
      gstPercentage: 0,
    },
  ])
  const [newPaymentDetails, setNewPaymentDetails] = useState({
    date: '',
    invoice: '',
    supplierName: '',
    drugLicenseNumber: '',
    total: ''
  })
  const [newSupplierDetails, setNewSupplierDetails] = useState({
    supplierName: '',
    phoneNumber: '',
    drugLn: '',
    supplierBalance: ''
  })
  const [allSuppliersSql, setAllSuppliersSqlite] = useState([])

  const { totalAmount, totalDiscount, totalGst } = calculateBillTotals(products);



  const pendingProductFocus = useRef(null);

  const focusProductField = useCallback((rowIndex, fieldIndex = 0) => {
    const rows = Array.from(document.querySelectorAll('[data-product-row]'));
    if (!rows.length) return;

    const safeRow = Math.max(0, Math.min(rowIndex, rows.length - 1));
    const fields = Array.from(rows[safeRow].querySelectorAll('[data-product-input]'));
    if (!fields.length) return;

    const safeField = Math.max(0, Math.min(fieldIndex, fields.length - 1));
    const target = fields[safeField];

    if (target) {
      target.focus({ preventScroll: false });
      if (typeof target.select === 'function') target.select();
    }
  }, []);

  const addProductAndFocus = useCallback(() => {
    pendingProductFocus.current = { rowIndex: products.length, fieldIndex: 0 };
    handleAddProduct(setProducts);
  }, [products.length, setProducts]);

  // Keep the newly created product line focused without stealing focus on load.
  useEffect(() => {
    if (!pendingProductFocus.current) return;

    const target = pendingProductFocus.current;
    pendingProductFocus.current = null;

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => focusProductField(target.rowIndex, target.fieldIndex));
    });

    return () => cancelAnimationFrame(frame);
  }, [products.length, focusProductField]);

  // Ctrl/Cmd + Shift + A adds a product and focuses its first field.
  useEffect(() => {
    if (activeTab !== 'add-purchase') return undefined;

    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        addProductAndFocus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, addProductAndFocus]);

  // Alt/Ctrl + Arrow moves focus between product rows and fields.
  useEffect(() => {
    if (activeTab !== 'add-purchase') return undefined;

    const handleKeyDown = (event) => {
      const input = event.target?.closest?.('[data-product-input]');
      if (!input) return;

      const row = input.closest('[data-product-row]');
      const rows = Array.from(document.querySelectorAll('[data-product-row]'));
      const rowIndex = rows.indexOf(row);
      if (rowIndex === -1) return;

      const fields = Array.from(row.querySelectorAll('[data-product-input]'));
      const fieldIndex = fields.indexOf(input);
      if (fieldIndex === -1) return;

      const arrows = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];

      if ((event.altKey || event.ctrlKey || event.metaKey) && !event.shiftKey && arrows.includes(event.key)) {
        event.preventDefault();

        if (event.key === 'ArrowDown') {
          if (rowIndex === rows.length - 1) {
            pendingProductFocus.current = { rowIndex: rowIndex + 1, fieldIndex };
            handleAddProduct(setProducts);
          } else {
            focusProductField(rowIndex + 1, fieldIndex);
          }
          return;
        }

        if (event.key === 'ArrowUp') {
          focusProductField(rowIndex - 1, fieldIndex);
          return;
        }

        if (event.key === 'ArrowRight') {
          if (fieldIndex < fields.length - 1) {
            focusProductField(rowIndex, fieldIndex + 1);
          } else if (rowIndex < rows.length - 1) {
            focusProductField(rowIndex + 1, 0);
          }
          return;
        }

        if (event.key === 'ArrowLeft') {
          if (fieldIndex > 0) {
            focusProductField(rowIndex, fieldIndex - 1);
          } else if (rowIndex > 0) {
            const previousFields = rows[rowIndex - 1].querySelectorAll('[data-product-input]');
            focusProductField(rowIndex - 1, Math.max(previousFields.length - 1, 0));
          }
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        addProductAndFocus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, addProductAndFocus, focusProductField, setProducts]);

  const stateRef = useRef();
  stateRef.current = { formData, products, totalAmount, totalDiscount, totalGst };

  useEffect(() => {
    if (activeTab !== 'add-purchase') return undefined;

    const handleKeyDown = (event) => {
      // Ctrl + Shift + S (Cmd + Shift + S on Mac)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "s") {
        event.preventDefault();

        const { formData, products, totalAmount, totalDiscount, totalGst } = stateRef.current;

        addNewBill(
          formData,
          products,
          setFormData,
          setProducts,
          totalAmount,
          totalDiscount,
          totalGst
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTab]);

  // Fetch and load all suppliers from the custom hook on component mount
  useEffect(() => {
    const fetchingSuppliers = async () => {
      const data = await fetchAllSuppliers();
      setAllSuppliersSqlite(data);
    }
    fetchingSuppliers()
  }, []);

  const searchedMed = useDebouncedSearch(searchedMedTxt);


  const handleInputChange = (id, field, value) => {
    setSearchedMedTxt(value)
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, [field]: value, supplier: formData.supplierName, } : product
      )
    );
  };


  const handleInputChangeSearch = (id, field, value) => {
    setSearchedMedTxt(value); // update typing

    if (!value.trim()) {
      // setSearchedMed([]);

      setProducts(prev =>
        prev.map(product =>
          product.id === id
            ? {
              ...product,
              [field]: "",
              unitPrice: "",
              mrp: "",
              discount: "",
              gstPercentage: "",
              category: "",
              salts: undefined,
            }
            : product
        )
      );

      return;
    }

    // check if selected from search results
    const selectedMed = searchedMed.find(med => med.name === value);

    if (selectedMed) {
      setProducts(prev =>
        prev.map(product =>
          product.id === id
            ? {
              ...product,
              name: selectedMed.name,
              unitPrice: selectedMed.unitPrice,
              mrp: selectedMed.mrp,
              discount: selectedMed.discount,
              gstPercentage: selectedMed.gstPercentage,
              category: selectedMed.category,
              [field]: value,
              supplier: formData.supplierName,
              // Prefill the medicine's existing composition. undefined keeps it
              // untouched when the payload is submitted.
              salts: Array.isArray(selectedMed.salts) ? selectedMed.salts : undefined,
            }
            : product
        )
      );
    } else {
      // allow manual typing
      setProducts(prev =>
        prev.map(product =>
          product.id === id
            ? { ...product, [field]: value, supplier: formData.supplierName }
            : product
        )
      );
    }
  };

  // Salts are optional and attach to the medicine, not the batch. This is kept
  // separate from handleInputChange because typing a product name drives the
  // search box, while editing salts must not.
  const handleSaltsChange = (id, salts) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? { ...product, salts: Array.isArray(salts) ? salts : undefined }
          : product
      )
    );
  };



  //input change for expiry
  const handleInputChangeExpiry = (id, field, value) => {
    setExpiryProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, [field]: value, supplier: expiryFormData.supplierName, } : product
      )
    );
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value.toUpperCase().replace(/\s+/g, ' ')
      // products:products
    }));
  };

  const handleChangeExpiry = (e) => {
    const { name, value } = e.target;
    setExpiryFormData((prevData) => ({
      ...prevData,
      [name]: value.toUpperCase().replace(/\s+/g, ' ')
      // products:products
    }));
  };

  const handleChangePayment = (e) => {
    const { name, value } = e.target;
    setNewPaymentDetails((prevData) => ({
      ...prevData,
      [name]: value.toUpperCase().replace(/\s+/g, ' ')
      // products:products
    }));
  };

  const handleChangeAddSupplier = (e) => {
    const { name, value } = e.target;
    setNewSupplierDetails((prevData) => (
      {
        ...prevData,
        [name]: value.toUpperCase().replace(/\s+/g, ' ')
      }
    ))
  }



  const handleDelete = (id) => {
    const rowIndex = products.findIndex((medicine) => medicine.id === id);

    if (rowIndex >= 0) {
      pendingProductFocus.current = {
        rowIndex: Math.max(0, rowIndex - 1),
        fieldIndex: 0,
      };
    }

    setProducts((previous) => previous.filter((medicine) => medicine.id !== id));
  };

  const handleDeleteExpiry = (id) => {
    setExpiryProducts((previous) => previous.filter((medicine) => medicine.id !== id));
  };


  //handle add expiry
  const handleExpiryData = async () => {
    const supplierName = String(expiryFormData.supplierName || '').trim();
    if (!supplierName) {
      alert('Distributor name is required.');
      return;
    }

    const recordDate = String(expiryFormData.date || '').trim();
    if (recordDate && !parseIsoDate(recordDate)) {
      alert('Please enter a valid record date.');
      return;
    }

    const errors = [];
    const validProducts = [];

    expiryProducts.forEach((product, index) => {
      const lineNumber = index + 1;
      const name = String(product.name || '').trim();
      const batchNumber = String(product.batchNumber || '').trim();
      const expiryDate = String(product.expiryDate || '').trim();
      const stock = Number(product.stock);
      const mrp = Number(product.mrp);

      const isBlank =
        !name &&
        !batchNumber &&
        !expiryDate &&
        !Number(product.stock) &&
        !Number(product.mrp);

      if (isBlank) return;

      if (!name) errors.push(`Line ${lineNumber}: medicine name is required.`);
      if (!batchNumber) errors.push(`Line ${lineNumber}: batch number is required.`);
      if (!getExpiryStatus(expiryDate)) {
        errors.push(`Line ${lineNumber}: a valid expiry date is required.`);
      }
      if (!Number.isFinite(stock) || stock <= 0) {
        errors.push(`Line ${lineNumber}: quantity must be greater than zero.`);
      }
      if (!Number.isFinite(mrp) || mrp <= 0) {
        errors.push(`Line ${lineNumber}: MRP must be greater than zero.`);
      }

      validProducts.push({
        name,
        batchNumber: batchNumber.toUpperCase(),
        expiryDate,
        stock,
        mrp,
        supplier: supplierName,
      });
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    if (validProducts.length === 0) {
      alert('Add at least one medicine with a batch number, expiry date, quantity and MRP.');
      return;
    }

    const hasMedicineInWindow = validProducts.some(
      (product) => getExpiryStatus(product.expiryDate)?.key !== 'later'
    );

    if (!hasMedicineInWindow) {
      const saveAnyway = window.confirm(
        'None of these medicines expire within the next three months. Save the expiry record anyway?'
      );
      if (!saveAnyway) return;
    }

    try {
      const allData = {
        id: Date.now(),
        date: recordDate || todayIsoDate(),
        supplierName,
        supplierDrugLn: String(expiryFormData.supplierDrugLn || '').trim(),
        supplierContact: String(expiryFormData.supplierContact || '').trim(),
        products: validProducts,
        type: 'EXPIRY',
      };

      await addNewExpiry(allData);

      alert('Expiry record saved successfully!');

      setExpiryFormData({
        date: todayIsoDate(),
        supplierName: '',
        supplierDrugLn: '',
        supplierContact: '',
        products: []
      });

      setExpiryProducts([
        {
          id: Date.now(),
          name: "",
          batchNumber: "",
          expiryDate: "",
          stock: 0,
          mrp: 0,
        },
      ]);
    } catch (error) {
      console.error("Error while adding expiry data:", error);
      alert(error.message || 'Failed to save the expiry record. Please try again.');
    }
  };


  // const handleBillExtracted = (bill) => {
  //   setFormData((previous) => ({
  //     ...previous,
  //     invoice: bill.invoice,
  //     date: bill.date,
  //     supplierName: bill.supplierName,
  //     supplierDrugLn: bill.supplierDrugLn,
  //     supplierContact: bill.supplierContact
  //   }));
  //   setProducts(bill.products.length ? bill.products : [{
  //     id: crypto.randomUUID(), name: '', batchNumber: '', expiryDate: '', stock: 0,
  //     unitPrice: 0, mrp: 0, discount: 0, gstPercentage: 0
  //   }]);
  // };

  const handleBillExtracted = (bill) => {
  const toNumber = (value) => Number(value) || 0;
  const supplierName = bill.supplierName || '';

  setFormData((previous) => ({
    ...previous,
    invoice: bill.invoice || '',
    date: bill.date || '',
    supplierName,
    supplierDrugLn: bill.supplierDrugLn || '',
    supplierContact: bill.supplierContact || '',
  }));

 setProducts(
  (bill.products || []).map((product, index) => ({
    id: Date.now() + index, // numeric ID for SQLite INTEGER PRIMARY KEY
    name: product.name || '',
    batchNumber: product.batchNumber || '',
    expiryDate: product.expiryDate || '',
    stock: toNumber(product.stock ?? product.quantity),
    unitPrice: toNumber(product.unitPrice),
    mrp: toNumber(product.mrp),
    discount: toNumber(product.discount),
    gstPercentage: toNumber(product.gstPercentage),
    supplier: supplierName,
    category: product.category || '',
  }))
);
};






  return (
    <main className="h-full min-w-0 flex-1 overflow-auto bg-slate-50 p-4 pb-24 md:p-6 lg:pb-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="relative overflow-hidden rounded-2xl border border-slate-300/80 bg-white px-6 py-5 shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-indigo-100/60 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 text-white shadow-md shadow-blue-600/20">
                <PlusCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">
                  Operations
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Add</h1>
                <p className="mt-1 max-w-xl text-sm text-slate-500">
                  Create purchase bills, suppliers, payments, expiry records and credit notes from one clean workspace.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShortcutsOpen(true)}
                className="gap-2 border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Keyboard className="h-4 w-4 text-slate-500" />
                Shortcuts
              </Button>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <span className="hidden font-medium text-slate-700 sm:inline">Command palette</span>
                <kbd className={kbdClass}>Ctrl</kbd>
                <span>+</span>
                <kbd className={kbdClass}>K</kbd>
              </div>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full gap-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-slate-300/80 bg-white p-1.5 shadow-sm">
            {ADD_TABS.map((tab) => {
              const Icon = tab.icon;

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] justify-start gap-2 rounded-lg px-3 py-2 text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm sm:flex-none sm:basis-auto sm:px-4"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="add-purchase" className="mt-1">
            <div className="space-y-5">
              <BillImageUpload onExtracted={handleBillExtracted} />
              <TabContentAddPurchase
                formData={formData}
                handleChange={handleChange}
                handleSupplierSelect={handleSupplierSelect}
                allSuppliersSql={allSuppliersSql}
                setFormData={setFormData}
                products={products}
                handleInputChangeSearch={handleInputChangeSearch}
                searchedMed={searchedMed}
                handleInputChange={handleInputChange}
                handleDelete={handleDelete}
                onSaltsChange={handleSaltsChange}
                onAddProduct={addProductAndFocus}
                setProducts={setProducts}
                totalAmount={totalAmount}
                totalDiscount={totalDiscount}
                totalGst={totalGst}
                addNewBill={addNewBill}
              />
            </div>
          </TabsContent>

          <TabsContent value="add-supplier" className="mt-1">
            <TabContentAddSupplier
              newSupplierDetails={newSupplierDetails}
              handleChangeAddSupplier={handleChangeAddSupplier}
              addNewSupplier={addNewSupplier}
              setNewSupplierDetails={setNewSupplierDetails}
            />
          </TabsContent>

          <TabsContent value='add-payment' className="mt-1">
            <TabContentAddPayment
              newPaymentDetails={newPaymentDetails}
              setNewPaymentDetails={setNewPaymentDetails}
              handleChangePayment={handleChangePayment}
              handleSupplierSelect={handleSupplierSelect}
              allSuppliersSql={allSuppliersSql}
              addNewPayment={addNewPayment}

            />
          </TabsContent>

          <TabsContent value='add-expiry' className="mt-1">
            <TabContentAddExpiry
              expiryFormData={expiryFormData}
              handleChangeExpiry={handleChangeExpiry}
              handleSupplierSelect={handleSupplierSelect}
              allSuppliersSql={allSuppliersSql}
              setExpiryFormData={setExpiryFormData}
              expiryProducts={expiryProducts}
              handleInputChangeExpiry={handleInputChangeExpiry}
              handleDeleteExpiry={handleDeleteExpiry}
              handleAddProduct={handleAddProduct}
              setExpiryProducts={setExpiryProducts}
              handleExpiryData={handleExpiryData}
            />
          </TabsContent>

          <TabsContent value='add-credit-note' className="mt-1">
            <TabContentAddCreditNote
              allSuppliersSql={allSuppliersSql}
              editingCreditNoteId={searchParams.get('creditNoteId')}
              onSaved={() => setSearchParams({ tab: 'add-credit-note' }, { replace: true })}
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Keyboard className="h-5 w-5" />
            </div>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>
              Work through Add Item without leaving the keyboard.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            {SHORTCUTS.map((shortcut) => (
              <ShortcutRow key={shortcut.label + shortcut.keys.join('')} {...shortcut} />
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShortcutsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default Add;
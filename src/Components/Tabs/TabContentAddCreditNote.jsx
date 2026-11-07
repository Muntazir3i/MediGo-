import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import TabContentAddPurchase from './TabContentAddPurchase.jsx';
import BillImageUpload from '../BillImageUpload.jsx';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch.js';
import { handleAddProduct } from '@/utils/addProductHelper.js';
import { handleSupplierSelect } from '@/utils/supplierHelpers.js';
import { calculateBillTotals } from '@/utils/billingCalculationsHelper.js';
import { todayIsoDate } from '@/utils/expiryHelpers.js';
import {
  addCreditNote,
  getCreditNoteById,
  updateCreditNote,
} from '@/services/medicineService.js';

const emptyForm = () => ({
  invoice: '',
  date: todayIsoDate(),
  supplierName: '',
  supplierDrugLn: '',
  supplierContact: '',
});

const emptyItem = (offset = 0) => ({
  id: Date.now() + offset,
  name: '',
  category: '',
  batchNumber: '',
  expiryDate: '',
  stock: 0,
  unitPrice: 0,
  mrp: 0,
  discount: 0,
  gstPercentage: 0,
});

const TabContentAddCreditNote = ({
  allSuppliersSql = [],
  editingCreditNoteId = null,
  onSaved,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [items, setItems] = useState(() => [emptyItem()]);
  const [searchedMedTxt, setSearchedMedTxt] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchedMed = useDebouncedSearch(searchedMedTxt);
  const { totalAmount, totalDiscount, totalGst } = calculateBillTotals(items);

  useEffect(() => {
    if (!editingCreditNoteId) return undefined;

    let cancelled = false;
    setLoadingEdit(true);

    getCreditNoteById(editingCreditNoteId)
      .then((record) => {
        if (cancelled) return;

        setFormData({
          invoice: record.creditNoteNumber || '',
          date: record.date || todayIsoDate(),
          supplierName: record.supplierName || '',
          supplierDrugLn: record.supplierDrugLn || '',
          supplierContact: record.supplierContact || '',
        });

        setItems(
          (record.items || []).map((item, index) => ({
            id: item.id ?? Date.now() + index,
            name: item.name || '',
            category: item.category || '',
            batchNumber: item.batchNumber || '',
            expiryDate: item.expiryDate || '',
            stock: item.quantity ?? 0,
            unitPrice: item.unitPrice ?? 0,
            mrp: item.mrp ?? 0,
            discount: item.discount ?? 0,
            gstPercentage: item.gstPercentage ?? 0,
          }))
        );
      })
      .catch((error) => {
        console.error('Error loading credit note:', error);
        alert(error.message || 'Could not load the credit note.');
      })
      .finally(() => {
        if (!cancelled) setLoadingEdit(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editingCreditNoteId]);

  const handleBillExtracted = (bill) => {
    const supplierName = bill.supplierName || '';

    setFormData((previous) => ({
      ...previous,
      invoice: bill.invoice || previous.invoice,
      date: bill.date || previous.date,
      supplierName: supplierName || previous.supplierName,
      supplierDrugLn: bill.supplierDrugLn || previous.supplierDrugLn,
      supplierContact: bill.supplierContact || previous.supplierContact,
    }));

    const extractedItems = (bill.products || []).map((product, index) => ({
      id: Date.now() + index,
      name: product.name || '',
      category: product.category || '',
      batchNumber: product.batchNumber || '',
      expiryDate: product.expiryDate || '',
      stock: Number(product.stock) || 0,
      unitPrice: Number(product.unitPrice) || 0,
      mrp: Number(product.mrp) || 0,
      discount: Number(product.discount) || 0,
      gstPercentage: Number(product.gstPercentage) || 0,
    }));

    if (extractedItems.length > 0) setItems(extractedItems);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value.toUpperCase().replace(/\s+/g, ' '),
    }));
  };

  const handleItemChange = (id, field, value) => {
    setItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleItemNameChange = (id, field, value) => {
    setSearchedMedTxt(value);
    const selected = searchedMed.find(
      (medicine) => String(medicine.name || '').toUpperCase() === String(value).toUpperCase()
    );

    setItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item;

        if (selected) {
          return {
            ...item,
            [field]: value,
            category: selected.category || item.category,
            unitPrice: selected.unitPrice ?? item.unitPrice,
            mrp: selected.mrp ?? item.mrp,
            discount: selected.discount ?? item.discount,
            gstPercentage: selected.gstPercentage ?? item.gstPercentage,
          };
        }

        return { ...item, [field]: value };
      })
    );
  };

  const handleDeleteItem = (id) => {
    if (!window.confirm('Remove this medicine from the credit note?')) return;
    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  const resetForm = () => {
    setFormData(emptyForm());
    setItems([emptyItem()]);
    setSearchedMedTxt('');
  };

  const handleSave = async () => {
    if (saving) return;

    const creditNoteNumber = formData.invoice.trim();
    const supplierName = formData.supplierName.trim();

    if (!creditNoteNumber) {
      alert('Credit note number is required.');
      return;
    }
    if (!formData.date) {
      alert('Credit note date is required.');
      return;
    }
    if (!supplierName) {
      alert('Distributor name is required.');
      return;
    }

    const errors = [];
    const payloadItems = [];

    items.forEach((item, index) => {
      const line = index + 1;
      const name = String(item.name || '').trim();
      const batchNumber = String(item.batchNumber || '').trim();
      const expiryDate = String(item.expiryDate || '').trim();
      const quantity = Number(item.stock);
      const unitPrice = Number(item.unitPrice);
      const mrp = Number(item.mrp);
      const discount = Number(item.discount || 0);
      const gstPercentage = Number(item.gstPercentage || 0);

      const isBlank =
        !name &&
        !batchNumber &&
        !expiryDate &&
        !Number(item.stock) &&
        !Number(item.unitPrice) &&
        !Number(item.mrp);

      if (isBlank) return;

      if (!name) errors.push(`Line ${line}: medicine name is required.`);
      if (!batchNumber) errors.push(`Line ${line}: batch number is required.`);
      if (!expiryDate) errors.push(`Line ${line}: expiry date is required.`);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        errors.push(`Line ${line}: quantity must be greater than zero.`);
      }
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        errors.push(`Line ${line}: rate must be greater than zero.`);
      }
      if (!Number.isFinite(mrp) || mrp <= 0) {
        errors.push(`Line ${line}: MRP must be greater than zero.`);
      }

      payloadItems.push({
        name,
        category: item.category || '',
        batchNumber,
        expiryDate,
        quantity,
        unitPrice,
        mrp,
        discount,
        gstPercentage,
      });
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    if (payloadItems.length === 0) {
      alert('Add at least one medicine to the credit note.');
      return;
    }

    const payload = {
      creditNoteNumber,
      date: formData.date,
      supplierName,
      supplierDrugLn: formData.supplierDrugLn.trim(),
      supplierContact: formData.supplierContact.trim(),
      items: payloadItems,
    };

    setSaving(true);

    try {
      if (editingCreditNoteId) {
        await updateCreditNote(editingCreditNoteId, payload);
        alert('Credit note updated successfully!');
      } else {
        await addCreditNote(payload);
        alert('Credit note saved successfully!');
      }

      resetForm();
      onSaved?.();
    } catch (error) {
      console.error('Error saving credit note:', error);
      alert(error.message || 'Failed to save the credit note.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-sm text-slate-500 shadow-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading credit note…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BillImageUpload
        onExtracted={handleBillExtracted}
        title="Import a credit note image"
        description="Upload a JPG, PNG or WebP (under 8 MB). Gemini fills the credit note form and medicine lines, then you review every value before saving."
        buttonLabel="Choose credit note"
        inputId="credit-note-image"
      />

      <TabContentAddPurchase
        mode="credit-note"
        formData={formData}
        handleChange={handleChange}
        handleSupplierSelect={handleSupplierSelect}
        allSuppliersSql={allSuppliersSql}
        setFormData={setFormData}
        products={items}
        handleInputChangeSearch={handleItemNameChange}
        searchedMed={searchedMed}
        handleInputChange={handleItemChange}
        handleDelete={handleDeleteItem}
        onAddProduct={() => handleAddProduct(setItems)}
        setProducts={setItems}
        totalAmount={totalAmount}
        totalDiscount={totalDiscount}
        totalGst={totalGst}
        addNewBill={handleSave}
      />
    </div>
  );
};

export default TabContentAddCreditNote;

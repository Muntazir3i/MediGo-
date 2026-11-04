import React, { useState, useEffect, useRef } from 'react';

import { Input } from './ui/input.jsx';
import { Button } from './ui/button.jsx';

import {
  getAllMedicines,
  findmedicineByName,
  saveInvoice
} from '../services/medicineService.js';

import { generateInvoicePdf } from '../utils/invoicePdf.js';

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
  TableFooter
} from "./ui/table.jsx";

import './home.css';

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

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

const lineSubtotal = (item) => itemPrice(item) * (Number(item.qty) || 0);

const lineDiscountAmount = (item) => lineSubtotal(item) * (itemDiscount(item) / 100);

const lineTotal = (item) => lineSubtotal(item) - lineDiscountAmount(item);

const createInvoiceNumber = () => `INV-${Math.floor(100000 + Math.random() * 900000)}`;

function Home() {

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

  const [invoiceNumber, setInvoiceNumber] = useState(createInvoiceNumber);

  const searchRequestRef = useRef(0);

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

  const onAddClick = (med) => {

    setCart((prevCart) => {

      const existingMed = prevCart.find(
        (item) => String(item.id) === String(med.id)
      );

      if (existingMed) {

        if (existingMed.qty >= Number(med.stock)) {
          return prevCart;
        }

        return prevCart.map((item) =>

          String(item.id) === String(med.id)

            ? {
              ...item,
              qty: item.qty + 1
            }

            : item
        );
      }

      return [
        ...prevCart,
        {
          ...med,
          qty: 1,
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

  const increaseQty = (id) => {

    setCart((prevCart) =>

      prevCart.map((item) => {

        if (
          String(item.id) === String(id) &&
          item.qty < Number(item.stock)
        ) {

          return {
            ...item,
            qty: item.qty + 1
          };
        }

        return item;
      })
    );
  };

  const decreaseQty = (id) => {

    setCart((prevCart) =>

      prevCart
        .map((item) =>

          String(item.id) === String(id)

            ? {
              ...item,
              qty: item.qty - 1
            }

            : item
        )

        .filter((item) => item.qty > 0)
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

    const invoiceDate = new Date().toISOString();

    const invoiceItems = cart.map((item) => ({
      id: item.id,
      name: item.name,
      qty: Number(item.qty) || 0,
      mrp: Number(item.mrp) || 0,
      price: itemPrice(item),
      discount: itemDiscount(item),
      discountAmount: round2(lineDiscountAmount(item)),
      lineTotal: round2(lineTotal(item)),
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate
    }));

    const newInvoice = {
      invoiceNumber,
      customer: {
        ...customer,
        name: customer.name.trim()
      },
      medicines: invoiceItems,
      subtotal,
      totalDiscount,
      total: totalAmount,
      status,
      date: invoiceDate
    };

    setSaving(true);

    try {

      // Sales invoices are stored in the invoice files. They must not be added
      // to the supplier bills table, which is only for purchase bills.
      await saveInvoice(newInvoice);

      // GENERATE PDF
      generateInvoicePdf({
        invoiceNumber,
        date: invoiceDate,
        customer: newInvoice.customer,
        items: invoiceItems,
        subtotal,
        totalDiscount,
        total: totalAmount,
        status
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

      setOpen(false);

      setInvoiceNumber(createInvoiceNumber());

      // REFRESH
      fetchMedicinesSql();

      alert("Invoice Saved Successfully");

    } catch (error) {

      console.error("Error saving invoice:", error);

      alert("Failed to save invoice");

    } finally {

      setSaving(false);
    }
  };

  return (

    <main
      id='main-top-container'
      className="h-full min-w-0 flex-1 overflow-auto bg-blue-50 p-4 pb-24 lg:pb-4"
    >

      <h1 className="text-5xl mb-4">
        Billing
      </h1>

      <div className='flex items-center gap-3 mb-3'>
        <Input
          className='bg-white'
          placeholder="Search medicine name or batch number"
          value={search}
          onChange={handleSearchChange}
        />
        {searchLoading && (
          <span className='whitespace-nowrap text-sm text-gray-500'>Searching…</span>
        )}
      </div>

      <div id='main-container' className='flex gap-2'>

        {/* INVENTORY */}

        <div id="inventory-container">

          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">

            <thead className="bg-gray-50">

              <tr>
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Batch No.</th>
                <th className="px-2 py-1">EXP Date</th>
                <th className="px-2 py-1">Stock</th>
                <th className="px-2 py-1">Price</th>
                <th className="px-2 py-1"></th>
              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 border-t border-gray-100">

              {filterMedicine.length > 0 ? (

                filterMedicine.map((med) => (

                  <tr key={med.id} className="hover:bg-gray-50">

                    <td className="px-2 py-1 text-black font-bold">
                      {med.name}
                    </td>

                    <td className="px-2 py-1 text-black">
                      {med.batchNumber}
                    </td>

                    <td className="px-2 py-1 text-black">
                      {med.expiryDate}
                    </td>

                    <td
                      className={`${Number(med.stock) > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                        } px-2 py-1 font-bold`}
                    >
                      {med.stock}
                    </td>

                    <td className="px-2 py-1 text-black font-bold">
                      ₹ {Number(med.mrp).toFixed(2)}
                    </td>

                    <td className="px-2 py-1">

                      {Number(med.stock) > 0 ? (

                        <Button onClick={() => onAddClick(med)}>
                          Add to Cart
                        </Button>

                      ) : (

                        <Button disabled>
                          Out of Stock
                        </Button>

                      )}

                    </td>

                  </tr>

                ))

              ) : (

                <tr>
                  <td colSpan="10" className="text-center py-5">
                    No Medicines Found
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* CART */}

        <div
          id='cart-container'
          className='bg-white px-3 py-3 w-[640px] min-w-[620px]'
        >

          <h1 className='text-4xl text-center'>
            Current Bill
          </h1>

          <p className='mb-4 text-center text-sm text-gray-500'>
            Invoice No: <span className='font-semibold text-gray-700'>{invoiceNumber}</span>
          </p>

          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">

            <thead className="bg-gray-50">

              <tr>
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Qty</th>
                <th className="px-2 py-1">Price ₹</th>
                <th className="px-2 py-1">Disc %</th>
                <th className="px-2 py-1">Total</th>
                <th className="px-2 py-1"></th>
              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 border-t border-gray-100">

              {cart.length > 0 ? (

                cart.map((med) => (

                  <tr key={med.id}>

                    <td className="px-2 py-1 text-black font-bold">
                      <div>{med.name}</div>
                      <div className='text-xs font-normal text-gray-500'>
                        Batch: {med.batchNumber}
                      </div>
                    </td>

                    <td className="px-2 py-1">

                      <div className="flex items-center gap-2">

                        <button
                          className='border w-6 h-6 rounded'
                          onClick={() => decreaseQty(med.id)}
                        >
                          -
                        </button>

                        <span>{med.qty}</span>

                        <button
                          className='border w-6 h-6 rounded'
                          onClick={() => increaseQty(med.id)}
                        >
                          +
                        </button>

                      </div>

                    </td>

                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={med.price}
                        onChange={(e) => updateCartItem(med.id, 'price', e.target.value)}
                        className="h-8 w-24 bg-white px-2 text-right"
                      />
                    </td>

                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={med.discount}
                        onChange={(e) => updateCartItem(med.id, 'discount', e.target.value)}
                        className="h-8 w-16 bg-white px-2 text-right"
                      />
                    </td>

                    <td className="px-2 py-1 font-bold text-black">
                      ₹ {lineTotal(med).toFixed(2)}
                      {lineDiscountAmount(med) > 0 && (
                        <div className='text-xs font-normal text-red-600'>
                          - ₹ {lineDiscountAmount(med).toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td>

                      <button
                        onClick={() => onDeleteClick(med.id)}
                        className='text-red-600'
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>
                  <td colSpan="10" className="text-center py-5">
                    No medicines added yet
                  </td>
                </tr>

              )}

            </tbody>

          </table>

          <hr className='mt-4' />

          <div className='mt-4 space-y-2'>
            <div className='flex justify-between text-sm text-gray-600'>
              <span>Subtotal</span>
              <span>₹ {subtotal.toFixed(2)}</span>
            </div>

            <div className='flex justify-between text-sm text-red-600'>
              <span>Discount</span>
              <span>- ₹ {totalDiscount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between border-t pt-2 text-2xl font-bold">
              <p>Grand Total</p>
              <p>₹ {totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {cart.length > 0 && (

            <div className='flex flex-col gap-3 mt-5'>

              <Input
                placeholder='Customer Name'
                name='name'
                value={customer.name}
                onChange={handleCustomerChange}
              />

              <Input
                placeholder='Phone Number'
                name='phone'
                value={customer.phone}
                onChange={handleCustomerChange}
              />

              <Input
                placeholder='Address'
                name='address'
                value={customer.address}
                onChange={handleCustomerChange}
              />

              <div>

                <p className='text-xl font-bold mb-2'>
                  Status
                </p>

                <div className='flex gap-5'>

                  <label className='flex gap-2'>
                    <input
                      type="radio"
                      value="completed"
                      checked={status === 'completed'}
                      onChange={statusCheck}
                    />
                    Completed
                  </label>

                  <label className='flex gap-2'>
                    <input
                      type="radio"
                      value="pending"
                      checked={status === 'pending'}
                      onChange={statusCheck}
                    />
                    Pending
                  </label>

                </div>

              </div>

            </div>

          )}

          <div className="flex justify-between mt-5">

            <Button
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              Clear Cart
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>

              <DialogTrigger asChild>

                <Button
                  disabled={
                    cart.length === 0 ||
                    customer.name.trim() === ''
                  }
                >
                  Checkout
                </Button>

              </DialogTrigger>

              <DialogContent className="sm:max-w-[820px]">

                <DialogHeader>

                  <DialogTitle className='text-2xl font-bold'>
                    SAABIT PHARMACY
                  </DialogTitle>

                  <DialogDescription>

                    <span className='font-medium text-gray-700'>Invoice No: {invoiceNumber}</span>
                    <br />
                    Customer: {customer.name || '-'}
                    {customer.phone ? ` | Phone: ${customer.phone}` : ''}
                    <br />
                    Status: {status === 'completed' ? 'Paid' : 'Pending'}

                  </DialogDescription>

                </DialogHeader>

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

                        <TableCell className="font-medium text-gray-800">{item.name}</TableCell>

                        <TableCell>{item.batchNumber}</TableCell>

                        <TableCell>{item.qty}</TableCell>

                        <TableCell className="text-right">
                          ₹ {itemPrice(item).toFixed(2)}
                        </TableCell>

                        <TableCell className="text-right">
                          {itemDiscount(item) > 0 ? `${itemDiscount(item)}%` : '-'}
                        </TableCell>

                        <TableCell className="text-right font-semibold">
                          ₹ {lineTotal(item).toFixed(2)}
                        </TableCell>

                      </TableRow>

                    ))}

                  </TableBody>

                  <TableFooter>

                    <TableRow>
                      <TableCell colSpan={5} className="text-right text-gray-600">
                        Subtotal
                      </TableCell>
                      <TableCell className="text-right">
                        ₹ {subtotal.toFixed(2)}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={5} className="text-right text-gray-600">
                        Discount
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        - ₹ {totalDiscount.toFixed(2)}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-right text-2xl font-bold"
                      >
                        Grand Total
                      </TableCell>
                      <TableCell className="text-right text-2xl font-bold">
                        ₹ {totalAmount.toFixed(2)}
                      </TableCell>
                    </TableRow>

                  </TableFooter>

                </Table>

                <DialogFooter>

                  <Button
                    onClick={addBillFn}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save & Generate PDF'}
                  </Button>

                </DialogFooter>

              </DialogContent>

            </Dialog>

          </div>

        </div>

      </div>

    </main>
  );
}

export default Home;
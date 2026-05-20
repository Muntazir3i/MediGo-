import React, { useState, useEffect } from 'react';

import { Input } from './ui/input.jsx';
import { Button } from './ui/button.jsx';

import {
  getAllMedicines,
  addBillSql,
  findmedicineByName,
  saveInvoice
} from '../services/medicineService.js';



import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

function Home() {

  const [open, setOpen] = useState(false);

  const [medicines, setMedicines] = useState([]);
  const [filterMedicine, setFilterMedicine] = useState([]);

  const [search, setSearch] = useState('');

  const [cart, setCart] = useState([]);

  const [status, setStatus] = useState('completed');

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const invoiceNumber = `INV-${Math.floor(
    100000 + Math.random() * 900000
  )}`;

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

  const handleSearchChange = async (e) => {

    const value = e.target.value;

    setSearch(value);

    try {

      if (value.trim() === '') {

        setFilterMedicine(medicines);

        return;
      }

      const response = await findmedicineByName(value);

      setFilterMedicine(response);

    } catch (error) {

      console.error("Search Error:", error);
    }
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
          qty: 1
        }
      ];
    });
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

  const totalAmount = cart.reduce(
    (acc, item) => acc + Number(item.mrp) * item.qty,
    0
  );

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  const generatePDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(24);

    doc.text("SAABIT PHARMACY", 14, 20);

    doc.setFontSize(11);

    doc.text("Drug Licence No: 13351/52", 14, 30);

    doc.text("Phone: +91 9797027047", 14, 37);

    doc.text(
      "Address: Kak Sarai, Karan Nagar, Opp HDFC Bank, Srinagar",
      14,
      44
    );

    doc.setFontSize(12);

    doc.text(`Invoice No: ${invoiceNumber}`, 14, 58);

    doc.text(`Date: ${formattedDate}`, 150, 58);

    doc.setFontSize(13);

    doc.text("Customer Details", 14, 72);

    doc.setFontSize(11);

    doc.text(`Name: ${customer.name}`, 14, 82);

    doc.text(`Phone: ${customer.phone}`, 14, 89);

    doc.text(`Address: ${customer.address}`, 14, 96);

    autoTable(doc, {

      startY: 110,

      head: [[
        'Medicine',
        'Qty',
        'Batch',
        'Expiry',
        'Price',
        'Total'
      ]],

      body: cart.map((item) => [

        item.name,

        item.qty,

        item.batchNumber,

        item.expiryDate,

        Number(item.mrp).toFixed(2),

        (Number(item.mrp) * item.qty).toFixed(2)

      ]),
    });

    doc.setFontSize(16);

    doc.text(
      `Grand Total: ₹${totalAmount.toFixed(2)}`,
      100,
      doc.lastAutoTable.finalY + 20
    );

    doc.setFontSize(11);

    doc.text(
      "Thank you for visiting Saabit Pharmacy",
      14,
      doc.lastAutoTable.finalY + 40
    );

    doc.save(`${invoiceNumber}.pdf`);
  };

  const addBillFn = async () => {

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const newInvoice = {

      invoiceNumber,

      customer,

      medicines: cart.map((item) => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        mrp: item.mrp,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
      })),

      total: totalAmount,

      status,

      date: new Date().toISOString(),
    };

    try {

      // SAVE INVOICE
      await saveInvoice(newInvoice);

      // SAVE BILL
      await addBillSql(newInvoice);

      // GENERATE PDF
      generatePDF();

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

      // REFRESH
      fetchMedicinesSql();

      alert("Invoice Saved Successfully");

    } catch (error) {

      console.error("Error saving invoice:", error);

      alert("Failed to save invoice");
    }
  };

  return (

    <main
      id='main-top-container'
      className="h-screen min-w-0 flex-1 overflow-auto bg-blue-50 p-4"
    >

      <h1 className="text-5xl mb-4">
        Billing
      </h1>

      <Input
        className='mb-3 bg-white'
        placeholder="Search Medicines"
        value={search}
        onChange={handleSearchChange}
      />

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
          className='bg-white px-3 py-3 w-[500px]'
        >

          <h1 className='text-4xl text-center mb-4'>
            Current Bill
          </h1>

          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">

            <thead className="bg-gray-50">

              <tr>
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Qty</th>
                <th className="px-2 py-1">Price</th>
                <th className="px-2 py-1">Total</th>
                <th className="px-2 py-1"></th>
              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 border-t border-gray-100">

              {cart.length > 0 ? (

                cart.map((med) => (

                  <tr key={med.id}>

                    <td className="px-2 py-1 text-black font-bold">
                      {med.name}
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
                      ₹ {Number(med.mrp).toFixed(2)}
                    </td>

                    <td className="px-2 py-1 font-bold">
                      ₹ {(Number(med.mrp) * med.qty).toFixed(2)}
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

          <div className="flex justify-between mt-4 text-2xl font-bold">

            <p>Total</p>

            <p>₹ {totalAmount.toFixed(2)}</p>

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

              <DialogContent className="sm:max-w-[700px]">

                <DialogHeader>

                  <DialogTitle className='text-2xl font-bold'>
                    SAABIT PHARMACY
                  </DialogTitle>

                  <DialogDescription>

                    Invoice No: {invoiceNumber}

                  </DialogDescription>

                </DialogHeader>

                <Table>

                  <TableHeader>

                    <TableRow>

                      <TableHead>Name</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>

                    </TableRow>

                  </TableHeader>

                  <TableBody>

                    {cart.map((item) => (

                      <TableRow key={item.id}>

                        <TableCell>{item.name}</TableCell>

                        <TableCell>{item.qty}</TableCell>

                        <TableCell>
                          ₹ {Number(item.mrp).toFixed(2)}
                        </TableCell>

                        <TableCell>
                          ₹ {(Number(item.mrp) * item.qty).toFixed(2)}
                        </TableCell>

                      </TableRow>

                    ))}

                  </TableBody>

                  <TableFooter>

                    <TableRow>

                      <TableCell
                        colSpan={4}
                        className="text-right text-2xl font-bold"
                      >
                        ₹ {totalAmount.toFixed(2)}
                      </TableCell>

                    </TableRow>

                  </TableFooter>

                </Table>

                <DialogFooter>

                  <Button onClick={addBillFn}>
                    Save & Generate PDF
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
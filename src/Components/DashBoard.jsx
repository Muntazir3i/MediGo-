import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

import { Button } from './ui/button.jsx';

import {
  deleteSaleInvoice,
  getLowStock,
  getOutOfStock,
  getExpiry,
  searchInvoices
} from '../services/medicineService.js';



import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card.jsx";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.jsx";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
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

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs.jsx";

function DashBoard() {

  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);

  const [customerSearch, setCustomerSearch] = useState('');

  const [loading, setLoading] = useState(false);

  const [filteredBill, setFilteredBill] = useState([]);

  const [lowStock, setLowStock] = useState([]);

  const [outOfStock, setOutOfStock] = useState([]);

  const [expiry, setExpiry] = useState([]);

  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);

  // ==========================
  // FETCH MEDICINES
  // ==========================

  useEffect(() => {
    fetchLowStock();
    fetchOutOfStock();
    fetchExpiryStock();
    fetchInvoices();
  }, []);

  // ==========================
  // LOW STOCK
  // ==========================

  const fetchLowStock = async () => {

    try {

      const response = await getLowStock();

      setLowStock(response);

    } catch (error) {

      console.error(
        'Error fetching low stock:',
        error
      );
    }
  };

  // ==========================
  // OUT OF STOCK
  // ==========================

  const fetchOutOfStock = async () => {

    try {

      const response = await getOutOfStock();

      setOutOfStock(response);

    } catch (error) {

      console.error(
        'Error fetching out of stock:',
        error
      );
    }
  };

  // ==========================
  // EXPIRY
  // ==========================

  const fetchExpiryStock = async () => {

    try {

      const response = await getExpiry();

      setExpiry(response);

    } catch (error) {

      console.error(
        'Error fetching expiry:',
        error
      );
    }
  };

  // ==========================
  // FETCH INVOICES
  // ==========================

  const fetchInvoices = async () => {

    try {

      setLoading(true);

      const response = await searchInvoices(
        date,
        customerSearch
      );

      setFilteredBill(response);

    } catch (error) {

      console.error(
        'Error fetching invoices:',
        error
      );

    } finally {

      setLoading(false);
    }
  };

  // ==========================
  // DELETE INVOICE
  // ==========================

  const handleDeleteInvoice = async (invoice) => {

    if (deletingInvoiceId !== null) return;

    const label = invoice.invoiceNumber || `#${invoice.id}`;
    const lineCount = invoice.medicines?.length ?? 0;

    const confirmed = window.confirm(
      `Delete invoice ${label} and restore stock for ${lineCount} medicine line(s)?\n\n` +
      'The medicines will be returned to the exact batches and quantities recorded on this invoice.'
    );

    if (!confirmed) return;

    setDeletingInvoiceId(invoice.id);

    try {

      const response = await deleteSaleInvoice(invoice.id);

      // Remove the row immediately so the list reflects the deletion even
      // before the refreshed search comes back.
      setFilteredBill((prev) =>
        prev.filter((item) => item.id !== invoice.id)
      );

      alert(response?.message || `Invoice ${label} deleted successfully.`);

      await fetchInvoices();

    } catch (error) {

      console.error('Error deleting invoice:', error);

      alert(
        error?.response?.data?.message
        || 'Failed to delete the invoice. Please try again.'
      );

    } finally {

      setDeletingInvoiceId(null);
    }
  };

  // ==========================
  // SALES CALCULATIONS
  // ==========================

  const totalSales = filteredBill.reduce(
    (sum, item) => sum + (item.total || 0),
    0
  );

  const completedSales = filteredBill
    .filter((item) => item.status === "completed")
    .reduce((sum, item) => sum + (item.total || 0), 0);

  const pendingSales = filteredBill
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + (item.total || 0), 0);

  const averageSales =
    totalSales / (filteredBill.length || 1);

  return (

    <main
      id='main-top-container'
      className="h-full min-w-0 flex-1 overflow-auto bg-blue-50 p-4 pb-24 lg:pb-4"
    >

      <Tabs defaultValue="sales">

        <TabsList>

          <TabsTrigger value="sales">
            Sales
          </TabsTrigger>

          <TabsTrigger value="stock-info">
            Stock Info
          </TabsTrigger>

          <TabsTrigger value="expiry">
            Expiry
          </TabsTrigger>

        </TabsList>

        {/* ===================================== */}
        {/* SALES */}
        {/* ===================================== */}

        <TabsContent value="sales">

          <h1 className="text-3xl font-bold mb-5">
            Sales Dashboard
          </h1>

          {/* SEARCH */}

          <div className='flex gap-3 items-center mb-5'>

            <input
              className='border p-2 rounded'
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
            />

            <input
              type="text"
              placeholder='Search Customer Name'
              value={customerSearch}
              onChange={(e) =>
                setCustomerSearch(e.target.value)
              }
              className='border p-2 rounded w-[250px]'
            />

            <Button onClick={fetchInvoices}>
              Search Invoice
            </Button>

          </div>

          {/* CARDS */}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <Card>

              <CardHeader>

                <CardTitle className="text-sm font-medium">
                  Total Sale
                </CardTitle>

              </CardHeader>

              <CardContent>

                <div className="text-2xl font-bold">
                  ₹{totalSales.toFixed(2)}
                </div>

                <p className="text-xs text-muted-foreground">
                  {filteredBill.length} invoices
                </p>

              </CardContent>

            </Card>

            <Card>

              <CardHeader>

                <CardTitle className="text-sm font-medium">
                  Completed
                </CardTitle>

              </CardHeader>

              <CardContent>

                <div className="text-2xl font-bold">
                  ₹{completedSales.toFixed(2)}
                </div>

                <p className="text-xs text-muted-foreground">
                  {
                    filteredBill.filter(
                      (item) =>
                        item.status === "completed"
                    ).length
                  } completed invoices
                </p>

              </CardContent>

            </Card>

            <Card>

              <CardHeader>

                <CardTitle className="text-sm font-medium">
                  Pending
                </CardTitle>

              </CardHeader>

              <CardContent>

                <div className="text-2xl font-bold">
                  ₹{pendingSales.toFixed(2)}
                </div>

                <p className="text-xs text-muted-foreground">
                  {
                    filteredBill.filter(
                      (item) =>
                        item.status === "pending"
                    ).length
                  } pending invoices
                </p>

              </CardContent>

            </Card>

            <Card>

              <CardHeader>

                <CardTitle className="text-sm font-medium">
                  Average Amount
                </CardTitle>

              </CardHeader>

              <CardContent>

                <div className="text-2xl font-bold">
                  ₹{averageSales.toFixed(2)}
                </div>

                <p className="text-xs text-muted-foreground">
                  Per Invoice
                </p>

              </CardContent>

            </Card>

          </div>

          {/* TABLE */}

          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500 mt-5">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-2 py-2">Invoice ID</th>

                <th className="px-2 py-2">Customer</th>

                <th className="px-2 py-2">Status</th>

                <th className="px-2 py-2">Date</th>

                <th className="px-2 py-2">Time</th>

                <th className="px-2 py-2">Total</th>

                <th className="px-2 py-2">Action</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 border-t border-gray-100">

              {loading ? (

                <tr>

                  <td
                    colSpan="10"
                    className="text-center py-5"
                  >
                    Loading...
                  </td>

                </tr>

              ) : filteredBill.length > 0 ? (

                filteredBill.map((med) => (

                  <tr
                    key={med.id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-2 py-2 text-black font-bold">
                      {med.invoiceNumber}
                    </td>

                    <td className="px-2 py-2 text-black font-bold">
                      {med.customer?.name}
                    </td>

                    <td className="px-2 py-2 text-black">
                      {med.status}
                    </td>

                    <td className="px-2 py-2 text-black">
                      {new Date(med.date)
                        .toLocaleDateString()}
                    </td>

                    <td className="px-2 py-2 text-black">
                      {new Date(med.date)
                        .toLocaleTimeString()}
                    </td>

                    <td className="px-2 py-2 text-black font-bold">
                      ₹ {Number(med.total).toFixed(2)}
                    </td>

                    <td className="px-2 py-2">

                      <DropdownMenu>

                        <DropdownMenuTrigger className="font-bold">
                          ...
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>

                          <DropdownMenuLabel>
                            Actions
                          </DropdownMenuLabel>

                          <DropdownMenuSeparator />

                          <Dialog>

                            <DropdownMenuItem
                              onSelect={(e) =>
                                e.preventDefault()
                              }
                            >

                              <DialogTrigger>
                                View Details
                              </DialogTrigger>

                            </DropdownMenuItem>

                            <DialogContent className="sm:max-w-[650px]">

                              <DialogHeader>

                                <DialogTitle className='text-2xl'>
                                  Saabit Pharmacy
                                </DialogTitle>

                                <DialogDescription>

                                  <span className='font-bold'>
                                    Drug Licence No:
                                  </span> 13351/52

                                  <br />

                                  <span className='font-bold'>
                                    Contact:
                                  </span> +91 9797027047

                                  <br />

                                  <span className='font-bold'>
                                    Address:
                                  </span> Kak Sarai,
                                  Karan Nagar,
                                  Srinagar,
                                  Jammu & Kashmir

                                </DialogDescription>

                                <DialogDescription>

                                  <span className='font-bold'>
                                    Customer Name:
                                  </span> {med.customer.name}

                                  <br />

                                  <span className='font-bold'>
                                    Contact:
                                  </span> +91 {med.customer.phone}

                                  <br />

                                  <span className='font-bold'>
                                    Address:
                                  </span> {med.customer.address}

                                </DialogDescription>


                              </DialogHeader>

                              <Table>

                                <TableHeader>

                                  <TableRow>

                                    <TableHead>
                                      Name
                                    </TableHead>

                                    <TableHead>
                                      Qty
                                    </TableHead>

                                    <TableHead>
                                      Batch
                                    </TableHead>

                                    <TableHead>
                                      Price
                                    </TableHead>

                                    <TableHead>
                                      Disc.
                                    </TableHead>

                                    <TableHead>
                                      Total
                                    </TableHead>

                                  </TableRow>

                                </TableHeader>

                                <TableBody>

                                  {med.medicines?.map((item) => (

                                    <TableRow key={item.id}>

                                      <TableCell>
                                        {item.name}
                                      </TableCell>

                                      <TableCell>
                                        x{Number(item.qty) || 0}
                                        {item.saleUnit ? ` ${item.saleUnit}` : ''}
                                      </TableCell>

                                      <TableCell>
                                        {item.batchNumber}
                                      </TableCell>

                                      <TableCell>
                                        ₹ {Number(item.price ?? item.mrp).toFixed(2)}
                                      </TableCell>

                                      <TableCell>
                                        {Number(item.discount) > 0 ? `${Number(item.discount)}%` : '-'}
                                      </TableCell>

                                      <TableCell>
                                        ₹ {Number(
                                          item.lineTotal ??
                                          (Number(item.price ?? item.mrp) || 0) *
                                          (Number(item.qty) || 0) *
                                          (1 - (Number(item.discount) || 0) / 100)
                                        ).toFixed(2)}
                                      </TableCell>

                                    </TableRow>

                                  ))}

                                </TableBody>

                                <TableFooter>

                                  {Number(med.totalDiscount) > 0 && (
                                    <>
                                      <TableRow>
                                        <TableCell colSpan={5} className="text-right text-gray-600">
                                          Subtotal
                                        </TableCell>
                                        <TableCell className="text-right">
                                          ₹ {Number(med.subtotal ?? med.total).toFixed(2)}
                                        </TableCell>
                                      </TableRow>

                                      <TableRow>
                                        <TableCell colSpan={5} className="text-right text-red-600">
                                          Discount
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                          - ₹ {Number(med.totalDiscount).toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    </>
                                  )}

                                  <TableRow>

                                    <TableCell
                                      colSpan={6}
                                      className="text-right text-2xl font-bold"
                                    >
                                      ₹ {
                                        Number(med.total)
                                          .toFixed(2)
                                      }
                                    </TableCell>

                                  </TableRow>

                                </TableFooter>

                              </Table>

                              <DialogFooter>

                                <Button>
                                  Print
                                </Button>

                              </DialogFooter>

                            </DialogContent>

                          </Dialog>

                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            disabled={deletingInvoiceId === med.id}
                            onSelect={() => handleDeleteInvoice(med)}
                          >

                            <Trash2 className="mr-2 h-4 w-4" />

                            {deletingInvoiceId === med.id
                              ? 'Deleting…'
                              : 'Delete Invoice'}

                          </DropdownMenuItem>

                        </DropdownMenuContent>

                      </DropdownMenu>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="10"
                    className="text-center py-5"
                  >
                    No Invoices Found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </TabsContent>

        {/* ===================================== */}
        {/* LOW STOCK */}
        {/* ===================================== */}

        <TabsContent value="stock-info">

          <Tabs defaultValue="low-stock">

            <TabsList>

              <TabsTrigger value="low-stock">
                Low Stock
              </TabsTrigger>

              <TabsTrigger value="out-of-stock">
                Out Of Stock
              </TabsTrigger>

            </TabsList>

            {/* LOW STOCK */}

            <TabsContent value="low-stock">

              <div className="mb-5">
                <h1 className="text-3xl font-bold">
                  Low Stock
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Products with more than 0 and less than 2 units in stock across all active batches.
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {lowStock.length} product{lowStock.length === 1 ? '' : 's'} need restocking.
                </p>
              </div>

              <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Price</th>

                  </tr>

                </thead>

                <tbody>

                  {lowStock.map((med) => (

                    <tr key={med.id}>

                      <td className="px-4 py-3">
                        {med.name}
                      </td>

                      <td className="px-4 py-3">
                        {med.category}
                      </td>

                      <td className="px-4 py-3">
                        {med.supplier}
                      </td>

                      <td className="px-4 py-3">
                        {med.batchNumber}
                      </td>

                      <td className="px-4 py-3">
                        {med.expiryDate}
                      </td>

                      <td className="px-4 py-3 text-red-600 font-bold">
                        {med.stock}
                      </td>

                      <td className="px-4 py-3">
                        ₹ {med.mrp}
                      </td>

                    </tr>

                  ))}

                  {lowStock.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                        No low-stock products right now.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </TabsContent>

            {/* OUT OF STOCK */}

            <TabsContent value="out-of-stock">

              <div className="mb-5">
                <h1 className="text-3xl font-bold">
                  Out Of Stock
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Products with no live stock across all active batches.
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {outOfStock.length} product{outOfStock.length === 1 ? '' : 's'} out of stock.
                </p>
              </div>

              <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Price</th>

                  </tr>

                </thead>

                <tbody>

                  {outOfStock.map((med) => (

                    <tr key={med.id}>

                      <td className="px-4 py-3">
                        {med.name}
                      </td>

                      <td className="px-4 py-3">
                        {med.category}
                      </td>

                      <td className="px-4 py-3">
                        {med.supplier}
                      </td>

                      <td className="px-4 py-3">
                        {med.batchNumber}
                      </td>

                      <td className="px-4 py-3">
                        {med.expiryDate}
                      </td>

                      <td className="px-4 py-3 text-red-600 font-bold">
                        {med.stock}
                      </td>

                      <td className="px-4 py-3">
                        ₹ {med.mrp}
                      </td>

                    </tr>

                  ))}

                  {outOfStock.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                        No out-of-stock products right now.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </TabsContent>

          </Tabs>

        </TabsContent>

        {/* ===================================== */}
        {/* EXPIRY */}
        {/* ===================================== */}

        <TabsContent value="expiry">

          <div className="mb-5">
            <h1 className="text-3xl font-bold">
              Expiry Medicines
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Active batches expiring within the next 3 months, starting today.
            </p>
            <p className="mt-1 text-xs font-medium text-slate-400">
              {expiry.length} batch{expiry.length === 1 ? '' : 'es'} expiring soon.
            </p>
          </div>

          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Price</th>

              </tr>

            </thead>

            <tbody>

              {expiry.map((med) => (

                <tr key={med.id}>

                  <td className="px-4 py-3">
                    {med.name}
                  </td>

                  <td className="px-4 py-3">
                    {med.category}
                  </td>

                  <td className="px-4 py-3">
                    {med.supplier}
                  </td>

                  <td className="px-4 py-3">
                    {med.batchNumber}
                  </td>

                  <td className="px-4 py-3 text-red-600 font-bold">
                    {med.expiryDate}
                  </td>

                  <td className="px-4 py-3">
                    {med.stock}
                  </td>

                  <td className="px-4 py-3">
                    ₹ {med.mrp}
                  </td>

                </tr>

              ))}

              {expiry.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No batches expire in the next 3 months.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </TabsContent>

      </Tabs>

    </main>
  );
}

export default DashBoard;
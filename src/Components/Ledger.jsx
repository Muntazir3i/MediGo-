import React, { useState, useEffect, useRef } from 'react';
import { findSupplierExpiry, getsupplierSql, findPaymentByDateSql, getBillPaymentSql, deletePaymentSql, updatePaymentSql, getAllPaymentsSql, loadMorePaymentsSql } from '@/services/medicineService.js';
import { generateSupplierStatementPdf } from '@/utils/supplierStatementPdf.js';
import { TabContentGeneralLedger, TabContentExpiryLedger, TabContentShowAllPayments } from './Tabs/index.js';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Input } from './ui/input.jsx';
import { Label } from "./ui/label.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "./ui/table.jsx"


const Ledger = () => {
  const [allSupplier, setAllSupplier] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [filteredBill, setFilteredBill] = useState([]);
  const [fileredExpiry, setFilteredExpiry] = useState([]);
  const [filteredSupplier, setFilteredSupplier] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyPayments, setDailyPayments] = useState([]);
  const [dailyPaymentSummary, setDailyPaymentSummary] = useState(null);
  const [dailyPaymentsLoading, setDailyPaymentsLoading] = useState(false);
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [selectedSupplierBalance, setSelectedSupplierBalance] = useState(0);
  const [statementFrom, setStatementFrom] = useState('');
  const [statementTo, setStatementTo] = useState('');
  const [statementSummary, setStatementSummary] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  const dailyPaymentsRequestRef = useRef(0);

  const loadPaymentsForDate = async (date, { showLoading = true } = {}) => {
    const requestId = ++dailyPaymentsRequestRef.current;
    if (showLoading) setDailyPaymentsLoading(true);

    try {
      const response = await findPaymentByDateSql(date);

      // Ignore responses for a date that is no longer selected.
      if (requestId !== dailyPaymentsRequestRef.current) return;

      setDailyPayments(response.payments || []);
      setDailyPaymentSummary(response.summary || null);
    } catch (error) {
      console.error("Error fetching payments by date:", error.message);
    } finally {
      if (requestId === dailyPaymentsRequestRef.current) {
        setDailyPaymentsLoading(false);
      }
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);

    if (!date) {
      // Invalidate any in-flight request.
      dailyPaymentsRequestRef.current += 1;
      setDailyPayments([]);
      setDailyPaymentSummary(null);
      setDailyPaymentsLoading(false);
      return;
    }

    loadPaymentsForDate(date);
  };

  const totalDailyPayment = dailyPaymentSummary
    ? Number(dailyPaymentSummary.total) || 0
    : dailyPayments.reduce((sum, item) => sum + Number(item.total), 0);


  useEffect(() => {
    fetchAllSupplier();
    fetchAllPayments();
  }, []);

async function loadMore() {
  if (allPayments.length > 0) {
    try {
      const lastId = allPayments[allPayments.length - 1].id;
      const response = await loadMorePaymentsSql(lastId);
      setAllPayments([...allPayments, ...response]);
    } catch (error) {
      console.log("Error Fetching More Payments:", error);
    }
  }
}




  const handleDeletePaymentSql = async (paymentId) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;

    try {
      const response = await deletePaymentSql(paymentId);
      console.log(response);
      // After deletion, you might want to refresh the payments list or update the state accordingly
      setDailyPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== paymentId));
      setAllPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== paymentId));
      alert('Payment Deleted Successfully!');

      // Keep the selected date's list and totals in sync.
      if (selectedDate) {
        loadPaymentsForDate(selectedDate, { showLoading: false });
      }
    } catch (error) {
      console.error('Error deleting payment from the database', error);
      alert('Failed To Delete Payment');
    }
  };


  const fetchAllSupplier = async () => {
    try {
      const response = await getsupplierSql();
      setAllSupplier(response);
      setFilteredSupplier(response);
    } catch (error) {
      console.error('Error fetching the Supplier:', error);
    }
  };

  const fetchAllPayments = async () => {
    try {
      const response = await getAllPaymentsSql();
      setAllPayments(response);
    } catch (error) {
      console.log("Error Fetching All The Payments:", error)
    }
  }


  function handleEditClick(item) {
    setFormData(item)
    setIsOpen(true);
  }

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData((prev) => (
      {
        ...prev,
        [name]: value
      }
    ))
  }

  const handlePaymentEditSave = async () => {
    try {
      const response = await updatePaymentSql(
        formData.id,
        formData
      );

      alert("Payment Updated Successfully!");
      setIsOpen(false);
      console.log(response);


      setDailyPayments((prevPayments) =>
        prevPayments.map((payment) =>
          payment.id === formData.id
            ? { ...payment, ...formData }
            : payment
        )
      );

      setAllPayments((prevPayments) =>
        prevPayments.map((payment) =>
          payment.id === formData.id
            ? { ...payment, ...formData }
            : payment
        )
      );

      // Keep the selected date's list and totals in sync.
      if (selectedDate) {
        loadPaymentsForDate(selectedDate, { showLoading: false });
      }

    } catch (error) {
      console.error(error);
      alert("Failed To Update Payment");
    }
  }





  const handleSearchChange = (e) => {
    const keyword = e.target.value;
    setSearch(keyword);
    const filtered = allSupplier.filter((supplier) =>
      supplier.supplierName.toLowerCase().includes(keyword.toLowerCase())
    );
    setFilteredSupplier(filtered);
  };


  const showNameFn = async (name) => {
    try {
      setSelectedSupplierName(name);
      setStatementSummary(null);

      const selectedSupplier = allSupplier.find((item) => item.supplierName === name);

      if (selectedSupplier) {
        setSelectedSupplierBalance(Number(selectedSupplier.supplierBalance));
      }

      const response = await getBillPaymentSql(name);
      setFilteredBill(response.transactions || []);
      setStatementSummary(response.summary || null);
    } catch (error) {
      console.error('Error fetching supplier transactions:', error.message);
      // Handle the error (e.g., show a toast or alert to the user)
    }
  };


  const generateStatementPdf = async () => {
    if (!selectedSupplierName) {
      alert('Select a supplier first.');
      return;
    }

    if (!statementFrom || !statementTo) {
      alert('Please select both From and To dates.');
      return;
    }

    if (statementFrom > statementTo) {
      alert('The From date must be before the To date.');
      return;
    }

    setStatementLoading(true);

    try {
      const response = await getBillPaymentSql(selectedSupplierName, {
        from: statementFrom,
        to: statementTo
      });

      const supplier = allSupplier.find((item) => item.supplierName === selectedSupplierName);

      generateSupplierStatementPdf({
        supplierName: selectedSupplierName,
        supplierDrugLn: supplier?.drugLn || '',
        phone: supplier?.phoneNumber || '',
        from: statementFrom,
        to: statementTo,
        transactions: response.transactions || [],
        summary: response.summary || {}
      });
    } catch (error) {
      console.error('Error generating supplier statement:', error);
      alert('Failed to generate the PDF statement.');
    } finally {
      setStatementLoading(false);
    }
  };


  const findExpiryFn = async (name) => {
    try {
      // Set the selected supplier name
      setSelectedSupplierName(name);

      // Find the selected supplier from the list of all suppliers
      const selectedSupplier = allSupplier.find((item) => item.supplierName === name);

      if (selectedSupplier) {
        // Set the supplier's balance
        setSelectedSupplierBalance(Number(selectedSupplier.supplierBalance));

        // Fetch the supplier expiry from the server
        const supplierExpiry = await findSupplierExpiry(name);

        // Set the filtered and sorted expiry
        setFilteredExpiry(supplierExpiry);

      }
    } catch (error) {
      console.error("Error fetching supplier expiry", error.message);
      // Handle the error (e.g., show a toast or alert to the user)
    }
  };

  return (

    <main id='main-top-container' className="h-[90vh] lg:h-screen min-w-0 flex-1 overflow-auto bg-blue-50 p-4">

      <Tabs defaultValue="general-ledger" className="w-full">
        <TabsList>
          <TabsTrigger value="general-ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="all-payment">All Payments</TabsTrigger>
          <TabsTrigger value="expiry-ledger">Expiry Ledger</TabsTrigger>
          <TabsTrigger value="credit-notes">Credit Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="general-ledger">
          <TabContentGeneralLedger
            search={search}
            handleSearchChange={handleSearchChange}
            filteredSupplier={filteredSupplier}
            showNameFn={showNameFn}

            selectedDate={selectedDate}
            handleDateChange={handleDateChange}
            dailyPayments={dailyPayments}
            dailyPaymentsLoading={dailyPaymentsLoading}
            dailyPaymentSummary={dailyPaymentSummary}
            totalDailyPayment={totalDailyPayment}
            handlePaymentEditSave={handlePaymentEditSave}
            handleDeletePaymentSql={handleDeletePaymentSql}
            handleEditClick={handleEditClick}

            selectedSupplierName={selectedSupplierName}
            filteredBill={filteredBill}
            selectedSupplierBalance={selectedSupplierBalance}

            statementFrom={statementFrom}
            statementTo={statementTo}
            handleStatementFromChange={(e) => setStatementFrom(e.target.value)}
            handleStatementToChange={(e) => setStatementTo(e.target.value)}
            generateStatementPdf={generateStatementPdf}
            statementLoading={statementLoading}
            statementSummary={statementSummary}

          />
        </TabsContent>
        <TabsContent value="all-payment">
          <TabContentShowAllPayments
            allPayments={allPayments}
            handleDeletePaymentSql={handleDeletePaymentSql}
            handleEditClick={handleEditClick}
            loadMore={loadMore}
          />
        </TabsContent>
        <TabsContent value="expiry-ledger">
          <TabContentExpiryLedger

            search={search}

            handleSearchChange={handleSearchChange}

            filteredSupplier={filteredSupplier}

            findExpiryFn={findExpiryFn}

            allSupplier={allSupplier}

            selectedSupplierName={selectedSupplierName}

            fileredExpiry={fileredExpiry}

          />
        </TabsContent>
        <TabsContent value="credit-notes">
          <h1 className="text-3xl font-bold ">Credit Notes</h1>
          <p className='mb-8'>Check Sales Return Bill Based on Supplier</p>
        </TabsContent>
      </Tabs>



      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
            <DialogDescription>Modify the medicine details and save changes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {formData && Object.keys(formData).map((key) => (
              key !== 'id' && (
                <div key={key} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={key} className="text-right">{key.toUpperCase()}</Label>
                  <Input id={key} name={key} defaultValue={formData[key]} className="col-span-3" onChange={handleInputChange} />
                </div>
              )
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handlePaymentEditSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>





    </main>
  );
};

export default Ledger;

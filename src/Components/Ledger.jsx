import React, { useState, useEffect } from 'react';
import { findSupplierExpiry, getsupplierSql, findPaymentByDateSql, getBillPaymentSql, deletePaymentSql, updatePaymentSql, getAllPaymentsSql } from '@/services/medicineService.js';
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
  const [allPayments,setAllPayments] = useState([])
  const [allPurchases, setAllPurchases] = useState([]);
  const [filteredBill, setFilteredBill] = useState([]);
  const [fileredExpiry, setFilteredExpiry] = useState([]);
  const [filteredSupplier, setFilteredSupplier] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyPayments, setDailyPayments] = useState([]);
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [selectedSupplierBalance, setSelectedSupplierBalance] = useState(0);
  const [formData, setFormData] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = async (e) => {
    try {
      const date = e.target.value; // Get the selected date from the event
      setSelectedDate(date); // Update the selected date state

      // If no date is selected, clear the dailyPayments state
      if (!date) {
        setDailyPayments([]);
        return;
      }

      // Fetch payments for the selected date
      const payments = await findPaymentByDateSql(date);
      setDailyPayments(payments); // Update the dailyPayments state with the retrieved payments
    } catch (error) {
      console.error("Error fetching payments by date:", error.message); // Log the error for debugging
      // You can set an error state here or display an error message to the user
    }
  };

  const totalDailyPayment = dailyPayments.reduce((sum, item) => sum + Number(item.total), 0);


  useEffect(() => {
    fetchAllSupplier();
    fetchAllPayments();
  }, []);




  const handleDeletePaymentSql = async (paymentId) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;

    try {
      const response = await deletePaymentSql(paymentId);
      console.log(response);
      // After deletion, you might want to refresh the payments list or update the state accordingly
      setDailyPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== paymentId));
      setAllPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== paymentId));
      alert('Payment Deleted Successfully!');
    } catch (error) {
      console.error('Error deleting payment from the database', error);
      alert('Failed To Delete Payment');
    }
  };


  const fetchAllSupplier = async () => {
    try {
      const response = await getsupplierSql();
      setAllSupplier(response.data);
      setFilteredSupplier(response.data);
    } catch (error) {
      console.error('Error fetching the Supplier:', error);
    }
  };

  const fetchAllPayments = async() =>{
    try {
      const response = await getAllPaymentsSql();
      setAllPayments(response);
    } catch (error) {
      console.log("Error Fetching All The Payments:",error)
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

 const handlePaymentEditSave =  async () => { 
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

      const selectedSupplier = allSupplier.find((item) => item.supplierName === name);

      if (selectedSupplier) {
        setSelectedSupplierBalance(Number(selectedSupplier.supplierBalance));

        const supplierBills = await getBillPaymentSql(name); // Fetch supplier bills
        // console.log(supplierBills);

        setFilteredBill(supplierBills); // Set filtered and sorted bills
      }
    } catch (error) {
      console.error('Error fetching supplier transactions:', error.message);
      // Handle the error (e.g., show a toast or alert to the user)
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

  const totalBalance = allSupplier.reduce((sum, supplier) => {
    return sum + Number(supplier.supplierBalance);
  }, 0);

  const averageBalance = allSupplier.length > 0 ? totalBalance / allSupplier.length : 0;

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
            totalDailyPayment={totalDailyPayment}
            handlePaymentEditSave={handlePaymentEditSave}
            handleDeletePaymentSql={handleDeletePaymentSql}
            handleEditClick={handleEditClick}

            selectedSupplierName={selectedSupplierName}
            filteredBill={filteredBill}
            selectedSupplierBalance={selectedSupplierBalance}

          />
        </TabsContent>
        <TabsContent value="all-payment">
          <TabContentShowAllPayments
          allPayments = {allPayments}
          handleDeletePaymentSql = {handleDeletePaymentSql}
          handleEditClick = {handleEditClick}
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

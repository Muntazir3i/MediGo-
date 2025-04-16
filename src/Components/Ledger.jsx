import React, { useState, useEffect } from 'react';
import { getSupplier, getPurchase,findSupplierTransaction,findPaymentByDate } from '@/services/medicineService.js';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Input } from './ui/input.jsx';

const Ledger = () => {
  const [allSupplier, setAllSupplier] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [filteredBill, setFilteredBill] = useState([]);
  const [filteredSupplier, setFilteredSupplier] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyPayments, setDailyPayments] = useState([]);
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [selectedSupplierBalance, setSelectedSupplierBalance] = useState(0);

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
      const payments = await findPaymentByDate(date);
      setDailyPayments(payments); // Update the dailyPayments state with the retrieved payments
    } catch (error) {
      console.error("Error fetching payments by date:", error.message); // Log the error for debugging
      // You can set an error state here or display an error message to the user
    }
  };

  const totalDailyPayment = dailyPayments.reduce((sum, item) => sum + Number(item.total), 0);


  useEffect(() => {
    fetchAllSupplier();
    fetchPurchases();
  }, []);

  const fetchAllSupplier = async () => {
    try {
      const response = await getSupplier();
      setAllSupplier(response.data);
      setFilteredSupplier(response.data);
    } catch (error) {
      console.error('Error fetching the Supplier:', error);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await getPurchase();
      setAllPurchases(response.data);
    } catch (error) {
      console.error('Error fetching the Bills:', error);
    }
  };

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
      // Set the selected supplier name
      setSelectedSupplierName(name);
  
      // Find the selected supplier from the list of all suppliers
      const selectedSupplier = allSupplier.find((item) => item.supplierName === name);
  
      if (selectedSupplier) {
        // Set the supplier's balance
        setSelectedSupplierBalance(Number(selectedSupplier.supplierBalance));
  
        // Fetch the supplier transactions from the server
        const supplierBills = await findSupplierTransaction(name);
  
        // Set the filtered and sorted bills
        setFilteredBill(supplierBills);
      }
    } catch (error) {
      console.error("Error fetching supplier transactions:", error.message);
      // Handle the error (e.g., show a toast or alert to the user)
    }
  };

  const totalBalance = allSupplier.reduce((sum, supplier) => {
    return sum + Number(supplier.supplierBalance);
  }, 0);

  const averageBalance = allSupplier.length > 0 ? totalBalance / allSupplier.length : 0;

  return (
    <main id='main-top-container' className="h-[90vh] lg:h-screen min-w-0 flex-1 overflow-auto bg-blue-50 p-4">
      <h1 className="text-3xl font-bold mb-8">Supplier Ledger</h1>


      <div className='h-[65vh] flex flex-col-reverse lg:flex-row gap-4 border'>
        <div className='border-gray-300 border lg:w-[65%] rounded-lg p-3 overflow-auto'>
          <Input className='mb-2 bg-white' placeholder="Search Suppliers" value={search} onChange={handleSearchChange} />
          <h1 className="text-3xl mb-2">Supplier Balances</h1>
          <p className='font-light text-lg'>Current balances for all suppliers</p>

          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4">Supplier Name</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
              {filteredSupplier.length > 0 ? (
                filteredSupplier.map((supplier, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-black font-bold">{supplier.supplierName}</td>
                    <td className="px-6 py-4">
                      <Button onClick={() => showNameFn(supplier.supplierName)}>View Transactions</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-center">No Supplier Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='border-gray-300 border lg:w-[35%] rounded-lg p-3'>
          <h1 className="text-3xl mb-2">Summary</h1>
          <p className='font-light text-lg'>Total outstanding balances</p>

          <div className='flex justify-between mt-3'>
            <p className='text-2xl'>Total Suppliers:</p>
            <p className='text-2xl font-bold'>{allSupplier.length}</p>
          </div>
          {/* <div className='flex justify-between mt-3'>
            <p className='text-2xl'>Total Balance:</p>
            <p className='text-2xl font-bold'>₹ {totalBalance.toFixed(2)}</p>
          </div>
          <div className='flex justify-between mt-3'>
            <p className='text-2xl'>Avg. Balance:</p>
            <p className='text-2xl font-bold'>₹ {averageBalance.toFixed(2)}</p>
          </div> */}
        </div>
      </div>

      <div className='border-gray-300 border w-full mt-5 h-[50vh] rounded-lg p-3 overflow-auto'>
        <h2 className='text-2xl font-bold mb-2'>Transaction History {selectedSupplierName && `for ${selectedSupplierName}`}</h2>
        <p className='font-light text-lg'>Showing all transactions</p>

        <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4">BILL DATE</th>
              <th className="px-6 py-4">SUPPLIER</th>
              <th className="px-6 py-4">TYPE</th>
              <th className="px-6 py-4">INVOICE</th>
              <th className="px-6 py-4">AMOUNT</th>
              <th className="px-6 py-4">BAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-t border-gray-100">
            {filteredBill.length > 0 ? (() => {
              let runningBal = selectedSupplierBalance;
              return filteredBill.map((bill, idx) => {
                if (bill.type === 'Bill') {
                  runningBal += Number(bill.total);
                } else if (bill.type === 'Payment') {
                  runningBal -= Number(bill.total);
                }

                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-black font-bold">{bill.date}</td>
                    <td className="px-6 py-4 text-black font-light">{bill.supplierName}</td>
                    <td className="px-6 py-4">
                      {bill.type === 'Bill' ? (
                        <Badge className='text-lg' variant="destructive">{bill.type}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-lg bg-green-100 text-green-800 hover:bg-green-100">
                          {bill.type}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-black font-light">{bill.invoice}</td>
                    <td className={bill.type === "Bill" ? "px-6 py-4 text-red-500 font-bold" : "px-6 py-4 text-green-800 font-bold"}>
                      {bill.type === "Bill" ? `+₹ ${Number(bill.total).toFixed(2)}` : `-₹ ${Number(bill.total).toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4 text-black font-bold">₹ {runningBal.toFixed(2)}</td>
                  </tr>
                );
              });
            })() : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">No Transactions Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mb-4 mt-4">
        <label className="text-xl font-semibold">Check Payments on Date:</label>
        <Input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="w-60"/*  */
        />
      </div>
      {selectedDate && (
  <div className='border-gray-300 border w-full mt-2 mb-4 rounded-lg p-3 overflow-auto bg-white'>
    <h2 className='text-xl font-bold mb-2'>Payments on {selectedDate}</h2>
    {dailyPayments.length > 0 ? (
      <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4">SUPPLIER</th>
            <th className="px-6 py-4">INVOICE</th>
            <th className="px-6 py-4">AMOUNT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 border-t border-gray-100">
          {dailyPayments.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-black font-bold">{item.supplierName}</td>
              <td className="px-6 py-4 text-black">{item.invoice}</td>
              <td className="px-6 py-4 text-green-800 font-bold">₹ {Number(item.total).toFixed(2)}</td>
            </tr>
          ))}
          <tr className="bg-gray-100">
  <td className="px-6 py-4 font-bold text-right" colSpan="2">Total</td>
  <td className="px-6 py-4 font-bold text-green-800">₹ {totalDailyPayment.toFixed(2)}</td>
</tr>

        </tbody>
      </table>
    ) : (
      <p className='text-gray-600'>No payments found on this date.</p>
    )}
  </div>
)}


    </main>
  );
};

export default Ledger;

import React, { useState, useEffect } from 'react';
import { getSupplier, getPurchase } from '@/services/medicineService.js';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';

const Ledger = () => {
  const [allSupplier, setAllSupplier] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [filteredBill, setFilteredBill] = useState([]);
  const [filteredSupplier, setFilteredSupplier] = useState(null);

  useEffect(() => {
    fetchAllSupplier();
    fetchPurchases();
  }, []);

  const fetchAllSupplier = async () => {
    try {
      const response = await getSupplier();
      setAllSupplier(response.data);
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

  const showNameFn = (name) => {
    setFilteredBill([]);
    setFilteredSupplier(null);
    const selectedSupplier = allSupplier.find((item) => item.supplierName === name);
    if (selectedSupplier) {
      setFilteredSupplier(Number(selectedSupplier.supplierBalance));
      const supplierBills = allPurchases
        .filter((item) => item.supplierName === name)
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // sort by date
      setFilteredBill(supplierBills);
    }
  };

  const totalBalance = allSupplier.reduce((sum, supplier) => {
    return sum + Number(supplier.supplierBalance);
  }, 0);

  const averageBalance = allSupplier.length > 0 ? totalBalance / allSupplier.length : 0;

  return (
    <main id='main-top-container' className="h-screen min-w-0 flex-1 overflow-auto bg-blue-50 p-4">
      <h1 className="text-3xl font-bold mb-8">Supplier Ledger</h1>

      <div className='h-[65vh] flex gap-4'>
        <div className='border-gray-300 border w-[65%] rounded-lg p-3 overflow-auto'>
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
              {allSupplier.length > 0 ? (
                allSupplier.map((supplier, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-black font-bold">{supplier.supplierName}</td>
                    <td className=""><Button onClick={() => showNameFn(supplier.supplierName)}>View Transactions</Button></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center">No Supplier Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className='border-gray-300 border w-[35%] rounded-lg p-3'>
          <h1 className="text-3xl mb-2">Summary</h1>
          <p className='font-light text-lg'>Total outstanding balances</p>

          <div className='flex justify-between mt-3'>
            <p className='text-2xl'>Total Suppliers:</p>
            <p className='text-2xl font-bold'>{allSupplier.length}</p>
          </div>
        </div>
      </div>

      <div className='border-gray-300 border w-full mt-5 h-[50vh] rounded-lg p-3 overflow-auto'>
        <h2 className='text-2xl font-bold mb-2'>Transaction History</h2>
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
              let runningBal = Number(filteredSupplier || 0);
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
                <td colSpan="10" className="px-6 py-4 text-center">No Supplier Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Ledger;

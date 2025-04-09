import React from 'react'
import { useState, useEffect } from 'react';
import { getSupplier, getPurchase } from '@/services/medicineService.js';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';


const Ledger = () => {

  const [allSupplier, setAllSupplier] = useState([])
  const [allPurchases, setAllPurchases] = useState([])
  const [filteredBill, setFilteredBill] = useState([])

  useEffect(() => {
    fetchAllSupplier()
  }, [])

  useEffect(() => {
    fetchPurchases()
  }, [])

  console.log(allPurchases);

  const totalBills = filteredBill
    .filter(entry => entry.type === "Bill")
    .reduce((sum, entry) => sum + Number(entry.total), 0);

    const totalPayments = filteredBill
    .filter(entry => entry.type === "Payment")
    .reduce((sum, entry) => sum + Number(entry.total), 0);

    const balance = totalBills - totalPayments;


  const showNameFn = (name)=>{
    setFilteredBill([]);
    setFilteredBill(allPurchases.filter((item)=>item.supplierName === name));
  }

  console.log(filteredBill);

  const fetchAllSupplier = async () => {
    try {
      const response = await getSupplier();
      setAllSupplier(response.data)
    } catch (error) {
      console.error('Error fetching the Supplier:', error);
    }
  }

  const fetchPurchases = async () => {
    try {
      const response = await getPurchase();
      setAllPurchases(response.data);
    } catch (error) {
      console.error('Error fetching the Bills:', error);
    }
  }

  const totalBalance = allSupplier.reduce((sum, supplier) => {
    return sum + Number(supplier.supplierBalance);
  }, 0);

  const averageBalance = allSupplier.length > 0 ? totalBalance / allSupplier.length : 0;



  return (
    <>
      <main id='main-top-container' className="h-screen min-w-0 flex-1 overflow-auto bg-blue-50 p-4">
        <h1 className="text-3xl font-bold mb-8">Supplier Ledger</h1>

        <div className=' h-[65vh] flex gap-4 b'>

          <div className='border-gray-300 border w-[65%] rounded-lg p-3  overflow-auto'>
            <h1 className="text-3xl mb-2">Supplier Balances</h1>
            <p className='font-light text-lg'>Current balances for all suppliers</p>

            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4">Supplier Name</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Actions</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                {allSupplier.length > 0 ? (
                  allSupplier.map((supplier) => (
                    <tr key={supplier} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-black font-bold">{supplier.supplierName}</td>
                      <td className="px-6 py-4 text-black font-light">₹ {totalBalance}</td>
                      <td className=""><Button onClick={()=>showNameFn(supplier.supplierName)}>View Transactions</Button></td>
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



          <div className='border-gray-300 border  w-[35%]  rounded-lg  p-3'>
            <h1 className="text-3xl mb-2">Summary</h1>
            <p className='font-light text-lg '>Total outstanding balances</p>

            <div className='flex justify-between mt-3'>
              <p className='text-2xl'>Total Suppliers:</p>
              <p className='text-2xl font-bold'>{allSupplier.length}</p>
            </div>

            <div className='flex justify-between mt-3'>
              <p className='text-2xl'>Total Outstanding::</p>
              <p className='text-2xl font-bold'>₹ {totalBalance}</p>
            </div>

            <div className='flex justify-between mt-3'>
              <p className='text-2xl'>Average Balance:</p>
              <p className='text-2xl font-bold'>₹ {averageBalance.toFixed(2)}</p>
            </div>




          </div>
        </div>

        <div className='border-gray-300 border w-[100%] mt-5 h-[50vh] rounded-lg p-3  overflow-auto'>
          <h2 className='text-2xl font-bold mb-2'>Transaction History</h2>
         <p className='font-light text-lg'>Showing all transactions</p>
         <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4">BILL DATE</th>
                  <th className="px-6 py-4">SUPPLIER</th>
                  <th className="px-6 py-4">TYPE</th>
                  <th className="px-6 py-4">BILL NO.</th>
                  <th className="px-6 py-4">AMOUNT</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                {filteredBill.length > 0 ? (
                  filteredBill.map((bill) => (
                    <tr key={bill} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-black font-bold">{bill.date}</td>
                      <td className="px-6 py-4 text-black font-light">{bill.supplierName}</td>
                     {bill.type === 'Bill' ?  <td className="px-6 py-4 text-black font-light"><Badge className='text-lg' variant="destructive">{bill.type}</Badge></td> :      <td className="px-6 py-4">
                                    <Badge variant="outline" className="text-lg bg-green-100 text-green-800 hover:bg-green-100">
                                       {bill.type}
                                    </Badge>
                                    </td> }
                      <td className="px-6 py-4 text-black font-light">{bill.invoice}</td>
                      {bill.type === "Bill" ? <td className="px-6 py-4 text-red-500 font-bold">+₹ {Number(bill.total).toFixed(2)}</td> : <td className="px-6 py-4 text-green-800 font-bold">-₹ {Number(bill.total).toFixed(2)}</td>}
                     
                    </tr>
                  )
                  )
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center">No Supplier Found</td>
                  </tr>
                )}
                <tr>
                <td className='font-bold'>TOTAL BALANCE</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td className="px-6 py-4 text-black font-bold">₹ {Number(balance).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
        </div>

      </main>
    </>
  )
}

export default Ledger
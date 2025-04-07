import React from 'react'
import { useState, useEffect } from 'react';
import { getSupplier } from '@/services/medicineService.js';
import { Button } from './ui/button.jsx';


const Ledger = () => {

  const [allSupplier, setAllSupplier] = useState([])

  useEffect(() => {
    fetchAllSupplier()
  }, [])


  console.log(allSupplier);



  const fetchAllSupplier = async () => {
    try {
      const response = await getSupplier();
      setAllSupplier(response.data)
    } catch (error) {
      console.error('Error fetching the Supplier:', error);
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
                      <td className="px-6 py-4 text-black font-light">₹ {supplier.supplierBalance}</td>
                      <td className=""><Button>View Transactions</Button></td>
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

      </main>
    </>
  )
}

export default Ledger
import React from 'react'
import { useState } from 'react';

const Ledger = () => {

  

  return (
    <>
     <main id='main-top-container' className="h-screen min-w-0 flex-1 overflow-auto bg-blue-50 p-4">
    <h1 className="text-3xl font-bold mb-8">Supplier Ledger</h1>

    <div className=' h-[80vh] flex gap-4'>

      <div className='border-gray-300 border w-[65%] rounded-lg p-3'>
      <h1 className="text-3xl mb-2">Supplier Balances</h1>
      <p className='font-light text-lg'>Current balances for all suppliers</p>
      </div>



      <div className='border-gray-300 border  w-[35%]  rounded-lg  p-3'>
      <h1 className="text-3xl mb-2">Summary</h1>
      <p className='font-light text-lg'>Total outstanding balances</p>
      </div>

    </div>

    </main>
    </>
  )
}

export default Ledger
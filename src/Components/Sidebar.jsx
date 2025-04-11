import React from 'react'
import {Link, NavLink} from 'react-router-dom'

function Sidebar() {
  return (
    
         <aside class="fixed bottom-0 left-0 h-[10vh]  w-full flex-none lg:static lg:h-screen lg:w-35 lg:flex-col lg:gap-5 bg-blue-200 p-4 flex flex-row items-center justify-center gap-2">
            <Link className='w-full' to='/'>
            <button type="button" className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Dashboard</button>
            </Link>
            <Link className='w-full' to='/billing'>
            <button type="button" className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Billing</button>
            </Link>
            <Link className='w-full' to='/add'>
            <button type="button" className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Add</button>
            </Link>
            <Link className='w-full' to='/inventory'>
    <button type="button" className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Inventory</button>
    </Link>

    <Link className='w-full' to='/ledger'>
    <button type="button" className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Ledger</button>
    </Link>
  </aside>
  )
}

export default Sidebar
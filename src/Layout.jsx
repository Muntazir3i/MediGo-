import React from 'react'
import Sidebar from './Components/Sidebar.jsx'
import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className='flex h-60'>
    <Sidebar/>
    <Outlet/>
    </div>
  )
}

export default Layout
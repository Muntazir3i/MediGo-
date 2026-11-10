import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Layout from './Layout'
import Home from './Components/Home.jsx'
import Add from './Components/Add.jsx'
import Inventory from './Components/Inventory.jsx'
import {createBrowserRouter, createRoutesFromElements ,RouterProvider,Route} from 'react-router-dom'
import DashBoard from './Components/DashBoard.jsx'
import Ledger from './Components/Ledger.jsx'
import Insights from './Components/Insights.jsx'
import Settings from './Components/Settings.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'

let router = createBrowserRouter(
  createRoutesFromElements(
    <Route path = '/' element={<Layout/>}>
      <Route path = '' element= {<DashBoard/>}/>
      <Route path = 'billing' element= {<Home/>}/>
      <Route path = 'add' element= {<Add/>}/>
      <Route path = 'inventory' element = {<Inventory/>}/>
      <Route path = 'ledger' element = {<Ledger/>}/>
      <Route path = 'insights' element = {<Insights/>}/>
      <Route path = 'settings' element = {<Settings/>}/>
    </Route>
  )
);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <RouterProvider router= {router} />
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>,
)

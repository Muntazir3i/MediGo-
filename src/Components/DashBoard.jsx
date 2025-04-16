import React, { useEffect, useState } from 'react'
import { Button } from './ui/button.jsx'
import { showAllBills } from '@/services/medicineService.js';
import { getMedicines, getLowStock, getOutOfStock,getExpiry } from '../services/medicineService.js';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card.jsx"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.jsx"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "./ui/dialog.jsx"

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

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs.jsx"



function DashBoard() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [allbills, setAllBills] = useState([])
  const [filteredBill, setFilteredBill] = useState([])
  const [medicines, setMedicines] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
  const [expiry,setExpiry] = useState([])

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    fetchLowStock();
  }, [])

  useEffect(() => {
    fetchOutOfStock();
  }, [])

  useEffect(()=>{
    fetchExpiryStock()
  },[])


  console.log(outOfStock);
  console.log(expiry);



  //fetch all med
  const fetchMedicines = async () => {
    try {
      const response = await getMedicines();
      setMedicines(response.data);
    } catch (error) {
      console.error('Error fetching the medicine:', error);
    }
  };
  // fetch low-stock med
  const fetchLowStock = async () => {
    try {
      const response = await getLowStock();
      setLowStock(response.data)
    } catch (error) {
      console.error('Error fetching the Low Stock medicine:', error);
    }
  }

  //fetch out-of-stock med
  const fetchOutOfStock = async () => {
    try {
      const response = await getOutOfStock();
      setOutOfStock(response.data)
    } catch (error) {
      console.error('Error fetching the Out Of Stock medicine:', error)
    }
  }

  //fetch expiry stock 
  const fetchExpiryStock = async()=>{
    try {
      const response = await getExpiry();
      setExpiry(response.data)
    } catch (error) {
      console.error('Error fetching the Expiry medicine:', error)
    }
  }



  const fetchAllBills = async () => {
    try {
      const response = await showAllBills();
      setAllBills(response.data);
    } catch (error) {
      console.error('Error fetching the Bills:', error);
    }
  };



  useEffect(() => {
    setFilteredBill(allbills.filter(item => item.date === date));
  }, [date, allbills]);


  useEffect(() => {
    console.log(filteredBill);

  }, [filteredBill])

  useEffect(() => {
    fetchAllBills()
  }, [])

  // useEffect(() => {
  //     console.log(allbills);

  // }, [allbills])

  const handleChange = (e) => {
    setDate(e.target.value)
  }

  const onBtnClick = () => {
    console.log(date);

  }




  return (


    <main id='main-top-container' className="h-screen min-w-0 flex-1 overflow-auto bg-blue-50 p-4">

      <Tabs defaultValue="sales" >
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="stock-info">Stock Info</TabsTrigger>
          <TabsTrigger value="expiry">Expiry</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <h1 className="text-3xl font-bold mb-8">Sales Dashboard</h1>
          <input className='border-black' onChange={handleChange} type="date" value={date} />
          {/* <Button onClick={filteredBillFn} >Show Date</Button> */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className='mt-2'>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sale</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{filteredBill.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{filteredBill.length} payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{filteredBill
                  .filter((item) => item.status === "completed")
                  .reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{filteredBill
                  .filter((item) => item.status === "completed").length} completed payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{filteredBill
                  .filter((item) => item.status === "pending")
                  .reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredBill
                    .filter((item) => item.status === "pending").length} pending payments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">  ₹{(
                  filteredBill.reduce((sum, item) => sum + (item.total || 0), 0) /
                  (filteredBill.length || 1)
                ).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Per completed payment</p>
              </CardContent>
            </Card>
          </div>

          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500 mt-5">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1">ID</th>
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Date</th>
                <th className="px-2 py-1">Time</th>
                <th className="px-2 py-1">Total</th>
                {/* <th className="px-2 py-1">Stock</th> */}
                {/* <th className="px-2 py-1">Price</th> */}
                {/* <th className="px-2 py-1"></th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
              {filteredBill.length > 0 ? (
                filteredBill.map((med) => (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-black">{med.id}</td>
                    <td className="px-2 py-1 text-black font-bold">{med.name}</td>
                    <td className="px-2 py-1 text-black">{med.status}</td>
                    <td className="px-2 py-1 text-black font-black">{med.date}</td>
                    <td className="px-2 py-1 text-black">{med.time}</td>
                    <td className="px-2 py-1 text-black font-bold">₹ {med.total.toFixed(2)}</td>
                    <td className="px-2 py-1">

                      <DropdownMenu>
                        <DropdownMenuTrigger className="font-bold">...</DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Dialog>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <DialogTrigger>View Details</DialogTrigger>
                            </DropdownMenuItem>
                            <DialogContent className="sm:max-w-[650px]">
                              <DialogHeader>
                                <DialogTitle className='text-2xl'>Saabit Pharmacy</DialogTitle>
                                <DialogDescription>
                                  <span className='font-bold'>Contact</span>: +91 9797027047
                                  <br></br>
                                  <span className='font-bold'>Address</span>: Saabit Complex, Hospital Road, Karan Nagar, Srinagar - 190010 (SMHS Hospital)
                                </DialogDescription>
                                <DialogDescription>
                                  Thank you for your purchase!
                                </DialogDescription>
                              </DialogHeader>

                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[100px]">Name</TableHead>
                                    <TableHead>QTY</TableHead>
                                    <TableHead>BATCH NO.</TableHead>
                                    <TableHead>PRICE</TableHead>
                                    <TableHead className="text-right">TOTAL</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {med.medicines.map((item) => (
                                    <TableRow>
                                      <TableCell className="font-medium">{item.name}</TableCell>
                                      <TableCell>{`x${item.qty}`}</TableCell>
                                      <TableCell>{item.batchNumber}</TableCell>
                                      <TableCell>{item.mrp}</TableCell>
                                      <TableCell className="text-right">{(Number(item.mrp) * item.qty).toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}


                                </TableBody>
                                <TableFooter>
                                  <TableRow>
                                    <TableCell colSpan={3}>Total</TableCell>
                                    <TableCell colSpan={5} className="text-right text-2xl font-extrabold">{`₹${med.total.toFixed(2)}`}</TableCell>
                                  </TableRow>
                                </TableFooter>
                              </Table>


                              <DialogFooter>
                                <Button type="button">
                                  Save & Print
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </DropdownMenuContent>
                      </DropdownMenu>



                    </td>
                    <td className="flex gap-4 px-2 py-1">
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-2 py-1 text-center">No Bills Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </TabsContent>
        <TabsContent value="stock-info">
          <Tabs defaultValue="low-stock">
            <TabsList>
              <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
              <TabsTrigger value="out-of-stock">Out Of Stock</TabsTrigger>
            </TabsList>
            <TabsContent value="low-stock">
              <h1 className="text-3xl font-bold mb-8">Low Stock</h1>
              <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Batch Number</th>
                    <th className="px-6 py-4">EXP Date</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                  {lowStock.length > 0 ? (
                    lowStock
                      .map((med) => (
                        <tr key={med.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-black font-bold">{med.name}</td>
                          <td className="px-6 py-4 text-black font-light">{med.category}</td>
                          <td className="px-6 py-4 text-black font-light">{med.supplier}</td>
                          <td className="px-6 py-4 text-black font-light">{med.batchNumber}</td>
                          <td className="px-6 py-4 text-black font-bold">{med.expiryDate}</td>
                          <td className={`${Number(med.stock) > 0 ? 'text-green-600' : 'text-red-600'} px-6 py-4 font-bold`}>
                            {med.stock}
                          </td>
                          <td className="px-6 py-4 text-black font-extrabold">Rs {med.mrp}</td>
                          <td className="flex gap-4 px-6 py-4">
                            <button onClick={() => handleDelete(med.id)} className="text-red-600 hover:text-red-800">Delete</button>
                            <Button variant="outline" onClick={() => handleEditClick(med)}>Edit</Button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-6 py-4 text-center">No Medicines Found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TabsContent>
            <TabsContent value="out-of-stock">
              <h1 className="text-3xl font-bold mb-8">Out Of Stock</h1>
              <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Batch Number</th>
                    <th className="px-6 py-4">EXP Date</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                  {outOfStock.length > 0 ? (
                    outOfStock
                      .map((med) => (
                        <tr key={med.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-black font-bold">{med.name}</td>
                          <td className="px-6 py-4 text-black font-light">{med.category}</td>
                          <td className="px-6 py-4 text-black font-light">{med.supplier}</td>
                          <td className="px-6 py-4 text-black font-light">{med.batchNumber}</td>
                          <td className="px-6 py-4 text-black font-bold">{med.expiryDate}</td>
                          <td className={`${Number(med.stock) > 0 ? 'text-green-600' : 'text-red-600'} px-6 py-4 font-bold`}>
                            {med.stock}
                          </td>
                          <td className="px-6 py-4 text-black font-extrabold">Rs {med.mrp}</td>
                          <td className="flex gap-4 px-6 py-4">
                            <button onClick={() => handleDelete(med.id)} className="text-red-600 hover:text-red-800">Delete</button>
                            <Button variant="outline" onClick={() => handleEditClick(med)}>Edit</Button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-6 py-4 text-center">No Medicines Found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value='expiry'>
          <h1 className="text-3xl font-bold mb-8">Expiry</h1>
          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Batch Number</th>
                    <th className="px-6 py-4">EXP Date</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                  {expiry.length > 0 ? (
                    expiry
                      .map((med) => (
                        <tr key={med.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-black font-bold">{med.name}</td>
                          <td className="px-6 py-4 text-black font-light">{med.category}</td>
                          <td className="px-6 py-4 text-black font-light">{med.supplier}</td>
                          <td className="px-6 py-4 text-black font-light">{med.batchNumber}</td>
                          <td className="px-6 py-4 text-black font-bold">{med.expiryDate}</td>
                          <td className={`${Number(med.stock) > 0 ? 'text-green-600' : 'text-red-600'} px-6 py-4 font-bold`}>
                            {med.stock}
                          </td>
                          <td className="px-6 py-4 text-black font-extrabold">Rs {med.mrp}</td>
                          <td className="flex gap-4 px-6 py-4">
                            <button onClick={() => handleDelete(med.id)} className="text-red-600 hover:text-red-800">Delete</button>
                            <Button variant="outline" onClick={() => handleEditClick(med)}>Edit</Button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-6 py-4 text-center">No Medicines Found</td>
                    </tr>
                  )}
                </tbody>
              </table>
        </TabsContent>
      </Tabs>

    </main>
  )
}

export default DashBoard
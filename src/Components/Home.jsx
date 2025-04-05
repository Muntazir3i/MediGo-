import React, { useState, useEffect } from 'react';
import { Input } from './ui/input.jsx';
// import { Label } from '@radix-ui/react-label.jsx';
import { getMedicines, addBill } from '../services/medicineService.js';
import { Button } from './ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog.jsx";
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




import './home.css'

function Home() {
  const [open, setOpen] = useState(false)
  const [medicines, setMedicines] = useState([]);
  const [filterMedicine, setFilterMedicine] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [bill, setBill] = useState({
    total: '',
    medicines: []
  })
  const [name, setName] = useState('')
  const [status, setStatus] = useState('')

  // const handleSave = () => {
  //   // Perform save logic here
  //   addBill()
  //   setOpen(false); // Close dialog
  // };

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    // Filter medicines whenever search input changes
    const filtered = medicines.filter((medicine) =>
      medicine.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilterMedicine(filtered);
  }, [search, medicines]);



  const fetchMedicines = async () => {
    try {
      const response = await getMedicines();
      setMedicines(response.data);
      setFilterMedicine(response.data);
    } catch (error) {
      console.error('Error fetching the medicine:', error);
    }
  };

  const handleName = (e) => {
    setName(e.target.value)
  }

  const addBillFn = async () => {
    const newBill = { medicines: [...cart], total: totalAmount, name: name, status: status, time: new Date().toLocaleTimeString() }; // Create the updated bill object

    setBill(newBill); // Update state (but won't be available immediately)

    try {
      const response = await addBill(newBill); // Use newBill instead of bill
      console.log(response);
      setCart([])
      setStatus('')
      setOpen(false)
    } catch (error) {
      console.error("Error Adding Bill to the database", error);
    }
  };


  useEffect(() => {
    console.log(bill);
  }, [bill])

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // const onAddClick = (med) => {
  //   setCart((prevCart) => {
  //     // Check if medicine is already in the cart
  //     const existingMed = prevCart.find((item) => item.id === med.id);

  //     if (existingMed) {
  //       // If found, increase quantity
  //       return prevCart.map((item) =>
  //         item.id === med.id ? { ...item, qty: item.qty + 1 } : item
  //       );
  //     } else {
  //       // If not found, add new medicine with qty 1
  //       return [...prevCart, { ...med, qty: 1 }];
  //     }
  //   });
  // };

  // useEffect(()=>{
  //   console.log(cart);

  // },[cart])

  const onAddClick = (med) => {
    setCart((prevCart) => {
      const existingMed = prevCart.find((item) => item.id === med.id);

      if (existingMed) {
        // Prevent adding more than available stock
        if (existingMed.qty >= (med.stock || 0)) return prevCart;

        return prevCart.map((item) =>
          item.id === med.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        // Only add if stock is available
        if ((med.stock || 0) > 0) {
          return [...prevCart, { ...med, qty: 1 }];
        } else {
          return prevCart; // No stock available, don't add
        }
      }
    });

    // Reduce stock in medicines
    setMedicines((prevMedicines) =>
      prevMedicines.map((medicine) =>
        medicine.id === med.id && (medicine.stock || 0) > 0
          ? { ...medicine, stock: medicine.stock - 1 }
          : medicine
      )
    );
  };



  const onDeleteClick = (id) => {
    setCart((prevCart) => {
      const itemInCart = prevCart.find((item) => item.id === id);
  
      if (!itemInCart) return prevCart; // If item not found in cart, do nothing
  
      return itemInCart.qty > 1
        ? prevCart.map((item) =>
            item.id === id ? { ...item, qty: item.qty - 1 } : item
          )
        : prevCart.filter((item) => item.id !== id);
    });
  
    setMedicines((prevMedicines) =>
      prevMedicines.map((medicine) =>
        medicine.id === id
          ? { ...medicine, stock: medicine.stock + 1 } // Always restore stock when removing from cart
          : medicine
      )
    );
  };

  const clearCart = () => {
    setCart([])
  }

  // const increaseQty = (id) => {
  //   setCart((prevCart) =>
  //     prevCart.map((item) =>
  //       item.id === id ? { ...item, qty: item.qty + 1 } : item
  //     )
  //   );
  // };

  // const decreaseQty = (id) => {
  //   setCart((prevCart) =>
  //     prevCart
  //       .map((item) =>
  //         item.id === id && item.qty > 1 ? { ...item, qty: item.qty - 1 } : item
  //       )
  //       .filter((item) => item.qty > 0) // Remove if qty becomes 0
  //   );
  // };

  const statusCheck = (e) => {
    setStatus(e.target.name)
  }


  const increaseQty = (id) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id
          ? { ...item, qty: Math.min(item.qty + 1, item.stock) } // Prevent exceeding stock
          : item
      )
    );

    // Reduce stock in medicines only if there's stock left
    setMedicines((prevMedicines) =>
      prevMedicines.map((medicine) =>
        medicine.id === id && medicine.stock > 0
          ? { ...medicine, stock: medicine.stock - 1 }
          : medicine
      )
    );
  };



  const decreaseQty = (id) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id && item.qty > 1 ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0) // Remove if qty becomes 0
    );

    // Increase stock only if quantity was greater than 1
    setMedicines((prevMedicines) =>
      prevMedicines.map((medicine) =>
        medicine.id === id && cart.find(item => item.id === id)?.qty > 1
          ? { ...medicine, stock: medicine.stock + 1 }
          : medicine
      )
    );
  };



  useState(() => {
    console.log(status);
  }, [status])

  const totalAmount = cart.reduce((acc, item) => acc + item.mrp * item.qty, 0);
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  console.log(formattedDate);


  return (
    <main id='main-top-container' className="h-screen min-w-0 flex-1 overflow-auto bg-blue-50 p-4">
      <h1 className="text-5xl">Billing</h1>
      <Input className='mb-3' placeholder="Search Medicines" onChange={handleSearchChange} />
      <div id='main-container' className='flex gap-2'>
        <div id="inventory-container">
          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Category</th>
                <th className="px-2 py-1">EXP Date</th>
                <th className="px-2 py-1">Stock</th>
                <th className="px-2 py-1">Price</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
              {filterMedicine.length > 0 ? (
                filterMedicine.map((med) => (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-black font-black">{med.name}</td>
                    <td className="px-2 py-1 text-black font-light">{med.category}</td>
                    <td className="px-2 py-1 text-black font-bold">{med.expiryDate}</td>
                    <td className={`${Number(med.stock) > 0 ? 'text-green-600 px-2 py-1 font-bold ' : 'text-red-600 px-2 py-1 font-bold'}`}>{med.stock}</td>
                    <td className="px-2 py-1 text-black font-bold">₹ {Number(med.mrp).toFixed(2)}</td>
                    <td className="flex gap-4 px-2 py-1">
                      {Number(med.stock) > 0 ?
                        <Button onClick={() => onAddClick(med)}>Add to cart</Button>
                        : <Button disabled>Add to Cart</Button>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-2 py-1 text-center">No Medicines Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div id='cart-container' className='bg-white px-2'>
          <h1 className='text-4xl text-center p-1'>Current Bill</h1>
          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Category</th>
                <th className="px-2 py-1">Qty</th>
                <th className="px-2 py-1">Price</th>
                <th className="px-2 py-1">Total</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
              {cart.length > 0 ? (
                cart.map((med) => (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-black font-bold">{med.name}</td>
                    <td className="px-2 py-1 text-black font-light">{med.category}</td>
                    <td className="px-2 py-1 text-black">
                      <div className="flex items-center space-x-1">
                        <button className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colo₹ focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-6 w-6'
                          onClick={() => decreaseQty(med.id)}>-</button>
                        <span className='w-8 text-center'>{med.qty}</span>
                        <button className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colo₹ focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-6 w-6'
                          onClick={() => increaseQty(med.id)}>+</button>
                      </div>
                    </td>
                    <td className="px-2 py-1 text-black font-light">₹ {Number(med.mrp).toFixed(2)}</td>
                    <td className="px-2 py-1 text-black font-bold ">₹ {(Number(med.mrp) * med.qty).toFixed(2)}</td>
                    <td className="flex gap-4 px-2 py-1">
                      <button onClick={() => onDeleteClick(med.id)} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-2 py-1 text-center">No medicines added to the bill yet</td>
                </tr>
              )}
            </tbody>
          </table>
          <hr className='mt-2' />
          <div className="flex justify-between mt-4 text-2xl font-bold text-center px-3">
            <p>Total</p>
            <p>₹{totalAmount.toFixed(2)}</p>
          </div>
          <div className={`mt-5 ${cart.length > 0 ? 'block' : 'hidden'}`}>
            <Input placeholder='Enter Your name' className='border-black py-5' onChange={handleName} />
            <p className='text-3xl font-bold mt-5'>Status</p>
            <label htmlFor="completed" className='mr-3'>Completed</label>
            <input name='completed' type="checkbox" onClick={statusCheck} />
            <br />
            <label htmlFor="pending" className='mr-3'>Pending</label>
            <input name='pending' type="checkbox" onClick={statusCheck} />
          </div>

          <div className="flex justify-between mt-5">
            {cart.length > 0 ? <Button onClick={clearCart} >Clear Cart</Button> : <Button disabled>Clear Cart</Button>}
            {cart.length && name.length > 0 ? <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setOpen(true)}>
                  Checkout
                </Button>
              </DialogTrigger>
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
                  <TableCaption>{formattedDate}</TableCaption>
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
                    {cart.map((item) => (
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
                      {/* <TableCell colSpan={3}>Total</TableCell> */}
                      <TableCell colSpan={5} className="text-right text-2xl font-extrabold">{`₹${totalAmount.toFixed(2)}`}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>


                <DialogFooter>
                  <Button type="button" onClick={addBillFn}>
                    Save & Print
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog> : <Button disabled>Checkout</Button>}
          </div>
        </div>
      </div>

    </main>
  );
}

export default Home;

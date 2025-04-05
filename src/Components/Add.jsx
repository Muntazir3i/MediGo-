import React, { useEffect, useState } from 'react';
import './add.css';
import { addMedicines, addPayment, addPurchase } from '../services/medicineService.js';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.jsx"
// import { Label } from '@radix-ui/react-label.jsx';
import { Label } from './ui/label';
import { Input } from './ui/input.jsx';
import { Button } from './ui/button.jsx';
import SelectList from './SelectList.jsx'


import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select"


function Add() {

  const [formData, setFormData] = useState({
    billNumber: '',
    billDate: '',
    supplierName: '',
    supplierDrugLn: '',
    supplierContact: '',
    products: []
  });

  const [products, setProducts] = useState([
    {
      id: Date.now(),
      name: "",
      batchNumber: "",
      expiryDate: "",
      stock: 0,
      unitPrice: 0,
      mrp: 0,
      discount: 0,
      gstPercentage: 0,
    },
  ])

  const [payments, setPayments] = useState({
    receiptDate: '',
    receiptNumber: '',
    supplierName: '',
    drugLicenseNumber: '',
    amountPaid: ''
  })

  const [addSupplier,setAddSupplier] = useState({
    supplierName:'',
    phoneNumber:'',
    email:'',
    address:'',
    drugLn:'',
    supplierBalance:''
  })

  const showPayment = async (e) => {
    e.preventDefault();
    let newPayment = { ...payments, id: Date.now() }
    setPayments(newPayment);
    try {
      const response = await addPayment(newPayment);
      console.log(response);
      setPayments({
        receiptDate: '',
        receiptNumber: '',
        supplierName: '',
        drugLicenseNumber: '',
        amountPaid: ''
      })

    } catch (error) {
      console.error('Error Adding Payment to the database', error)
    }


  }


  const addProduct = () => {
    setProducts([
      ...products,
      {
        id: Date.now(),
        name: "",
        batchNumber: "",
        expiryDate: "",
        stock: 0,
        unitPrice: 0,
        mrp: 0,
        discount: 0,
        gstPercentage: 0,
      },
    ])
  }



  const handleInputChange = (id, field, value) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, [field]: value, supplier: formData.supplierName, } : product
      )
    );
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value.toUpperCase().replace(/\s+/g, ' ')
      // products:products
    }));
  };

  const handleChangePayment = (e) => {
    const { name, value } = e.target;
    setPayments((prevData) => ({
      ...prevData,
      [name]: value.toUpperCase().replace(/\s+/g, ' ')
      // products:products
    }));
  };

  const handleChangeAddSupplier = (e)=>{
    const {name,value} = e.target;
    setAddSupplier((prevData)=>(
      {
        ...prevData,
        [name]:  value.toUpperCase().replace(/\s+/g, ' ')
      }
    ))
  }

  const showData = (e) =>{
    e.preventDefault();
    console.log(addSupplier);
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      setProducts(products.filter((med) => med.id !== id));

    }
  };


  const handleBothActions = async () => {
    if (!formData.billNumber.trim() || !formData.billDate.trim()) {
      alert("Bill Number and Bill Date are required.");
      return;
    }

    const validProducts = products.filter(product =>
      product.name.trim() &&
      product.batchNumber.trim() &&
      product.expiryDate.trim() &&
      product.stock > 0
    );

    if (validProducts.length === 0) {
      alert("At least one valid product is required.");
      return;
    }

    try {
      let allData = {
        id: Date.now(),
        ...formData,
        products: validProducts,
        totalAmount: totalAmount.toFixed(2),
        totalGst: totalGst.toFixed(2),
        total: Math.round(totalAmount + totalGst)
      };

      const [purchaseResponse, medicineResponse] = await Promise.all([
        addPurchase(allData),
        addMedicines(validProducts)
      ]);

      console.log('Purchase Response:', purchaseResponse);
      console.log('Medicine Response:', medicineResponse.data);

      alert('Purchase and Medicine added successfully!');

      // Reset state
      setFormData({
        billNumber: '',
        billDate: '',
        supplierName: '',
        supplierGstin: '',
        supplierContact: '',
      });

      setProducts([
        {
          id: Date.now(),
          name: "",
          batchNumber: "",
          expiryDate: "",
          stock: 0,
          unitPrice: 0,
          mrp: 0,
          discount: 0,
          gstPercentage: 0,
        },
      ]);

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process. Please check if the item already exists.');
    }
  };

  //   try {
  //     // Ensure `products` is an array and correctly structured
  //     const cleanedProducts = Array.isArray(products) ? products : Object.values(products);

  //     // Send request with cleaned array
  //     const response = await addMedicines(cleanedProducts);
  //     console.log('Medicine Added Successfully:', response.data);
  //     alert('Medicine added successfully!');

  //     // Reset products list
  //     setProducts([
  //       {
  //         id: Date.now(),
  //         name: "",
  //         batchNumber: "",
  //         expiryDate: "",
  //         stock: 0,
  //         unitPrice: 0,
  //         mrp: 0,
  //         discount: 0,
  //         gstPercentage: 0,
  //       },
  //     ]);
  //   } catch (error) {
  //     console.error('Error adding medicine:', error);
  //     alert('Failed to add medicine. Either The Item Already Exist.');
  //   }
  // };

  const totalAmount = products.reduce((acc, item) => acc + item.unitPrice * item.stock, 0);
  const totalGst = products.reduce((acc, item) => acc + (item.unitPrice * item.stock * item.gstPercentage) / 100, 0);


  return (
    <main className="h-screen min-w-0 flex-1 overflow-auto bg-white p-4">
      <h1 className="text-5xl mb-3">Add</h1>
      <Tabs defaultValue="add-purchase">
        <TabsList >
          <TabsTrigger value="add-purchase">Add Item</TabsTrigger>
          <TabsTrigger value="add-supplier">Add Supplier</TabsTrigger>
          <TabsTrigger value="add-payment">Add Payment</TabsTrigger>
        </TabsList>
        <TabsContent value="add-purchase">
          <div>
            <h1 className='text-3xl'>Record Purchases</h1>
            <p>Enter the details of the purchase from a supplier</p>

            <div id="bill-details-container" className='border-b-2 border-gray-400 py-2'>
              <h2 className='text-2xl'>Bill Details</h2>
              <div id="bill-details-inner-container" className='flex mt-2 justify-between'>

                <div className='w-[49%]'>
                  <Label htmlFor='billNumber'>Bill / Inv Number</Label>
                  <Input name='billNumber' value={formData.billNumber} className='border-black' type='text' onChange={handleChange} required></Input>
                </div>

                <div className='w-[49%]'>
                  <Label htmlFor='billDate'>Bill Date</Label>
                  <Input name='billDate' value={formData.billDate} className='border-black' type='date' onChange={handleChange}></Input>
                </div>
              </div>
            </div>

            <div id="supplier-details-container" className='border-b-2 border-gray-400 py-2'>
              <h2 className='text-2xl'>Supplier Details</h2>
              <div id="supplier-details-inner-container" className='flex gap-2'>

                <div className='w-[100%]'>
                  <Label htmlFor='supplierName'>Supplier Name</Label>
                  <Input name='supplierName' value={formData.supplierName} className='border-black' type='text' onChange={handleChange}></Input>
                </div>

                <div className='w-[100%]'>
                  <Label htmlFor='supplierDrugLn'>Supplier Drug L/N</Label>
                  <Input name='supplierDrugLn' value={formData.supplierDrugLn} className='border-black' type='text' onChange={handleChange}></Input>
                </div>

                <div className='w-[100%]'>
                  <Label htmlFor='supplierContact'>Supplier Contact</Label>
                  <Input name='supplierContact' value={formData.supplierContact} className='border-black' type='tel' onChange={handleChange}></Input>
                </div>
              </div>
            </div>

            <div id="product-details-container" className='border-b-2 border-gray-400 py-2'>
              <h2 className="text-2xl mb-4">Product Details</h2>
              <div id="product-details-inner-container">
                <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-black">Product Name</th>
                      <th className="px-4 py-2 text-black">Category</th>
                      <th className="px-4 py-2 text-black">Batch Number</th>
                      <th className="px-4 py-2 text-black">EXP Date</th>
                      <th className="px-4 py-2 text-black">Quantity</th>
                      <th className="px-4 py-2 text-black">Unit Price</th>
                      <th className="px-4 py-2 text-black">MRP</th>
                      <th className="px-4 py-2 text-black">Discount %</th>
                      <th className="px-4 py-2 text-black">GST %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                    {products.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2">
                          <Input
                            type="text"
                            className="border border-black p-1 w-full text-black font-bold"
                            value={item.name}
                            onChange={(e) => handleInputChange(item.id, "name", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          {/* <Input
                            type="text"
                            className="border p-1 w-full"
                            value={item.category}
                            onChange={(e) => handleInputChange(item.id, "category", e.target.value)}
                          /> */}
                          <SelectList
                            handleInputChange={handleInputChange}
                            itemId={item.id}
                            selectedCategory={item.category}
                          />

                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="text"
                            className="border border-black p-1 w-full text-black"
                            value={item.batchNumber}
                            onChange={(e) => handleInputChange(item.id, "batchNumber", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="date"
                            className="border border-black p-1 w-ful text-black"
                            value={item.expiryDate}
                            onChange={(e) => handleInputChange(item.id, "expiryDate", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="border border-black p-1 w-full text-black"
                            value={item.quantity}
                            onChange={(e) => handleInputChange(item.id, "stock", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="border border-black p-1 w-full text-black"
                            value={item.unitPrice}
                            onChange={(e) => handleInputChange(item.id, "unitPrice", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="border border-black p-1 w-full text-black"
                            value={item.mrp}
                            onChange={(e) => handleInputChange(item.id, "mrp", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="border border-black p-1 w-full text-black"
                            value={item.discount}
                            onChange={(e) => handleInputChange(item.id, "discount", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="border border-black p-1 w-full text-black"
                            value={item.gstPercentage}
                            onChange={(e) => handleInputChange(item.id, "gstPercentage", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 flex gap-4">
                  <button
                    onClick={addProduct}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Add Product
                  </button>

                </div>
              </div>
            </div>

            <div id="payment-details-container" className='border-gray-400 border-b-2 py-2'>
              <h2 className='text-2xl'>Payment Details</h2>
              <div id="payment-details-inner-container">
                <div id="sub-total-container" className='flex justify-between'>
                  <p>Subtotal</p>
                  <p>Rs {totalAmount.toFixed(2)}</p>
                </div>
                <div id="gst-amount" className='flex justify-between'>
                  <p>Gst Amount</p>
                  <p>Rs {totalGst.toFixed(2)}</p>
                </div>
                <hr />
                <div id="all-total" className='flex justify-between'>
                  <p className='font-bold'>Total Amount</p>
                  <p className='font-bold'>Rs {Math.round((totalAmount + totalGst).toFixed(2))}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleBothActions}
              className="px-4 py-2 bg-green-500 text-white rounded mt-2"
            >
              Save
            </button>
          </div>
        </TabsContent>
        <TabsContent value="add-supplier">
          <div>
            <form className="flex flex-col gap-3" >
              <label htmlFor="supplier-name">Supplier Name</label>
              <input className="border-1" type="text" name="supplierName" value={addSupplier.supplierName} onChange={handleChangeAddSupplier} required />

              <label htmlFor="phone-number">Phone Number</label>
              <input className="border-1" type="tel" name="phoneNumber" value={addSupplier.phoneNumber} onChange={handleChangeAddSupplier} required />

              <label htmlFor="email">Email Address</label>
              <input className="border-1" type="email" name="email" value={addSupplier.email} onChange={handleChangeAddSupplier} required />


              <label htmlFor="address">Address</label>
              <input className="border-1" type="text" name="address" value={addSupplier.address} onChange={handleChangeAddSupplier} required />


              <label htmlFor="drug-license-number">Drug License Number</label>
              <input className="border-1" type="text" name="drugLn" value={addSupplier.drugLn} onChange={handleChangeAddSupplier} required />

              <label htmlFor="drug-license-number">Balance</label>
              <input className="border-1" type="text" name="supplierBalance" value={addSupplier.supplierBalance} onChange={handleChangeAddSupplier} required />


              <input
                className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                type="submit"
                value="Save"
                onClick={showData}
              />
            </form>
          </div>
        </TabsContent>
        <TabsContent value='add-payment'>
          <div>
            <form className="flex flex-col gap-3" >
              <label htmlFor="receiptDate">Receipt Date</label>
              <input className="border-1" type="date" name="receiptDate" value={payments.receiptDate} onChange={handleChangePayment} required />

              <label htmlFor="receiptNumber">Receipt Number</label>
              <input className="border-1" type="tel" name="receiptNumber" value={payments.receiptNumber} onChange={handleChangePayment} required />

              <label htmlFor="supplierName">Supplier Name</label>
              <input className="border-1" type="email" name="supplierName" value={payments.supplierName} onChange={handleChangePayment} required />

              <label htmlFor="drugLicenseNumber">Drug License Number</label>
              <input className="border-1" type="text" name="drugLicenseNumber" value={payments.drugLicenseNumber} onChange={handleChangePayment} required />

              <label htmlFor="amountPaid">Amount Paid</label>
              <input className="border-1" type="number" name="amountPaid" value={payments.amountPaid} onChange={handleChangePayment} required />


              <input
                className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                type="submit"
                value="Save"
                onClick={showPayment}
              />
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

export default Add;

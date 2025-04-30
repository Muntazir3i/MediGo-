import React, { useEffect, useState } from 'react';
import './add.css';
import { addMedicines, addPayment, addPurchase, addNewSupplier, getSupplier, addNewExpiry, addNewSuppliersql, getsupplierSql } from '../services/medicineService.js';
import { Link, data } from 'react-router-dom';
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
    invoice: '',
    date: '',
    supplierName: '',
    supplierDrugLn: '',
    supplierContact: '',
    products: []
  });

  //for expiry
  const [expiryFormData, setExpiryFormData] = useState({
    date: '',
    supplierName: '',
    supplierDrugLn: '',
    supplierContact: '',
    products: []
  })

  //for expiry
  const [expiryProducts, setExpiryProducts] = useState([
    {
      id: Date.now(),
      name: "",
      batchNumber: "",
      expiryDate: "",
      stock: 0,
      mrp: 0,
    },
  ])



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
    date: '',
    invoice: '',
    supplierName: '',
    drugLicenseNumber: '',
    total: ''
  })

  const [addSupplier, setAddSupplier] = useState({
    supplierName: '',
    phoneNumber: '',
    drugLn: '',
    supplierBalance: ''
  })

  const [allSupplier, setAllSupplier] = useState([]);
  const [allSuppliersSql, setAllSuppliersSqlite] = useState([])

  useEffect(() => {
    fetchAllSupplier();
  }, []);

  useEffect(() => {
    fetchAllSuppliersSql();
  }, []);



  const fetchAllSupplier = async () => {
    try {
      const response = await getSupplier();
      setAllSupplier(response.data);
    } catch (error) {
      console.error('Error fetching the Supplier:', error);
    }
  };

  const fetchAllSuppliersSql = async () => {
    try {
      const response = await getsupplierSql();
      setAllSuppliersSqlite(response.data)
      console.log(response);
    } catch (error) {
      console.log('Error Fetching the suppliers:', error);
    }
  }


  //for bills and CN

  const handleSupplierSelect = (e) => {
    const supplierName = e.target.value;
    const supplier = allSupplier.find(s => s.supplierName === supplierName);

    if (supplier) {
      setFormData(prev => ({
        ...prev,
        supplierName: supplier.supplierName,
        supplierContact: supplier.phoneNumber,
        supplierDrugLn: supplier.drugLn
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        supplierName,
        supplierContact: '',
        supplierDrugLn: ''
      }));
    }
  };

  //for expiry
  const handleSupplierSelectExpiry = (e) => {
    const supplierName = e.target.value;
    const supplier = allSupplier.find(s => s.supplierName === supplierName);

    if (supplier) {
      setExpiryFormData(prev => ({
        ...prev,
        supplierName: supplier.supplierName,
        supplierContact: supplier.phoneNumber,
        supplierDrugLn: supplier.drugLn
      }));
    } else {
      setExpiryFormData(prev => ({
        ...prev,
        supplierName,
        supplierContact: '',
        supplierDrugLn: ''
      }));
    }
  };

  const handleAddPaymentSupplierSelect = (e) => {
    const supplierName = e.target.value;
    const supplier = allSupplier.find(s => s.supplierName === supplierName);

    if (supplier) {
      setPayments(prev => ({
        ...prev,
        supplierName: supplier.supplierName,
        drugLicenseNumber: supplier.drugLn,
      }));
    } else {
      setPayments(prev => ({
        ...prev,
        supplierName,
        drugLicenseNumber: ''
      }));
    }
  };

  const showData = async (e) => {
    e.preventDefault();
    let newSupplier = { ...addSupplier }
    setAddSupplier(newSupplier);
    try {
      const response = await addNewSuppliersql(newSupplier);
      console.log(response);
      setAddSupplier({
        supplierName: '',
        phoneNumber: '',
        drugLn: '',
        supplierBalance: ''
      })
    } catch (error) {
      console.error('Error Adding Supplier to the database', error)
    }
  }

  const showPayment = async (e) => {
    e.preventDefault();
    let newPayment = { ...payments, id: Date.now(), type: 'Payment' }
    setPayments(newPayment);
    try {
      const response = await addPurchase(newPayment);
      console.log(response);
      setPayments({
        date: '',
        invoice: '',
        supplierName: '',
        drugLicenseNumber: '',
        total: ''
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

  const addProductExpiry = () => {
    setExpiryProducts([
      ...expiryProducts,
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

  //input change for expiry

  const handleInputChangeExpiry = (id, field, value) => {
    setExpiryProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, [field]: value, supplier: expiryFormData.supplierName, } : product
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

  const handleChangeExpiry = (e) => {
    const { name, value } = e.target;
    setExpiryFormData((prevData) => ({
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

  const handleChangeAddSupplier = (e) => {
    const { name, value } = e.target;
    setAddSupplier((prevData) => (
      {
        ...prevData,
        [name]: value.toUpperCase().replace(/\s+/g, ' ')
      }
    ))
  }



  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      setProducts(products.filter((med) => med.id !== id));

    }
  };

  const handleDeleteExpiry = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      setExpiryProducts(expiryProducts.filter((med) => med.id !== id));

    }
  };


  const handleBothActions = async () => {
    if (!formData.invoice.trim() || !formData.date.trim()) {
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
        totalDiscount: totalDiscount.toFixed(2),
        total: Math.round(totalAmount + totalGst - totalDiscount),
        type: 'Bill'
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
        invoice: '',
        date: '',
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

  //handle add expiry

  const handleExpityData = async () => {
    // Filter valid products based on the criteria
    const validProducts = expiryProducts.filter(product =>
      product.name.trim() && // Ensure product name is not empty
      product.batchNumber.trim() && // Ensure batch number is not empty
      product.expiryDate.trim() && // Ensure expiry date is not empty
      product.stock > 0 // Ensure stock is greater than 0
    );

    // Check if there are any valid products
    if (validProducts.length === 0) {
      alert("At least one valid product is required.");
      return;
    }

    try {
      // Create the payload for the API request
      let allData = {
        id: Date.now(), // Generate a unique ID
        ...expiryFormData, // Include form data (e.g., supplier details)
        products: validProducts, // Include the validated products
        type: 'EXPIRY', // Set the type to 'EXPIRY'
      };

      // Send the data to the backend using the addNewExpiry function
      const response = await addNewExpiry(allData);

      console.log("Response from server:", response);

      // Show success message to the user
      alert('Expiry data added successfully!');

      // Reset the form state
      setExpiryFormData({
        date: '',
        supplierName: '',
        supplierGstin: '',
        supplierContact: '',
      });

      // Reset the products state
      setExpiryProducts([
        {
          id: Date.now(),
          name: "",
          batchNumber: "",
          expiryDate: "",
          stock: 0,
          mrp: 0,
        },
      ]);
    } catch (error) {
      // Log the error for debugging
      console.error("Error while adding expiry data:", error);

      // Show an error message to the user
      alert('Failed to process. Please check if the item already exists or try again later.');
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
  const totalDiscount = products.reduce((acc, item) => acc + (item.unitPrice * item.stock * (item.discount || 0)) / 100, 0);




  return (
    <main className="h-[90vh] lg:h-screen min-w-0 flex-1 overflow-auto bg-white p-4">
      <h1 className="text-5xl mb-3">Add</h1>
      <Tabs defaultValue="add-purchase">
        <TabsList >
          <TabsTrigger value="add-purchase">Add Item</TabsTrigger>
          <TabsTrigger value="add-supplier">Add Supplier</TabsTrigger>
          <TabsTrigger value="add-payment">Add Payment</TabsTrigger>
          <TabsTrigger value="add-expiry">Add Expiry</TabsTrigger>
        </TabsList>
        <TabsContent value="add-purchase">
          <div>
            <h1 className='text-3xl'>Record Purchases</h1>
            <p>Enter the details of the purchase from a supplier</p>

            <div id="bill-details-container" className='border-b-2 border-gray-400 py-2'>
              <h2 className='text-2xl'>Bill Details</h2>
              <div id="bill-details-inner-container" className='flex flex-col gap-2 lg:gap-0 lg:flex-row mt-2 justify-between'>

                <div className='w-full lg:w-[49%]'>
                  <Label htmlFor='invoice'>Bill / Inv Number</Label>
                  <Input name='invoice' value={formData.invoice} className='border-black' type='text' onChange={handleChange} required></Input>
                </div>

                <div className='w-full lg:w-[49%]'>
                  <Label htmlFor='date'>Bill Date</Label>
                  <Input name='date' value={formData.date} className='border-black' type='date' onChange={handleChange}></Input>
                </div>
              </div>
            </div>

            <div id="supplier-details-container" className='border-b-2 border-gray-400 py-2'>
              <h2 className='text-2xl'>Supplier Details</h2>
              <div id="supplier-details-inner-container" className='flex flex-col gap-4 lg:flex-row lg:gap-2  '>

                <div className='w-[100%]'>
                  <Label htmlFor='supplierDrugLn'>Supplier Name</Label>
                  <Input
                    list="supplierList"
                    className="border p-2 w-full border-black"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleSupplierSelect}
                  />
                  <datalist id="supplierList">
                    {allSupplier.map((s, index) => (
                      <option key={index} value={s.supplierName} />
                    ))}
                  </datalist>
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
              <div id="product-details-inner-container" className='border overflow-auto'>
                <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 overflow-auto">
                    <tr >
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
                  <tbody className="divide-y divide-gray-100 border-t border-gray-100 ">
                    {products.map((item) => (
                      <tr key={item.id}  >
                        <td className="px-4 py-2">
                          <Input
                            type="text"
                            className="border border-black p-1 w-40 lg:w-full text-black font-bold"
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
                            className="border border-black p-1 w-40 lg:w-full text-black"
                            value={item.batchNumber}
                            onChange={(e) => handleInputChange(item.id, "batchNumber", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="date"
                            className="border border-black p-1 w-40 lg:w-full text-black"
                            value={item.expiryDate}
                            onChange={(e) => handleInputChange(item.id, "expiryDate", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="border border-black p-1 w-40 lg:w-full text-black"
                            value={item.quantity}
                            onChange={(e) => handleInputChange(item.id, "stock", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="border border-black p-1 w-40 lg:w-full text-black"
                            value={item.unitPrice}
                            onChange={(e) => handleInputChange(item.id, "unitPrice", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="border border-black p-1 w-40 lg:w-full text-black"
                            value={item.mrp}
                            onChange={(e) => handleInputChange(item.id, "mrp", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="border border-black p-1 w-40 lg:w-full text-black"
                            value={item.discount}
                            onChange={(e) => handleInputChange(item.id, "discount", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="border border-black p-1 w-50 lg:w-full text-black"
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

            <div id="payment-details-container" className="border-gray-400 border-b-2 py-2">
              <h2 className="text-2xl">Payment Details</h2>
              <div id="payment-details-inner-container">
                <div id="sub-total-container" className="flex justify-between">
                  <p>Subtotal</p>
                  <p>Rs {totalAmount.toFixed(2)}</p>
                </div>
                <div id="gst-amount" className="flex justify-between">
                  <p>Gst Amount</p>
                  <p>Rs {totalGst.toFixed(2)}</p>
                </div>
                <div id="discount-amount" className="flex justify-between">
                  <p>Discount Amount</p>
                  <p>Rs {totalDiscount.toFixed(2)}</p>
                </div>
                <hr />
                <div id="all-total" className="flex justify-between">
                  <p className="font-bold">Total Amount</p>
                  <p className="font-bold">
                    Rs {Math.round((totalAmount + totalGst - totalDiscount).toFixed(2))}
                  </p>
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
              <label htmlFor="date">Receipt Date</label>
              <input className="border-1" type="date" name="date" value={payments.date} onChange={handleChangePayment} required />

              <label htmlFor="invoice">Receipt Number</label>
              <input className="border-1" type="tel" name="invoice" value={payments.invoice} onChange={handleChangePayment} required />

              {/* <label htmlFor="supplierName">Supplier Name</label>
              <input className="border-1" type="email" name="supplierName" value={payments.supplierName} onChange={handleChangePayment} required /> */}
              <div className='w-[100%]'>
                <Label htmlFor='supplierDrugLn'>Supplier Name</Label>
                <Input
                  list="supplierList"
                  className="border p-2 w-full border-black"
                  name="supplierName"
                  value={payments.supplierName}
                  onChange={handleAddPaymentSupplierSelect}
                />
                <datalist id="supplierList">
                  {allSupplier.map(s => (
                    <option key={s.id} value={s.supplierName} />
                  ))}
                </datalist>
              </div>

              <label htmlFor="drugLicenseNumber">Drug License Number</label>
              <input className="border-1" type="text" name="drugLicenseNumber" value={payments.drugLicenseNumber} onChange={handleChangePayment} required />

              <label htmlFor="total">Amount Paid</label>
              <input className="border-1" type="number" name="total" value={payments.total} onChange={handleChangePayment} required />


              <input
                className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                type="submit"
                value="Save"
                onClick={showPayment}
              />
            </form>
          </div>
        </TabsContent>
        <TabsContent value='add-expiry'>
          <div>
            <h1 className='text-3xl'>Record Expiry</h1>
            <p>Enter the details of the Expiry for a supplier</p>

            <div id="bill-details-container" className='border-b-2 border-gray-400 py-2'>
              <h2 className='text-2xl'>Bill Details</h2>
              <div id="bill-details-inner-container" className='flex flex-col gap-2 lg:gap-0 lg:flex-row mt-2 justify-between'>

                {/* <div className='w-full lg:w-[49%]'>
                  <Label htmlFor='invoice'>Bill / Inv Number</Label>
                  <Input name='invoice' value={formData.invoice} className='border-black' type='text' onChange={handleChange} required></Input>
                </div> */}

                <div className='w-full lg:w-[49%]'>
                  <Label htmlFor='date'>Bill Date</Label>
                  <Input name='date' value={expiryFormData.date} className='border-black' type='date' onChange={handleChangeExpiry}></Input>
                </div>
              </div>
            </div>

            <div id="supplier-details-container" className='border-b-2 border-gray-400 py-2'>
              <h2 className='text-2xl'>Supplier Details</h2>
              <div id="supplier-details-inner-container" className='flex flex-col gap-4 lg:flex-row lg:gap-2  '>

                <div className='w-[100%]'>
                  <Label htmlFor='supplierDrugLn'>Supplier Name</Label>
                  <Input
                    list="supplierList"
                    className="border p-2 w-full border-black"
                    name="supplierName"
                    value={expiryFormData.supplierName}
                    onChange={handleSupplierSelectExpiry}
                  />
                  <datalist id="supplierList">
                    {allSupplier.map(s => (
                      <option key={s.id} value={s.supplierName} />
                    ))}
                  </datalist>
                </div>

                <div className='w-[100%]'>
                  <Label htmlFor='supplierDrugLn'>Supplier Drug L/N</Label>
                  <Input name='supplierDrugLn' value={expiryFormData.supplierDrugLn} className='border-black' type='text' onChange={handleChangeExpiry}></Input>
                </div>

                <div className='w-[100%]'>
                  <Label htmlFor='supplierContact'>Supplier Contact</Label>
                  <Input name='supplierContact' value={expiryFormData.supplierContact} className='border-black' type='tel' onChange={handleChangeExpiry}></Input>
                </div>
              </div>
            </div>

            <div id="product-details-container" className='border-b-2 border-gray-400 py-2'>
              <h2 className="text-2xl mb-4">Product Details</h2>
              <div id="product-details-inner-container" className='border overflow-auto'>
                <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 overflow-auto">
                    <tr >
                      <th className="px-4 py-2 text-black">Product Name</th>
                      <th className="px-4 py-2 text-black">Batch Number</th>
                      <th className="px-4 py-2 text-black">EXP Date</th>
                      <th className="px-4 py-2 text-black">Quantity</th>
                      <th className="px-4 py-2 text-black">MRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 border-t border-gray-100 ">
                    {expiryProducts.map((item) => (
                      <tr key={item.id}  >
                        <td className="px-4 py-2">
                          <Input
                            type="text"
                            className="border border-black p-1 w-40 lg:w-full text-black font-bold"
                            value={item.name}
                            onChange={(e) => handleInputChangeExpiry(item.id, "name", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="text"
                            className="border border-black p-1 w-40 lg:w-full text-black"
                            value={item.batchNumber}
                            onChange={(e) => handleInputChangeExpiry(item.id, "batchNumber", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="date"
                            className="border border-black p-1 w-40 lg:w-full text-black"
                            value={item.expiryDate}
                            onChange={(e) => handleInputChangeExpiry(item.id, "expiryDate", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="border border-black p-1 w-40 lg:w-full text-black"
                            value={item.quantity}
                            onChange={(e) => handleInputChangeExpiry(item.id, "stock", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="border border-black p-1 w-40 lg:w-full text-black"
                            value={item.mrp}
                            onChange={(e) => handleInputChangeExpiry(item.id, "mrp", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <button onClick={() => handleDeleteExpiry(item.id)} className="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 flex gap-4">
                  <button
                    onClick={addProductExpiry}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Add Product
                  </button>

                </div>
              </div>
            </div>

            <button
              onClick={handleExpityData}
              className="px-4 py-2 bg-green-500 text-white rounded mt-2"
            >
              Save
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

export default Add;
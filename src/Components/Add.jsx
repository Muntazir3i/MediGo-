import React, { useEffect, useState } from 'react';
import './add.css';
import { addNewExpiry, findmedicineByName } from '../services/medicineService.js';
import { fetchAllSuppliers } from '@/hooks/useSupplier.js';
import { addNewSupplier } from '@/hooks/useAddSupplier.js';
import { addNewPayment } from '@/hooks/useAddPayment.js';
import { addNewBill } from '@/hooks/useAddBill.js';
import { handleSupplierSelect } from '@/utils/supplierHelpers.js';
import { handleAddProduct } from '@/utils/addProductHelper.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.jsx"
import { Label } from './ui/label';
import { Input } from './ui/input.jsx';
import SelectList from './SelectList.jsx'
import { data } from 'react-router-dom';

function Add() {

  const [formData, setFormData] = useState({
    invoice: '',
    date: '',
    supplierName: '',
    supplierDrugLn: '',
    supplierContact: '',
    products: []
  });
  const [searchedMedTxt, setSearchedMedTxt] = useState('');
  const [searchedMed, setSearchedMed] = useState([])
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
  const [newPaymentDetails, setNewPaymentDetails] = useState({
    date: '',
    invoice: '',
    supplierName: '',
    drugLicenseNumber: '',
    total: ''
  })
  const [newSupplierDetails, setNewSupplierDetails] = useState({
    supplierName: '',
    phoneNumber: '',
    drugLn: '',
    supplierBalance: ''
  })
  const [allSuppliersSql, setAllSuppliersSqlite] = useState([])

  // Fetch and load all suppliers from the custom hook on component mount
  useEffect(() => {
    const fetchingSuppliers = async () => {
      const data = await fetchAllSuppliers();
      setAllSuppliersSqlite(data);
    }
    fetchingSuppliers()
  }, []);



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
    setSearchedMedTxt(value)
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, [field]: value, supplier: formData.supplierName, } : product
      )
    );
  };

  const handleInputChangeSearch = async (id, field, value) => {
    let eValue = value
    setSearchedMedTxt(eValue);

    if (!eValue.trim()) {
      setSearchedMed([]);

      setProducts(prev =>
        prev.map(product =>
          product.id === id
            ? { ...product, [field]: "", unitPrice: "", mrp: "", discount: "", gstPercentage: "", category: "" }
            : product
        )
      );

      return;
    }

    try {
      const result = await findmedicineByName(value); // ✅ use 'value' not searchedMedTxt
      setSearchedMed(result);

      const selectedMed = result.find(med => med.name === value);

      if (selectedMed) {
        setProducts(prev =>
          prev.map(product =>
            product.id === id
              ? {
                ...product,
                name: selectedMed.name,
                unitPrice: selectedMed.unitPrice,
                mrp: selectedMed.mrp,
                discount: selectedMed.discount,
                gstPercentage: selectedMed.gstPercentage,
                category: selectedMed.category,
                [field]: value,
                supplier: formData.supplierName
              }
              : product
          )
        );
      } else {
        // Optional: allow manual entry for new meds
        setProducts(prev =>
          prev.map(product =>
            product.id === id
              ? { ...product, [field]: value, supplier: formData.supplierName }
              : product
          )
        );
      }
    } catch (error) {
      console.error("Error searching medicine:", error);
    }
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
    setNewPaymentDetails((prevData) => ({
      ...prevData,
      [name]: value.toUpperCase().replace(/\s+/g, ' ')
      // products:products
    }));
  };

  const handleChangeAddSupplier = (e) => {
    const { name, value } = e.target;
    setNewSupplierDetails((prevData) => (
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


  

  const totalAmount = products.reduce((acc, item) => {
    const price = item.unitPrice * item.stock;
    return acc + price;
  }, 0);

  const totalDiscount = products.reduce((acc, item) => {
    const price = item.unitPrice * item.stock;
    const discount = price * (item.discount || 0) / 100;
    return acc + discount;
  }, 0);

  const totalGst = products.reduce((acc, item) => {
    const price = item.unitPrice * item.stock;
    const discount = price * (item.discount || 0) / 100;
    const priceAfterDiscount = price - discount;
    const gst = priceAfterDiscount * (item.gstPercentage || 0) / 100;
    return acc + gst;
  }, 0);





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
                    onChange={(e)=>handleSupplierSelect(e,allSuppliersSql,setFormData,true)}
                  />
                  <datalist id="supplierList">
                    {allSuppliersSql.map((s, index) => (
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
                            list="searchedMedList"
                            onChange={(e) => handleInputChangeSearch(item.id, "name", e.target.value)}
                          />
                          <datalist id="searchedMedList">
                            {searchedMed.map((s, index) => (
                              <option key={index} value={s.name} />
                            ))}
                          </datalist>
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
                    onClick={()=>handleAddProduct(products,setProducts)}
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

                  <p>Discount Amount</p>
                  <p>Rs {totalDiscount.toFixed(2)}</p>
                </div>
                <div id="discount-amount" className="flex justify-between">
                  <p>Gst Amount</p>
                  <p>Rs {totalGst.toFixed(2)}</p>
                </div>
                <hr />
                <div id="all-total" className="flex justify-between">
                  <p className="font-bold">Total Amount</p>
                  <p className="font-bold">
                    Rs {Math.round(((totalAmount - totalDiscount) + totalGst).toFixed(2))}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={()=>addNewBill(formData,products,setFormData,setProducts,totalAmount,totalDiscount,totalGst)}
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
              <input className="border-1" type="text" name="supplierName" value={newSupplierDetails.supplierName} onChange={handleChangeAddSupplier} required />

              <label htmlFor="phone-number">Phone Number</label>
              <input className="border-1" type="tel" name="phoneNumber" value={newSupplierDetails.phoneNumber} onChange={handleChangeAddSupplier} required />

              <label htmlFor="drug-license-number">Drug License Number</label>
              <input className="border-1" type="text" name="drugLn" value={newSupplierDetails.drugLn} onChange={handleChangeAddSupplier} required />

              <label htmlFor="drug-license-number">Balance</label>
              <input className="border-1" type="text" name="supplierBalance" value={newSupplierDetails.supplierBalance} onChange={handleChangeAddSupplier} required />


              <input
                className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                type="submit"
                value="Save"
                onClick={(e)=>addNewSupplier(e,newSupplierDetails,setNewSupplierDetails)}
              />
            </form>
          </div>
        </TabsContent>
        <TabsContent value='add-payment'>
          <div>
            <form className="flex flex-col gap-3" >
              <label htmlFor="date">Receipt Date</label>
              <input className="border-1" type="date" name="date" value={newPaymentDetails.date} onChange={handleChangePayment} required />

              <label htmlFor="invoice">Receipt Number</label>
              <input className="border-1" type="tel" name="invoice" value={newPaymentDetails.invoice} onChange={handleChangePayment} required />

    
              <div className='w-[100%]'>
                <Label htmlFor='supplierDrugLn'>Supplier Name</Label>
                <Input
                  list="supplierList"
                  className="border p-2 w-full border-black"
                  name="supplierName"
                  value={newPaymentDetails.supplierName}
                  onChange={(e)=>handleSupplierSelect(e,allSuppliersSql,setNewPaymentDetails,false)}
                />
                <datalist id="supplierList">
                  {allSuppliersSql.map(s => (
                    <option key={s.id} value={s.supplierName} />
                  ))}
                </datalist>
              </div>

              <label htmlFor="drugLicenseNumber">Drug License Number</label>
              <input className="border-1" type="text" name="drugLicenseNumber" value={newPaymentDetails.drugLicenseNumber} onChange={handleChangePayment} required />

              <label htmlFor="total">Amount Paid</label>
              <input className="border-1" type="number" name="total" value={newPaymentDetails.total} onChange={handleChangePayment} required />


              <input
                className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                type="submit"
                value="Save"
                onClick={(e)=>addNewPayment(e,newPaymentDetails,setNewPaymentDetails)}
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
                    onChange={(e)=>handleSupplierSelect(e,allSuppliersSql,setExpiryFormData,true)}
                  />
                  <datalist id="supplierList">
                    {allSuppliersSql.map(s => (
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
                    onClick={()=>handleAddProduct(expiryProducts,setExpiryProducts)}
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
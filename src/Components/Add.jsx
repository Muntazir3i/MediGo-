import React, { useEffect, useState } from 'react';
import './add.css';
import {TabContentAddPurchase, TabContentAddSupplier, TabContentAddPayment, TabContentAddExpiry} from './Tabs/index.js'
import { addNewExpiry, findmedicineByName } from '../services/medicineService.js';
import { fetchAllSuppliers } from '@/hooks/useSupplier.js';
import { addNewSupplier } from '@/hooks/useAddSupplier.js';
import { addNewPayment } from '@/hooks/useAddPayment.js';
import { addNewBill } from '@/hooks/useAddBill.js';
import { handleSupplierSelect } from '@/utils/supplierHelpers.js';
import { handleAddProduct } from '@/utils/addProductHelper.js';
import { calculateBillTotals } from '@/utils/billingCalculationsHelper.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.jsx"
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
  const [debouncedQuery,setDebouncedQuery] = useState("");
  const [searchedMed, setSearchedMed] = useState([]);
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchedMedTxt);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchedMedTxt]);

 useEffect(() => {
  const search = async () => {
    if (!debouncedQuery.trim()) {
      setSearchedMed([]);
      return;
    }

    try {
      const result = await findmedicineByName(debouncedQuery);
      setSearchedMed(result);
    } catch (err) {
      console.error("Error searching medicine:", err);
    }
  };

  search();
}, [debouncedQuery]);



  const handleInputChange = (id, field, value) => {
    setSearchedMedTxt(value)
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, [field]: value, supplier: formData.supplierName, } : product
      )
    );
  };

  
const handleInputChangeSearch = (id, field, value) => {
  setSearchedMedTxt(value); // update typing

  if (!value.trim()) {
    setSearchedMed([]);

    setProducts(prev =>
      prev.map(product =>
        product.id === id
          ? {
              ...product,
              [field]: "",
              unitPrice: "",
              mrp: "",
              discount: "",
              gstPercentage: "",
              category: "",
            }
          : product
      )
    );

    return;
  }

  // check if selected from search results
  const selectedMed = searchedMed.find(med => med.name === value);

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
              supplier: formData.supplierName,
            }
          : product
      )
    );
  } else {
    // allow manual typing
    setProducts(prev =>
      prev.map(product =>
        product.id === id
          ? { ...product, [field]: value, supplier: formData.supplierName }
          : product
      )
    );
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

  const handleExpiryData = async () => {
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




  const { totalAmount, totalDiscount, totalGst } = calculateBillTotals(products);


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
          <TabContentAddPurchase
            formData={formData}
            handleChange={handleChange}
            handleSupplierSelect={handleSupplierSelect}
            allSuppliersSql={allSuppliersSql}
            setFormData={setFormData}
            products={products}
            handleInputChangeSearch={handleInputChangeSearch}
            searchedMed={searchedMed}
            handleInputChange={handleInputChange}
            handleDelete={handleDelete}
            handleAddProduct={handleAddProduct}
            setProducts={setProducts}
            totalAmount={totalAmount}
            totalDiscount={totalDiscount}
            totalGst={totalGst}
            addNewBill={addNewBill}
          />
        </TabsContent>
        <TabsContent value="add-supplier">
          <TabContentAddSupplier
            newSupplierDetails={newSupplierDetails}
            handleChangeAddSupplier={handleChangeAddSupplier}
            addNewSupplier={addNewSupplier}
            setNewSupplierDetails={setNewSupplierDetails}
          />
        </TabsContent>
        <TabsContent value='add-payment'>
          <TabContentAddPayment
            newPaymentDetails={newPaymentDetails}
            setNewPaymentDetails={setNewPaymentDetails}
            handleChangePayment={handleChangePayment}
            handleSupplierSelect={handleSupplierSelect}
            allSuppliersSql={allSuppliersSql}
            addNewPayment={addNewPayment}
          />
        </TabsContent>
        <TabsContent value='add-expiry'>
          <TabContentAddExpiry
            expiryFormData={expiryFormData}
            handleChangeExpiry={handleChangeExpiry}
            handleSupplierSelect={handleSupplierSelect}
            allSuppliersSql={allSuppliersSql}
            setExpiryFormData={setExpiryFormData}
            expiryProducts={expiryProducts}
            handleInputChangeExpiry={handleInputChangeExpiry}
            handleDeleteExpiry={handleDeleteExpiry}
            handleAddProduct={handleAddProduct}
            setExpiryProducts={setExpiryProducts}
            handleExpiryData={handleExpiryData}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}

export default Add;
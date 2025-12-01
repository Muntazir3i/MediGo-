import React from 'react'
import { Label } from '../ui/label.jsx';
import { Input } from '../ui/input.jsx';
import SelectList from '../SelectList.jsx';

const TabContentAddPurchase = ({
  formData,
  handleChange,
  handleSupplierSelect,
  allSuppliersSql,
  setFormData,
  products,
  handleInputChangeSearch,
  searchedMed,
  handleInputChange,
  handleDelete,
  handleAddProduct,
  setProducts,
  totalAmount,
  totalDiscount,
  totalGst,
  addNewBill,
}) => {
  return (
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
              onChange={(e) => handleSupplierSelect(e, allSuppliersSql, setFormData, true)}
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
              onClick={() => handleAddProduct(products, setProducts)}
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
            <p className="font-bold text-2xl">
              Rs {Math.round(((totalAmount - totalDiscount) + totalGst).toFixed(2))}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => addNewBill(formData, products, setFormData, setProducts, totalAmount, totalDiscount, totalGst)}
        className="px-4 py-2 bg-green-500 text-white rounded mt-2"
      >
        Save
      </button>
    </div>
  )
}

export default TabContentAddPurchase
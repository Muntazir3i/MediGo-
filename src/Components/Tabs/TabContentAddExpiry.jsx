import React from 'react'
import { Label } from '../ui/label.jsx';
import { Input } from '../ui/input.jsx';

const TabContentAddExpiry = ({
    expiryFormData,
    handleChangeExpiry,
    handleSupplierSelect,
    allSuppliersSql,
    setExpiryFormData,
    expiryProducts,
    handleInputChangeExpiry,
    handleDeleteExpiry,
    handleAddProduct,
    setExpiryProducts,
    handleExpiryData,
}) => {
    return (
        <div>
            <h1 className='text-3xl'>Record Expiry</h1>
            <p>Enter the details of the Expiry for a supplier</p>

            <div id="bill-details-container" className='border-b-2 border-gray-400 py-2'>
                <h2 className='text-2xl'>Bill Details</h2>
                <div id="bill-details-inner-container" className='flex flex-col gap-2 lg:gap-0 lg:flex-row mt-2 justify-between'>


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
                            onChange={(e) => handleSupplierSelect(e, allSuppliersSql, setExpiryFormData, true)}
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
                            onClick={() => handleAddProduct(expiryProducts, setExpiryProducts)}
                            className="px-4 py-2 bg-blue-500 text-white rounded"
                        >
                            Add Product
                        </button>

                    </div>
                </div>
            </div>

            <button
                onClick={handleExpiryData}
                className="px-4 py-2 bg-green-500 text-white rounded mt-2"
            >
                Save
            </button>
        </div>
    )
}

export default TabContentAddExpiry
import React from 'react'
import { Button } from '../ui/button.jsx';

const TabContentShowAllPayments = ({allPayments,handleDeletePaymentSql,handleEditClick}) => {
  return (
        <div className='border-gray-300 border w-full mt-2 mb-4 rounded-lg p-3 overflow-auto bg-white'>
                            {allPayments.length > 0 ? (
                                <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4">NO.</th>
                                            <th className="px-6 py-4">SUPPLIER</th>
                                            <th className="px-6 py-4">INVOICE</th>
                                            <th className="px-6 py-4">DATE</th>
                                            <th className="px-6 py-4">AMOUNT</th>
                                            <th className="px-6 py-4" colSpan="2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                                        {allPayments.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 px-6 py-4">
                                                <td className="px-2 py-2 text-black font-bold">{idx + 1}</td>
                                                <td className="px-2 py-2 text-black font-bold">{item.supplierName}</td>
                                                <td className="px-2 py-2 text-black">{item.invoice}</td>
                                                <td className="px-2 py-2 text-black">{item.date}</td>
                                                <td className="px-2 py-2 text-green-800 font-bold">₹ {Number(item.total).toFixed(2)}</td>
                                                <td className="px-2 py-2 font-bold">
                                                    <Button onClick={()=> handleDeletePaymentSql(item.id)} variant="outline" className="text-red-600 hover:text-red-800">Delete</Button>
                                                </td>
                                                <td className="px-2 py-2 font-bold">
                                                    <Button variant="outline" onClick={() => handleEditClick(item)}>Edit</Button>
                                                </td>
                                            </tr>
                                        ))}

                                    </tbody>
                                </table>
                            ) : (
                                <p className='text-gray-600'>No payments found.</p>
                            )}
                            <div className='btn-container flex justify-center py-4 '><Button className="bg-purple-600 hover:bg-purple-700 text-white" size="lg" variant="outline">LOAD MORE</Button></div>
    </div>
    
  )
}

export default TabContentShowAllPayments
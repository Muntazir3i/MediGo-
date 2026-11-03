import React from 'react'
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';

const TabContentShowAllPayments = ({
    allPayments,
    handleDeletePaymentSql,
    handleEditClick,
    loadMore,
    invoiceSearch = '',
    onInvoiceSearchChange,
    onClearInvoiceSearch,
    loading = false,
    loadingMore = false,
    hasMore = false,
}) => {
    return (
        <div className='border-gray-300 border w-full mt-2 mb-4 rounded-lg p-3 overflow-auto bg-white'>
            <div className='mb-3 flex flex-wrap items-center gap-2'>
                <Input
                    className='bg-white md:max-w-sm'
                    placeholder="Search by invoice number"
                    value={invoiceSearch}
                    onChange={onInvoiceSearchChange}
                />
                {invoiceSearch && (
                    <Button variant="outline" size="sm" onClick={onClearInvoiceSearch}>
                        Clear
                    </Button>
                )}
                {loading && (
                    <span className='text-sm text-gray-500'>Searching…</span>
                )}
            </div>

            {loading ? (
                <p className='px-2 py-6 text-gray-600'>Loading payments…</p>
            ) : allPayments.length > 0 ? (
                <>
                    <p className='mb-2 text-sm text-gray-600'>
                        Showing {allPayments.length} payment{allPayments.length === 1 ? '' : 's'}
                        {invoiceSearch ? ` for invoice “${invoiceSearch}”` : ''}
                    </p>

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
                                <tr key={item.id ?? idx} className="hover:bg-gray-50 px-6 py-4">
                                    <td className="px-2 py-2 text-black font-bold">{idx + 1}</td>
                                    <td className="px-2 py-2 text-black font-bold">{item.supplierName}</td>
                                    <td className="px-2 py-2 text-black">{item.invoice}</td>
                                    <td className="px-2 py-2 text-black">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="px-2 py-2 text-green-800 font-bold">₹ {Number(item.total).toFixed(2)}</td>
                                    <td className="px-2 py-2 font-bold">
                                        <Button onClick={() => handleDeletePaymentSql(item.id)} variant="outline" className="text-red-600 hover:text-red-800">Delete</Button>
                                    </td>
                                    <td className="px-2 py-2 font-bold">
                                        <Button variant="outline" onClick={() => handleEditClick(item)}>Edit</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            ) : (
                <p className='text-gray-600'>
                    {invoiceSearch
                        ? `No payments found for invoice “${invoiceSearch}”.`
                        : 'No payments found.'}
                </p>
            )}

            {!loading && allPayments.length > 0 && hasMore && (
                <div className='btn-container flex justify-center py-4'>
                    <Button
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="lg"
                        variant="outline"
                        onClick={loadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? 'LOADING...' : 'LOAD MORE'}
                    </Button>
                </div>
            )}
        </div>
    )
}

export default TabContentShowAllPayments

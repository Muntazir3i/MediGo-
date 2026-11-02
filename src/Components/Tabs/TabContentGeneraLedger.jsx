import React from 'react'
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Input } from '../ui/input.jsx';





const TabContentGeneraLedger = ({
    // 🔎 Supplier search
    search,
    handleSearchChange,
    filteredSupplier,
    showNameFn,

    // 📅 Daily payments section
    selectedDate,
    handleDateChange,
    dailyPayments,
    dailyPaymentsLoading,
    dailyPaymentSummary,
    totalDailyPayment,
    handleEditClick,
    handleDeletePaymentSql,

    // 📊 Transaction history section
    selectedSupplierName,
    filteredBill,

    // 🧾 PDF statement
    statementFrom,
    statementTo,
    handleStatementFromChange,
    handleStatementToChange,
    generateStatementPdf,
    statementLoading,
    statementSummary,
}) => {
    return (
        <div>
            <h1 className="text-3xl font-bold ">General Ledger</h1>
            <p className='mb-8'>Check Transaction & Daily Payments</p>
            <div className='h-[65vh] flex flex-col-reverse lg:flex-row gap-4'>
                <div className='border-gray-300 border lg:w-[65%] rounded-lg p-3 overflow-auto'>
                    <Input className='mb-2 bg-white' placeholder="Search Suppliers" value={search} onChange={handleSearchChange} />
                    <h1 className="text-3xl mb-2">All Suppliers</h1>
                    <p className='font-light text-lg'>Check Transaction For All suppliers</p>

                    <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4">Supplier Name</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                            {filteredSupplier.length > 0 ? (
                                filteredSupplier.map((supplier, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-black font-bold">{supplier.supplierName}</td>
                                        <td className="px-6 py-4">
                                            <Button onClick={() => showNameFn(supplier.supplierName)}>View Transactions</Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="2" className="px-6 py-4 text-center">No Supplier Found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col w-[70%] items-center gap-4 mb-4 mt-4 border rounded-lg p-2">
                    <label className="text-xl font-semibold">Check Payments on Date:</label>
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="w-60"/*  */
                    />
                    {selectedDate && (
                        <div className='border-gray-300 border w-full mt-2 mb-4 rounded-lg p-3 overflow-auto bg-white'>
                            <h2 className='text-xl font-bold mb-2'>
                                Payments on {selectedDate}
                                {dailyPaymentSummary ? ` (${dailyPaymentSummary.count})` : ''}
                            </h2>
                            {dailyPaymentsLoading ? (
                                <p className='text-gray-600'>Loading payments…</p>
                            ) : dailyPayments.length > 0 ? (
                                <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4">NO.</th>
                                            <th className="px-6 py-4">SUPPLIER</th>
                                            <th className="px-6 py-4">INVOICE</th>
                                            <th className="px-6 py-4">AMOUNT</th>
                                            <th className="px-6 py-4" colSpan="2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                                        {dailyPayments.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 px-6 py-4">
                                                <td className="px-2 py-2 text-black font-bold">{idx + 1}</td>
                                                <td className="px-2 py-2 text-black font-bold">{item.supplierName}</td>
                                                <td className="px-2 py-2 text-black">{item.invoice}</td>
                                                <td className="px-2 py-2 text-green-800 font-bold">₹ {Number(item.total).toFixed(2)}</td>
                                                <td className="px-2 py-2 font-bold">
                                                    <Button onClick={()=> handleDeletePaymentSql(item.id)} variant="outline" className="text-red-600 hover:text-red-800">Delete</Button>
                                                </td>
                                                <td className="px-2 py-2 font-bold">
                                                    <Button variant="outline" onClick={() => handleEditClick(item)}>Edit</Button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-100">
                                            <td className="px-2 py-2 font-bold text-right" colSpan="3">Total</td>
                                            <td className="px-2 py-2 font-bold text-green-800">₹ {totalDailyPayment.toFixed(2)}</td>
                                            <td colSpan="2"></td>
                                        </tr>

                                    </tbody>
                                </table>
                            ) : (
                                <p className='text-gray-600'>No payments found on this date.</p>
                            )}
                        </div>
                    )}
                </div>

            </div>

            <div className='border-gray-300 border w-full mt-5 rounded-lg p-3 overflow-auto'>
                <div className='flex flex-col lg:flex-row lg:items-start justify-between gap-3'>
                    <div>
                        <h2 className='text-2xl font-bold mb-1'>Transaction History {selectedSupplierName && `for ${selectedSupplierName}`}</h2>
                        <p className='font-light text-lg'>Showing {filteredBill.length} transactions</p>
                    </div>

                    {selectedSupplierName && (
                        <div className='flex flex-wrap items-end gap-2'>
                            <div>
                                <label className='block text-xs font-medium text-gray-600 mb-1'>From</label>
                                <Input
                                    type="date"
                                    value={statementFrom}
                                    onChange={handleStatementFromChange}
                                    className="w-40 bg-white"
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-medium text-gray-600 mb-1'>To</label>
                                <Input
                                    type="date"
                                    value={statementTo}
                                    onChange={handleStatementToChange}
                                    className="w-40 bg-white"
                                />
                            </div>
                            <Button
                                onClick={generateStatementPdf}
                                disabled={statementLoading}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {statementLoading ? 'Generating…' : 'Download PDF Statement'}
                            </Button>
                        </div>
                    )}
                </div>

                {selectedSupplierName && statementSummary && (
                    <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 my-4'>
                        <div className='rounded-lg border bg-white p-3'>
                            <p className='text-xs uppercase text-gray-500'>Opening Balance</p>
                            <p className='text-xl font-bold text-gray-800'>₹ {Number(statementSummary.openingBalance || 0).toFixed(2)}</p>
                        </div>
                        <div className='rounded-lg border bg-white p-3'>
                            <p className='text-xs uppercase text-gray-500'>Total Bills</p>
                            <p className='text-xl font-bold text-red-600'>₹ {Number(statementSummary.totalBills || 0).toFixed(2)}</p>
                        </div>
                        <div className='rounded-lg border bg-white p-3'>
                            <p className='text-xs uppercase text-gray-500'>Total Payments</p>
                            <p className='text-xl font-bold text-green-700'>₹ {Number(statementSummary.totalPayments || 0).toFixed(2)}</p>
                        </div>
                        <div className='rounded-lg border bg-white p-3'>
                            <p className='text-xs uppercase text-gray-500'>Closing Balance</p>
                            <p className='text-xl font-bold text-gray-800'>₹ {Number(statementSummary.closingBalance || 0).toFixed(2)}</p>
                        </div>
                    </div>
                )}

                <div className='max-h-[45vh] overflow-auto'>
                    <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4">BILL DATE</th>
                                <th className="px-6 py-4">SUPPLIER</th>
                                <th className="px-6 py-4">TYPE</th>
                                <th className="px-6 py-4">INVOICE</th>
                                <th className="px-6 py-4">AMOUNT</th>
                                <th className="px-6 py-4">BAL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                            {filteredBill.length > 0 ? (
                                filteredBill.map((bill, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-black font-bold">{bill.date}</td>
                                        <td className="px-6 py-4 text-black font-light">{bill.supplierName}</td>
                                        <td className="px-6 py-4">
                                            {bill.type === 'Bill' ? (
                                                <Badge className='text-lg' variant="destructive">{bill.type}</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-lg bg-green-100 text-green-800 hover:bg-green-100">
                                                    {bill.type}
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-black font-light">{bill.invoice}</td>
                                        <td className={bill.type === "Bill" ? "px-6 py-4 text-red-500 font-bold" : "px-6 py-4 text-green-800 font-bold"}>
                                            {bill.type === "Bill" ? `+₹ ${Number(bill.total).toFixed(2)}` : `-₹ ${Number(bill.total).toFixed(2)}`}
                                        </td>
                                        <td className="px-6 py-4 text-black font-bold">₹ {Number(bill.balance || 0).toFixed(2)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center">No Transactions Found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default TabContentGeneraLedger
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
    totalDailyPayment,
    handleEditClick,
    handleDeletePaymentSql,

    // 📊 Transaction history section
    selectedSupplierName,
    filteredBill,
    selectedSupplierBalance,
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
                            <h2 className='text-xl font-bold mb-2'>Payments on {selectedDate}</h2>
                            {dailyPayments.length > 0 ? (
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

            <div className='border-gray-300 border w-full mt-5 h-[50vh] rounded-lg p-3 overflow-auto'>
                <h2 className='text-2xl font-bold mb-2'>Transaction History {selectedSupplierName && `for ${selectedSupplierName}`}</h2>
                <p className='font-light text-lg'>Showing all transactions</p>

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
                        {filteredBill.length > 0 ? (() => {
                            let runningBal = selectedSupplierBalance;
                            return filteredBill.map((bill, idx) => {
                                if (bill.type === 'Bill') {
                                    runningBal += Number(bill.total);
                                } else if (bill.type === 'Payment') {
                                    runningBal -= Number(bill.total);
                                }

                                return (
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
                                        <td className="px-6 py-4 text-black font-bold">₹ {runningBal.toFixed(2)}</td>
                                    </tr>
                                );
                            });
                        })() : (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center">No Transactions Found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default TabContentGeneraLedger
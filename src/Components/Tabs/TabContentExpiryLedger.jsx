import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Input } from '../ui/input.jsx';
import { Label } from "../ui/label.jsx";

const TabContentExpiryLedger = ({
  search,
  handleSearchChange,
  filteredSupplier,
  findExpiryFn,
  allSupplier,
  selectedSupplierName,
  fileredExpiry
}) => {
  return (
    <div>
        <h1 className="text-3xl font-bold ">Expiry Ledger</h1>
          <p className='mb-8'>Check Sales Return Based on Supplier</p>
          <div className='h-[65vh] flex flex-col-reverse lg:flex-row gap-4 border'>
            <div className='border-gray-300 border lg:w-[65%] rounded-lg p-3 overflow-auto'>
              <Input className='mb-2 bg-white' placeholder="Search Suppliers" value={search} onChange={handleSearchChange} />
              <h1 className="text-3xl mb-2">Suppliers</h1>
              <p className='font-light text-lg'>Check expiry ledger of all suppliers</p>

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
                          <Button onClick={() => findExpiryFn(supplier.supplierName)}>View Transactions</Button>
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

            <div className='border-gray-300 border lg:w-[35%] rounded-lg p-3'>
              <h1 className="text-3xl mb-2">Summary</h1>

              <div className='flex justify-between mt-3'>
                <p className='text-2xl'>Total Suppliers:</p>
                <p className='text-2xl font-bold'>{allSupplier.length}</p>
              </div>
              {/* <div className='flex justify-between mt-3'>
      <p className='text-2xl'>Total Balance:</p>
      <p className='text-2xl font-bold'>₹ {totalBalance.toFixed(2)}</p>
    </div>
    <div className='flex justify-between mt-3'>
      <p className='text-2xl'>Avg. Balance:</p>
      <p className='text-2xl font-bold'>₹ {averageBalance.toFixed(2)}</p>
    </div> */}
            </div>
          </div>

          <div className='border-gray-300 border w-full mt-5 h-[50vh] rounded-lg p-3 overflow-auto'>
            <h2 className='text-2xl font-bold mb-2'>Expiry History {selectedSupplierName && `for ${selectedSupplierName}`}</h2>
            <p className='font-light text-lg'>Showing all Expiry</p>

            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4">BILL DATE</th>
                  <th className="px-6 py-4">SUPPLIER</th>
                  <th className="px-6 py-4">TYPE</th>
                  <th className="px-6 py-4">PRODUCTS</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                {fileredExpiry.length > 0 ? (
                  fileredExpiry.map((bill, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-black font-bold">{bill.date}</td>
                      <td className="px-6 py-4 text-black font-light">{bill.supplierName}</td>
                      <td className="px-6 py-4">
                        {bill.type === 'EXPIRY' ? (
                          <Badge className="text-lg" variant="destructive">
                            {bill.type}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-lg bg-green-100 text-green-800 hover:bg-green-100">
                            {bill.type}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-black font-light">{bill.products.length}</td>
                      <td className="px-6 py-4">
                        <Dialog  >
                          <DialogTrigger asChild>
                            <Button variant="outline">View Details</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[1400px] h-[90vh]">
                            <DialogHeader>
                              <DialogTitle>{bill.supplierName}</DialogTitle>
                              <DialogDescription className="flex justify-between">
                                <p>DRUG L/N: {bill.supplierDrugLn}</p>
                                <p>Contact: {bill.supplierContact}</p>
                                <p>Expiry Bill Date: {bill.date}</p>
                              </DialogDescription>
                            </DialogHeader>

                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead >No.</TableHead>
                                  <TableHead >Name</TableHead>
                                  <TableHead>EXP</TableHead>
                                  <TableHead>QTY</TableHead>
                                  <TableHead>BATCH NO.</TableHead>
                                  <TableHead>MRP</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {bill.products.map((item, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.expiryDate}</TableCell>
                                    <TableCell>{item.stock}</TableCell>
                                    <TableCell>{item.batchNumber}</TableCell>
                                    <TableCell>{item.mrp}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>

                            <DialogFooter />
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center">No Expiry Found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
    </div>
  )
}

export default TabContentExpiryLedger
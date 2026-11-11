import React, { useEffect, useState } from 'react';
import {
  getLowStock,
  getOutOfStock,
  getExpiry
} from '../services/medicineService.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs.jsx';
import SalesDashboard from './SalesDashboard.jsx';

function DashBoard() {

  const [lowStock, setLowStock] = useState([]);

  const [outOfStock, setOutOfStock] = useState([]);

  const [expiry, setExpiry] = useState([]);

  // ==========================
  // FETCH MEDICINES
  // ==========================

  useEffect(() => {
    fetchLowStock();
    fetchOutOfStock();
    fetchExpiryStock();
  }, []);

  // ==========================
  // LOW STOCK
  // ==========================

  const fetchLowStock = async () => {

    try {

      const response = await getLowStock();

      setLowStock(response);

    } catch (error) {

      console.error(
        'Error fetching low stock:',
        error
      );
    }
  };

  // ==========================
  // OUT OF STOCK
  // ==========================

  const fetchOutOfStock = async () => {

    try {

      const response = await getOutOfStock();

      setOutOfStock(response);

    } catch (error) {

      console.error(
        'Error fetching out of stock:',
        error
      );
    }
  };

  // ==========================
  // EXPIRY
  // ==========================

  const fetchExpiryStock = async () => {

    try {

      const response = await getExpiry();

      setExpiry(response);

    } catch (error) {

      console.error(
        'Error fetching expiry:',
        error
      );
    }
  };

  return (

    <main
      id='main-top-container'
      className="h-full min-w-0 flex-1 overflow-auto bg-slate-50 p-4 pb-24 md:p-6 lg:pb-6"
    >

      <Tabs defaultValue="sales">

        <TabsList>

          <TabsTrigger value="sales">
            Sales
          </TabsTrigger>

          <TabsTrigger value="stock-info">
            Stock Info
          </TabsTrigger>

          <TabsTrigger value="expiry">
            Expiry
          </TabsTrigger>

        </TabsList>

        {/* ===================================== */}
        {/* SALES */}
        {/* ===================================== */}

        <TabsContent value="sales">
          <SalesDashboard />
        </TabsContent>

        {/* ===================================== */}
        {/* LOW STOCK */}
        {/* ===================================== */}

        <TabsContent value="stock-info">

          <Tabs defaultValue="low-stock">

            <TabsList>

              <TabsTrigger value="low-stock">
                Low Stock
              </TabsTrigger>

              <TabsTrigger value="out-of-stock">
                Out Of Stock
              </TabsTrigger>

            </TabsList>

            {/* LOW STOCK */}

            <TabsContent value="low-stock">

              <div className="mb-5">
                <h1 className="text-3xl font-bold">
                  Low Stock
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Products with more than 0 and less than 2 units in stock across all active batches.
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {lowStock.length} product{lowStock.length === 1 ? '' : 's'} need restocking.
                </p>
              </div>

              <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Price</th>

                  </tr>

                </thead>

                <tbody>

                  {lowStock.map((med) => (

                    <tr key={med.id}>

                      <td className="px-4 py-3">
                        {med.name}
                      </td>

                      <td className="px-4 py-3">
                        {med.category}
                      </td>

                      <td className="px-4 py-3">
                        {med.supplier}
                      </td>

                      <td className="px-4 py-3">
                        {med.batchNumber}
                      </td>

                      <td className="px-4 py-3">
                        {med.expiryDate}
                      </td>

                      <td className="px-4 py-3 text-red-600 font-bold">
                        {med.stock}
                      </td>

                      <td className="px-4 py-3">
                        ₹ {med.mrp}
                      </td>

                    </tr>

                  ))}

                  {lowStock.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                        No low-stock products right now.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </TabsContent>

            {/* OUT OF STOCK */}

            <TabsContent value="out-of-stock">

              <div className="mb-5">
                <h1 className="text-3xl font-bold">
                  Out Of Stock
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Products with no live stock across all active batches.
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {outOfStock.length} product{outOfStock.length === 1 ? '' : 's'} out of stock.
                </p>
              </div>

              <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Price</th>

                  </tr>

                </thead>

                <tbody>

                  {outOfStock.map((med) => (

                    <tr key={med.id}>

                      <td className="px-4 py-3">
                        {med.name}
                      </td>

                      <td className="px-4 py-3">
                        {med.category}
                      </td>

                      <td className="px-4 py-3">
                        {med.supplier}
                      </td>

                      <td className="px-4 py-3">
                        {med.batchNumber}
                      </td>

                      <td className="px-4 py-3">
                        {med.expiryDate}
                      </td>

                      <td className="px-4 py-3 text-red-600 font-bold">
                        {med.stock}
                      </td>

                      <td className="px-4 py-3">
                        ₹ {med.mrp}
                      </td>

                    </tr>

                  ))}

                  {outOfStock.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                        No out-of-stock products right now.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </TabsContent>

          </Tabs>

        </TabsContent>

        {/* ===================================== */}
        {/* EXPIRY */}
        {/* ===================================== */}

        <TabsContent value="expiry">

          <div className="mb-5">
            <h1 className="text-3xl font-bold">
              Expiry Medicines
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Active batches expiring within the next 3 months, starting today.
            </p>
            <p className="mt-1 text-xs font-medium text-slate-400">
              {expiry.length} batch{expiry.length === 1 ? '' : 'es'} expiring soon.
            </p>
          </div>

          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Price</th>

              </tr>

            </thead>

            <tbody>

              {expiry.map((med) => (

                <tr key={med.id}>

                  <td className="px-4 py-3">
                    {med.name}
                  </td>

                  <td className="px-4 py-3">
                    {med.category}
                  </td>

                  <td className="px-4 py-3">
                    {med.supplier}
                  </td>

                  <td className="px-4 py-3">
                    {med.batchNumber}
                  </td>

                  <td className="px-4 py-3 text-red-600 font-bold">
                    {med.expiryDate}
                  </td>

                  <td className="px-4 py-3">
                    {med.stock}
                  </td>

                  <td className="px-4 py-3">
                    ₹ {med.mrp}
                  </td>

                </tr>

              ))}

              {expiry.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No batches expire in the next 3 months.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </TabsContent>

      </Tabs>

    </main>
  );
}

export default DashBoard;
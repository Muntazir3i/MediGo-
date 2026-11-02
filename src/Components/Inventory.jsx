import React, { useState, useEffect } from 'react';
import {
    deleteMedicine,
    updateMedicine,
    fetchBillsProductsSql,
    getAllMedicines,
    findmedicineByName,
} from '../services/medicineService.js';
import { Input } from './ui/input';
import { Badge } from './ui/badge.jsx';
import './inventory.css';
import TableData from './TableData.jsx';
import { Button } from './ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from './ui/accordion.jsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHead,
    TableRow,
    TableFooter,
} from './ui/table.jsx';

function Inventory() {
    // ----- Medicines state -----
    const [medicines, setMedicines] = useState([]);
    const [filterMedicine, setFilterMedicine] = useState([]);
    const [medicineSearch, setMedicineSearch] = useState('');

    // ----- Purchases state -----
    const [allPurchases, setAllPurchases] = useState([]);
    const [filteredPurchase, setFilterPurchase] = useState([]);
    const [purchaseSearch, setPurchaseSearch] = useState('');

    // ----- Edit dialog state -----
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [formData, setFormData] = useState({});

    // ----- Initial fetch -----
    useEffect(() => {
        fetchMedicinesSql();
        fetchPurchases();
    }, []);

    // ----- Medicine search (debounced) -----
    useEffect(() => {
        const run = async () => {
            try {
                if (medicineSearch.trim() === '') {
                    setFilterMedicine(medicines.slice(0, 50));
                    return;
                }
                const response = await findmedicineByName(medicineSearch);
                // normalize in case service returns { data: [...] }
                const list = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];
                setFilterMedicine(list);
            } catch (error) {
                console.error('Search error:', error);
                setFilterMedicine([]);
            }
        };
        const t = setTimeout(run, 250);
        return () => clearTimeout(t);
    }, [medicineSearch, medicines]);

    // ----- Purchase search (independent) -----
    useEffect(() => {
        const source = Array.isArray(allPurchases) ? allPurchases : [];
        if (!purchaseSearch.trim()) {
            setFilterPurchase(source);
            return;
        }
        const q = purchaseSearch.toLowerCase();
        setFilterPurchase(
            source.filter((p) => p?.supplierName?.toLowerCase().includes(q))
        );
    }, [purchaseSearch, allPurchases]);

    // ----- Fetch purchases (normalized to array) -----
    const fetchPurchases = async () => {
        try {
            const response = await fetchBillsProductsSql();

            // Normalize: accept array or { data: [...] } / { purchases: [...] } / { bills: [...] }
            let list = [];
            if (Array.isArray(response)) {
                list = response;
            } else if (Array.isArray(response?.data)) {
                list = response.data;
            } else if (Array.isArray(response?.purchases)) {
                list = response.purchases;
            } else if (Array.isArray(response?.bills)) {
                list = response.bills;
            } else {
                console.warn('fetchBillsProductsSql returned unexpected shape:', response);
            }

            setAllPurchases(list);
            setFilterPurchase(list);
        } catch (error) {
            console.error('Error fetching the Bills:', error);
            setAllPurchases([]);
            setFilterPurchase([]);
        }
    };

    // ----- Fetch medicines (normalized to array) -----
    const fetchMedicinesSql = async () => {
        try {
            const response = await getAllMedicines();
            const list = Array.isArray(response)
                ? response
                : Array.isArray(response?.data)
                    ? response.data
                    : [];
            setMedicines(list);
            setFilterMedicine(list.slice(0, 50));
        } catch (error) {
            console.error('Error fetching Sql medicines:', error);
        }
    };

    // ----- Delete -----
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this medicine?')) return;
        try {
            await deleteMedicine(id);
            setMedicines((prev) => prev.filter((m) => m.id !== id));
            setFilterMedicine((prev) => prev.filter((m) => m.id !== id));
            alert('Medicine deleted successfully!');
        } catch (error) {
            console.error('Error deleting medicine:', error);
            alert('Failed to delete medicine.');
        }
    };

    // ----- Edit -----
    const handleEditClick = (medicine) => {
        setSelectedMedicine(medicine);
        setFormData({}); // track only changed fields
        setIsOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        if (!selectedMedicine) {
            alert('No medicine selected.');
            return;
        }
        if (Object.keys(formData).length === 0) {
            alert('No changes detected.');
            return;
        }
        try {
            await updateMedicine(selectedMedicine.id, formData);
            const merge = (list) =>
                list.map((m) =>
                    m.id === selectedMedicine.id ? { ...m, ...formData } : m
                );
            setMedicines(merge);
            setFilterMedicine(merge);
            alert('Medicine updated successfully!');
            setIsOpen(false);
            setSelectedMedicine(null);
            setFormData({});
        } catch (error) {
            console.error('Error updating medicine:', error);
            alert('Failed to update medicine.');
        }
    };

    // ----- Group purchases by supplier (defensive) -----
    const purchasesArray = Array.isArray(filteredPurchase) ? filteredPurchase : [];

    const groupedPurchases = purchasesArray.reduce((acc, purchase) => {
        const name = purchase?.supplierName ?? 'Unknown Supplier';
        if (!acc[name]) {
            acc[name] = {
                supplierGstin: purchase?.supplierGstin,
                supplierDrugLn: purchase?.supplierDrugLn,
                purchases: [],
                totalAmount: 0,
            };
        }
        acc[name].purchases.push(purchase);
        acc[name].totalAmount += Number(purchase?.total || 0);
        return acc;
    }, {});

    return (
        <main className="h-[90vh] min-w-0 flex-1 overflow-auto lg:h-screen bg-blue-50 p-4">
            <Tabs defaultValue="all-product">
                <TabsList>
                    <TabsTrigger value="all-product">All Product</TabsTrigger>
                    <TabsTrigger value="all-purchase">All Purchase</TabsTrigger>
                </TabsList>

                {/* ============== ALL PRODUCTS ============== */}
                <TabsContent value="all-product">
                    <h1 className="text-5xl mb-3">All Products</h1>
                    <h2 className="text-3xl mb-3">
                        Total Items <span className="font-bold">{medicines.length}</span>
                    </h2>
                    <Input
                        className="mb-2 bg-white"
                        placeholder="Search Medicines"
                        value={medicineSearch}
                        onChange={(e) => setMedicineSearch(e.target.value)}
                    />
                    <div className="overflow-auto">
                        <TableData
                            medicines={filterMedicine}
                            handleDelete={handleDelete}
                            handleEditClick={handleEditClick}
                            isOpen={isOpen}
                            setIsOpen={setIsOpen}
                            selectedMedicine={selectedMedicine}
                            handleChange={handleChange}
                            handleUpdate={handleUpdate}
                            formData={formData}
                        />
                    </div>
                </TabsContent>

                {/* ============== ALL PURCHASES ============== */}
                <TabsContent value="all-purchase">
                    <h1 className="text-5xl mb-3">All Purchases</h1>

                    <Input
                        className="mb-2 bg-white"
                        placeholder="Search Purchases"
                        value={purchaseSearch}
                        onChange={(e) => setPurchaseSearch(e.target.value)}
                    />

                    {Object.keys(groupedPurchases).length === 0 && (
                        <p className="text-muted-foreground">No purchases found.</p>
                    )}

                    {Object.entries(groupedPurchases).map(([supplierName, data]) => {
                        const bills = data.purchases.filter((p) => p.type === 'Bill');
                        const totalBills = bills.reduce(
                            (acc, curr) => acc + Number(curr?.total || 0),
                            0
                        );

                        return (
                            <Accordion type="single" collapsible key={supplierName}>
                                <AccordionItem value={supplierName}>
                                    <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-lg bg-white mb-2">
                                        <div className="flex flex-1 flex-col md:flex-row md:items-center justify-between text-left gap-2">
                                            <div>
                                                <h3 className="font-medium">{supplierName}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {data.supplierDrugLn}
                                                </p>
                                            </div>
                                            <div className="text-sm flex gap-2">
                                                <span className="text-muted-foreground mr-1">
                                                    Purchases: {bills.length}
                                                </span>
                                                <span className="text-muted-foreground mr-1">
                                                    Total: Rs{' '}
                                                    <span className="font-bold">
                                                        {totalBills.toFixed(2)}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>

                                    <AccordionContent>
                                        <div className="border h-[50vh] overflow-y-scroll">
                                            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-4">BILL NO.</th>
                                                        <th className="px-6 py-4">BILL DATE</th>
                                                        <th className="px-6 py-4">PRODUCTS</th>
                                                        <th className="px-6 py-4">TYPE</th>
                                                        <th className="px-6 py-4">TOTAL</th>
                                                        <th className="px-6 py-4">ACTIONS</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                                                    {bills.map((purchase) => (
                                                        <tr key={purchase.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 text-black">
                                                                {purchase.invoice}
                                                            </td>
                                                            <td className="px-6 py-4 text-black">
                                                                {new Date(purchase.date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4 text-black">
                                                                {purchase.products?.length ?? '-'}
                                                            </td>
                                                            <td className="px-6 py-4 text-black">
                                                                <Badge className="text-lg" variant="destructive">
                                                                    {purchase.type}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4 text-black">
                                                                {Number(purchase.total || 0).toFixed(2)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <Button variant="outline">
                                                                            View Details
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="sm:max-w-[1400px]">
                                                                        <DialogHeader>
                                                                            <DialogTitle>
                                                                                {purchase.supplierName}
                                                                            </DialogTitle>
                                                                            <DialogDescription asChild>
                                                                                <div className="flex justify-between gap-2 text-sm">
                                                                                    <span>Bill No.: {purchase.invoice}</span>
                                                                                    <span>DRUG L/N: {purchase.supplierDrugLn}</span>
                                                                                    <span>Contact: {purchase.supplierContact}</span>
                                                                                    <span>Bill Date: {purchase.date}</span>
                                                                                </div>
                                                                            </DialogDescription>
                                                                        </DialogHeader>

                                                                        <Table>
                                                                            <TableHeader>
                                                                                <TableRow>
                                                                                    <TableHead className="w-[100px]">Name</TableHead>
                                                                                    <TableHead>Category</TableHead>
                                                                                    <TableHead>EXP</TableHead>
                                                                                    <TableHead>QTY</TableHead>
                                                                                    <TableHead>BATCH NO.</TableHead>
                                                                                    <TableHead>RATE</TableHead>
                                                                                    <TableHead>MRP</TableHead>
                                                                                    <TableHead>Discount</TableHead>
                                                                                    <TableHead>GST %</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {(purchase.products ?? []).map((item, idx) => (
                                                                                    <TableRow key={idx}>
                                                                                        <TableCell className="font-medium">
                                                                                            {item.name}
                                                                                        </TableCell>
                                                                                        <TableCell>{item.category}</TableCell>
                                                                                        <TableCell>{item.expiryDate}</TableCell>
                                                                                        <TableCell>{item.stock}</TableCell>
                                                                                        <TableCell>{item.batchNumber}</TableCell>
                                                                                        <TableCell>{item.unitPrice}</TableCell>
                                                                                        <TableCell>{item.mrp}</TableCell>
                                                                                        <TableCell>{item.discount}</TableCell>
                                                                                        <TableCell>{item.gstPercentage}</TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                            <TableFooter>
                                                                                <TableRow>
                                                                                    <TableCell colSpan={3}>Sub Total</TableCell>
                                                                                    <TableCell
                                                                                        colSpan={6}
                                                                                        className="text-right text-2xl font-extrabold"
                                                                                    >
                                                                                        {Number(purchase.totalAmount || 0).toFixed(2)}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                                <TableRow>
                                                                                    <TableCell colSpan={3}>Sub Gst</TableCell>
                                                                                    <TableCell
                                                                                        colSpan={6}
                                                                                        className="text-right text-2xl font-extrabold"
                                                                                    >
                                                                                        {Number(purchase.totalGst || 0).toFixed(2)}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                                <TableRow>
                                                                                    <TableCell colSpan={3}>Total</TableCell>
                                                                                    <TableCell
                                                                                        colSpan={6}
                                                                                        className="text-right text-2xl font-extrabold"
                                                                                    >
                                                                                        {Number(purchase.total || 0).toFixed(2)}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            </TableFooter>
                                                                        </Table>

                                                                        <DialogFooter />
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        );
                    })}
                </TabsContent>
            </Tabs>
        </main>
    );
}

export default Inventory;
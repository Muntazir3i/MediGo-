import React, { useState, useEffect, useCallback } from 'react';
import {
    deleteMedicine,
    updateMedicine,
    fetchBillsProductsSql,
    getBillSuppliers,
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

// How many bills to show when a supplier accordion is opened / "Load more" is clicked.
const PURCHASE_BILL_PAGE_SIZE = 3;

function Inventory() {
    // ----- Medicines state -----
    const [medicines, setMedicines] = useState([]);
    const [filterMedicine, setFilterMedicine] = useState([]);
    const [medicineSearch, setMedicineSearch] = useState('');

    // ----- Purchases state -----
    const [billSuppliers, setBillSuppliers] = useState([]);
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [suppliersError, setSuppliersError] = useState('');
    const [purchaseSearch, setPurchaseSearch] = useState('');
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [openSupplier, setOpenSupplier] = useState('');
    // Per-supplier paginated bills: { [supplierName]: { bills, total, hasMore, ... } }
    const [supplierBills, setSupplierBills] = useState({});

    // ----- Edit dialog state -----
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [formData, setFormData] = useState({});

    // ----- Initial fetch -----
    useEffect(() => {
        fetchMedicinesSql();
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

    // ----- Purchase filters (debounced) -----
    const loadSuppliers = useCallback(async () => {
        setSuppliersLoading(true);
        setSuppliersError('');
        try {
            const response = await getBillSuppliers({
                search: purchaseSearch.trim(),
                date: purchaseDate,
                invoice: invoiceSearch.trim(),
            });
            const list = Array.isArray(response)
                ? response
                : Array.isArray(response?.data)
                    ? response.data
                    : [];
            setBillSuppliers(list);
        } catch (error) {
            console.error('Error fetching purchase suppliers:', error);
            setBillSuppliers([]);
            setSuppliersError('Could not load suppliers. Please try again.');
        } finally {
            setSuppliersLoading(false);
        }
    }, [purchaseSearch, purchaseDate, invoiceSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            // Filters changed: drop previously loaded bills and collapse any open accordion.
            setSupplierBills({});
            setOpenSupplier('');
            loadSuppliers();
        }, 250);
        return () => clearTimeout(timer);
    }, [loadSuppliers]);

    const clearPurchaseFilters = () => {
        setPurchaseSearch('');
        setInvoiceSearch('');
        setPurchaseDate('');
    };

    // ----- Bills for a supplier (paged, 3 at a time) -----
    const loadSupplierBills = async (supplierName, { reset = false } = {}) => {
        const existing = supplierBills[supplierName];
        const offset = reset ? 0 : (existing?.bills?.length ?? 0);

        if (!reset && (!existing || existing.loading || existing.loadingMore || !existing.hasMore)) {
            return;
        }

        setSupplierBills((prev) => ({
            ...prev,
            [supplierName]: {
                bills: reset ? [] : (prev[supplierName]?.bills ?? []),
                total: reset ? 0 : (prev[supplierName]?.total ?? 0),
                hasMore: reset ? false : (prev[supplierName]?.hasMore ?? false),
                loading: reset,
                loadingMore: !reset,
                loaded: false,
                error: '',
            },
        }));

        try {
            const response = await fetchBillsProductsSql({
                supplierName,
                limit: PURCHASE_BILL_PAGE_SIZE,
                offset,
                date: purchaseDate,
                invoice: invoiceSearch.trim(),
            });

            const list = Array.isArray(response?.bills)
                ? response.bills
                : Array.isArray(response)
                    ? response
                    : [];
            const total = Number(response?.total ?? (offset + list.length));
            const hasMore = typeof response?.hasMore === 'boolean'
                ? response.hasMore
                : offset + list.length < total;

            setSupplierBills((prev) => {
                const previousBills = prev[supplierName]?.bills ?? [];
                const seen = new Set(previousBills.map((bill) => bill.id));
                const merged = reset
                    ? list
                    : [...previousBills, ...list.filter((bill) => !seen.has(bill.id))];

                return {
                    ...prev,
                    [supplierName]: {
                        bills: merged,
                        total,
                        hasMore,
                        loading: false,
                        loadingMore: false,
                        loaded: true,
                        error: '',
                    },
                };
            });
        } catch (error) {
            console.error('Error fetching bills for supplier:', error);
            setSupplierBills((prev) => ({
                ...prev,
                [supplierName]: {
                    ...(prev[supplierName] || { bills: [], total: 0, hasMore: false }),
                    loading: false,
                    loadingMore: false,
                    loaded: true,
                    error: 'Could not load bills for this supplier.',
                },
            }));
        }
    };

    // Single accordion root -> opening one supplier automatically closes the previous one.
    const handleSupplierToggle = (value) => {
        setOpenSupplier(value);
        const state = supplierBills[value];
        if (value && !state?.loaded && !state?.loading) {
            loadSupplierBills(value, { reset: true });
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
    const hasPurchaseFilters =
        purchaseSearch.trim() !== '' ||
        invoiceSearch.trim() !== '' ||
        purchaseDate !== '';

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

                    <div className="mb-3 grid gap-2 md:grid-cols-3">
                        <Input
                            className="bg-white"
                            placeholder="Search supplier"
                            value={purchaseSearch}
                            onChange={(e) => setPurchaseSearch(e.target.value)}
                        />
                        <Input
                            className="bg-white"
                            placeholder="Search invoice / bill no."
                            value={invoiceSearch}
                            onChange={(e) => setInvoiceSearch(e.target.value)}
                        />
                        <Input
                            className="bg-white"
                            type="date"
                            aria-label="Filter bills by date"
                            value={purchaseDate}
                            onChange={(e) => setPurchaseDate(e.target.value)}
                        />
                    </div>

                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            {suppliersLoading
                                ? 'Loading suppliers...'
                                : `${billSuppliers.length} supplier${billSuppliers.length === 1 ? '' : 's'} found`}
                        </p>
                        {hasPurchaseFilters && (
                            <Button variant="outline" size="sm" onClick={clearPurchaseFilters}>
                                Clear filters
                            </Button>
                        )}
                    </div>

                    {suppliersError && (
                        <p className="mb-3 text-red-600">{suppliersError}</p>
                    )}

                    {!suppliersLoading && !suppliersError && billSuppliers.length === 0 && (
                        <p className="text-muted-foreground">No purchases found.</p>
                    )}

                    {billSuppliers.length > 0 && (
                        <Accordion
                            type="single"
                            collapsible
                            value={openSupplier}
                            onValueChange={handleSupplierToggle}
                        >
                            {billSuppliers.map((supplier) => {
                                const supplierName = supplier.supplierName;
                                const state = supplierBills[supplierName];
                                const bills = state?.bills ?? [];
                                const billCount = Number(supplier.billCount ?? 0);
                                const totalAmount = Number(supplier.total ?? 0);
                                const isLoaded = state?.loaded ?? false;

                                return (
                                    <AccordionItem value={supplierName} key={supplierName}>
                                        <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-lg bg-white mb-2">
                                            <div className="flex flex-1 flex-col md:flex-row md:items-center justify-between text-left gap-2">
                                                <div>
                                                    <h3 className="font-medium">{supplierName}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {supplier.supplierDrugLn}
                                                    </p>
                                                </div>
                                                <div className="text-sm flex gap-2">
                                                    <span className="text-muted-foreground mr-1">
                                                        Bills: {billCount}
                                                    </span>
                                                    <span className="text-muted-foreground mr-1">
                                                        Total: Rs{' '}
                                                        <span className="font-bold">
                                                            {totalAmount.toFixed(2)}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </AccordionTrigger>

                                        <AccordionContent>
                                            {state?.loading && (
                                                <p className="bg-white px-4 py-6 text-muted-foreground">
                                                    Loading bills...
                                                </p>
                                            )}

                                            {!state?.loading && state?.error && (
                                                <div className="flex items-center gap-3 bg-white px-4 py-4">
                                                    <p className="text-red-600">{state.error}</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => loadSupplierBills(supplierName, { reset: true })}
                                                    >
                                                        Retry
                                                    </Button>
                                                </div>
                                            )}

                                            {!state?.loading && !state?.error && isLoaded && bills.length === 0 && (
                                                <p className="bg-white px-4 py-6 text-muted-foreground">
                                                    No bills found for this supplier.
                                                </p>
                                            )}

                                            {!state?.loading && !state?.error && bills.length > 0 && (
                                                <>
                                                    <div className="border max-h-[50vh] overflow-y-auto">
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

                                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 rounded-lg">
                                                        <span className="text-sm text-muted-foreground">
                                                            Showing {bills.length} of {state?.total ?? billCount} bills
                                                        </span>
                                                        {state?.hasMore ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={state?.loadingMore}
                                                                onClick={() => loadSupplierBills(supplierName)}
                                                            >
                                                                {state?.loadingMore ? 'Loading...' : 'Load more bills'}
                                                            </Button>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">
                                                                All bills loaded
                                                            </span>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    )}
                </TabsContent>
            </Tabs>
        </main>
    );
}

export default Inventory;
import React, { useState, useEffect } from 'react';
import { getMedicines, deleteMedicine, updateMedicine, getPurchase, getPayments } from '../services/medicineService.js';
import { Input } from "./ui/input";
import './inventory.css'
import TableData from './TableData.jsx';
import { Button } from "./ui/button.jsx"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./ui/card.jsx"
// import { Label } from "./ui/label.jsx"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "./ui/tabs.jsx"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./ui/accordion.jsx"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from "./ui/table.jsx"



function Inventory() {
    const [medicines, setMedicines] = useState([]);
    const [allPurchases, setAllPurchases] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState();
    const [formData, setFormData] = useState({});
    const [filterMedicine, setFilterMedicine] = useState([]);
    const [filteredPurchase, setFilterPurchase] = useState([])
    const [filteredPayment, setFilterPayment] = useState([])
    const [search, setSearch] = useState('');
    const [payments, setPayments] = useState([])

    useEffect(() => {
        fetchMedicines();
    }, []);

    useEffect(() => {
        fetchPurchases()
    }, [])

    useEffect(() => {
        fetchPayments()
    }, [])

    useEffect(() => {
        console.log(allPurchases);
    }, [allPurchases])

    useEffect(() => {
        // Filter medicines whenever search input changes
        const filtered = medicines.filter((medicine) =>
            medicine.name.toLowerCase().includes(search.toLowerCase())
        );
        setFilterMedicine(filtered);
    }, [search, medicines]);

    useEffect(() => {
        // Filter medicines whenever search input changes
        const filtered = allPurchases.filter((purchase) =>
            purchase.supplierName.toLowerCase().includes(search.toLowerCase())
        );
        setFilterPurchase(filtered);
    }, [search, allPurchases]);

    useEffect(() => {
        // Filter medicines whenever search input changes
        const filtered = payments.filter((payment) =>
            payment.supplierName.toLowerCase().includes(search.toLowerCase())
        );
        setFilterPayment(filtered);
    }, [search, payments]);

    const fetchPurchases = async () => {
        try {
            const response = await getPurchase();
            setAllPurchases(response.data);
        } catch (error) {
            console.error('Error fetching the Bills:', error);
        }
    }

    const fetchMedicines = async () => {
        try {
            const response = await getMedicines();
            setMedicines(response.data);
            setFilterMedicine(response.data);
        } catch (error) {
            console.error('Error fetching the medicine:', error);
        }
    };
    const fetchPayments = async () => {
        try {
            const response = await getPayments();
            setPayments(response.data);
            // setFilterMedicine(response.data);
        } catch (error) {
            console.error('Error fetching the payments:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this medicine?")) {
            try {
                await deleteMedicine(id);
                setMedicines(medicines.filter((med) => med.id !== id));
                alert("Medicine deleted successfully!");
            } catch (error) {
                console.error("Error deleting medicine:", error);
                alert("Failed to delete medicine.");
            }
        }
    };

    const handleEditClick = async (medicine) => {

        // setSelectedMedicine(medicine);
        // console.log(selectedMedicine);

        setFormData(medicine); // Start with empty formData to track only changed fields
        // console.log(formData);

        setIsOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const handleUpdate = async () => {
        if (!selectedMedicine || Object.keys(formData).length === 0) {
            alert("No changes detected.");
            return;
        }

        try {
            await updateMedicine(selectedMedicine.id, formData); // Send only modified fields
            setMedicines(medicines.map((med) =>
                med.id === selectedMedicine.id ? { ...med, ...formData } : med
            ));
            alert("Medicine updated successfully!");
            setIsOpen(false);
        } catch (error) {
            console.error("Error updating medicine:", error);
            alert("Failed to update medicine.");
        }
    };


    const groupedPurchases = filteredPurchase.reduce((acc, purchase) => {
        if (!acc[purchase.supplierName]) {
            acc[purchase.supplierName] = {
                supplierGstin: purchase.supplierGstin,
                purchases: [],
            };
        }
        acc[purchase.supplierName].purchases.push(purchase);
        return acc;
    }, {});




    return (
        <main className="h-screen min-w-0 flex-1 overflow-auto bg-blue-50 p-4">
            <h1 className="text-5xl mb-3">All Products</h1>
            <Tabs defaultValue="all-product" >
                <TabsList >
                    <TabsTrigger value="all-product">All Product</TabsTrigger>
                    <TabsTrigger value="all-purchase">All Purchase</TabsTrigger>
                    <TabsTrigger value="all-payments">All Payments</TabsTrigger>
                </TabsList>
                <TabsContent value="all-product">
                    <Input className='mb-2 bg-white' placeholder="Search Medicines" onChange={handleSearchChange} />
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
                </TabsContent>
                <TabsContent value="all-purchase">
                    <Input className='mb-2 bg-white' placeholder="Search Purchases" onChange={handleSearchChange} />
                    {Object.entries(groupedPurchases).map(([supplierName, data]) => (
                        <Accordion type="single" collapsible key={supplierName}>
                            <AccordionItem value={supplierName}>
                                <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-lg bg-white mb-2">
                                    <div className="flex flex-1 flex-col md:flex-row md:items-center justify-between text-left gap-2">
                                        <div>
                                            <h3 className="font-medium">{supplierName}</h3>
                                            <p className="text-sm text-muted-foreground">{data.supplierDrugLn}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-sm">
                                                <span className="text-muted-foregroundz mr-1">Purchases:</span>
                                                {data.purchases.length}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4">BILL NO.</th>
                                                <th className="px-6 py-4">BILL DATE</th>
                                                <th className="px-6 py-4">PRODUCTS</th>
                                                <th className="px-6 py-4">TOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                                            {data.purchases.map((purchase) => (
                                                <tr key={purchase.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-black">{purchase.billNumber}</td>
                                                    <td className="px-6 py-4 text-black">{purchase.billDate}</td>
                                                    <td className="px-6 py-4 text-black">{purchase.products.length}</td>
                                                    <td className="px-6 py-4 text-black">{Number(purchase.total).toFixed(2)}</td>
                                                    <td className="px-6 py-4">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline">View Details</Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-[1400px]">
                                                                <DialogHeader>
                                                                    <DialogTitle>{supplierName}</DialogTitle>
                                                                    <DialogDescription className='flex justify-between'>
                                                                        <p>Bill No.: {purchase.billNumber} </p>
                                                                        <p>DRUG L/N: {purchase.supplierDrugLn} </p>
                                                                        <p>Contact: {purchase.supplierContact}</p>
                                                                        <p>Bill Date: {purchase.billDate}</p>
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
                                                                            <TableHead>Unite Price</TableHead>
                                                                            <TableHead>PRICE</TableHead>
                                                                            <TableHead>Discount</TableHead>
                                                                            <TableHead>GST %</TableHead>

                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {purchase.products.map((item) => (
                                                                            <TableRow>
                                                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                                                <TableCell>{item.category}</TableCell>
                                                                                <TableCell>{item.expiryDate}</TableCell>
                                                                                <TableCell>{item.stock}</TableCell>
                                                                                <TableCell>{item.batchNumber}</TableCell>
                                                                                <TableCell>{item.unitPrice}</TableCell>
                                                                                <TableCell>{item.mrp}</TableCell>
                                                                                <TableCell>{item.discount}</TableCell>
                                                                                <TableCell>{item.gstPercentage}</TableCell>

                                                                                {/* <TableCell className="text-right">{(Number(item.mrp) * item.qty).toFixed(2)}</TableCell> */}
                                                                            </TableRow>
                                                                        ))}


                                                                    </TableBody>
                                                                    <TableFooter>
                                                                        <TableRow>
                                                                            <TableCell colSpan={3}>Sub Total</TableCell>
                                                                            <TableCell colSpan={6} className="text-right text-2xl font-extrabold">{Number(purchase.totalAmount).toFixed(2)}</TableCell>
                                                                        </TableRow>
                                                                        <TableRow>
                                                                            <TableCell colSpan={3}>Sub Gst</TableCell>
                                                                            <TableCell colSpan={6} className="text-right text-2xl font-extrabold">{Number(purchase.totalGst).toFixed(2)}</TableCell>
                                                                        </TableRow>
                                                                        <TableRow>
                                                                            <TableCell colSpan={3}>Total</TableCell>
                                                                            <TableCell colSpan={6} className="text-right text-2xl font-extrabold">{Number(purchase.total).toFixed(2)}</TableCell>
                                                                        </TableRow>
                                                                    </TableFooter>
                                                                </Table>

                                                                <DialogFooter>
                                                                    {/* <Button type="submit">Save changes</Button> */}
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    ))}
                </TabsContent>
                <TabsContent value="all-payments">
                    <Input className='mb-2 bg-white' placeholder="Search Payments" onChange={handleSearchChange} />
                    {filteredPayment.map((item) => (
                                    <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                                        <thead className="bg-gray-50">
                                            <tr>
                                            
                                                
                                                <th className="px-6 py-4">Supplier Name</th>
                                                <th className="px-6 py-4">Receipt Date</th>
                                                <th className="px-6 py-4">Receipt Number</th>
                                                <th className="px-6 py-4">Amount Paid</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">{item.supplierName}</td>
                                                    <td className="px-6 py-4">{item.receiptDate}</td>
                                                    <td className="px-6 py-4">{item.receiptNumber}</td>
                                                    <td className="px-6 py-4">{`Rs ${Number(item.amountPaid)}`}</td>
                                                </tr>
                                        </tbody>
                                    </table>
                          
                    ))}
                </TabsContent>

            </Tabs>

        </main>
    );
}

export default Inventory;

import React, { useState, useEffect } from 'react';
import { getMedicines, deleteMedicine, updateMedicine, getPurchase, getPayments } from '../services/medicineService.js';
import { Input } from "./ui/input";
import { Badge } from './ui/badge.jsx';
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


    // const groupedPurchases = filteredPurchase.reduce((acc, purchase) => {
    //     if (!acc[purchase.supplierName]) {
    //         acc[purchase.supplierName] = {
    //             supplierGstin: purchase.supplierGstin,
    //             purchases: [],
    //         };
    //     }
    //     acc[purchase.supplierName].purchases.push(purchase);
    //     return acc;
    // }, {});

    const groupedPurchases = filteredPurchase.reduce((acc, purchase) => {
        if (!acc[purchase.supplierName]) {
            acc[purchase.supplierName] = {
                supplierGstin: purchase.supplierGstin,
                supplierDrugLn: purchase.supplierDrugLn, // you were using this in JSX
                purchases: [],
                totalAmount: 0,
            };
        }

        acc[purchase.supplierName].purchases.push(purchase);
        acc[purchase.supplierName].totalAmount += Number(purchase.total || 0);

        return acc;
    }, {});






    return (
        <main className="h-[90vh] min-w-0 flex-1 overflow-auto lg:h-screen bg-blue-50 p-4">

            <Tabs defaultValue="all-product" >
                <TabsList >
                    <TabsTrigger value="all-product">All Product</TabsTrigger>
                    <TabsTrigger value="all-purchase">All Purchase</TabsTrigger>
                    <TabsTrigger value="all-payments">All Payments</TabsTrigger>
                </TabsList>
                <TabsContent value="all-product">
                    <h1 className="text-5xl mb-3">All Products</h1>
                    <h2 className=' text-3xl mb-3'>Total Items <span className='font-bold'>{medicines.length}</span></h2>
                    <Input className='mb-2 bg-white' placeholder="Search Medicines" onChange={handleSearchChange} />
                    <div className='overflow-auto'>
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
                <TabsContent value="all-purchase">
                    <h1 className="text-5xl mb-3">All Purchases</h1>

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
                                        <div className="">
                                            <div className="text-sm flex gap-2">
                                                <span className="text-muted-foregroundz mr-1">Purchases: {data.purchases.filter((p)=>p.type === 'Bill').length}</span>

                                                <span className="text-muted-foregroundz mr-1">
                                                    Total: Rs{" "}
                                                    <span className="font-bold">
                                                        {data.purchases
                                                            .filter((p) => p.type === "Bill")
                                                            .reduce((acc, curr) => acc + Number(curr.total), 0)
                                                            .toFixed(2)}
                                                    </span>
                                                </span>



                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className='border border-red-400 overflow-auto'>
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
                                            {data.purchases
                                                .filter((purchase) => purchase.type === "Bill")
                                                .map((purchase) => (
                                                    <tr key={purchase.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-black">{purchase.invoice}</td>
                                                        <td className="px-6 py-4 text-black">{purchase.date}</td>
                                                        <td className="px-6 py-4 text-black">
                                                            {purchase.products ? purchase.products.length : "-"}
                                                        </td>
                                                        <td className="px-6 py-4 text-black">
                                                            <Badge className="text-lg" variant="destructive">
                                                                {purchase.type}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-black">
                                                            {Number(purchase.total).toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="outline">View Details</Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[1400px]">
                                                                    <DialogHeader>
                                                                        <DialogTitle>{purchase.supplierName}</DialogTitle>
                                                                        <DialogDescription className="flex justify-between">
                                                                            <p>Bill No.: {purchase.invoice}</p>
                                                                            <p>DRUG L/N: {purchase.supplierDrugLn}</p>
                                                                            <p>Contact: {purchase.supplierContact}</p>
                                                                            <p>Bill Date: {purchase.date}</p>
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
                                                                            {purchase.products.map((item, idx) => (
                                                                                <TableRow key={idx}>
                                                                                    <TableCell className="font-medium">{item.name}</TableCell>
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
                                                                                <TableCell colSpan={6} className="text-right text-2xl font-extrabold">
                                                                                    {Number(purchase.totalAmount).toFixed(2)}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                            <TableRow>
                                                                                <TableCell colSpan={3}>Sub Gst</TableCell>
                                                                                <TableCell colSpan={6} className="text-right text-2xl font-extrabold">
                                                                                    {Number(purchase.totalGst).toFixed(2)}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                            <TableRow>
                                                                                <TableCell colSpan={3}>Total</TableCell>
                                                                                <TableCell colSpan={6} className="text-right text-2xl font-extrabold">
                                                                                    {Number(purchase.total).toFixed(2)}
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
                    ))}
                </TabsContent>
                <TabsContent value="all-payments" className='overflow-auto'>
                    <h1 className="text-5xl mb-3">All Payments</h1>
                    <Input className='mb-2 bg-white' placeholder="Search Payments" onChange={handleSearchChange} />
                    {allPurchases
                        .filter((item) => item.type === "Payment")
                        .map((item) => (
                            <table
                                key={item.id}
                                className="w-full border-collapse bg-white text-left text-sm text-gray-500 mb-4"
                            >
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4">SUPPLIER NAME</th>
                                        <th className="px-6 py-4">RECEIPT DATE</th>
                                        <th className="px-6 py-4">RECEIPT NO.</th>
                                        <th className="px-6 py-4">TYPE</th>
                                        <th className="px-6 py-4">Amount Paid</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-black">{item.supplierName}</td>
                                        <td className="px-6 py-4 text-black">{item.date}</td>
                                        <td className="px-6 py-4 text-black">{item.invoice}</td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant="outline"
                                                className="text-lg bg-green-100 text-green-800 hover:bg-green-100"
                                            >
                                                {item.type}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-black font-bold">{`Rs ${Number(item.total).toFixed(2)}`}</td>
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
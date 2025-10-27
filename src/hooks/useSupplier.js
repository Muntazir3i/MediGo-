import { getsupplierSql } from "@/services/medicineService.js";

export const fetchAllSuppliers = async()=>{
    try {
        const response = await getsupplierSql();
        return response.data;
    } catch (error) {
        console.log('Error Fetching the suppliers:', error);
    }
}
import { useState, useEffect } from "react";
import { findmedicineByName } from "@/services/medicineService.js";

export const useDebouncedSearch = (searchText, delay = 500) => {
    const [debouncedQuery, setDebouncedQuery] = useState(searchText);
    const [searchResult, setSearchResult] = useState([]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchText);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [searchText,delay]);

    useEffect(() => {
        const search = async () => {
            if (!debouncedQuery.trim()) {
                setSearchResult([]);
                return;
            }

            try {
                const result = await findmedicineByName(debouncedQuery);
                setSearchResult(result);
            } catch (err) {
                console.error("Error searching medicine:", err);
            }
        };

        search();
    }, [debouncedQuery]);

    return searchResult;
} 
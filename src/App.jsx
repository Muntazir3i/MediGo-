import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import axios from "axios";
import { getMedicines } from './services/medicineService.js';


function App() {
  const [medicines,setMedicines] = useState([]);

  useEffect(()=>{
    fetchMedicines()
  },[])

  //fetch Medicine
  const fetchMedicines = async()=>{
    try {
      const response = await getMedicines();
      setMedicines(response.data)
    } catch (error) {
      console.error('Error Fetching the medicine:', error)
    }
  }

  console.log(medicines);
  


  return (
    <>
      

    </>
  )
}

export default App

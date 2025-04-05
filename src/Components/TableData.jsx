import React from 'react'
import { Button } from "./ui/button.jsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input.jsx";
import { Label } from "./ui/label.jsx";

function TableData({ medicines, handleDelete, handleEditClick, isOpen, setIsOpen, selectedMedicine, handleChange, handleUpdate,formData }) {
  return (
    <>
    <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
    <thead className="bg-gray-50">
        <tr>
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Supplier</th>
            <th className="px-6 py-4">Batch Number</th>
            <th className="px-6 py-4">EXP Date</th>
            <th className="px-6 py-4">Stock</th>
            <th className="px-6 py-4">Price</th>
            <th className="px-6 py-4"></th>
        </tr>
    </thead>
    <tbody className="divide-y divide-gray-100 border-t border-gray-100">
        {medicines.length > 0 ? (
            medicines.map((med) => (
                <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-black font-bold">{med.name}</td>
                    <td className="px-6 py-4 text-black font-light">{med.category}</td>
                    <td className="px-6 py-4 text-black font-light">{med.supplier}</td>
                    <td className="px-6 py-4 text-black font-light">{med.batchNumber}</td>
                    <td className="px-6 py-4 text-black font-bold">{med.expiryDate}</td>
                    <td className={`${Number(med.stock) > 0 ? 'text-green-600 px-6 py-4 font-bold ' : 'text-red-600 px-6 py-4 font-bold'}`}>{med.stock}</td>
                    <td className="px-6 py-4 text-black font-extrabold">Rs {med.mrp}</td>
                    <td className="flex gap-4 px-6 py-4">
                        <button onClick={() => handleDelete(med.id)} className="text-red-600 hover:text-red-800">Delete</button>
                        <Button variant="outline" onClick={() => handleEditClick(med)}>Edit</Button>
                    </td>
                </tr>
            ))
        ) : (
            <tr>
                <td colSpan="10" className="px-6 py-4 text-center">No Medicines Found</td>
            </tr>
        )}
    </tbody>
</table>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
              <DialogTitle>Edit Medicine</DialogTitle>
              <DialogDescription>Modify the medicine details and save changes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              {formData && Object.keys(formData).map((key) => (
                  key !== 'id' && (
                      <div key={key} className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor={key} className="text-right">{key}</Label>
                          <Input id={key} name={key} defaultValue={formData[key]} onChange={handleChange} className="col-span-3" />
                      </div>
                  )
              ))}
          </div>
          <DialogFooter>
              <Button onClick={handleUpdate}>Save changes</Button>
          </DialogFooter>
      </DialogContent>
  </Dialog>
  </>
  )
}

export default TableData
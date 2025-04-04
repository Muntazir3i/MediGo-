import React from 'react'


const SelectList = ({itemId,handleInputChange,selectedCategory}) => {
  return (
    <select
    className="border-1"
    id="medicine-form"
    name="category"
    value={selectedCategory}  // Bind the state value
    onChange={(e) => handleInputChange(itemId, "category", e.target.value)} // Update state when selection changes
    required
  >
    <option value="">Select Category</option>  {/* Default placeholder */}
    <option value="Tablet">Tablet</option>
    <option value="Capsule">Capsule</option>
    <option value="Syrup">Syrup</option>
    <option value="Suspension">Suspension</option>
    <option value="Drops">Drops</option>
    <option value="Injection">Injection</option>
    <option value="Ointment">Ointment</option>
    <option value="Cream">Cream</option>
    <option value="Gel">Gel</option>
    <option value="Powder">Powder</option>
    <option value="Suppository">Suppository</option>
    <option value="Inhaler">Inhaler</option>
    <option value="Patch">Patch</option>
    <option value="Lozenge">Lozenge</option>
    <option value="Spray">Spray</option>
  </select>
  )
}

export default SelectList
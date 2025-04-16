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
    <option value="Test Kit">TEST KIT</option>
    <option value="Diaper">DIAPER</option>
    <option value="Sanitary Pads">SANITARY PADS</option>
    <option value="Sanitizer">SANITIZER</option>
    <option value="Granules">Granules</option>
    <option value="Baby Food">BABY FOOD</option>
    <option value="Lotion">LOTION</option>
    <option value="Cosmetics">COSMETICS</option>
    <option value="Sachet">SACHET</option>
    <option value="Mouth Wash">MOUTHWASH</option>
    <option value="Soap">SOAP</option>
    <option value="Cream">CREAM</option>
    <option value="Oil">Oil</option>
    <option value="Wipes">Wipes</option>
    <option value="Rotocap">ROTOCAP</option>
    
    
  </select>
  )
}

export default SelectList
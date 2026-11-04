import React from 'react'

const SelectList = ({ itemId, handleInputChange, selectedCategory, ...inputProps }) => {
  return (
    <select
      className="h-9 w-full min-w-[95px] rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
      name="category"
      value={selectedCategory || ''}
      onChange={(e) => handleInputChange(itemId, "category", e.target.value)}
      required
      {...inputProps}
    >
      <option value="">Category</option>
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
      <option value="NANO SHOTS">NANO SHOTS</option>
      <option value="SACHET">SACHETS</option>
      <option value="GARGLES">GARGLES</option>
      <option value="HANDWASH">HANDWASH</option>
      <option value="SUSPENSION">SUSPENSION</option>
      <option value="HAIR PRODUCT">HAIR PRODUCT</option>
    </select>
  )
}

export default SelectList

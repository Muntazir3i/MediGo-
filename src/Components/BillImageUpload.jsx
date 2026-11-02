import { useState } from 'react';

const toNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export default function BillImageUpload({ onExtracted }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // lets the user select the same image again
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please select a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Use an image smaller than 8 MB.');
      return;
    }

    setIsScanning(true);
    setError('');
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.match(/data:(.*?);/)?.[1];
      const response = await fetch('/api/bills/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to scan the bill.');

      onExtracted({
        ...payload,
        products: (payload.products || []).map((product) => ({
          id: Date.now(),
          name: product.name || '',
          batchNumber: product.batchNumber || '',
          expiryDate: product.expiryDate || '',
          stock: toNumber(product.stock),
          unitPrice: toNumber(product.unitPrice),
          mrp: toNumber(product.mrp),
          discount: toNumber(product.discount),
          gstPercentage: toNumber(product.gstPercentage)
        }))
      });
    } catch (scanError) {
      setError(scanError.message || 'Unable to scan the bill.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="mb-4 rounded border p-3">
      <label className="block font-medium" htmlFor="bill-image">Import bill image</label>
      <p className="mb-2 text-sm text-gray-500">Gemini fills the form; review every value before saving.</p>
      <input id="bill-image" type="file" accept="image/jpeg,image/png,image/webp" disabled={isScanning} onChange={handleFile} />
      {isScanning && <p className="mt-2 text-sm">Reading bill…</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
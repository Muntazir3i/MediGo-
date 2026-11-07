import { useRef, useState } from 'react';
import { ImagePlus, Loader2, ScanLine } from 'lucide-react';
import { Button } from './ui/button.jsx';

const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export default function BillImageUpload({
  onExtracted,
  title = 'Import a bill image',
  description = 'Upload a JPG, PNG or WebP (under 8 MB). Gemini fills the form, then you review every value before saving.',
  buttonLabel = 'Choose image',
  inputId = 'bill-image',
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

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
        body: JSON.stringify({ base64, mimeType }),
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
          gstPercentage: toNumber(product.gstPercentage),
        })),
      });
    } catch (scanError) {
      setError(scanError.message || 'Unable to scan the bill.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-dashed border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <ScanLine className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 max-w-xl text-xs text-muted-foreground">
            {description}
          </p>
          {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={isScanning}
        onChange={handleFile}
        className="sr-only"
      />

      <Button
        type="button"
        variant="outline"
        disabled={isScanning}
        onClick={() => inputRef.current?.click()}
        className="shrink-0 gap-2 border-border bg-background text-foreground shadow-sm hover:bg-accent"
      >
        {isScanning ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        ) : (
          <ImagePlus className="h-4 w-4 text-muted-foreground" />
        )}
        {isScanning ? 'Reading image…' : buttonLabel}
      </Button>
    </section>
  );
}

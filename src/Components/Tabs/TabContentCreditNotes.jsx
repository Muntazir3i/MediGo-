import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CircleDollarSign,
  Eye,
  FilePlus2,
  FileText,
  Landmark,
  PackageSearch,
  Pencil,
  ReceiptText,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table.jsx';
import LedgerSupplierList from '../LedgerSupplierList.jsx';
import { formatCurrency, formatLedgerDate } from '../../utils/ledgerFormat.js';
import { deleteCreditNote, getCreditNotes } from '../../services/medicineService.js';

const StatCard = ({ label, children, icon, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="rounded-xl border border-slate-300/80 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`rounded-lg p-1.5 ${tones[tone] || tones.slate}`}>
          {React.createElement(icon, { className: 'h-4 w-4' })}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
};

const TabContentCreditNotes = ({
  search = '',
  handleSearchChange,
  onClearSearch,
  filteredSupplier = [],
  allSupplier = [],
  suppliersLoading = false,
}) => {
  const navigate = useNavigate();
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const requestRef = useRef(0);

  useEffect(() => {
    if (!selectedSupplierName) {
      setRecords([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    const requestId = ++requestRef.current;
    setLoading(true);
    setError('');

    getCreditNotes({ supplierName: selectedSupplierName })
      .then((response) => {
        if (requestId !== requestRef.current) return;
        setRecords(Array.isArray(response) ? response : []);
      })
      .catch((requestError) => {
        if (requestId !== requestRef.current) return;
        console.error('Error loading credit notes:', requestError);
        setRecords([]);
        setError(requestError.message || 'Could not load credit notes.');
      })
      .finally(() => {
        if (requestId === requestRef.current) setLoading(false);
      });

    return () => {
      requestRef.current += 1;
    };
  }, [selectedSupplierName, reloadKey]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const selectedSupplier = useMemo(
    () => allSupplier.find((supplier) => supplier.supplierName === selectedSupplierName),
    [allSupplier, selectedSupplierName]
  );

  const summary = useMemo(() => {
    const totalCredit = records.reduce(
      (sum, record) => sum + (Number(record.total) || 0),
      0
    );
    const totalQuantity = records.reduce(
      (sum, record) => sum + (Number(record.totalQuantity) || 0),
      0
    );

    return { totalCredit, totalQuantity };
  }, [records]);

  const goToAdd = () => {
    navigate('/add?tab=add-credit-note');
  };

  const goToEdit = (record) => {
    navigate(`/add?tab=add-credit-note&creditNoteId=${record.id}`);
  };

  const handleSelectSupplier = (name) => {
    setSelectedSupplierName(name);
  };

  const handleDelete = async (record) => {
    const confirmed = window.confirm(
      `Delete credit note ${record.creditNoteNumber} for ${record.supplierName}?`
    );
    if (!confirmed) return;

    try {
      await deleteCreditNote(record.id);
      setNotice('Credit note deleted successfully.');
      setReloadKey((key) => key + 1);
    } catch (deleteError) {
      console.error('Error deleting credit note:', deleteError);
      setError(deleteError.message || 'Could not delete the credit note.');
    }
  };

  return (
    <div className="space-y-5">
      {notice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {notice}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <LedgerSupplierList
          title="Distributor directory"
          description="Open a distributor to review their credit notes."
          actionLabel="View credit notes"
          footerText={`${filteredSupplier.length} distributor${filteredSupplier.length === 1 ? '' : 's'} shown`}
          suppliers={filteredSupplier}
          search={search}
          onSearchChange={handleSearchChange}
          onClearSearch={onClearSearch}
          selectedSupplierName={selectedSupplierName}
          onSelect={handleSelectSupplier}
          loading={suppliersLoading}
        />

        <section className="flex h-[430px] flex-col overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 p-5">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Credit note overview</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Review credits received from the selected distributor.
              </p>
            </div>
          </div>

          <div className="grid flex-1 content-start gap-3 overflow-y-auto p-5 sm:grid-cols-2">
            <StatCard label="Distributors" icon={Building2} tone="blue">
              <p className="text-2xl font-bold text-slate-900">{allSupplier.length}</p>
            </StatCard>

            <StatCard label="Credit notes" icon={ReceiptText} tone="emerald">
              <p className="text-2xl font-bold text-slate-900">
                {selectedSupplierName ? records.length : '—'}
              </p>
            </StatCard>

            <StatCard label="Total credit" icon={CircleDollarSign} tone="emerald">
              <p className="text-2xl font-bold text-emerald-700">
                {selectedSupplierName ? formatCurrency(summary.totalCredit) : '—'}
              </p>
            </StatCard>

            <StatCard label="Total quantity" icon={PackageSearch} tone="blue">
              <p className="text-2xl font-bold text-slate-900">
                {selectedSupplierName ? summary.totalQuantity : '—'}
              </p>
            </StatCard>

            <div className="sm:col-span-2">
              <StatCard label="Selected distributor" icon={Landmark} tone="slate">
                {selectedSupplierName ? (
                  <>
                    <p className="truncate text-sm font-bold text-slate-900">
                      {selectedSupplierName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Stored balance {formatCurrency(selectedSupplier?.supplierBalance)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    Choose a distributor to see their credit note history.
                  </p>
                )}
              </StatCard>
            </div>

            <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 sm:col-span-2">
              Credit notes are deducted from the supplier ledger balance in the same way as payments.
            </p>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-300/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <ReceiptText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Credit note history</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {selectedSupplierName
                  ? `Showing ${records.length} credit note${records.length === 1 ? '' : 's'} for ${selectedSupplierName}`
                  : 'Select a distributor to load credit notes.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedSupplierName && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {records.length} credit note{records.length === 1 ? '' : 's'}
              </Badge>
            )}
            <Button
              type="button"
              onClick={goToAdd}
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <FilePlus2 className="h-4 w-4" />
              Add credit note
            </Button>
          </div>
        </div>

        {!selectedSupplierName && (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">No distributor selected</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Pick a distributor from the directory to see their credit notes.
            </p>
          </div>
        )}

        {selectedSupplierName && loading && (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((item) => (
              <div key={item} className="animate-pulse rounded-lg border border-slate-100 p-4">
                <div className="h-4 w-1/2 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-1/4 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {selectedSupplierName && !loading && error && (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="rounded-full bg-rose-50 p-3 text-rose-500">
              <ReceiptText className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">Could not load credit notes</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Try again
            </Button>
          </div>
        )}

        {selectedSupplierName && !loading && !error && records.length > 0 && (
          <div className="max-h-[45vh] overflow-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Credit note</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 text-right font-semibold">Items</th>
                  <th className="px-5 py-3 text-right font-semibold">Qty</th>
                  <th className="px-5 py-3 text-right font-semibold">Credit amount</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id} className="transition hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-sm font-bold text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                        {record.creditNoteNumber}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                      {formatLedgerDate(record.date)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-slate-600">
                      {record.itemCount}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-slate-600">
                      {record.totalQuantity}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-emerald-700">
                      {formatCurrency(record.total)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                          className="h-8 gap-1 px-2.5 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToEdit(record)}
                          className="h-8 gap-1 px-2.5 text-xs"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(record)}
                          className="h-8 gap-1 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedSupplierName && !loading && !error && records.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-400">
              <PackageSearch className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">No credit notes</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              There are no credit notes for {selectedSupplierName}.
            </p>
            <Button
              className="mt-4 gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={goToAdd}
            >
              <FilePlus2 className="h-4 w-4" />
              Add credit note
            </Button>
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => {
          if (!open) setSelectedRecord(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[1100px]">
          {selectedRecord && (
            <>
              <DialogHeader>
                <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <DialogTitle>{selectedRecord.supplierName}</DialogTitle>
                <DialogDescription asChild>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <span>Credit note: {selectedRecord.creditNoteNumber}</span>
                    <span>Date: {formatLedgerDate(selectedRecord.date)}</span>
                    <span>D.L.: {selectedRecord.supplierDrugLn || '—'}</span>
                    <span>Contact: {selectedRecord.supplierContact || '—'}</span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">Disc %</TableHead>
                    <TableHead className="text-right">GST %</TableHead>
                    <TableHead className="text-right">Line total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selectedRecord.items || []).map((item, index) => (
                    <TableRow key={item.id ?? index}>
                      <TableCell className="text-slate-500">{index + 1}</TableCell>
                      <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                      <TableCell className="text-slate-600">{item.category || '—'}</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-md border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          {item.batchNumber || '—'}
                        </span>
                      </TableCell>
                      <TableCell>{formatLedgerDate(item.expiryDate)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.mrp)}</TableCell>
                      <TableCell className="text-right">{item.discount}</TableCell>
                      <TableCell className="text-right">{item.gstPercentage}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.lineTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5}>Subtotal</TableCell>
                    <TableCell colSpan={6} className="text-right font-semibold">
                      {formatCurrency(selectedRecord.totalAmount)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5}>Discount</TableCell>
                    <TableCell colSpan={6} className="text-right text-rose-600">
                      − {formatCurrency(selectedRecord.totalDiscount)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5}>GST</TableCell>
                    <TableCell colSpan={6} className="text-right text-emerald-700">
                      + {formatCurrency(selectedRecord.totalGst)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5}>Total credit</TableCell>
                    <TableCell colSpan={6} className="text-right text-lg font-bold">
                      {formatCurrency(selectedRecord.total)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>

              <DialogFooter />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TabContentCreditNotes;

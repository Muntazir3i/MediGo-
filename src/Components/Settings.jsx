import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { useShopSettings } from '../context/SettingsContext.jsx';
import {
  backupDownloadUrl,
  createBackup,
  getBackups,
  restoreBackup,
} from '../services/medicineService.js';

const FIELD_CLASS =
  'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

const TEXTAREA_CLASS =
  'flex min-h-[84px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

const Field = ({ label, htmlFor, hint, icon: Icon, children }) => (
  <div>
    <Label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
      {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
      {label}
    </Label>
    {children}
    {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
  </div>
);

const Settings = () => {
  const { settings, loading, error: loadError, refresh, saveSettings } = useShopSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState(null);
  const [backupData, setBackupData] = useState(null);
  const [backupLoading, setBackupLoading] = useState(true);
  const [backupCreating, setBackupCreating] = useState(false);
  const [backupRestoring, setBackupRestoring] = useState(null);
  const [backupMessage, setBackupMessage] = useState(null);

  const loadBackups = useCallback(async () => {
    setBackupLoading(true);

    try {
      const response = await getBackups();
      setBackupData(response);
    } catch (error) {
      setBackupMessage({ type: 'error', text: error.message || 'Could not load backups.' });
    } finally {
      setBackupLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleCreateBackup = async () => {
    if (backupCreating) return;

    setBackupCreating(true);
    setBackupMessage(null);

    try {
      const response = await createBackup();
      setBackupMessage({
        type: 'success',
        text: response?.message || 'Backup created successfully.',
      });
      await loadBackups();
    } catch (error) {
      setBackupMessage({ type: 'error', text: error.message || 'Could not create a backup.' });
    } finally {
      setBackupCreating(false);
    }
  };

  const handleRestoreBackup = async (backup) => {
    if (backupRestoring) return;

    const confirmed = window.confirm(
      `Restore ${backup.name}?\n\n` +
      'A safety backup of the current database will be created first. ' +
      'After preparing the restore, restart the backend to apply it.',
    );

    if (!confirmed) return;

    setBackupRestoring(backup.name);
    setBackupMessage(null);

    try {
      const response = await restoreBackup(backup.name);
      setBackupMessage({
        type: 'success',
        text:
          response?.message
          || 'Restore prepared. Restart the backend to apply it.',
      });
      await loadBackups();
    } catch (error) {
      setBackupMessage({
        type: 'error',
        text: error.message || 'Could not prepare the restore.',
      });
    } finally {
      setBackupRestoring(null);
    }
  };

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(settings),
    [form, settings],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (message?.type === 'success') setMessage(null);
  };

  const handleReset = () => {
    setForm(settings);
    setMessage(null);
  };

  const handleReload = async () => {
    setRefreshing(true);
    setMessage(null);

    try {
      await refresh();
      setMessage({ type: 'success', text: 'Settings reloaded from the server.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not reload settings.' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!String(form.shopName ?? '').trim()) {
      setMessage({ type: 'error', text: 'Shop name is required.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await saveSettings(form);
      setMessage({ type: 'success', text: 'Shop settings saved. New invoices will use these details.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not save shop settings.' });
    } finally {
      setSaving(false);
    }
  };

  const preview = {
    shopName: form.shopName || 'Your pharmacy name',
    drugLicenceNumber: form.drugLicenceNumber || '',
    phone: form.phone || '',
    address: form.address || '',
    gstin: form.gstin || '',
    email: form.email || '',
    pharmacistName: form.pharmacistName || '',
    invoiceFooter: form.invoiceFooter || '',
  };

  return (
    <main className="h-full min-w-0 flex-1 overflow-auto bg-slate-50 p-4 pb-24 md:p-6 lg:pb-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-6 py-6 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                  Shop profile
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  These details appear on sales invoices, invoice PDFs and supplier statements.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white/10 px-4 py-2.5 text-xs ring-1 ring-white/10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                Stored in database
              </p>
              <p className="mt-1 font-medium text-slate-100">
                {settings.updatedAt ? `Last saved ${settings.updatedAt}` : 'Not saved yet'}
              </p>
            </div>
          </div>
        </header>

        {loadError && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Could not load saved settings.</p>
              <p className="mt-0.5 text-xs">{loadError} Showing defaults until the server is reachable.</p>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-300/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Pharmacy details
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Keep the legal details exactly as they appear on your licence.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                Invoice header
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Shop name"
                  htmlFor="shopName"
                  icon={Store}
                  hint="Printed as the main heading on every invoice and PDF."
                >
                  <Input
                    id="shopName"
                    name="shopName"
                    value={form.shopName ?? ''}
                    onChange={handleChange}
                    placeholder="SAABIT PHARMACY"
                    maxLength={120}
                    className={FIELD_CLASS}
                  />
                </Field>
              </div>

              <Field
                label="Drug licence number"
                htmlFor="drugLicenceNumber"
                icon={ShieldCheck}
                hint="Retail and wholesale numbers can be written together."
              >
                <Input
                  id="drugLicenceNumber"
                  name="drugLicenceNumber"
                  value={form.drugLicenceNumber ?? ''}
                  onChange={handleChange}
                  placeholder="13351/52"
                  maxLength={60}
                  className={`${FIELD_CLASS} font-mono`}
                />
              </Field>

              <Field label="Phone number" htmlFor="phone" icon={Phone}>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone ?? ''}
                  onChange={handleChange}
                  placeholder="+91 9797027047"
                  maxLength={40}
                  className={FIELD_CLASS}
                />
              </Field>

              <Field label="GSTIN" htmlFor="gstin" icon={ReceiptText} hint="Optional. Printed when provided.">
                <Input
                  id="gstin"
                  name="gstin"
                  value={form.gstin ?? ''}
                  onChange={handleChange}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={30}
                  className={`${FIELD_CLASS} font-mono uppercase`}
                />
              </Field>

              <Field label="Email address" htmlFor="email" icon={Mail} hint="Optional. Useful for supplier correspondence.">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email ?? ''}
                  onChange={handleChange}
                  placeholder="shop@example.com"
                  maxLength={120}
                  className={FIELD_CLASS}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Address" htmlFor="address" icon={MapPin}>
                  <textarea
                    id="address"
                    name="address"
                    value={form.address ?? ''}
                    onChange={handleChange}
                    placeholder="Kak Sarai, Karan Nagar, Opp HDFC Bank, Srinagar"
                    maxLength={240}
                    rows={2}
                    className={TEXTAREA_CLASS}
                  />
                </Field>
              </div>

              <Field
                label="Pharmacist / signature label"
                htmlFor="pharmacistName"
                icon={UserRound}
                hint="Optional. Replaces “Authorised Signature” on the invoice."
              >
                <Input
                  id="pharmacistName"
                  name="pharmacistName"
                  value={form.pharmacistName ?? ''}
                  onChange={handleChange}
                  placeholder="Registered pharmacist"
                  maxLength={120}
                  className={FIELD_CLASS}
                />
              </Field>

              <Field
                label="Invoice footer note"
                htmlFor="invoiceFooter"
                icon={ReceiptText}
                hint="Optional thank-you or terms line on the invoice."
              >
                <Input
                  id="invoiceFooter"
                  name="invoiceFooter"
                  value={form.invoiceFooter ?? ''}
                  onChange={handleChange}
                  placeholder="Thank you for choosing us. Get well soon!"
                  maxLength={400}
                  className={FIELD_CLASS}
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="text-[11px] text-slate-400">
                {dirty ? 'You have unsaved changes.' : 'All changes are saved.'}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReload}
                  disabled={saving || refreshing}
                  className="gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Reload
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={saving || !dirty}
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Discard
                </Button>

                <Button
                  type="submit"
                  disabled={saving || loading}
                  className="gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving…' : 'Save settings'}
                </Button>
              </div>
            </div>
          </form>

          <aside className="flex flex-col gap-4">
            <section className="overflow-hidden rounded-2xl border border-slate-300/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Invoice preview
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Updates live as you type.
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-5 py-5 text-white">
                <p className="text-lg font-semibold tracking-tight">{preview.shopName}</p>

                {(preview.drugLicenceNumber || preview.phone) && (
                  <p className="mt-1 text-[11px] text-slate-300">
                    {preview.drugLicenceNumber ? `Drug Licence No: ${preview.drugLicenceNumber}` : ''}
                    {preview.drugLicenceNumber && preview.phone ? '  |  ' : ''}
                    {preview.phone ? `Phone: ${preview.phone}` : ''}
                  </p>
                )}

                {preview.address && (
                  <p className="mt-0.5 text-[11px] text-slate-400">{preview.address}</p>
                )}

                {(preview.gstin || preview.email) && (
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {preview.gstin ? `GSTIN: ${preview.gstin}` : ''}
                    {preview.gstin && preview.email ? '  |  ' : ''}
                    {preview.email || ''}
                  </p>
                )}
              </div>

              <div className="space-y-2 px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Invoice</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">INV-100001</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Date</span>
                  <span className="text-slate-700 dark:text-slate-200">
                    {new Date().toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="mt-3 rounded-lg border border-dashed border-slate-200 px-3 py-2 dark:border-slate-700">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Footer
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    {preview.invoiceFooter || 'No footer note set.'}
                  </p>
                  <p className="mt-2 border-t border-slate-100 pt-2 text-right text-[10px] text-slate-400 dark:border-slate-800">
                    {preview.pharmacistName || 'Authorised Signature'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900 shadow-sm dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
              <p className="font-semibold">Where these details are used</p>
              <ul className="mt-2 space-y-1.5 text-blue-800 dark:text-blue-200">
                <li>Sales invoice preview in Billing</li>
                <li>Downloaded invoice PDF header and footer</li>
                <li>Supplier statement PDF header</li>
              </ul>
              <p className="mt-3 text-[11px] text-blue-700/80 dark:text-blue-300/80">
                Changes are saved to the shop database, so they apply to every terminal and survive restarts.
              </p>
            </section>
          </aside>
        </div>

        <section className="rounded-2xl border border-slate-300/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Backup & restore
                </h2>
                <p className="mt-0.5 max-w-2xl text-xs text-slate-500 dark:text-slate-400">
                  Create a consistent database backup at any time. Automatic backups run daily
                  after 21:00 and keep the latest 30 copies.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={loadBackups}
                disabled={backupLoading}
                className="gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`h-4 w-4 ${backupLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                type="button"
                onClick={handleCreateBackup}
                disabled={backupCreating}
                className="gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {backupCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                {backupCreating ? 'Creating backup…' : 'Create backup now'}
              </Button>
            </div>
          </div>

          {backupMessage && (
            <div
              className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                backupMessage.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
              }`}
            >
              {backupMessage.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{backupMessage.text}</span>
            </div>
          )}

          {backupData?.pendingRestore && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Restore pending</p>
                <p className="mt-0.5 text-xs">
                  Backup {backupData.pendingRestore.backupName || 'selected backup'} is ready.
                  Restart the backend to apply it.
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <p>
              {backupData?.lastBackup
                ? `Last backup: ${new Date(backupData.lastBackup.createdAt).toLocaleString('en-IN')}`
                : 'No backups yet.'}
            </p>
            <p>
              Automatic schedule: {backupData?.autoBackup?.schedule || 'Daily after 21:00'}
            </p>
          </div>

          <div className="mt-3 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {backupLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10">
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading backups…
                      </div>
                    </td>
                  </tr>
                ) : (backupData?.backups ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                      No backups yet. Create one now.
                    </td>
                  </tr>
                ) : (
                  backupData.backups.map((backup) => (
                    <tr key={backup.name} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {new Date(backup.createdAt).toLocaleString('en-IN')}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">{backup.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            backup.type === 'auto'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                              : backup.type === 'pre-restore'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {backup.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {backup.sizeLabel}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={backupDownloadUrl(backup.name)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreBackup(backup)}
                            disabled={backupRestoring === backup.name}
                            className="h-8 gap-1.5 border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {backupRestoring === backup.name ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                            Restore
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Restore is applied on the next backend start. The current database is backed up
            automatically before a restore is prepared.
          </p>
        </section>
      </div>
    </main>
  );
};

export default Settings;

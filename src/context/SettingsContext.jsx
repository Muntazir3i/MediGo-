import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getShopSettings, updateShopSettings } from '../services/medicineService.js';

/**
 * Shop details shown on invoices and PDFs.
 *
 * The defaults mirror the values the app shipped with before settings existed,
 * so the UI never flashes an empty header while the API request is in flight.
 */
export const DEFAULT_SHOP_SETTINGS = {
  id: 1,
  shopName: 'SAABIT PHARMACY',
  drugLicenceNumber: '13351/52',
  phone: '+91 9797027047',
  address: 'Kak Sarai, Karan Nagar, Opp HDFC Bank, Srinagar',
  gstin: '',
  email: '',
  pharmacistName: '',
  invoiceFooter: 'Thank you for choosing Saabit Pharmacy. Get well soon!',
};

const SettingsContext = createContext({
  settings: DEFAULT_SHOP_SETTINGS,
  loading: true,
  error: '',
  refresh: async () => {},
  saveSettings: async () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SHOP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getShopSettings();
      if (response) {
        setSettings({ ...DEFAULT_SHOP_SETTINGS, ...response });
      }
      return response;
    } catch (requestError) {
      // Keep the last known values; the banner on the settings page explains
      // that the server could not be reached.
      setError(requestError.message || 'Could not load shop settings.');
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (nextSettings) => {
    const saved = await updateShopSettings(nextSettings);
    setSettings({ ...DEFAULT_SHOP_SETTINGS, ...saved });
    setError('');
    return saved;
  }, []);

  useEffect(() => {
    // A failed initial load should not crash the app; the defaults are already
    // usable and the settings page offers a retry.
    refresh().catch(() => {});
  }, [refresh]);

  const value = useMemo(
    () => ({ settings, loading, error, refresh, saveSettings, setSettings }),
    [settings, loading, error, refresh, saveSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useShopSettings() {
  return useContext(SettingsContext);
}

export default SettingsContext;

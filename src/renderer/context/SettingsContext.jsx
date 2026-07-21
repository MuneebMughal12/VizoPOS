import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const res = await window.vizo.settings.getAll();
    if (res.ok) {
      setSettings(res.settings);
      setLogoDataUrl(res.logoDataUrl);
      setLoaded(true);
    }
    return res;
  }, []);

  useEffect(() => {
    if (user) refresh();
    else {
      setSettings({});
      setLogoDataUrl(null);
      setLoaded(false);
    }
  }, [user, refresh]);

  const save = useCallback(async (entries) => {
    const res = await window.vizo.settings.save(entries);
    if (res.ok) setSettings(res.settings);
    return res;
  }, []);

  const chooseLogo = useCallback(async () => {
    const res = await window.vizo.settings.chooseLogo();
    if (res.ok && !res.canceled && res.logoDataUrl) setLogoDataUrl(res.logoDataUrl);
    return res;
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, logoDataUrl, loaded, refresh, save, chooseLogo }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

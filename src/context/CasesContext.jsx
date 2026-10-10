import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getCases, POLL_MS } from '../services/api';
import { useAuth } from './AuthContext';

const CasesContext = createContext(null);
export const useCases = () => useContext(CasesContext);

const ALERT_THRESHOLD = 85; // 'Critical' band

export function CasesProvider({ children }) {
  const { user } = useAuth();
  const enabled = !!user && user.role !== 'reporter'; // reporters only submit emails; they don't read the case list
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const seen = useRef(null); // ids known at first load; anything new + high risk raises an alert

  const refresh = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    try {
      const data = await getCases();
      setCases(data);
      setError(null);
      setLastSync(Date.now());
      if (seen.current === null) {
        seen.current = new Set(data.map((c) => c.case_id));
      } else {
        const fresh = data.filter((c) => !seen.current.has(c.case_id));
        fresh.forEach((c) => seen.current.add(c.case_id));
        const hot = fresh.filter((c) => c.overall_risk_score >= ALERT_THRESHOLD);
        if (hot.length) setAlerts((a) => [...hot, ...a].slice(0, 5));
      }
    } catch (e) {
      setError(e.message || 'Could not reach the API');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
    const id = setInterval(() => !document.hidden && refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const markSeen = useCallback((id) => seen.current?.add(id), []);
  const dismissAlert = useCallback((caseId) => setAlerts((a) => a.filter((c) => c.case_id !== caseId)), []);
  const clearAlerts = useCallback(() => setAlerts([]), []);

  const value = useMemo(
    () => ({ cases, loading, error, alerts, markSeen, dismissAlert, clearAlerts, refresh, lastSync }),
    [cases, loading, error, alerts, markSeen, dismissAlert, clearAlerts, refresh, lastSync],
  );
  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

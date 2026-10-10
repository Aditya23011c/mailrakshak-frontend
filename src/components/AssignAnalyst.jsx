import { useEffect, useState } from 'react';
import { Loader2, UserCheck } from 'lucide-react';
import { assignAnalyst, fetchAnalysts } from '../services/api';

const label = (a) => a.name || a.email;

// Admin-only. Lists real analysts from GET /auth/analysts and saves with POST /cases/:id/assign.
export default function AssignAnalyst({ caseData, onChange }) {
  const [analysts, setAnalysts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = () => fetchAnalysts().then(setAnalysts).catch((e) => { setAnalysts([]); setError(e.message); });
  useEffect(() => { load(); }, []);

  const current = caseData.assigned_to ? String(caseData.assigned_to) : '';
  const known = analysts?.some((a) => a.id === current);

  const pick = async (e) => {
    const analystId = e.target.value || null;
    setBusy(true);
    setError(null);
    try {
      onChange(await assignAnalyst(caseData.case_id, analystId));
    } catch (err) {
      setError(err.payload?.error === 'INVALID_ANALYST' ? 'That analyst is no longer available. The list was refreshed; please choose again.' : err.message);
      if (err.payload?.error === 'INVALID_ANALYST') load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      <UserCheck className="h-3.5 w-3.5 text-slate-400" />
      <span className="text-slate-400">Assigned analyst</span>
      <select value={current} onChange={pick} disabled={busy || analysts === null} className="input py-1 text-xs disabled:opacity-60">
        <option value="">Unassigned</option>
        {current && analysts && !known && <option value={current}>Unknown analyst</option>}
        {(analysts || []).map((a) => <option key={a.id} value={a.id}>{label(a)}</option>)}
      </select>
      {(busy || analysts === null) && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
      {error && <span role="alert" className="text-risk-critical">{error}</span>}
    </div>
  );
}

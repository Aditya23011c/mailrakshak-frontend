import { Link } from 'react-router-dom';
import { ShieldAlert, X } from 'lucide-react';
import { useCases } from '../context/CasesContext';
import { fraudScore } from '../lib/risk';

export default function AlertBanner() {
  const { alerts, dismissAlert, clearAlerts } = useCases();
  if (!alerts.length) return null;
  const top = alerts[0];

  return (
    <div role="alert" aria-live="assertive" className="fixed inset-x-0 top-[4.25rem] z-50 flex justify-center px-3">
      <div
        key={top.case_id}
        className="relative w-full max-w-3xl animate-slideDown overflow-hidden rounded-xl border border-risk-critical/50 bg-ink-900/90 shadow-[0_0_40px_rgba(255,59,92,.35)] backdrop-blur-md"
      >
        <span className="absolute inset-y-0 left-0 w-1 animate-blink bg-risk-critical" />
        <div className="flex items-center gap-3 py-3 pl-5 pr-3">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-risk-critical/20 text-risk-critical">
            <span className="absolute inset-0 rounded-full bg-risk-critical/40 animate-ping2" />
            <ShieldAlert className="relative h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-risk-critical">
              New high-risk email{alerts.length > 1 ? ` (${alerts.length} unread alerts)` : ''}
            </p>
            <p className="truncate text-sm text-slate-200">{top.email?.subject}</p>
            <p className="truncate text-xs text-slate-400">
              {top.email?.sender} · risk {Math.round(top.overall_risk_score)} · fraud score {fraudScore(top)}
            </p>
          </div>
          <Link to={`/cases/${top.case_id}`} onClick={() => dismissAlert(top.case_id)} className="btn border-risk-critical/40 bg-risk-critical/15 text-risk-critical hover:bg-risk-critical/25">
            Investigate
          </Link>
          <button aria-label="Dismiss alert" onClick={() => (alerts.length > 1 ? clearAlerts() : dismissAlert(top.case_id))} className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

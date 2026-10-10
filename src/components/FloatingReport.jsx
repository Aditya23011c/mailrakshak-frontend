import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, X } from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import { useAuth } from '../context/AuthContext';
import { useReportTracker } from '../context/ReportTrackerContext';
import { riskLevel } from '../lib/risk';
import { titleCase } from '../lib/format';

const STAGES = ['Received', 'Detected', 'Verified', 'Traced', 'Scored'];
const GLOW = { critical: 'glow-critical', high: 'glow-high', medium: 'glow-high', low: 'glow-low' };
const TONE = { bad: 'bg-risk-critical/10 text-risk-critical', warn: 'bg-risk-medium/10 text-risk-medium', ok: 'bg-risk-low/10 text-risk-low' };
const ADVICE = {
  critical: 'Do not click any links, open attachments or reply. Delete this email.',
  high: 'Do not click any links, open attachments or reply. Delete this email.',
  medium: 'Be careful. Do not enter passwords or payment details unless you can confirm the sender another way.',
  low: 'We found nothing alarming. If something still feels wrong, trust your instinct and check with the sender.',
};
const authTone = (v) => { const s = String(v || '').toLowerCase(); return s === 'pass' ? 'ok' : s === 'fail' || s === 'softfail' ? 'bad' : 'warn'; };
const authText = (v) => (!v ? 'No result' : String(v).toLowerCase() === 'none' ? 'Not present' : titleCase(v));

function useCountUp(target, active) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) { setV(0); return undefined; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return undefined; }
    let raf;
    const t0 = performance.now();
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / 900);
      setV(Math.round(target * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);
  return v;
}

// Floating card that follows the person's latest report. Same look as the landing page's live example.
export default function FloatingReport() {
  const { user } = useAuth();
  const { job, dismiss } = useReportTracker();
  const [now, setNow] = useState(Date.now());
  const analyzing = job?.status === 'analyzing';
  const done = job?.status === 'done';
  const failed = job?.status === 'error';

  useEffect(() => {
    if (!analyzing) return undefined;
    const t = setInterval(() => setNow(Date.now()), 120);
    return () => clearInterval(t);
  }, [analyzing]);

  const score = useCountUp(job?.score ?? 0, done);
  if (!user || !job) return null;

  const lvl = riskLevel(job.score ?? 0);
  const elapsed = ((job.finishedAt ?? now) - job.startedAt) / 1000;
  const tick = Math.floor((now - job.startedAt) / 350) % STAGES.length;
  const pending = <span className="animate-blink font-mono text-slate-600">...</span>;
  const rows = done && job.checks
    ? [['SPF', authText(job.checks.spf), authTone(job.checks.spf)], ['DKIM', authText(job.checks.dkim), authTone(job.checks.dkim)], ['DMARC', authText(job.checks.dmarc), authTone(job.checks.dmarc)], ['Origin', job.checks.origin, null]]
    : ['SPF', 'DKIM', 'DMARC', 'Origin'].map((k) => [k, done ? 'Checked' : null, null]);

  return (
    <div className="report-card fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:w-96" role="status" aria-live="polite">
      <div className={`panel p-5 transition-all duration-500 ${done ? `glow-card ${GLOW[lvl.key]}` : ''}`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          {failed ? (
            <span className="chip border-risk-critical/40 bg-risk-critical/10 text-risk-critical">Could not analyse</span>
          ) : done ? (
            <span className={`chip ${lvl.bg} ${lvl.border} ${lvl.text}`}>{job.label || lvl.full}</span>
          ) : (
            <span className="chip border-accent/30 bg-accent/10 text-accent-soft"><span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" />Analysing</span>
          )}
          <span className="flex items-center gap-2 text-[11px] text-slate-500">
            Your report
            <button onClick={dismiss} aria-label="Dismiss report card" className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" /></button>
          </span>
        </div>

        <p className="truncate font-semibold text-slate-100" title={job.subject}>{job.subject}</p>
        <p className="truncate font-mono text-xs text-slate-500">{job.sender}</p>

        {failed ? (
          <p role="alert" className="mt-4 rounded-lg border border-risk-critical/40 bg-risk-critical/10 px-3 py-2 text-sm text-risk-critical">{job.error}</p>
        ) : (
          <div className="mt-4 flex items-center gap-5">
            <ScoreGauge value={score} label="Overall risk" size={104} />
            <ul className="flex-1 space-y-1.5 text-sm">
              {rows.map(([k, v, tone]) => (
                <li key={k} className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1 transition-colors duration-500 ${v && tone ? TONE[tone] : 'bg-white/5'}`}>
                  <span className="text-slate-300">{k}</span>
                  {v ? <span className={`truncate font-medium ${tone ? '' : 'text-slate-100'}`}>{v}</span> : pending}
                </li>
              ))}
            </ul>
          </div>
        )}

        {done && (
          <div className="mt-3 space-y-2.5">
            <p className="text-xs leading-relaxed text-slate-300">{job.message || ADVICE[lvl.key]}</p>
            {user.role !== 'reporter' && job.caseId ? (
              <Link to={`/cases/${job.caseId}`} className="btn w-full justify-center border-accent/40 bg-accent/15 text-accent-soft hover:bg-accent/25">Open case</Link>
            ) : job.caseId ? (
              <p className="truncate font-mono text-[11px] text-slate-500" title={job.caseId}>Reference {job.caseId}</p>
            ) : null}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-slate-400">
          {done ? <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> : <Clock className="h-3.5 w-3.5 text-accent" />}
          {STAGES.map((s, n) => (
            <span key={s} title={s} className={`h-1.5 w-1.5 rounded-full transition-colors ${done ? 'bg-accent shadow-[0_0_6px_#22ff9c]' : failed ? 'bg-white/15' : n === tick ? 'bg-accent shadow-[0_0_6px_#22ff9c]' : 'bg-white/15'}`} />
          ))}
          <span className="ml-1">{failed ? 'Stopped' : done ? 'Scored' : 'Analysing...'}</span>
          <span className="ml-auto font-mono text-accent-soft">{elapsed.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}

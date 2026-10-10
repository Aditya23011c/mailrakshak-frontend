import { fmtElapsed, fmtTime } from '../lib/format';

/**
 * Pipeline timeline: received_at -> detection -> forensics -> enrichment -> correlated_at.
 * The three microservices run in parallel, so each delta is "time since the previous stamp".
 */
export default function Timeline({ caseData }) {
  const stages = [
    { key: 'received', name: 'Received', done: 'Ingested', at: caseData.received_at },
    { key: 'detection', name: 'Detection', done: 'Detected', at: caseData.detection?.processed_at },
    { key: 'forensics', name: 'Forensics', done: 'Headers checked', at: caseData.forensics?.processed_at },
    { key: 'enrichment', name: 'Enrichment', done: 'Origin traced', at: caseData.enrichment?.processed_at },
    { key: 'correlated', name: 'Correlated', done: 'Case scored', at: caseData.correlated_at },
  ];
  const ms = stages.map((s) => (s.at ? new Date(s.at).getTime() : null));
  const total = ms[4] != null && ms[0] != null ? ms[4] - ms[0] : null;

  // slowest step (excluding the first stage) gets highlighted
  const deltas = ms.map((t, i) => (i === 0 || t == null || ms[i - 1] == null ? null : t - ms[i - 1]));
  const max = Math.max(...deltas.filter((d) => d != null), 0);

  return (
    <div>
      <ol className="grid grid-cols-1 gap-y-6 md:grid-cols-5">
        {stages.map((s, i) => {
          const d = deltas[i];
          const slow = d != null && d === max && max > 0;
          return (
            <li key={s.key} className="relative flex items-start gap-4 md:block md:text-center">
              {i > 0 && (
                <div className="absolute right-1/2 top-4 hidden h-0.5 w-full bg-white/10 md:block">
                  <div
                    className="h-full origin-left animate-grow bg-gradient-to-r from-accent/80 to-accent"
                    style={{ animationDelay: `${i * 260}ms`, boxShadow: '0 0 8px rgba(34,255,156,.7)' }}
                  />
                </div>
              )}
              <div className="relative z-10 md:mx-auto md:w-8">
                <span
                  className="relative flex h-8 w-8 animate-pop items-center justify-center rounded-full border-2 border-accent bg-ink-900 font-mono text-xs text-accent-soft"
                  style={{ animationDelay: `${i * 260}ms` }}
                >
                  {i === stages.length - 1 && <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping2" />}
                  {i + 1}
                </span>
              </div>
              <div className="md:mt-3">
                <p className="text-sm font-semibold text-slate-100">{s.name}</p>
                <p className="font-mono text-xs text-slate-400">{fmtTime(s.at)}</p>
                {d != null && (
                  <p className={`mt-1 text-xs font-medium ${slow ? 'text-risk-high' : 'text-accent-soft'}`}>
                    {d < 0 ? 'ran in parallel' : `${s.done.toLowerCase()} in ${fmtElapsed(d)}`}
                  </p>
                )}
                {i === 0 && <p className="mt-1 text-xs text-slate-500">Via {caseData.source}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 border-t border-white/5 pt-3 text-sm text-slate-300">
        Total pipeline time <span className="font-mono font-semibold text-accent-soft">{fmtElapsed(total)}</span>
        <span className="text-slate-500"> from receipt to correlated verdict. Each stage time is measured from the previous timestamp.</span>
      </p>
    </div>
  );
}

import { CheckCircle2, XCircle, MinusCircle, AlertCircle } from 'lucide-react';

const STATE = {
  pass: { Icon: CheckCircle2, text: 'text-risk-low', bg: 'bg-risk-low/10', border: 'border-risk-low/30', label: 'Pass' },
  fail: { Icon: XCircle, text: 'text-risk-critical', bg: 'bg-risk-critical/10', border: 'border-risk-critical/30', label: 'Fail' },
  softfail: { Icon: AlertCircle, text: 'text-risk-high', bg: 'bg-risk-high/10', border: 'border-risk-high/30', label: 'Soft fail' },
  neutral: { Icon: AlertCircle, text: 'text-risk-medium', bg: 'bg-risk-medium/10', border: 'border-risk-medium/30', label: 'Neutral' },
  none: { Icon: MinusCircle, text: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10', label: 'Not present' },
};
const stateFor = (v) => STATE[String(v || 'none').toLowerCase()] ?? STATE.none;

const HELP = {
  SPF: 'Is the sending server allowed by the domain?',
  DKIM: 'Is the message signature valid?',
  DMARC: 'Does the domain policy align with SPF/DKIM?',
};

export default function AuthChecks({ forensics }) {
  const items = [
    ['SPF', forensics?.spf_result],
    ['DKIM', forensics?.dkim_result],
    ['DMARC', forensics?.dmarc_result],
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map(([name, val], i) => {
        const s = stateFor(val);
        return (
          <div
            key={name}
            className={`animate-pop rounded-lg border ${s.border} ${s.bg} p-3`}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-100">{name}</span>
              <s.Icon className={`h-5 w-5 ${s.text}`} />
            </div>
            <p className={`mt-1 text-sm font-medium ${s.text}`}>{s.label}</p>
            <p className="mt-1 text-xs text-slate-400">{HELP[name]}</p>
          </div>
        );
      })}
    </div>
  );
}

import { AlertTriangle, Flag, Network } from 'lucide-react';
import InfoTip from './InfoTip';

const TONES = {
  content: 'border-accent/30 bg-accent/10 text-accent-soft',
  header: 'border-risk-high/30 bg-risk-high/10 text-risk-high',
  dns: 'border-risk-medium/30 bg-risk-medium/10 text-risk-medium',
};

function Group({ title, Icon, items, tone, empty, tip }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
        <Icon className="h-4 w-4 text-slate-400" /> {title} {tip && <InfoTip term={tip} />}
      </p>
      {items?.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((t, i) => (
            <span key={t} className={`chip animate-pop ${TONES[tone]}`} style={{ animationDelay: `${i * 60}ms` }}>{t}</span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">{empty}</p>
      )}
    </div>
  );
}

export default function IndicatorChips({ detection, forensics, enrichment }) {
  return (
    <div className="space-y-5">
      <Group title="Flagged content" Icon={Flag} items={detection?.matched_indicators} tone="content" empty="No suspicious content patterns matched." />
      <Group title="Header anomalies" Icon={AlertTriangle} items={forensics?.anomaly_flags} tone="header" empty="No header anomalies found." />
      <Group title="DNS mismatches" tip="dns" Icon={Network} items={enrichment?.dns_mismatch_flags} tone="dns" empty="Claimed and actual mail infrastructure agree." />
    </div>
  );
}

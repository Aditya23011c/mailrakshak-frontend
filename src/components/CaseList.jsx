import { useNavigate } from 'react-router-dom';
import { Inbox, Globe, Puzzle, Upload, Mail } from 'lucide-react';
import RiskBadge from './RiskBadge';
import { fraudScore, riskLevel } from '../lib/risk';
import { fmtDateTime, timeAgo, titleCase } from '../lib/format';

const SRC = { upload: Upload, imap: Mail, extension: Puzzle };

export default function CaseList({ cases, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
    );
  }
  if (!cases.length) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <Inbox className="h-8 w-8 text-slate-500" />
        <p className="text-slate-200">No cases match these filters.</p>
        <p className="text-sm text-slate-500">Widen the date range or clear the domain search.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-white/10 text-xs text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Risk</th>
            <th className="px-4 py-3 font-medium">Subject and sender</th>
            <th className="px-4 py-3 font-medium">Domain</th>
            <th className="px-4 py-3 font-medium">Fraud score</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Received</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c, i) => {
            const fs = fraudScore(c);
            const r = riskLevel(c.overall_risk_score);
            const Src = SRC[c.source] ?? Mail;
            return (
              <tr
                key={c.case_id}
                tabIndex={0}
                onClick={() => navigate(`/cases/${c.case_id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/cases/${c.case_id}`)}
                className="group animate-rowIn cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.06]"
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              >
                <td className="px-4 py-3"><RiskBadge score={c.overall_risk_score} /></td>
                <td className="max-w-[360px] px-4 py-3">
                  <p className="truncate font-medium text-slate-100">{c.email?.subject}</p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-slate-400">
                    <Src className="h-3 w-3 shrink-0" /> {c.email?.sender}
                    {c.campaign_id && <span className="ml-1 rounded bg-white/5 px-1.5 font-mono text-[11px] text-slate-300">{c.campaign_id}</span>}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                    <Globe className="h-3 w-3 text-slate-500" /> {c.email?.domain}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${r.solid}`} style={{ width: `${fs}%`, transition: 'width 1s ease' }} />
                    </div>
                    <span className="font-mono text-xs text-slate-200">{fs}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">{titleCase(c.detection?.classification)}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-300">{titleCase(c.status)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-xs text-slate-200">{timeAgo(c.received_at)}</p>
                  <p className="text-[11px] text-slate-500">{fmtDateTime(c.received_at)}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

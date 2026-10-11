import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Fingerprint, Layers } from 'lucide-react';
import InfoTip from '../components/InfoTip';
import PageIntro from '../components/PageIntro';
import RiskBadge from '../components/RiskBadge';
import { useCases } from '../context/CasesContext';
import { RISK, riskLevel } from '../lib/risk';
import { fmtDateTime, timeAgo } from '../lib/format';

const unique = (arr) => [...new Set(arr.filter(Boolean))];

function sharedTraits(list) {
  const traits = [];
  const same = (vals) => unique(vals).length === 1;
  const g = list.map((c) => c.enrichment?.geolocation ?? {});
  const subnet = g.map((x) => (x.ip ? x.ip.split('.').slice(0, 3).join('.') + '.0/24' : null));
  if (same(subnet)) traits.push(['IP range', subnet[0]]);
  if (same(g.map((x) => x.isp))) traits.push(['Network', g[0].isp]);
  if (same(g.map((x) => x.country))) traits.push(['Country', g[0].country]);
  if (same(list.map((c) => c.enrichment?.infrastructure_type))) traits.push(['Infrastructure', list[0].enrichment.infrastructure_type]);
  const doms = unique(list.map((c) => c.email?.domain));
  if (doms.length === 1) traits.push(['Domain', doms[0]]);
  const tlds = unique(list.map((c) => (c.email?.domain || '').split('.').pop()));
  if (doms.length > 1 && tlds.length === 1) traits.push(['Domain pattern', `.${tlds[0]} lookalikes`]);
  return traits;
}

function CampaignCard({ id, list, index }) {
  const [open, setOpen] = useState(index === 0);
  const max = Math.max(...list.map((c) => c.overall_risk_score));
  const times = list.map((c) => new Date(c.received_at).getTime());
  const traits = useMemo(() => sharedTraits(list), [list]);
  const r = riskLevel(max);

  return (
    <article className="panel animate-rowIn overflow-hidden" style={{ animationDelay: `${index * 80}ms` }}>
      <span className={`absolute inset-y-0 left-0 w-1 ${r.solid}`} />
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-4 p-5 pl-6 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-lg font-semibold text-slate-50">{id}</h2>
            <RiskBadge score={max} />
            <span className="text-sm text-slate-400">{list.length} emails</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            First seen {fmtDateTime(new Date(Math.min(...times)).toISOString())} · latest {timeAgo(new Date(Math.max(...times)).toISOString())}
          </p>
          <div className="mt-3 flex gap-1" aria-label="Risk of each case">
            {list.map((c) => (
              <span key={c.case_id} title={`${c.case_id}: ${Math.round(c.overall_risk_score)}`} className="h-2 flex-1 max-w-10 rounded-full" style={{ background: RISK[riskLevel(c.overall_risk_score).key].hex }} />
            ))}
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="grid gap-5 border-t border-white/10 p-5 pl-6 md:grid-cols-5">
          <div className="md:col-span-2">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200"><Fingerprint className="h-4 w-4 text-slate-400" /> What these emails share <InfoTip term="campaign" /></p>
            {traits.length ? (
              <dl className="space-y-1.5">
                {traits.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 rounded-md bg-white/[0.04] px-3 py-1.5 text-sm">
                    <dt className="text-slate-400">{k}</dt>
                    <dd className="truncate font-mono text-slate-100">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-slate-400">Linked through partial attribute matches only.</p>
            )}
          </div>
          <ul className="space-y-2 md:col-span-3">
            {list.map((c) => (
              <li key={c.case_id}>
                <Link to={`/cases/${c.case_id}`} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-slate-100">{c.email?.subject}</span>
                    <span className="block truncate font-mono text-xs text-slate-500">{c.email?.domain} · {c.enrichment?.geolocation?.ip} · {timeAgo(c.received_at)}</span>
                  </span>
                  <RiskBadge score={c.overall_risk_score} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default function Campaigns() {
  const { cases, loading } = useCases();
  const groups = useMemo(() => {
    const m = new Map();
    cases.filter((c) => c.campaign_id).forEach((c) => m.set(c.campaign_id, [...(m.get(c.campaign_id) ?? []), c]));
    return [...m.entries()].sort((a, b) => Math.max(...b[1].map((c) => c.overall_risk_score)) - Math.max(...a[1].map((c) => c.overall_risk_score)));
  }, [cases]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">Campaigns</h1>
        <p className="text-sm text-slate-400">Flagged emails grouped by shared sending infrastructure, so one attacker shows up as one item.</p>
      </div>
      <PageIntro id="campaigns" title="What is a campaign?">
        <p>When several emails share the same IP range, network, country or domain pattern, they probably come from one attacker. MailRakshak groups them so you see one campaign instead of many separate alerts.</p>
        <p>Click a campaign to see what its emails share, then open any case inside it.</p>
      </PageIntro>
      {loading ? (
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="panel h-32 animate-pulse" />)}</div>
      ) : groups.length ? (
        <div className="space-y-4">{groups.map(([id, list], i) => <CampaignCard key={id} id={id} list={list} index={i} />)}</div>
      ) : (
        <div className="panel flex flex-col items-center gap-2 px-6 py-14 text-center">
          <Layers className="h-8 w-8 text-slate-500" />
          <p className="text-slate-200">No campaigns detected yet.</p>
          <p className="text-sm text-slate-500">Related emails appear here once two or more cases share an IP, domain pattern or network.</p>
        </div>
      )}
    </div>
  );
}

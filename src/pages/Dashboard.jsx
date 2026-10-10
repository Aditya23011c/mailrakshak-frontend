import { useEffect, useMemo, useState } from 'react';
import { Activity, Layers, ShieldAlert, Timer, Search, X } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import CaseList from '../components/CaseList';
import { useCases } from '../context/CasesContext';
import { RISK, RISK_ORDER, riskLevel } from '../lib/risk';
import { fmtElapsed } from '../lib/format';

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms);
      setV(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Stat({ Icon, label, value, display, tone = 'text-accent', hint }) {
  const n = useCountUp(value ?? 0);
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <p className={`mt-2 font-mono text-3xl font-semibold ${tone}`}>{display ?? Math.round(n)}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const ChartTip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-1 text-slate-400">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-slate-100">{p.name}: <span className="font-mono">{p.value}</span></p>
      ))}
    </div>
  ) : null;

export default function Dashboard() {
  const { cases, loading } = useCases();
  const [risk, setRisk] = useState(new Set());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [domain, setDomain] = useState('');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const f = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
    const t = to ? new Date(`${to}T23:59:59`).getTime() : Infinity;
    const d = domain.trim().toLowerCase();
    const s = q.trim().toLowerCase();
    return cases.filter((c) => {
      const when = new Date(c.received_at).getTime();
      if (risk.size && !risk.has(riskLevel(c.overall_risk_score).key)) return false;
      if (when < f || when > t) return false;
      if (d && !(c.email?.domain || '').toLowerCase().includes(d)) return false;
      if (s && !`${c.email?.subject} ${c.email?.sender} ${c.case_id}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [cases, risk, from, to, domain, q]);

  const stats = useMemo(() => {
    const flagged = cases.filter((c) => c.overall_risk_score >= 60).length;
    const campaigns = new Set(cases.map((c) => c.campaign_id).filter(Boolean)).size;
    const times = cases.map((c) => new Date(c.correlated_at) - new Date(c.received_at)).filter((x) => x >= 0);
    const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
    return { total: cases.length, flagged, campaigns, avg };
  }, [cases]);

  const dist = useMemo(
    () => RISK_ORDER.map((k) => ({ name: RISK[k].label, key: k, value: cases.filter((c) => riskLevel(c.overall_risk_score).key === k).length })),
    [cases],
  );

  const volume = useMemo(() => {
    const now = Date.now();
    const H = 4 * 3600000;
    return Array.from({ length: 6 }, (_, i) => {
      const end = now - (5 - i) * H;
      const start = end - H;
      const inB = cases.filter((c) => {
        const t = new Date(c.received_at).getTime();
        return t > start && t <= end;
      });
      return {
        label: `${String(new Date(end).getHours()).padStart(2, '0')}:00`,
        'High risk': inB.filter((c) => c.overall_risk_score >= 60).length,
        'Lower risk': inB.filter((c) => c.overall_risk_score < 60).length,
      };
    });
  }, [cases]);

  const toggle = (k) => setRisk((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const dirty = risk.size || from || to || domain || q;
  const clear = () => { setRisk(new Set()); setFrom(''); setTo(''); setDomain(''); setQ(''); };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat Icon={Activity} label="Cases analysed" value={stats.total} hint="All ingestion channels" />
        <Stat Icon={ShieldAlert} label="High and critical" value={stats.flagged} tone="text-risk-critical" hint="Risk score 60 and above" />
        <Stat Icon={Layers} label="Active campaigns" value={stats.campaigns} tone="text-risk-high" hint="Cases sharing infrastructure" />
        <Stat Icon={Timer} label="Average pipeline time" display={fmtElapsed(stats.avg)} value={0} tone="text-risk-low" hint="Receipt to correlated verdict" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="panel p-4 lg:col-span-3">
          <p className="panel-title">Emails received, last 24 hours</p>
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff3b5c" stopOpacity={0.5} /><stop offset="100%" stopColor="#ff3b5c" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22ff9c" stopOpacity={0.4} /><stop offset="100%" stopColor="#22ff9c" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="Lower risk" stroke="#22ff9c" strokeWidth={2} fill="url(#gLow)" />
                <Area type="monotone" dataKey="High risk" stroke="#ff3b5c" strokeWidth={2} fill="url(#gHigh)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-4 lg:col-span-2">
          <p className="panel-title">Cases by risk level</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dist} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none" animationDuration={900}>
                    {dist.map((d) => <Cell key={d.key} fill={RISK[d.key].hex} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2 text-sm">
              {dist.map((d) => (
                <li key={d.key} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300"><span className={`h-2.5 w-2.5 rounded-sm ${RISK[d.key].solid}`} />{d.name}</span>
                  <span className="font-mono text-slate-100">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
          <p className="panel-title mr-2">Cases <span className="ml-1 font-mono text-slate-500">{filtered.length}</span></p>
          <div className="flex gap-1.5" role="group" aria-label="Filter by risk level">
            {RISK_ORDER.map((k) => {
              const on = risk.has(k);
              return (
                <button
                  key={k}
                  onClick={() => toggle(k)}
                  aria-pressed={on}
                  className={`chip transition-colors ${on ? `${RISK[k].bg} ${RISK[k].border} ${RISK[k].text}` : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${RISK[k].solid}`} /> {RISK[k].label}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-slate-500" />
              <input className="input w-44 pl-8" placeholder="Search subject or sender" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search cases" />
            </label>
            <input className="input w-40" placeholder="Domain contains…" value={domain} onChange={(e) => setDomain(e.target.value)} aria-label="Filter by domain" />
            <input type="date" className="input" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <input type="date" className="input" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
            {dirty ? (
              <button onClick={clear} className="btn"><X className="h-4 w-4" /> Clear</button>
            ) : null}
          </div>
        </div>
        <CaseList cases={filtered} loading={loading} />
      </section>
    </div>
  );
}

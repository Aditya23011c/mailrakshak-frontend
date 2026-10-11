import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CalendarClock, CheckCircle2, Layers, MapPin, Server, XCircle } from 'lucide-react';
import AuthChecks from '../components/AuthChecks';
import IndicatorChips from '../components/IndicatorChips';
import RiskBadge from '../components/RiskBadge';
import ScoreGauge from '../components/ScoreGauge';
import Timeline from '../components/Timeline';
import TraceMap from '../components/TraceMap';
import AssignAnalyst from '../components/AssignAnalyst';
import InfoTip from '../components/InfoTip';
import PageIntro from '../components/PageIntro';
import { explainCase } from '../lib/explain';
import { useAuth } from '../context/AuthContext';
import { useCases } from '../context/CasesContext';
import { getCase } from '../services/api';
import { fraudScore } from '../lib/risk';
import { fmtDateTime, titleCase } from '../lib/format';

const TONE = { bad: [XCircle, 'text-risk-critical'], warn: [AlertTriangle, 'text-risk-medium'], ok: [CheckCircle2, 'text-risk-low'], info: [MapPin, 'text-accent-soft'] };
const HEAD = { critical: 'text-risk-critical', high: 'text-risk-high', medium: 'text-risk-medium', low: 'text-risk-low' };

const Section = ({ title, hint, tip, children, className = '' }) => (
  <section className={`panel p-5 ${className}`}>
    <div className="mb-4">
      <h2 className="panel-title flex items-center gap-1.5">{title} {tip && <InfoTip term={tip} />}</h2>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
    {children}
  </section>
);

export default function CaseDetail() {
  const { id } = useParams();
  const { cases } = useCases();
  const { user } = useAuth();
  const [c, setC] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    setC(null);
    setErr(null);
    getCase(id).then((d) => alive && setC(d)).catch((e) => alive && setErr(e.message));
    return () => { alive = false; };
  }, [id]);

  if (err)
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <p className="text-lg font-semibold text-slate-100">We couldn't open this case</p>
        <p className="mt-1 text-sm text-slate-400">{err}. It may have been removed, or the API is unreachable.</p>
        <Link to="/dashboard" className="btn mt-4"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      </div>
    );
  if (!c) return <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="panel h-40 animate-pulse" />)}</div>;

  const related = c.campaign_id ? cases.filter((x) => x.campaign_id === c.campaign_id && x.case_id !== c.case_id) : [];
  const age = c.enrichment?.domain_age_days;
  const ex = explainCase(c, { related: related.length });

  return (
    <div className="space-y-5">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100"><ArrowLeft className="h-4 w-4" /> All cases</Link>

      <PageIntro id="case" title="How to read this case">
        <p>Start with <b className="text-slate-200">In plain words</b> for the short version. The score breakdown and sender checks show why the score is what it is, and the trace path shows where the email really came from.</p>
        <p>Hover or tap any small <span className="text-accent">(i)</span> icon for a plain-language explanation of a term.</p>
      </PageIntro>

      <header className="panel p-5">
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge score={c.overall_risk_score} showScore />
          <span className="chip border-white/10 bg-white/5 text-slate-300">{titleCase(c.detection?.classification)}</span>
          <span className="chip border-white/10 bg-white/5 text-slate-300">{titleCase(c.status)}</span>
          <span className="ml-auto font-mono text-xs text-slate-500">{c.case_id}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-50">{c.email?.subject}</h1>
        <p className="mt-1 text-sm text-slate-400">
          From <span className="font-mono text-slate-200">{c.email?.sender}</span> · received {fmtDateTime(c.received_at)} via {c.source}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {c.campaign_id && (
            <Link to="/campaigns" className="chip border-risk-high/30 bg-risk-high/10 text-risk-high hover:bg-risk-high/20">
              <Layers className="h-3 w-3" /> Campaign {c.campaign_id}{related.length ? ` · ${related.length} related` : ''}
            </Link>
          )}
          {age != null && (
            <span className={`chip ${age < 30 ? 'border-risk-critical/30 bg-risk-critical/10 text-risk-critical' : 'border-white/10 text-slate-300'}`}>
              <CalendarClock className="h-3 w-3" /> Domain {age < 30 ? 'registered only ' : 'age '}{age >= 365 ? `${(age / 365).toFixed(1)} years` : `${age} days`}{age < 30 ? ' ago' : ''}
            </span>
          )}
          <span className="chip border-white/10 text-slate-300"><Server className="h-3 w-3" /> {titleCase(c.enrichment?.infrastructure_type)} infrastructure <InfoTip term="infra" /></span>
        </div>
        {(user?.role === 'admin' || user?.role === 'superadmin') && <AssignAnalyst caseData={c} onChange={setC} />}
      </header>

      <section className="panel p-5" aria-labelledby="plain-words">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">In plain words</p>
        <h2 id="plain-words" className={`mt-1 text-xl font-bold ${HEAD[ex.level]}`}>{ex.headline}</h2>
        <p className="mt-1 text-sm text-slate-300">{ex.summary}</p>
        {!ex.pending && (
        <div className="mt-4 grid gap-5 md:grid-cols-5">
          <div className="md:col-span-3">
            <p className="mb-2 text-sm font-semibold text-slate-200">Why we think so</p>
            <ul className="space-y-1.5">
              {ex.reasons.map((r) => { const [Icon, color] = TONE[r.tone]; return (
                <li key={r.text} className="flex gap-2 text-sm text-slate-300"><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />{r.text}</li>
              ); })}
            </ul>
          </div>
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-semibold text-slate-200">Suggested next steps</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400 marker:text-accent">
              {ex.staffActions.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
        </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-5">
        <Section title="Score breakdown" hint="How the overall verdict was reached" className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ScoreGauge value={c.overall_risk_score} label={<span className="inline-flex items-center gap-1">Overall risk <InfoTip term="overall" /></span>} sub="Combined verdict" />
            <ScoreGauge value={fraudScore(c)} label={<span className="inline-flex items-center gap-1">Fraud score <InfoTip term="fraud" /></span>} sub={`Detection: ${titleCase(c.detection?.classification)}`} />
            <ScoreGauge value={c.forensics?.spoofing_risk_score ?? 0} label={<span className="inline-flex items-center gap-1">Spoofing risk <InfoTip term="spoofRisk" /></span>} sub="Header forensics" />
          </div>
        </Section>
        <Section title="Sender authentication" hint="Results from header forensics" className="lg:col-span-2">
          <AuthChecks forensics={c.forensics} />
        </Section>
      </div>

      <Section title="Pipeline timeline" hint="Every stage stamps its own completion time, so slow steps stand out">
        <Timeline caseData={c} />
      </Section>

      <Section title="Trace path" tip="relay" hint="Relay hops from the original headers, ending at the geolocated origin">
        <TraceMap forensics={c.forensics} enrichment={c.enrichment} />
      </Section>

      <div className="grid gap-5 lg:grid-cols-5">
        <Section title="Indicators and flags" className="lg:col-span-3">
          <IndicatorChips detection={c.detection} forensics={c.forensics} enrichment={c.enrichment} />
        </Section>
        <Section title="Related cases" tip="campaign" hint={c.campaign_id ? `Same campaign: ${c.campaign_id}` : undefined} className="lg:col-span-2">
          {related.length ? (
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.case_id}>
                  <Link to={`/cases/${r.case_id}`} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-slate-100">{r.email?.subject}</span>
                      <span className="block truncate font-mono text-xs text-slate-500">{r.enrichment?.geolocation?.ip} · {r.email?.domain}</span>
                    </span>
                    <RiskBadge score={r.overall_risk_score} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">{c.campaign_id ? 'No other cases in this campaign yet.' : 'This email is not linked to a campaign.'}</p>
          )}
        </Section>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, FileDown, MapPin, Search, ShieldCheck, Upload, UserCog, UserRound, Users, Crown, XCircle } from 'lucide-react';
import AuthChecks from '../AuthChecks';
import InfoTip from '../InfoTip';
import RiskBadge from '../RiskBadge';
import ScoreGauge from '../ScoreGauge';
import { EML_STEPS, FAQ, GLOSSARY, RISK_BANDS, ROLE_INFO } from '../../content/knowledge';
import { explainCase } from '../../lib/explain';
import { RISK } from '../../lib/risk';

export function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-700 ease-out motion-reduce:transition-none ${on ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 motion-reduce:opacity-100 motion-reduce:translate-y-0'} ${className}`}>
      {children}
    </div>
  );
}

function Section({ id, no, eyebrow, title, lead, children }) {
  return (
    <section id={id} className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-20">
      <Reveal>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent">{no} · {eyebrow}</p>
        <h2 className="max-w-3xl text-3xl font-bold uppercase leading-tight tracking-[0.05em] text-white md:text-4xl">{title}</h2>
        {lead && <p className="mt-4 max-w-2xl text-lg text-slate-300">{lead}</p>}
      </Reveal>
      <div className="mt-10">{children}</div>
    </section>
  );
}

/* ---------- 01 Start here ---------- */
function StartHere() {
  const [tab, setTab] = useState('Gmail');
  const steps = [
    { Icon: FileDown, title: 'Save the email', text: 'Save the suspicious email as a .eml file. It keeps the hidden headers that hold the clues.' },
    { Icon: Upload, title: 'Upload it', text: 'Sign in as a reporter, drop the file in the box and press "Run analysis". You can leave the page while it runs.' },
    { Icon: ShieldCheck, title: 'Read the verdict', text: 'You get a score from 0 to 100, a risk level and clear advice on what to do next.' },
  ];
  return (
    <Section id="start" no="01" eyebrow="Start here" title="Checking an email takes three steps" lead="No technical knowledge needed. If you can save a file, you can use MailRakshak.">
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(({ Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 90}>
            <div className="panel h-full p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent"><Icon className="h-5 w-5" /></span>
                <span className="font-mono text-sm text-accent/70">Step {i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-6">
        <div className="panel p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-50">How to get the .eml file <InfoTip term="eml" /></h3>
          <div role="tablist" aria-label="Email program" className="mt-4 flex flex-wrap gap-2">
            {Object.keys(EML_STEPS).map((k) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${tab === k ? 'border-accent/60 bg-accent/15 text-accent-soft' : 'border-white/10 text-slate-400 hover:border-accent/30 hover:text-slate-100'}`}>{k}</button>
            ))}
          </div>
          <ol className="mt-5 space-y-3">
            {EML_STEPS[tab].map((s, i) => (
              <li key={s} className="flex gap-3 text-sm text-slate-300">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-mono text-xs text-accent-soft">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-xs text-slate-500">Forwarding the email is not enough: forwarding drops the headers MailRakshak needs.</p>
        </div>
      </Reveal>

      <Reveal className="mt-6">
        <p className="mb-3 text-sm font-medium text-slate-200">What the score means</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RISK_BANDS.map((b) => (
            <div key={b.key} className={`rounded-xl border p-4 ${RISK[b.key].border} ${RISK[b.key].bg}`}>
              <p className={`flex items-center justify-between font-semibold ${RISK[b.key].text}`}>{b.label}<span className="font-mono text-xs opacity-80">{b.range}</span></p>
              <p className="mt-1 text-sm text-slate-300">{b.text}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

/* ---------- 02 Live demo ---------- */
const SAMPLES = [
  {
    email: { subject: 'Urgent: verify your account within 24 hours', sender: 'alerts@bank-secure-login.top', domain: 'bank-secure-login.top' }, overall_risk_score: 94, campaign_id: 'CMP-2041',
    detection: { classification: 'phishing', confidence_score: 0.96, matched_indicators: ['Urgency', 'Credential Request', 'Risky Tld'] },
    forensics: { spf_result: 'fail', dkim_result: 'none', dmarc_result: 'fail', spoofing_risk_score: 91, anomaly_flags: ['Return-Path domain differs from the From domain'] },
    enrichment: { geolocation: { city: 'Moscow', country: 'Russia' }, infrastructure_type: 'hosting', domain_age_days: 6, dns_mismatch_flags: [] },
  },
  {
    email: { subject: 'Invoice 4471 attached: please process today', sender: 'accounts@vendor-billing.co', domain: 'vendor-billing.co' }, overall_risk_score: 61,
    detection: { classification: 'bec', confidence_score: 0.74, matched_indicators: ['Financial Request', 'Urgency'] },
    forensics: { spf_result: 'softfail', dkim_result: 'none', dmarc_result: 'none', spoofing_risk_score: 48, anomaly_flags: ['Reply-To differs from the From address'] },
    enrichment: { geolocation: { city: 'Amsterdam', country: 'Netherlands' }, infrastructure_type: 'vpn', domain_age_days: 41, dns_mismatch_flags: [] },
  },
  {
    email: { subject: 'Your weekly team digest', sender: 'digest@company.com', domain: 'company.com' }, overall_risk_score: 9,
    detection: { classification: 'legitimate', confidence_score: 0.93, matched_indicators: [] },
    forensics: { spf_result: 'pass', dkim_result: 'pass', dmarc_result: 'pass', spoofing_risk_score: 10, anomaly_flags: [] },
    enrichment: { geolocation: { city: 'Pune', country: 'India' }, infrastructure_type: 'business', domain_age_days: 4380, dns_mismatch_flags: [] },
  },
];
const TONE = { bad: [XCircle, 'text-risk-critical'], warn: [AlertTriangle, 'text-risk-medium'], ok: [CheckCircle2, 'text-risk-low'], info: [MapPin, 'text-accent-soft'] };

function LiveDemo() {
  const [i, setI] = useState(0);
  const [view, setView] = useState('analyst');
  const s = SAMPLES[i];
  const ex = useMemo(() => explainCase(s, { related: s.campaign_id ? 3 : 0 }), [s]);
  return (
    <Section id="demo" no="02" eyebrow="Live demo" title="See a verdict before you sign in" lead="Pick a sample email, then switch between what a reporter sees and what an analyst sees. These are made-up examples, not real emails.">
      <div className="grid gap-5 lg:grid-cols-5">
        <div role="tablist" aria-label="Sample emails" className="space-y-3 lg:col-span-2">
          {SAMPLES.map((x, n) => (
            <button key={x.email.subject} role="tab" aria-selected={n === i} onClick={() => setI(n)} className={`panel w-full p-4 text-left transition-all ${n === i ? '!border-accent/70 bg-accent/[0.06]' : 'opacity-80 hover:opacity-100'}`}>
              <RiskBadge score={x.overall_risk_score} showScore />
              <p className="mt-2 font-semibold text-slate-100">{x.email.subject}</p>
              <p className="font-mono text-xs text-slate-500">{x.email.sender}</p>
            </button>
          ))}
        </div>

        <div className="panel p-5 lg:col-span-3" aria-live="polite">
          <div className="mb-4 inline-flex rounded-full border border-white/10 p-1 text-sm" role="group" aria-label="View as">
            {[['reporter', 'Reporter view'], ['analyst', 'Analyst view']].map(([k, label]) => (
              <button key={k} onClick={() => setView(k)} aria-pressed={view === k} className={`rounded-full px-4 py-1.5 transition-colors ${view === k ? 'bg-accent/20 text-accent-soft' : 'text-slate-400 hover:text-slate-100'}`}>{label}</button>
            ))}
          </div>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <ScoreGauge value={s.overall_risk_score} label={<span className="inline-flex items-center gap-1">Overall risk <InfoTip term="overall" /></span>} size={120} />
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-slate-50">{ex.headline}</p>
              <p className="mt-1 text-sm text-slate-400">{ex.summary}</p>
            </div>
          </div>

          {view === 'reporter' ? (
            <div className="mt-5 rounded-xl border border-accent/30 bg-accent/[0.05] p-4">
              <p className="text-sm font-semibold text-accent-soft">What to do</p>
              <p className="mt-1 text-slate-200">{ex.reporterAdvice}</p>
              <p className="mt-3 text-xs text-slate-500">Reporters see this plain-language result. No technical detail to wade through.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <AuthChecks forensics={s.forensics} />
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-200">Why we think so</p>
                <ul className="space-y-1.5">
                  {ex.reasons.map((r) => { const [Icon, color] = TONE[r.tone]; return (
                    <li key={r.text} className="flex gap-2 text-sm text-slate-300"><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />{r.text}</li>
                  ); })}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-200">Suggested next steps</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400 marker:text-accent">
                  {ex.staffActions.map((a) => <li key={a}>{a}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ---------- 03 Roles ---------- */
const ROLE_ICON = { reporter: UserRound, analyst: Search, admin: UserCog, superadmin: Crown };
function Roles({ home, user }) {
  return (
    <Section id="roles" no="03" eyebrow="Who it is for" title="One system, four kinds of people" lead="Each person gets a portal that shows what they need and nothing they do not.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLE_INFO.map((r, i) => {
          const Icon = ROLE_ICON[r.key] || Users;
          return (
            <Reveal key={r.key} delay={i * 80}>
              <div className="panel flex h-full flex-col p-5">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent"><Icon className="h-5 w-5" /></span>
                <h3 className="text-lg font-semibold text-slate-50">{r.name}</h3>
                <p className="text-xs uppercase tracking-wider text-accent/80">{r.best}</p>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-slate-300">
                  {r.can.map((c) => <li key={c} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{c}</li>)}
                </ul>
                <p className="mt-4 border-t border-white/10 pt-3 text-xs text-slate-500"><b className="text-slate-400">How you get in:</b> {r.access}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
      <div className="mt-6 text-center">
        <Link to={home} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-ink-950 hover:brightness-110">{user ? 'Open your console' : 'Sign in'} <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </Section>
  );
}

/* ---------- 04 Glossary ---------- */
function Learn() {
  const [q, setQ] = useState('');
  const terms = Object.values(GLOSSARY).filter((g) => `${g.term} ${g.short} ${g.long}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Section id="learn" no="04" eyebrow="Learn" title="Plain-language glossary" lead="Email security has a lot of jargon. Here is every term MailRakshak uses, explained simply. The same explanations appear next to each term inside the app.">
      <label className="relative mb-6 block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
        <input className="input w-full py-2.5 pl-9" placeholder="Search, e.g. SPF or campaign" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the glossary" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        {terms.map((g) => (
          <details key={g.term} className="group panel p-4 open:border-accent/40">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 marker:hidden">
              <span><span className="block font-semibold text-slate-50">{g.term}</span><span className="text-sm text-slate-400">{g.short}</span></span>
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-relaxed text-slate-300">{g.long}</p>
          </details>
        ))}
        {!terms.length && <p className="text-slate-500">No terms match "{q}".</p>}
      </div>
    </Section>
  );
}

/* ---------- 05 FAQ ---------- */
function Faq() {
  return (
    <Section id="faq" no="05" eyebrow="FAQ" title="Questions" lead="Everything you might ask before your first report.">
      <div className="mx-auto max-w-3xl space-y-3">
        {FAQ.map((f, i) => (
          <details key={f.q} className="group panel p-5 open:border-accent/40">
            <summary className="flex cursor-pointer list-none items-center gap-4 marker:hidden">
              <span className="font-mono text-sm text-accent/70">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 font-semibold text-slate-100">{f.q}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 pl-10 text-sm leading-relaxed text-slate-400">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ---------- closing call to action ---------- */
function FinalCta({ home, user }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <Reveal>
        <div className="panel glow-card glow-low flex flex-col items-center gap-5 p-10 text-center">
          <h2 className="text-3xl font-bold uppercase tracking-[0.05em] text-white md:text-4xl">Got an email you do not trust?</h2>
          <p className="max-w-lg text-slate-300">Sign in, upload it, and get a verdict in a few seconds. If you are not sure it is worth checking, it is.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to={home} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-ink-950 hover:brightness-110">{user ? 'Open your console' : 'Report an email'} <ArrowRight className="h-4 w-4" /></Link>
            <a href="#start" className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-slate-100 hover:border-accent hover:text-accent">How to start</a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function LandingSections({ home, user, solid = false }) {
  return (
    <div className={solid ? 'relative bg-ink-950' : 'relative'}>
      <StartHere />
      <LiveDemo />
      <Roles home={home} user={user} />
      <Learn />
      <Faq />
      <FinalCta home={home} user={user} />
      <footer className="border-t border-white/10 bg-ink-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500">
          <span>MailRakshak · Smart India Hackathon 2026 · SIH26106</span>
          <span>AI-powered email threat detection, geolocation and forensic intelligence</span>
        </div>
      </footer>
    </div>
  );
}

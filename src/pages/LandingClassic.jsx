import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Clock, FileText, Fingerprint, Globe, Layers, Link2, Lock, Mail, Radar, ShieldCheck, Users,
} from 'lucide-react';
import LiveBackground from '../components/LiveBackground';
import Logo from '../components/Logo';
import RiskBadge from '../components/RiskBadge';
import ScoreGauge from '../components/ScoreGauge';
import { useAuth } from '../context/AuthContext';

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-700 ease-out ${on ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}>
      {children}
    </div>
  );
}

const FEATURES = [
  { Icon: Radar, title: 'AI email classification', body: 'Reads the subject and body and labels each email legitimate, suspicious, phishing or business email compromise (BEC). You get a confidence score and the exact phrases that raised the flag.' },
  { Icon: ShieldCheck, title: 'Header forensics', body: 'Checks SPF, DKIM and DMARC, then rebuilds the relay path hop by hop to expose spoofed senders, forged return paths and out-of-order timestamps.' },
  { Icon: Globe, title: 'Origin tracing', body: 'Locates the sending IP on a map, flags VPN, Tor and hosting networks, and checks how new the sender domain is and whether its DNS records add up.' },
  { Icon: Layers, title: 'Campaign correlation', body: 'Groups emails that share infrastructure, so one attacker shows up as one campaign instead of a pile of unrelated alerts.' },
  { Icon: Link2, title: 'Tamper-evident evidence', body: 'When a threat is confirmed, a fingerprint of the case is anchored on a public blockchain test network. Anyone can later check that the record was not altered.' },
  { Icon: FileText, title: 'Investigation-ready report', body: 'Admins export one PDF covering every stage of the analysis, the full timeline and the evidence fingerprint, ready to hand to legal or law enforcement.' },
];

const STEPS = [
  { n: 1, name: 'Receive', text: 'The email arrives and gets a case ID.' },
  { n: 2, name: 'Detect', text: 'AI scores the text for phishing and BEC.' },
  { n: 3, name: 'Verify', text: 'Headers and sender authentication are checked.' },
  { n: 4, name: 'Trace', text: 'Origin, network and domain are enriched.' },
  { n: 5, name: 'Correlate', text: 'The verdict is scored and linked to campaigns.' },
];

const ROLES = [
  { Icon: Mail, name: 'Reporter', text: 'Forward or upload a suspicious email and get a clear verdict in plain language. No technical detail to wade through.' },
  { Icon: Users, name: 'Analyst', text: 'Work the case queue with the full picture: scores, authentication results, relay path, origin map and timeline.' },
  { Icon: Lock, name: 'Admin', text: 'Confirm genuine threats, anchor the evidence, manage cases and export the formal forensic report.' },
];

const EXAMPLES = [
  { subject: 'Urgent: verify your account within 24 hours', sender: 'alerts@bank-secure-login.top', score: 94, glow: 'glow-critical',
    checks: [['SPF', 'Fail', 'bad'], ['DKIM', 'Not signed', 'bad'], ['DMARC', 'Fail', 'bad']], origin: 'Hosting network' },
  { subject: 'Invoice 4471 attached: please process today', sender: 'accounts@vendor-billing.co', score: 61, glow: 'glow-high',
    checks: [['SPF', 'Softfail', 'warn'], ['DKIM', 'Not signed', 'bad'], ['DMARC', 'None', 'warn']], origin: 'VPN exit node' },
  { subject: 'Your weekly team digest', sender: 'digest@company.com', score: 12, glow: 'glow-low',
    checks: [['SPF', 'Pass', 'ok'], ['DKIM', 'Pass', 'ok'], ['DMARC', 'Pass', 'ok']], origin: 'Business network' },
];
const STAGES = ['Received', 'Detected', 'Verified', 'Traced', 'Scored'];
const TONE = {
  bad: 'bg-risk-critical/10 text-risk-critical',
  warn: 'bg-risk-medium/10 text-risk-medium',
  ok: 'bg-risk-low/10 text-risk-low',
};

// Plays a live analysis loop: each example email goes through the five pipeline stages,
// the checks fill in, and the score counts up. Static final state for prefers-reduced-motion.
function PreviewCard() {
  const [i, setI] = useState(0);
  const [stage, setStage] = useState(0); // how many of the five stages are done
  const [score, setScore] = useState(0);
  const ex = EXAMPLES[i];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setStage(5); setScore(EXAMPLES[0].score); return undefined; }
    let alive = true;
    let raf = 0;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));
    const countUp = (target) => {
      const start = performance.now();
      const tick = () => {
        if (!alive) return;
        const k = Math.min(1, (performance.now() - start) / 900);
        setScore(Math.round(target * (1 - (1 - k) ** 3)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const run = (n) => {
      setI(n); setStage(0); setScore(0);
      STAGES.forEach((_, st) => later(() => setStage(st + 1), 600 + st * 650));
      later(() => countUp(EXAMPLES[n].score), 600 + 4 * 650 + 80);
      later(() => run((n + 1) % EXAMPLES.length), 600 + 5 * 650 + 4200);
    };
    run(0);
    return () => { alive = false; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  }, []);

  const done = stage >= 5;
  const pending = <span className="font-mono text-slate-600 animate-blink">...</span>;

  return (
    <div className={`panel relative w-full max-w-md p-5 transition-all duration-500 ${done ? `glow-card ${ex.glow}` : ''}`} aria-label="Live example analysis">
      <div className="mb-3 flex items-center justify-between">
        {done ? <RiskBadge score={ex.score} /> : (
          <span className="chip border-accent/30 bg-accent/10 text-accent-soft"><span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" />Analysing</span>
        )}
        <span className="text-[11px] text-slate-500">Live example</span>
      </div>
      <div key={i} className="animate-slideDown">
        <p className="font-semibold text-slate-100">{ex.subject}</p>
        <p className="font-mono text-xs text-slate-500">{ex.sender}</p>
      </div>
      <div className="mt-4 flex items-center gap-5">
        <ScoreGauge value={score} label="Overall risk" size={104} />
        <ul className="flex-1 space-y-1.5 text-sm">
          {ex.checks.map(([k, v, tone]) => (
            <li key={k} className={`flex items-center justify-between rounded-md px-2.5 py-1 transition-colors duration-500 ${stage >= 3 ? TONE[tone] : 'bg-white/5'}`}>
              <span className="text-slate-300">{k}</span>
              {stage >= 3 ? <span className="font-medium">{v}</span> : pending}
            </li>
          ))}
          <li className="flex items-center justify-between rounded-md bg-white/5 px-2.5 py-1">
            <span className="text-slate-300">Origin</span>
            {stage >= 4 ? <span className="text-slate-100">{ex.origin}</span> : pending}
          </li>
        </ul>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-slate-400">
        <Clock className="h-3.5 w-3.5 text-accent" />
        {STAGES.map((st, n) => (
          <span key={st} title={st} className={`h-1.5 w-1.5 rounded-full transition-colors ${n < stage ? 'bg-accent shadow-[0_0_6px_#22ff9c]' : n === stage ? 'animate-blink bg-accent' : 'bg-white/15'}`} />
        ))}
        <span className="ml-1">{done ? 'Scored' : STAGES[Math.min(stage, 4)] + '...'}</span>
        <span className="ml-auto font-mono text-accent-soft">{done ? 'a few seconds' : `${(stage * 0.6).toFixed(1)}s`}</span>
      </div>
    </div>
  );
}

export default function LandingClassic() {
  const { user } = useAuth();
  const home = user ? (user.role === 'reporter' ? '/upload' : '/dashboard') : '/login';
  const cta = user ? 'Open your console' : 'Sign in';

  return (
    <div className="relative min-h-screen">
      <LiveBackground variant="hero" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-2">
          <Link to="/" className="flex shrink-0 items-center" aria-label="MailRakshak home">
            <Logo size="h-11" />
          </Link>
          <nav className="ml-4 hidden gap-5 text-sm text-slate-400 md:flex">
            <a href="#features" className="hover:text-slate-100">Features</a>
            <a href="#how" className="hover:text-slate-100">How it works</a>
            <a href="#evidence" className="hover:text-slate-100">Evidence</a>
            <a href="#roles" className="hover:text-slate-100">Who it is for</a>
          </nav>
          <Link to={home} className="btn ml-auto border-accent/40 bg-accent/15 font-semibold text-accent-soft hover:bg-accent/25">{cta}</Link>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 lg:grid-cols-2 lg:pt-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" /> Email threat detection and forensics
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-50 sm:text-5xl">
              Catch fraudulent email. Trace where it came from. <span className="bg-gradient-to-r from-accent to-neon-purple bg-clip-text text-transparent">Keep the proof.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              MailRakshak checks every suspicious email three ways at once: what it says, whether the sender is genuine, and where it really came from. Then it turns the result into evidence an investigator can use.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={home} className="btn border-accent/50 bg-accent px-5 py-2.5 font-semibold text-ink-950 hover:bg-accent-soft">
                {user ? cta : 'Report a suspicious email'} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="btn px-5 py-2.5">See how it works</a>
            </div>
            <p className="mt-4 text-xs text-slate-500">Built for Smart India Hackathon 2026 · problem statement SIH26106</p>
          </div>
          <div className="flex justify-center lg:justify-end"><PreviewCard /></div>
        </section>

        {/* features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-slate-50">Core features</h2>
            <p className="mt-2 max-w-2xl text-slate-400">One report, several lines of evidence. Each check covers a gap the others leave open.</p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={(i % 3) * 90}>
                <article className="panel h-full p-5 transition-colors hover:border-accent/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-semibold text-slate-100">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-slate-50">How it works</h2>
            <p className="mt-2 max-w-2xl text-slate-400">Every email goes through the same five stages, and each stage stamps its own time, so you can see exactly how the verdict was built.</p>
          </Reveal>
          <ol className="mt-10 grid gap-8 md:grid-cols-5 md:gap-0">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 110}>
                <li className="relative flex gap-4 md:block md:px-3 md:text-center">
                  {i > 0 && <span className="absolute right-1/2 top-4 hidden h-0.5 w-full bg-gradient-to-r from-accent/20 to-accent/70 md:block" />}
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-ink-900 font-mono text-xs text-accent-soft md:mx-auto">{s.n}</span>
                  <div className="md:mt-3">
                    <p className="font-semibold text-slate-100">{s.name}</p>
                    <p className="text-sm text-slate-400">{s.text}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* evidence */}
        <section id="evidence" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <Reveal>
            <div className="panel grid gap-8 p-7 lg:grid-cols-2">
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent"><Fingerprint className="h-5 w-5" /></span>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-50">Evidence that proves it was not changed</h2>
                <p className="mt-2 text-slate-300">A forensic report is only useful if people can trust it. When an admin confirms a threat, MailRakshak records a fingerprint of the finished case on a public blockchain test network.</p>
                <p className="mt-3 text-sm text-slate-400">Only the fingerprint goes on the blockchain. The email, the sender and the case details never do, so there is no new privacy exposure.</p>
              </div>
              <ol className="space-y-3 self-center">
                {[
                  ['A threat is confirmed', 'The finished case becomes a locked record.'],
                  ['A fingerprint is made', 'A SHA-256 hash is calculated from the whole case.'],
                  ['It is anchored publicly', 'The hash is stored on a public test network and its transaction ID is saved in the report.'],
                  ['Anyone can verify it later', 'Re-hash the case. A match means unaltered. A mismatch means someone changed it.'],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 font-mono text-xs text-accent-soft">{i + 1}</span>
                    <div><p className="text-sm font-semibold text-slate-100">{t}</p><p className="text-xs text-slate-400">{d}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </section>

        {/* roles */}
        <section id="roles" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-slate-50">Who it is for</h2>
            <p className="mt-2 max-w-2xl text-slate-400">Three portals, so each person sees what they need and nothing they should not.</p>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {ROLES.map(({ Icon, name, text }, i) => (
              <Reveal key={name} delay={i * 100}>
                <article className="panel h-full p-5">
                  <Icon className="h-6 w-6 text-accent" />
                  <h3 className="mt-3 font-semibold text-slate-100">{name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* final call to action */}
        <section className="mx-auto max-w-6xl px-4 pb-24 pt-8">
          <Reveal>
            <div className="panel flex flex-col items-center gap-4 p-10 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">Got an email you do not trust?</h2>
              <p className="max-w-lg text-slate-400">Sign in, upload it, and get a verdict in seconds.</p>
              <Link to={home} className="btn border-accent/50 bg-accent px-6 py-2.5 font-semibold text-ink-950 hover:bg-accent-soft">
                {user ? cta : 'Sign in to check an email'} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-ink-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500">
          <span>MailRakshak · Smart India Hackathon 2026 · SIH26106</span>
          <span>AI-powered email threat detection, geolocation and forensic intelligence</span>
        </div>
      </footer>
    </div>
  );
}

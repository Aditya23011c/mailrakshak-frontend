import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import LiveBackground from '../components/LiveBackground';
import Logo from '../components/Logo';
import RiskBadge from '../components/RiskBadge';
import ScoreGauge from '../components/ScoreGauge';
import LandingSections, { Reveal } from '../components/landing/LandingSections';
import { PIPELINE } from '../content/knowledge';
import { useAuth } from '../context/AuthContext';

// The classic (non-3D) landing page. Used when WebGL is unavailable or reduced motion is on.
// It carries exactly the same information as the 3D version.

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
  const links = [['How it works', '#how'], ['Start here', '#start'], ['Live demo', '#demo'], ['Roles', '#roles'], ['Learn', '#learn'], ['FAQ', '#faq']];

  return (
    <div className="relative min-h-screen">
      <LiveBackground variant="hero" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-2">
          <Link to="/" className="flex shrink-0 items-center" aria-label="MailRakshak home">
            <Logo size="h-11" />
          </Link>
          <nav className="ml-4 hidden gap-5 text-sm text-slate-400 lg:flex" aria-label="Main">
            {links.map(([label, href]) => <a key={href} href={href} className="hover:text-slate-100">{label}</a>)}
          </nav>
          <Link to={home} className="btn ml-auto border-accent/40 bg-accent/15 font-semibold text-accent-soft hover:bg-accent/25">{cta}</Link>
        </div>
      </header>

      <main>
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
            <ul className="mt-5 flex flex-wrap gap-2 text-xs text-slate-200">
              {['No technical knowledge needed', 'Result in a few seconds', 'Plain-language advice'].map((t) => (
                <li key={t} className="rounded-full border border-accent/30 bg-black/30 px-3 py-1">{t}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={home} className="btn border-accent/50 bg-accent px-5 py-2.5 font-semibold text-ink-950 hover:bg-accent-soft">
                {user ? cta : 'Report a suspicious email'} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#start" className="btn px-5 py-2.5">Start here</a>
            </div>
            <p className="mt-4 text-xs text-slate-500">Built for Smart India Hackathon 2026 · problem statement SIH26106</p>
          </div>
          <div className="flex justify-center lg:justify-end"><PreviewCard /></div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16">
          <Reveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent">How it works</p>
            <h2 className="max-w-3xl text-3xl font-bold uppercase leading-tight tracking-[0.05em] text-white md:text-4xl">Six stages, one verdict</h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-300">Every email goes through the same stages, and each one adds to the case you see in the app.</p>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PIPELINE.map((c, i) => (
              <Reveal key={c.id} delay={(i % 3) * 90}>
                <div className="panel h-full p-6">
                  <p className="font-mono text-xs text-accent/70">{c.tag}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-50">{c.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{c.body}</p>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
                    {c.points.map((pt) => <li key={pt} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{pt}</li>)}
                  </ul>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent/80">In the app · {c.app}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <LandingSections home={home} user={user} />
      </main>
    </div>
  );
}

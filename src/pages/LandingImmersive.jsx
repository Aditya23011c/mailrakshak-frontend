import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { N, createWalkthrough } from '../three/walkthrough';

// Eight chapters: a hero, six pipeline stages and a closing call to action.
// The text lives in the page (readable, selectable, accessible); the 3D scene is the backdrop.
const CHAPTERS = [
  { tag: 'MailRakshak', nav: null },
  { tag: 'Chapter 01 · Report', nav: 'Report', title: 'Every investigation starts with one email', body: 'Upload a suspicious .eml and MailRakshak takes it from there. No setup and no copying headers by hand. Each report becomes its own case.' },
  { tag: 'Chapter 02 · Detect', nav: 'Detect', title: 'AI reads the message', body: 'Subject and body are classified as legitimate, suspicious, phishing or business email compromise (BEC), with a confidence score and the exact phrases that raised the flag.' },
  { tag: 'Chapter 03 · Verify', nav: 'Verify', title: 'Is the sender who they claim to be?', body: 'SPF, DKIM and DMARC are checked, then the relay path is rebuilt hop by hop to expose spoofed senders, forged return paths and out-of-order timestamps.' },
  { tag: 'Chapter 04 · Trace', nav: 'Trace', title: 'Where did it really come from?', body: 'The sending IP is located on a map and checked for VPN, Tor and hosting networks. Domain age and DNS records show whether the infrastructure adds up.' },
  { tag: 'Chapter 05 · Connect', nav: 'Connect', title: 'One attacker, one campaign', body: 'Emails that share infrastructure are grouped, so related attacks surface together instead of as a pile of unrelated alerts.' },
  { tag: 'Chapter 06 · Prove', nav: 'Prove', title: 'Evidence that cannot be quietly changed', body: 'When an admin confirms a threat, a fingerprint of the case is anchored on a public blockchain test network. Only the fingerprint is stored, never the email itself.' },
  { tag: 'Chapter 07 · Begin', nav: null, title: 'Got an email you do not trust?', body: 'Reporters, analysts and admins each get their own portal.' },
];
const NAV = CHAPTERS.map((c, i) => ({ ...c, i })).filter((c) => c.nav);

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export default function LandingImmersive({ onFail }) {
  const { user } = useAuth();
  const home = user ? (user.role === 'reporter' ? '/upload' : '/dashboard') : '/login';
  const canvasRef = useRef(null);
  const chapterEls = useRef([]);
  const dotEls = useRef([]);
  const labelEl = useRef(null);
  const cueEl = useRef(null);
  const lastIdx = useRef(-1);

  const goTo = (i) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (i / (N - 1)) * max, behavior: 'smooth' });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    let walk;
    try {
      walk = createWalkthrough({
        canvas: canvasRef.current,
        onFrame: (u) => {
          chapterEls.current.forEach((el, i) => {
            if (!el) return;
            const op = clamp(1 - (Math.abs(u - i) - 0.2) / 0.35);
            el.style.opacity = op.toFixed(3);
            el.style.transform = `translate3d(0, ${((i - u) * 36).toFixed(1)}px, 0)`;
            el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
            el.dataset.live = op > 0.6 ? '1' : '0';
          });
          const idx = Math.round(u);
          if (idx !== lastIdx.current) {
            lastIdx.current = idx;
            dotEls.current.forEach((d, i) => { if (d) d.dataset.active = i === idx ? '1' : '0'; });
            if (labelEl.current) labelEl.current.textContent = CHAPTERS[idx].tag;
          }
          if (cueEl.current) cueEl.current.style.opacity = String(clamp(1 - u * 5));
        },
      });
    } catch (err) {
      console.warn('3D landing unavailable, using the classic page.', err);
      if (onFail) onFail();
      return undefined;
    }
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      walk.setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      walk.dispose();
    };
  }, [onFail]);

  return (
    <div className="relative bg-black">
      {/* the 3D scene */}
      <canvas ref={canvasRef} className="fixed inset-0 h-full w-full" aria-hidden="true" />

      {/* soft shade behind the text so it stays readable over the bright scene */}
      <div
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.62), rgba(0,0,0,0.2) 45%, transparent 66%), linear-gradient(0deg, rgba(0,0,0,0.5), transparent 32%)' }}
      />

      {/* floating pill navigation */}
      <header className="fixed inset-x-0 top-3 z-30 flex justify-center px-3">
        <nav className="flex w-full max-w-5xl items-center justify-between gap-3 rounded-full border border-white/10 bg-black/50 py-1.5 pl-4 pr-1.5 backdrop-blur-md" aria-label="Main">
          <Link to="/" onClick={() => goTo(0)} aria-label="MailRakshak home"><Logo size="h-8" /></Link>
          <ul className="hidden items-center md:flex">
            {NAV.map((c) => (
              <li key={c.nav}>
                <button onClick={() => goTo(c.i)} className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 transition-colors hover:text-accent">{c.nav}</button>
              </li>
            ))}
          </ul>
          <Link to={home} className="rounded-full bg-accent px-5 py-2 text-sm font-bold uppercase tracking-wider text-ink-950 transition hover:brightness-110">{user ? 'Console' : 'Sign in'}</Link>
        </nav>
      </header>

      {/* chapter progress */}
      <ul className="fixed right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
        {CHAPTERS.map((c, i) => (
          <li key={c.tag}>
            <button
              ref={(el) => { dotEls.current[i] = el; }}
              data-active={i === 0 ? '1' : '0'}
              onClick={() => goTo(i)}
              aria-label={`Go to ${c.title || 'the start'}`}
              className="block h-2 w-2 rounded-full bg-white/30 transition-all hover:bg-white/60 data-[active=1]:h-3 data-[active=1]:w-3 data-[active=1]:bg-accent data-[active=1]:shadow-[0_0_10px_#22ff9c]"
            />
          </li>
        ))}
      </ul>
      <p ref={labelEl} className="fixed bottom-5 left-5 z-20 hidden text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/80 md:block">MailRakshak</p>
      <div ref={cueEl} className="pointer-events-none fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-slate-300">
        Scroll to explore
        <span className="scroll-cue h-8 w-px bg-accent" />
      </div>

      {/* chapter text, faded in and out by scroll position */}
      <div className="pointer-events-none fixed inset-0 z-10" aria-hidden="true">
        {CHAPTERS.map((c, i) => {
          const hero = i === 0;
          const last = i === CHAPTERS.length - 1;
          return (
            <section
              key={c.tag}
              ref={(el) => { chapterEls.current[i] = el; }}
              data-live={hero ? '1' : '0'}
              style={{ opacity: hero ? 1 : 0, visibility: hero ? 'visible' : 'hidden' }}
              className={`chapter absolute inset-0 flex px-5 pb-24 md:px-[7vw] md:pb-0 ${last ? 'items-end justify-center text-center md:items-end md:pb-28' : 'items-end md:items-center'}`}
            >
              <div className={`${hero ? 'max-w-3xl' : 'max-w-xl rounded-2xl bg-black/40 p-5 backdrop-blur-sm md:bg-black/25 md:p-6'} ${last ? 'mx-auto' : ''}`}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent">{hero ? 'Email threat detection and forensics' : c.tag}</p>
                {hero ? (
                  <>
                    <h1 className="text-[clamp(2.4rem,7.5vw,5.4rem)] font-bold uppercase leading-none tracking-[0.14em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)]">MailRakshak</h1>
                    <p className="mt-5 max-w-xl text-lg text-slate-100 drop-shadow-[0_1px_10px_rgba(0,0,0,0.8)] md:text-xl">Catch fraudulent email. Trace where it came from. Keep the proof.</p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link to={home} className="rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-ink-950 hover:brightness-110">{user ? 'Open your console' : 'Report an email'}</Link>
                      <button onClick={() => goTo(1)} className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-slate-100 hover:border-accent hover:text-accent">How it works</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold uppercase leading-tight tracking-[0.06em] text-white md:text-4xl">{c.title}</h2>
                    <p className="mt-4 text-base leading-relaxed text-slate-200 md:text-lg">{c.body}</p>
                    {last && (
                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link to={home} className="rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-ink-950 hover:brightness-110">{user ? 'Open your console' : 'Sign in to report'}</Link>
                      </div>
                    )}
                    {last && <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-slate-500">Built for Smart India Hackathon 2026 · SIH26106</p>}
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* scroll distance that drives the camera */}
      <div style={{ height: `${CHAPTERS.length * 115}vh` }} />

      {/* the same content as plain text for screen readers */}
      <div className="sr-only">
        <h1>MailRakshak: email threat detection and forensics</h1>
        {CHAPTERS.slice(1).map((c) => (<section key={c.tag}><h2>{c.title}</h2><p>{c.body}</p></section>))}
      </div>
    </div>
  );
}

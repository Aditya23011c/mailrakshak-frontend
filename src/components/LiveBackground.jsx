import { useEffect, useRef } from 'react';

/**
 * Live background (canvas):
 *  - faint email-header / detection code scrolling upward in columns
 *  - glowing data streams that flow across the page and converge on one focal point (the result card),
 *    with packets that turn from green to orange as they reach it
 *  - a drifting node graph with occasional red "threat" nodes
 *  - a large MAILRAKSHAK watermark
 * variant="hero" is the full effect (landing page); the default is a quieter version for app screens.
 * Pauses when the tab is hidden and draws one still frame for prefers-reduced-motion.
 */
const SNIPPETS = [
  'Received: from mail.bank-secure-login.top ([185.220.101.7])',
  'Authentication-Results: spf=fail dkim=none dmarc=fail',
  'const verdict = await analyze(headers, body);',
  'if (spf.status !== "pass") risk += 30;',
  'return { classification, confidence_score };',
  'alerts@bank-secure-login.top',
  'X-Originating-IP: 185.220.101.7',
  'Return-Path: <bounce@bank-secure-login.top>',
  'geo.lookup(ip) -> { country: "RU", hosting: true }',
  'campaign.correlate(infrastructure);',
  'anchor(sha256(case)); // tamper-evident',
  'Subject: Urgent: verify your account within 24 hours',
  'DKIM-Signature: none',
  '// SPF FAIL | DKIM NONE | DMARC FAIL',
  'hops.map((h) => trace(h.from_ip));',
  'if (risk >= 85) flag("CRITICAL");',
  'Message-ID: <7f3a9c@bank-secure-login.top>',
  'domain.age_days < 30 && score++;',
  'relay_path.sort((a, b) => a.timestamp - b.timestamp);',
  'Reply-To: support@bank-secure-login.top',
];
const WARM = /fail|critical|\.top|risk >=|none/i;

export default function LiveBackground({ variant = 'app' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const hero = variant === 'hero';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const LINK = 150, LINE_H = 18;
    const rnd = (a, b) => a + Math.random() * (b - a);
    let w = 0, h = 0, dpr = 1, raf = 0, last = 0;
    let nodes = [], cols = [], streams = [], focal = { x: 0, y: 0 };
    const mouse = { x: -9999, y: -9999 };

    const init = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const wide = w >= 900;
      focal = { x: wide ? w * 0.72 : w * 0.5, y: wide ? h * 0.44 : h * 0.38 };

      const count = Math.max(16, Math.min(70, Math.floor((w * h) / 26000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.24, vy: (Math.random() - 0.5) * 0.24,
        r: Math.random() * 1.2 + 0.7, hot: Math.random() < 0.06,
      }));

      const nCols = Math.max(1, Math.floor(w / 340));
      cols = Array.from({ length: nCols }, (_, i) => {
        const lines = [...SNIPPETS].sort(() => Math.random() - 0.5);
        return { x: (w / nCols) * i + 18, speed: rnd(0.012, 0.03), lines, off: rnd(0, lines.length * LINE_H) };
      });

      const sn = hero ? 16 : 8;
      streams = Array.from({ length: sn }, (_, i) => ({
        k: i, n: sn,
        y0: h * (0.06 + (0.88 * i) / (sn - 1)) + rnd(-12, 12),
        ph: rnd(0, 6.28), spd: rnd(0.5, 1.1),
        packets: [{ p: Math.random(), s: rnd(0.0012, 0.0026) }, { p: Math.random(), s: rnd(0.0012, 0.0026) }],
      }));
    };

    const bez = (a, b, c, d, t) => {
      const u = 1 - t;
      return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
    };
    const streamPts = (s, t) => {
      const off = s.k - (s.n - 1) / 2;
      return [
        { x: -40, y: s.y0 },
        { x: w * 0.28, y: s.y0 + Math.sin((t / 2400) * s.spd + s.ph) * 70 },
        { x: focal.x - w * 0.18, y: focal.y + off * 10 + Math.cos((t / 2900) * s.spd + s.ph) * 60 },
        { x: focal.x - 30, y: focal.y + off * 8 },
      ];
    };

    const drawCode = (t) => {
      ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';
      const base = hero ? 0.12 : 0.065;
      for (const col of cols) {
        const total = col.lines.length * LINE_H;
        const shift = -((t * col.speed + col.off) % total);
        for (let tile = 0; tile * total < h + total; tile++) {
          for (let j = 0; j < col.lines.length; j++) {
            const y = shift + tile * total + j * LINE_H;
            if (y < -LINE_H || y > h) continue;
            const fade = Math.min(1, y / 140, (h - y) / 140);
            if (fade <= 0) continue;
            const line = col.lines[j];
            ctx.fillStyle = WARM.test(line) ? `rgba(255,150,70,${base * 1.25 * fade})` : `rgba(34,255,156,${base * fade})`;
            ctx.fillText(line, col.x, y);
          }
        }
      }
    };

    const drawStreams = (t, dt) => {
      const mul = hero ? 1 : 0.4;
      // warm glow where everything converges
      const pulse = 0.85 + 0.15 * Math.sin(t / 900);
      const glow = ctx.createRadialGradient(focal.x, focal.y, 0, focal.x, focal.y, 320);
      glow.addColorStop(0, `rgba(255,130,40,${0.13 * mul * pulse})`);
      glow.addColorStop(1, 'rgba(255,130,40,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const grad = ctx.createLinearGradient(0, 0, focal.x, 0);
      grad.addColorStop(0, 'rgba(34,255,156,0)');
      grad.addColorStop(0.4, `rgba(34,255,156,${0.2 * mul})`);
      grad.addColorStop(0.85, `rgba(255,170,60,${0.34 * mul})`);
      grad.addColorStop(1, `rgba(255,120,40,${0.12 * mul})`);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = grad;
      for (const s of streams) {
        const [a, b, c, d] = streamPts(s, t);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.bezierCurveTo(b.x, b.y, c.x, c.y, d.x, d.y);
        ctx.stroke();
      }
      for (const s of streams) {
        const [a, b, c, d] = streamPts(s, t);
        for (const k of s.packets) {
          k.p += k.s * (dt / 16);
          if (k.p >= 1) k.p = 0;
          const x = bez(a.x, b.x, c.x, d.x, k.p);
          const y = bez(a.y, b.y, c.y, d.y, k.p);
          const col = k.p > 0.68 ? '255,170,60' : '90,255,190';
          const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
          g.addColorStop(0, `rgba(${col},${0.95 * Math.max(mul, 0.55)})`);
          g.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawNodes = (t, dt) => {
      const step = dt / 16;
      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx * step; n.y += n.vy * step;
          if (n.x < -20) n.x = w + 20;
          if (n.x > w + 20) n.x = -20;
          if (n.y < -20) n.y = h + 20;
          if (n.y > h + 20) n.y = -20;
          const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
          if (d < 180 && d > 1) { n.x += (dx / d) * 0.35 * step; n.y += (dy / d) * 0.35 * step; }
        }
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            const alpha = (1 - d / LINK) * 0.16;
            ctx.strokeStyle = a.hot || b.hot ? `rgba(255,46,99,${alpha * 1.5})` : `rgba(34,255,156,${alpha})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        const pulse = n.hot ? 0.55 + 0.45 * Math.sin(t / 420 + n.x) : 1;
        ctx.fillStyle = n.hot ? `rgba(255,46,99,${0.85 * pulse})` : 'rgba(170,255,215,.65)';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (n.hot ? 1.8 : 1), 0, Math.PI * 2); ctx.fill();
        if (n.hot) {
          ctx.strokeStyle = `rgba(255,46,99,${0.35 * pulse})`;
          ctx.beginPath(); ctx.arc(n.x, n.y, 6 + 5 * pulse, 0, Math.PI * 2); ctx.stroke();
        }
      }
    };

    const drawWatermark = () => {
      ctx.save();
      ctx.globalAlpha = hero ? 0.075 : 0.04;
      ctx.fillStyle = '#22ff9c';
      ctx.strokeStyle = '#22ff9c';
      ctx.font = '700 40px "Chakra Petch", ui-sans-serif, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '8px';
      const text = 'MAILRAKSHAK';
      const m = ctx.measureText(text).width;
      const x0 = w / 2 - (m + 58) / 2;
      const cy = h * 0.9;
      const cx = x0 + 17;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 20); ctx.lineTo(cx + 16, cy - 13); ctx.lineTo(cx + 16, cy + 2);
      ctx.quadraticCurveTo(cx + 16, cy + 15, cx, cy + 22);
      ctx.quadraticCurveTo(cx - 16, cy + 15, cx - 16, cy + 2);
      ctx.lineTo(cx - 16, cy - 13); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 7, cy + 1); ctx.lineTo(cx - 2, cy + 7); ctx.lineTo(cx + 8, cy - 6); ctx.stroke();
      ctx.fillText(text, x0 + 58, cy + 1);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.restore();
    };

    const draw = (t, dt) => {
      ctx.clearRect(0, 0, w, h);
      drawCode(t);
      drawStreams(t, dt);
      drawNodes(t, dt);
      drawWatermark();
    };

    const loop = (t) => {
      const dt = Math.min(50, last ? t - last : 16);
      last = t;
      draw(t, dt);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    const onVis = () => {
      cancelAnimationFrame(raf);
      last = 0;
      if (!document.hidden && !reduce) raf = requestAnimationFrame(loop);
    };
    const onResize = () => { init(); if (reduce) draw(0, 16); };

    init();
    if (reduce) draw(0, 16);
    else raf = requestAnimationFrame(loop);

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [variant]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] animate-drift rounded-full bg-accent-deep/15 blur-[120px]" />
      <div className="absolute -bottom-52 right-[-8rem] h-[38rem] w-[38rem] animate-drift rounded-full bg-risk-high/10 blur-[140px] [animation-delay:-9s]" />
      <div className="absolute left-1/2 top-1/3 h-[26rem] w-[26rem] -translate-x-1/2 animate-drift rounded-full bg-neon-purple/10 blur-[130px] [animation-delay:-15s]" />
      <div
        className="absolute inset-0 animate-gridMove opacity-[0.12]"
        style={{
          backgroundImage: 'linear-gradient(rgba(34,255,156,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,255,156,.12) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
        }}
      />
      <canvas ref={ref} className="absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-accent/[0.05] to-transparent" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(2,6,11,.75) 100%)' }} />
    </div>
  );
}

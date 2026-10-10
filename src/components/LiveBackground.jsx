import { useEffect, useRef } from 'react';

/**
 * Live background: a drifting mail-network graph on <canvas> (nodes, links, data packets,
 * pointer-reactive), over a moving grid, floating glows and a slow scan line.
 * Pauses when the tab is hidden; renders a single still frame for prefers-reduced-motion.
 */
export default function LiveBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const LINK = 150;
    let w = 0, h = 0, dpr = 1, raf = 0, nodes = [], packets = [];
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
      const count = Math.max(24, Math.min(110, Math.floor((w * h) / 16000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.3 + 0.7,
        hot: Math.random() < 0.07, // occasional "threat" node
      }));
      packets = [];
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -20) n.x = w + 20;
          if (n.x > w + 20) n.x = -20;
          if (n.y < -20) n.y = h + 20;
          if (n.y > h + 20) n.y = -20;
          const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
          if (d < 180 && d > 1) { n.x += (dx / d) * 0.35; n.y += (dy / d) * 0.35; }
        }
      }

      // links
      const near = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            const alpha = (1 - d / LINK) * 0.22;
            ctx.strokeStyle = a.hot || b.hot ? `rgba(255,59,92,${alpha * 1.4})` : `rgba(56,189,248,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            near.push([i, j]);
          }
        }
      }

      // packets travelling along links
      if (!reduce && near.length && packets.length < 14 && Math.random() < 0.06) {
        const [i, j] = near[Math.floor(Math.random() * near.length)];
        packets.push({ a: nodes[i], b: nodes[j], p: 0, s: 0.008 + Math.random() * 0.012, hot: nodes[i].hot || nodes[j].hot });
      }
      packets = packets.filter((k) => k.p < 1);
      for (const k of packets) {
        k.p += k.s;
        const x = k.a.x + (k.b.x - k.a.x) * k.p;
        const y = k.a.y + (k.b.y - k.a.y) * k.p;
        const c = k.hot ? '255,59,92' : '125,211,252';
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, `rgba(${c},.95)`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      // nodes
      for (const n of nodes) {
        const pulse = n.hot ? 0.55 + 0.45 * Math.sin(t / 420 + n.x) : 1;
        ctx.fillStyle = n.hot ? `rgba(255,59,92,${0.85 * pulse})` : 'rgba(148,197,255,.65)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (n.hot ? 1.8 : 1), 0, Math.PI * 2);
        ctx.fill();
        if (n.hot) {
          ctx.strokeStyle = `rgba(255,59,92,${0.35 * pulse})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 6 + 5 * pulse, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    const loop = (t) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) raf = requestAnimationFrame(loop);
    };
    const onResize = () => { init(); if (reduce) draw(0); };

    init();
    if (reduce) draw(0);
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
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      {/* floating glows */}
      <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-accent-deep/20 blur-[120px] animate-drift" />
      <div className="absolute -bottom-52 right-[-8rem] h-[38rem] w-[38rem] rounded-full bg-risk-critical/10 blur-[140px] animate-drift [animation-delay:-9s]" />
      <div className="absolute left-1/2 top-1/3 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[130px] animate-drift [animation-delay:-15s]" />
      {/* moving grid */}
      <div
        className="absolute inset-0 animate-gridMove opacity-[0.22]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(56,189,248,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.12) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
        }}
      />
      {/* radar sweep */}
      <div
        className="absolute -right-64 -top-64 h-[44rem] w-[44rem] rounded-full animate-spinSlow opacity-60"
        style={{
          background: 'conic-gradient(from 0deg, rgba(56,189,248,0) 0deg, rgba(56,189,248,.14) 40deg, rgba(56,189,248,0) 42deg)',
        }}
      />
      <canvas ref={ref} className="absolute inset-0" />
      {/* scan line */}
      <div className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-accent/[0.06] to-transparent" />
      {/* vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(5,9,18,.75) 100%)' }} />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { riskLevel } from '../lib/risk';

// Animated ring gauge. `value` is 0-100.
export default function ScoreGauge({ value = 0, label, sub, size = 132 }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const r = riskLevel(value);
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={r.hex}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - shown / 100)}
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)', filter: `drop-shadow(0 0 6px ${r.hex}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-semibold" style={{ color: r.hex }}>{Math.round(value)}</span>
          <span className={`text-xs font-medium ${r.text}`}>{r.label}</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-100">{label}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

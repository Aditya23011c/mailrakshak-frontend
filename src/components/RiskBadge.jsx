import { riskLevel } from '../lib/risk';

export default function RiskBadge({ score, showScore = false, className = '' }) {
  const r = riskLevel(score);
  return (
    <span className={`chip ${r.bg} ${r.border} ${r.text} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${r.solid} ${r.key === 'critical' ? 'animate-blink' : ''}`} />
      {r.label}
      {showScore && <span className="font-mono opacity-80">{Math.round(score)}</span>}
    </span>
  );
}

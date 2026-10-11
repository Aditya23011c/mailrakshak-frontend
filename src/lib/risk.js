// Risk levels are derived from overall_risk_score (0-100) on the case document.
// Class names are written out in full so Tailwind can see them.
export const RISK = {
  critical: {
    key: 'critical', label: 'Critical', min: 85, hex: '#ff2e63',
    text: 'text-risk-critical', bg: 'bg-risk-critical/15', border: 'border-risk-critical/40', solid: 'bg-risk-critical',
  },
  high: {
    key: 'high', label: 'High', min: 60, hex: '#ff9f1c',
    text: 'text-risk-high', bg: 'bg-risk-high/15', border: 'border-risk-high/40', solid: 'bg-risk-high',
  },
  medium: {
    key: 'medium', label: 'Medium', min: 30, hex: '#ffd23f',
    text: 'text-risk-medium', bg: 'bg-risk-medium/15', border: 'border-risk-medium/40', solid: 'bg-risk-medium',
  },
  low: {
    key: 'low', label: 'Low', min: 0, hex: '#22ff9c',
    text: 'text-risk-low', bg: 'bg-risk-low/15', border: 'border-risk-low/40', solid: 'bg-risk-low',
  },
};

export const RISK_ORDER = ['critical', 'high', 'medium', 'low'];

export function riskLevel(score = 0) {
  if (score >= 85) return RISK.critical;
  if (score >= 60) return RISK.high;
  if (score >= 30) return RISK.medium;
  return RISK.low;
}

// confidence_score (0-1) is how sure the model is of the label it chose, not how risky the email is.
// For "legitimate" the two point opposite ways (93% sure it is safe = 7 fraud score), so invert it there.
export const fraudScore = (c) => {
  const conf = c?.detection?.confidence_score;
  if (typeof conf !== 'number') return 0;
  const pct = Math.round((conf > 1 ? conf / 100 : conf) * 100);
  return String(c?.detection?.classification).toLowerCase() === 'legitimate' ? 100 - pct : pct;
};

// Risk levels are derived from overall_risk_score (0-100) on the case document.
// Class names are written out in full so Tailwind can see them.
export const RISK = {
  critical: {
    key: 'critical', label: 'Critical', min: 85, hex: '#ff3b5c',
    text: 'text-risk-critical', bg: 'bg-risk-critical/15', border: 'border-risk-critical/40', solid: 'bg-risk-critical',
  },
  high: {
    key: 'high', label: 'High', min: 60, hex: '#ff8a1f',
    text: 'text-risk-high', bg: 'bg-risk-high/15', border: 'border-risk-high/40', solid: 'bg-risk-high',
  },
  medium: {
    key: 'medium', label: 'Medium', min: 30, hex: '#f5c518',
    text: 'text-risk-medium', bg: 'bg-risk-medium/15', border: 'border-risk-medium/40', solid: 'bg-risk-medium',
  },
  low: {
    key: 'low', label: 'Low', min: 0, hex: '#22d3a0',
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

// Detection confidence_score is read as "probability the email is malicious" (0-1).
export const fraudScore = (c) => Math.round((c?.detection?.confidence_score ?? 0) * 100);

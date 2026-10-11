import { riskLevel } from './risk';

// Turns a case into plain sentences: what the verdict is, why, and what to do.
// Works on the UI case shape (see caseAdapter): confidence_score is 0-1, auth results are strings.
const pct = (v) => Math.round(v > 1 ? v : v * 100);
const low = (v) => String(v || 'none').toLowerCase();
const ORDER = { bad: 0, warn: 1, info: 2, ok: 3 };

const HEADLINE = {
  critical: 'Very likely a fraudulent email',
  high: 'Likely a fraudulent email',
  medium: 'Suspicious: treat with caution',
  low: 'Looks legitimate',
};

export const REPORTER_ADVICE = {
  critical: 'Do not click any links, open attachments or reply. Delete this email and tell your IT or security team.',
  high: 'Do not click any links, open attachments or reply. Delete this email and tell your IT or security team.',
  medium: 'Be careful. Do not enter passwords or payment details unless you can confirm the sender another way.',
  low: 'We found nothing alarming. If something still feels wrong, trust your instinct and check with the sender.',
};

const STAFF_ACTIONS = {
  critical: ['Stop more copies reaching inboxes: block the sender domain and IP at your mail gateway.', 'Open the related cases to see if the same attacker hit others.', 'Check the trace path to see where it really came from.'],
  high: ['Stop more copies reaching inboxes: block the sender domain and IP at your mail gateway.', 'Open the related cases to see if the same attacker hit others.', 'Check the trace path to see where it really came from.'],
  medium: ['Review the flagged content and authentication results before deciding.', 'Check with the recipient whether this sender is expected.'],
  low: ['No action needed unless the sender or content seems unusual to the recipient.'],
};

export function explainCase(c, { related = 0 } = {}) {
  const level = riskLevel(c?.overall_risk_score ?? 0).key;
  const d = c?.detection;
  const f = c?.forensics;
  const e = c?.enrichment;
  if (!d && !f && !e) {
    return { level, pending: true, headline: 'Analysis has not finished yet', summary: 'Findings appear here as each stage completes. Check back in a few seconds.', reasons: [], staffActions: [], reporterAdvice: 'Please wait for the result before acting on this email.' };
  }
  const r = [];
  const add = (tone, text) => r.push({ tone, text });

  if (d?.classification) {
    const cls = low(d.classification);
    const conf = d.confidence_score != null ? ` (${pct(d.confidence_score)}% confident)` : '';
    if (cls === 'phishing') add('bad', `The wording matches phishing${conf}.`);
    else if (cls === 'bec') add('bad', `The wording matches business email compromise${conf}.`);
    else if (cls === 'suspicious') add('warn', `The wording looks suspicious${conf}.`);
    else add('ok', `The wording looks like normal email${conf}.`);
  }
  if (d?.matched_indicators?.length) add('warn', `Flagged content: ${d.matched_indicators.slice(0, 3).join(', ')}.`);

  const spf = low(f?.spf_result), dkim = low(f?.dkim_result), dmarc = low(f?.dmarc_result);
  if (f) {
    if (spf === 'fail' || spf === 'softfail') add('bad', 'SPF failed: the sending server is not approved by the domain.');
    else if (spf === 'pass') add('ok', 'SPF passed: the sending server is approved by the domain.');
    else add('warn', 'There is no SPF result, so the sending server could not be confirmed.');
    if (dkim === 'fail') add('bad', 'The DKIM signature is invalid: the email may have been changed.');
    else if (dkim === 'pass') add('ok', 'The DKIM signature is valid.');
    else add('warn', 'The email is not digitally signed (no DKIM).');
    if (dmarc === 'fail') add('bad', 'DMARC failed: the email breaks the domain\'s own rules.');
    else if (dmarc === 'pass') add('ok', 'DMARC passed.');
    else add('warn', 'The domain has no DMARC result for this email.');
    (f.anomaly_flags || []).slice(0, 2).forEach((a) => add('warn', `Header oddity: ${a}.`.replace(/\.\.$/, '.')));
  }

  (e?.dns_mismatch_flags || []).slice(0, 2).forEach((m) => add('warn', `DNS mismatch: ${m}.`.replace(/\.\.$/, '.')));
  const age = e?.domain_age_days;
  if (age != null) {
    if (age < 30) add('bad', `The sender's domain was registered only ${age} day${age === 1 ? '' : 's'} ago.`);
    else if (age < 180) add('warn', `The sender's domain is fairly new (${age} days old).`);
    else add('ok', `The sender's domain is established (${age >= 365 ? `${(age / 365).toFixed(1)} years` : `${age} days`} old).`);
  }
  const infra = low(e?.infrastructure_type);
  const INFRA = { vpn: 'VPN', tor: 'Tor', hosting: 'hosting', proxy: 'proxy' };
  if (INFRA[infra]) add('warn', `It was sent from a ${INFRA[infra]} network, which real senders rarely use.`);
  const geo = e?.geolocation;
  if (geo?.country) add('info', `Traced to ${[geo.city, geo.country].filter(Boolean).join(', ')}.`);
  if (c?.campaign_id) add('warn', `Part of campaign ${c.campaign_id}${related ? `, with ${related} other email${related === 1 ? '' : 's'}` : ''}.`);

  const reasons = r.sort((a, b) => ORDER[a.tone] - ORDER[b.tone]).slice(0, 9);
  const cls = low(d?.classification);
  const summary = level === 'low'
    ? 'MailRakshak found nothing alarming in the wording or the sender checks.'
    : `${cls === 'bec' ? 'The text reads like a business email compromise scam' : cls === 'phishing' ? 'The text reads like a phishing attempt' : 'Some signs in this email are suspicious'}${spf === 'fail' || dmarc === 'fail' ? ', and the sender could not be verified.' : '.'}`;

  return { level, headline: HEADLINE[level], summary, reasons, staffActions: STAFF_ACTIONS[level], reporterAdvice: REPORTER_ADVICE[level] };
}

// Adapter: real backend Case document -> the flat shape the MailRakshak UI reads.
// The UI components stay untouched; all differences between the two are handled here.
//
// Real Case (backend)                         UI shape
//   _id                                    -> case_id
//   createdAt                              -> received_at
//   channel (extension|manual_upload|...)  -> source (upload|imap|extension|api)
//   sender / subject                       -> email.{sender,subject,domain}
//   detection.confidence_score (0-100)     -> detection.confidence_score (0-1)
//   detection.matched_indicators (object)  -> detection.matched_indicators (string[])
//   forensics.spf/dkim/dmarc.status        -> forensics.spf_result/dkim_result/dmarc_result
//   forensics.relay_path[{from_host,...}]  -> forensics.relay_path[{hop,server,timestamp}]
//   enrichment.geolocation{latitude,...}   -> enrichment.geolocation{ip,lat,lng,...}
//   campaignId | enrichment.campaign_cluster_id -> campaign_id
//   (computed)                             -> overall_risk_score

const PRIVATE_IP = [/^10\./, /^127\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./, /^::1$/, /^f[cd][0-9a-f]{2}:/i];
const isPrivateIp = (ip) => typeof ip === 'string' && PRIVATE_IP.some((re) => re.test(ip.trim()));

const humanize = (k) => String(k).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Same formula the backend uses for GET /cases?risk= (confidence is inverted for "legitimate").
export function caseRiskScore(doc) {
  const conf = doc?.detection?.confidence_score;
  const spoof = doc?.forensics?.spoofing_risk_score;
  if (typeof conf !== 'number' && typeof spoof !== 'number') return null;
  const c = typeof conf === 'number' ? conf : 0;
  const part = doc?.detection?.classification === 'legitimate' ? 100 - c : c;
  return Math.round((part + (typeof spoof === 'number' ? spoof : 0)) / 2);
}

export const isObjectId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);

const TRANSIENT = ['pending', 'received', 'queued', 'processing', 'analyzing', 'analysing', 'in_progress'];
const DONE = ['success', 'succeeded', 'complete', 'completed', 'done'];
const blockDone = (b) => Boolean(b && typeof b === 'object' && (b.processed_at || DONE.includes(String(b.status || '').toLowerCase()) || Object.keys(b).length > 2));

// Finished when detection, forensics and enrichment are all filled in. Different backends mark that differently,
// so accept processed_at, a success status, or simply real content once the case itself is no longer pending.
export function analysisComplete(doc) {
  if (!doc) return false;
  const blocks = [doc.detection, doc.forensics, doc.enrichment];
  if (blocks.every((b) => b?.processed_at)) return true;
  if (!blocks.every(blockDone)) return false;
  return !TRANSIENT.includes(String(doc.status || '').toLowerCase());
}

function indicators(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== 'object') return [];
  return Object.entries(raw)
    .filter(([, v]) => (typeof v === 'boolean' ? v : typeof v === 'number' ? v > 0 : Boolean(v)))
    .map(([k, v]) => (typeof v === 'number' && !Number.isInteger(v) ? `${humanize(k)} (${v.toFixed(2)})` : humanize(k)));
}

const authStatus = (node) => (node == null ? undefined : typeof node === 'string' ? node : node.status ? String(node.status).toLowerCase() : undefined);

function relayPath(forensics) {
  const path = forensics?.relay_path;
  if (!Array.isArray(path)) return [];
  return path.map((h, i) => ({
    hop: typeof h.hop === 'number' ? h.hop : i + 1,
    server: h.from_host || h.server || h.from_ip || h.by_host || `hop ${i + 1}`,
    timestamp: h.timestamp ?? null,
    from_ip: h.from_ip ?? null,
  }));
}

function originIp(forensics) {
  const hop = (forensics?.relay_path ?? []).find((h) => h.from_ip && !isPrivateIp(h.from_ip));
  return hop?.from_ip ?? null;
}

const SOURCE = { manual_upload: 'upload', upload: 'upload', imap: 'imap', extension: 'extension', api: 'api' };

export function senderDomain(doc) {
  const f = doc?.forensics?.email?.from_domain;
  if (f) return f;
  const s = doc?.sender;
  return typeof s === 'string' && s.includes('@') ? s.split('@').pop().replace(/[>\s]/g, '').toLowerCase() : null;
}

export function normalizeCase(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  // Reporter-tier (redacted) responses are not full cases; leave them alone.
  if (doc.risk_label && !doc.detection && !doc._id) return doc;

  const det = doc.detection;
  const f = doc.forensics;
  const e = doc.enrichment;
  const geo = e?.geolocation;
  const conf = typeof det?.confidence_score === 'number' ? det.confidence_score : null;

  const processed = [det?.processed_at, f?.processed_at, e?.processed_at].filter(Boolean).map((t) => new Date(t).getTime());
  const correlated = doc.correlated_at ?? doc.correlatedAt ?? (processed.length === 3 ? new Date(Math.max(...processed)).toISOString() : null);

  return {
    ...doc,
    case_id: doc._id ?? doc.case_id ?? doc.id,
    source: SOURCE[doc.channel] ?? doc.channel ?? 'upload',
    received_at: doc.createdAt ?? doc.received_at ?? null,
    correlated_at: correlated,
    email: {
      subject: doc.subject ?? doc.email?.subject ?? f?.email?.subject ?? '(no subject)',
      sender: doc.sender ?? doc.email?.sender ?? f?.email?.from ?? '',
      domain: senderDomain(doc) ?? doc.email?.domain ?? '',
    },
    detection: det && {
      ...det,
      // backend sends 0-100; the UI reads 0-1
      confidence_score: conf == null ? undefined : conf > 1 ? conf / 100 : conf,
      matched_indicators: indicators(det.matched_indicators),
    },
    forensics: f && {
      ...f,
      spf_result: authStatus(f.spf) ?? f.spf_result,
      dkim_result: authStatus(f.dkim) ?? f.dkim_result,
      dmarc_result: authStatus(f.dmarc) ?? f.dmarc_result,
      relay_path: relayPath(f),
      anomaly_flags: f.anomaly_flags ?? f.anomalies ?? [],
    },
    enrichment: e && {
      ...e,
      geolocation: geo && {
        ...geo,
        ip: geo.ip ?? e.ip ?? originIp(f),
        lat: geo.lat ?? geo.latitude ?? null,
        lng: geo.lng ?? geo.longitude ?? null,
      },
      infrastructure_type: e.infrastructure_type ? String(e.infrastructure_type).toLowerCase() : undefined,
      domain_age_days: e.domain_age_days ?? e.whois?.domain_age_days ?? e.domain?.age_days,
      dns_mismatch_flags: e.dns_mismatch_flags ?? [],
    },
    campaign_id: doc.campaignId ?? doc.campaign_id ?? e?.campaign_cluster_id ?? null,
    overall_risk_score: caseRiskScore(doc) ?? doc.overall_risk_score ?? 0,
  };
}

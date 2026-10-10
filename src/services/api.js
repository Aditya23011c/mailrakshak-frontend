import { normalizeCase, isObjectId, analysisComplete } from '../lib/caseAdapter';

// Always talks to the real backend. Override with VITE_API_BASE_URL (with or without the trailing /api).
// Default is the same-origin '/api', which Vite (dev) and vercel.json (prod) forward to the backend, so CORS never applies.
// Set VITE_API_BASE_URL only to call a backend directly (that backend must then allow this site's origin via CORS).
const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export const POLL_MS = Number(import.meta.env.VITE_POLL_MS) || 8000;

// Real backend contract: every route lives under /api and responses are wrapped in { data }.
// VITE_API_BASE_URL may be given with or without the trailing /api.
const API = BASE.endsWith('/api') ? BASE : `${BASE}/api`;

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, { method = 'GET', body, params, timeoutMs = 60000 } = {}) {
  const token = localStorage.getItem('token');
  const url = new URL(`${API}${path}`, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && url.searchParams.set(k, v));
  let res;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    res = await fetch(url.toString(), {
    signal: ctl.signal,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw new ApiError('The server took too long to answer. Please try again.', 0, null);
    throw new ApiError('Cannot reach the server. It may be waking up (can take up to a minute), or the browser is blocking the request (CORS). Press F12 and check the Console tab for details.', 0, null);
  }
  clearTimeout(timer);
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  // 401 on an authenticated call = expired session. Login/OTP endpoints also 401 on bad credentials, so skip those.
  if (res.status === 401 && token && !path.startsWith('/auth/') && !path.startsWith('/reporters/')) window.dispatchEvent(new Event('auth:expired'));
  if (!res.ok) throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  return data;
}

// GET /api/cases  -> { data: [...], page, limit, total }   (analyst + admin)
export async function getCases() {
  const res = await request('/cases', { params: { limit: 100 } });
  const list = Array.isArray(res) ? res : res?.data ?? res?.cases ?? [];
  return list.map(normalizeCase);
}

// GET /api/cases/:id  -> { data: caseDoc }  (id must be the Mongo _id)
export async function getCase(id) {
  if (!isObjectId(id)) throw new ApiError(`"${id}" is not a valid case id.`, 400, { error: 'INVALID_ID' });
  const res = await request(`/cases/${encodeURIComponent(id)}`);
  return normalizeCase(res?.data ?? res);
}

// ---------------------------------------------------------------------------
// Email submission
//   POST /api/emails/submit   { rawEmail, sender, recipients, subject, source }
//   The backend takes JSON (no multipart), so the .eml is read as text here.
//   Staff get the full case document back; reporters get a redacted
//   { case_id, risk_score, risk_label, message } and nothing under /cases.
//   (POST /api/emails/analyze is preview-only and creates no case, so it is not used.)
// ---------------------------------------------------------------------------
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const storedUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const unwrap = (r) => r?.data ?? r;

function emlHeader(text, name) {
  const head = text.split(/\r?\n\r?\n/)[0].replace(/\r?\n[ \t]+/g, ' '); // unfold continuation lines
  const m = head.match(new RegExp(`^${name}:\\s*(.+)$`, 'im'));
  return m ? m[1].trim() : '';
}
const addrOf = (v) => (v.match(/<([^>]+)>/)?.[1] ?? v).trim();


// The submit response can carry the new case's id under several names/nestings; find it wherever it is.
const ID_KEYS = ['_id', 'id', 'case_id', 'caseId'];
function findCaseId(p, depth = 0) {
  if (!p || typeof p !== 'object' || depth > 3) return null;
  for (const k of ID_KEYS) if (isObjectId(p[k])) return p[k];
  for (const k of ['case', 'data', 'result', 'newCase', 'created']) {
    const found = findCaseId(p[k], depth + 1);
    if (found) return found;
  }
  return null;
}

export async function analyzeEmail(file) {
  const rawEmail = await file.text();
  const subject = emlHeader(rawEmail, 'Subject');
  const sender = addrOf(emlHeader(rawEmail, 'From'));
  if (!sender) throw new Error('This file has no From: header, so it cannot be analysed.');
  const recipients = emlHeader(rawEmail, 'To').split(',').map((x) => addrOf(x)).filter(Boolean);

  const res = await request('/emails/submit', { method: 'POST', body: { rawEmail, sender, recipients, subject, source: 'manual_upload' }, timeoutMs: 120000 });
  const payload = unwrap(res);

  // Reporter tier: redacted result only. Map it onto the fields the verdict card reads.
  if (storedUser()?.role === 'reporter' || (payload?.risk_label && !payload?.detection)) {
    return {
      ...payload,
      case_id: findCaseId(payload) ?? payload?.case_id,
      overall_risk_score: payload?.risk_score ?? payload?.overall_risk_score ?? 0,
      email: { subject: subject || '(no subject)', sender },
    };
  }

  // Staff tier. Find the new case's id in the response; if the backend did not return one,
  // look for the case we just created in the case list instead.
  let id = findCaseId(res) ?? findCaseId(payload);
  if (!id) {
    const since = Date.now() - 5 * 60 * 1000;
    const list = unwrap(await request('/cases', { params: { limit: 25 } }));
    const rows = Array.isArray(list) ? list : list?.data ?? [];
    const mine = rows
      .filter((c) => c.sender === sender && new Date(c.createdAt || 0).getTime() >= since)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    id = mine?._id ?? null;
  }
  if (!id) {
    throw new Error(`The email was sent, but the server did not say which case it created. Server reply: ${JSON.stringify(res).slice(0, 300)}`);
  }

  // The pipeline can run asynchronously: poll until detection, forensics and enrichment have all landed.
  let latest = payload && typeof payload === 'object' && payload._id === id ? payload : unwrap(await request(`/cases/${encodeURIComponent(id)}`));
  for (let i = 0; i < 20 && !analysisComplete(latest); i += 1) {
    await wait(1500);
    try { latest = unwrap(await request(`/cases/${encodeURIComponent(id)}`)) ?? latest; } catch { break; }
  }
  return normalizeCase({ ...latest, _id: latest?._id ?? id });
}

// ---------------------------------------------------------------------------
// Staff-only case actions (no UI in this app yet; ready to wire up)
// ---------------------------------------------------------------------------
export const flagCase = async (id, payload) => normalizeCase(unwrap(await request(`/cases/${id}/flag`, { method: 'POST', body: payload })));             // analyst + admin
export const confirmThreat = async (id, notes) => normalizeCase(unwrap(await request(`/cases/${id}/confirm`, { method: 'POST', body: { notes } })));      // admin; 409/422/502
export const generateReport = async (id, format) => unwrap(await request(`/cases/${id}/report`, { method: 'POST', body: { format } }));                   // admin -> { reportRef, generatedAt }
export const verifyCaseAnchor = async (id) => unwrap(await request(`/cases/${id}/verify`, { method: 'POST' }));                                           // analyst + admin
export const assignAnalyst = async (id, analystId) => normalizeCase(unwrap(await request(`/cases/${id}/assign`, { method: 'POST', body: { analystId } }))); // admin
export const fetchAnalysts = async () => unwrap(await request('/auth/analysts')) ?? [];                                                                     // admin
// Team management (see backend-team-management.md): list staff, change a role.
export const fetchUsers = async () => unwrap(await request('/auth/users')) ?? [];                                                                             // admin + superadmin
export const changeUserRole = async (id, role) => unwrap(await request(`/auth/users/${id}/role`, { method: 'PATCH', body: { role } }));                         // superadmin
export const registerStaffAccount = ({ email, password, role, name }) => request('/auth/register', { method: 'POST', body: { email, password, role, name } }); // admin
export const fetchMyReports = (filters) => request('/reporters/me/cases', { params: filters });                                                            // reporter
export const fetchReporterRateLimit = () => request('/reporters/me/rate-limit');                                                                            // reporter
export const forgotPassword = async ({ email }) => unwrap(await request('/auth/forgot-password', { method: 'POST', body: { email } }));
export const resetPassword = async ({ token, newPassword }) => unwrap(await request('/auth/reset-password', { method: 'POST', body: { token, newPassword } }));

// ---------------------------------------------------------------------------
// Authentication (real backend contract)
//
// STAFF (analyst / admin) is a two-call flow; a correct password never returns a token directly:
//   1. POST /api/auth/login { email, password }
//        -> { data: { userId, requiresPasswordChange: true } }   first login ever
//        -> { data: { userId, mfaRequired: true } }              every later login
//   2. first login : POST /api/auth/set-initial-password { userId, tempPassword, newPassword } -> { token, user }
//      later logins: POST /api/auth/verify-otp          { userId, otp }                        -> { token, user }
//
// REPORTER is email + OTP (no password):
//   POST /api/reporters/login      { email }                 -> { data: { reporterId } }   404 if no account
//   POST /api/reporters/signup     { name, phone, email, organization? } -> { data: { reporterId } }
//   POST /api/reporters/verify-otp { reporterId, otp }       -> { data: { token, reporter } }
// ---------------------------------------------------------------------------
const PENDING_KEY = 'mr_pending_staff';
const REPORTER_PENDING_KEY = 'mr_pending_reporter';
const readPending = (k) => { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } };

function finishStaff(data, role, email) {
  const user = data.user ?? { email, role: data.role ?? role };
  // A super admin signs in through the Admin portal.
  const ok = user.role === role || (role === 'admin' && user.role === 'superadmin');
  if (role && !ok) throw new Error(`This account is not ${role === 'admin' ? 'an admin' : 'an analyst'} account. Try the other portal.`);
  return { token: data.token, user };
}

// Step 1 of staff login. A correct password ends in a pending state (code or first-password step),
// signalled by an ApiError with .pending = 'MFA' | 'PASSWORD_CHANGE'; Login.jsx handles step 2.
export async function login(role, email, password) {
  const res = unwrap(await request('/auth/login', { method: 'POST', body: { email, password } }));
  if (res?.token) return finishStaff(res, role, email); // tolerate a backend with MFA switched off
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ userId: res.userId, email, role, tempPassword: password }));
  const firstLogin = Boolean(res.requiresPasswordChange);
  const err = new ApiError(
    firstLogin
      ? 'First sign-in: you must set a new password. This screen cannot collect it yet.'
      : 'A one-time code was emailed to you. This screen cannot accept it yet.',
    202,
    { pending: firstLogin ? 'PASSWORD_CHANGE' : 'MFA' },
  );
  err.pending = err.payload.pending;
  throw err;
}

// Step 2 of staff login. Both return { token, user } UNWRAPPED (no { data } envelope).
export async function verifyStaffOtp(otp) {
  const p = readPending(PENDING_KEY);
  if (!p) throw new Error('Start sign-in again.');
  const data = await request('/auth/verify-otp', { method: 'POST', body: { userId: p.userId, otp } }); // 400: NO_ACTIVE_OTP | EXPIRED | INCORRECT | TOO_MANY_ATTEMPTS
  sessionStorage.removeItem(PENDING_KEY);
  return finishStaff(data, p.role, p.email);
}

export async function setInitialPassword(newPassword) {
  const p = readPending(PENDING_KEY);
  if (!p) throw new Error('Start sign-in again.');
  const data = await request('/auth/set-initial-password', { method: 'POST', body: { userId: p.userId, tempPassword: p.tempPassword, newPassword } }); // 409 ALREADY_SET
  sessionStorage.removeItem(PENDING_KEY);
  return finishStaff(data, p.role, p.email);
}

// Reporter: "send code" = login. A 404 means no account exists and sign-up needs name + phone (see signupReporter).
export async function requestCode(email) {
  try {
    const data = unwrap(await request('/reporters/login', { method: 'POST', body: { email } }));
    sessionStorage.setItem(REPORTER_PENDING_KEY, JSON.stringify({ reporterId: data.reporterId, email }));
  } catch (e) {
    if (e.status === 404) throw new ApiError('No reporter account exists for this email yet. Registering needs a name and phone number, which this screen does not collect.', 404, e.payload);
    throw e;
  }
}

export async function signupReporter({ name, phone, email, organization }) {
  const data = unwrap(await request('/reporters/signup', { method: 'POST', body: { name, phone, email, organization } }));
  sessionStorage.setItem(REPORTER_PENDING_KEY, JSON.stringify({ reporterId: data.reporterId, email }));
  return data;
}

export async function verifyCode(email, code) {
  const p = readPending(REPORTER_PENDING_KEY);
  if (!p?.reporterId) throw new Error('Please request a new code.');
  const data = unwrap(await request('/reporters/verify-otp', { method: 'POST', body: { reporterId: p.reporterId, otp: code } }));
  sessionStorage.removeItem(REPORTER_PENDING_KEY);
  return { token: data.token, user: { email, ...(data.reporter ?? {}), role: 'reporter' } };
}

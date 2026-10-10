import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { analyzeEmail } from '../services/api';
import { useAuth } from './AuthContext';

// Tracks the email the signed-in person most recently reported, so a floating result card can
// follow them around the site (landing page, dashboard, upload) while it is analysed.
// The analysis runs here, not inside the Upload page, so leaving that page does not cancel it.

const Ctx = createContext(null);
export const useReportTracker = () => useContext(Ctx);

const KEY = 'mr_last_report';
const headerOf = (raw, name) => {
  const m = raw.match(new RegExp(`^${name}:[ \\t]*(.+)$`, 'im'));
  return m ? m[1].trim() : '';
};
const addrOf = (v) => {
  const a = v.match(/<([^>]+)>/);
  return (a ? a[1] : v).trim();
};
const readStored = () => {
  try {
    const j = JSON.parse(sessionStorage.getItem(KEY));
    return j?.status === 'done' ? j : null; // an unfinished analysis cannot be resumed after a reload
  } catch { return null; }
};

export function TrackerProvider({ children }) {
  const { user } = useAuth();
  const [job, setJob] = useState(readStored);
  const jobRef = useRef(job);
  jobRef.current = job;

  useEffect(() => { if (!user) setJob(null); }, [user]);
  useEffect(() => {
    if (job?.status === 'done') sessionStorage.setItem(KEY, JSON.stringify(job));
    else if (!job) sessionStorage.removeItem(KEY);
  }, [job]);

  const submitReport = useCallback(async (file) => {
    const raw = await file.text();
    const id = Date.now();
    setJob({
      id, status: 'analyzing', startedAt: id, role: user?.role, fileName: file.name,
      subject: headerOf(raw, 'Subject') || '(no subject)', sender: addrOf(headerOf(raw, 'From')),
    });
    analyzeEmail(file)
      .then((c) => {
        const staffView = user?.role !== 'reporter' && c?.forensics;
        const geo = c?.enrichment?.geolocation;
        setJob((j) => (j?.id !== id ? j : {
          ...j, status: 'done', finishedAt: Date.now(), caseId: c.case_id,
          score: Math.round(c.overall_risk_score ?? 0), label: c.risk_label || null, message: c.message || null,
          checks: staffView ? {
            spf: c.forensics?.spf_result, dkim: c.forensics?.dkim_result, dmarc: c.forensics?.dmarc_result,
            origin: [geo?.city, geo?.country].filter(Boolean).join(', ') || c.enrichment?.infrastructure_type || 'Unknown',
          } : null,
        }));
      })
      .catch((e) => {
        const error = e?.status === 429 ? "You've reached today's submission limit. Please try again after it resets." : e?.message || 'The analysis failed. Please try again.';
        setJob((j) => (j?.id !== id ? j : { ...j, status: 'error', finishedAt: Date.now(), error }));
      });
  }, [user?.role]);

  const dismiss = useCallback(() => setJob(null), []);

  // True for a case the signed-in person just created themselves, so it should not raise an alert banner.
  const isOwnUpload = useCallback((c) => {
    const j = jobRef.current;
    return Boolean(j && j.sender && c?.email?.sender === j.sender && c.received_at && new Date(c.received_at).getTime() >= j.startedAt - 15000);
  }, []);

  const value = useMemo(() => ({ job, submitReport, dismiss, isOwnUpload }), [job, submitReport, dismiss, isOwnUpload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

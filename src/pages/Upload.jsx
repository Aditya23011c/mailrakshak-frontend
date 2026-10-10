import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, Loader2, Radar, ShieldCheck, UploadCloud, X, Globe } from 'lucide-react';
import { analyzeEmail } from '../services/api';
import { useCases } from '../context/CasesContext';
import { useAuth } from '../context/AuthContext';
import { riskLevel } from '../lib/risk';

const MAX_MB = 10;
const STAGES = [
  { key: 'detection', name: 'ML detection', desc: 'Scoring subject and body for phishing and BEC', Icon: Radar },
  { key: 'forensics', name: 'Header forensics', desc: 'Checking SPF, DKIM, DMARC and the relay path', Icon: ShieldCheck },
  { key: 'enrichment', name: 'Origin tracing', desc: 'Geolocating the sender and checking the domain', Icon: Globe },
];

const VERDICT = {
  critical: ['High risk', 'Do not click any links, open attachments or reply. Delete this email.'],
  high: ['High risk', 'Do not click any links, open attachments or reply. Delete this email.'],
  medium: ['Suspicious', 'Be careful. Do not enter passwords or payment details unless you can confirm the sender another way.'],
  low: ['Likely safe', 'We found nothing alarming. If something still feels wrong, trust your instinct and check with the sender.'],
};

function Verdict({ c, onAgain }) {
  const r = riskLevel(c.overall_risk_score);
  const [title, advice] = VERDICT[r.key];
  return (
    <div className={`panel animate-pop border ${r.border} p-6 text-center`}>
      <span className={`chip ${r.bg} ${r.border} ${r.text}`}>{title}</span>
      <h2 className="mt-3 text-xl font-bold text-slate-50">{c.email?.subject}</h2>
      <p className="mt-3 text-sm text-slate-300">{advice}</p>
      <p className="mt-2 font-mono text-xs text-slate-500">Reference {c.case_id}</p>
      <button onClick={onAgain} className="btn mt-5">Check another email</button>
    </div>
  );
}

export default function Upload() {
  const navigate = useNavigate();
  const { markSeen, refresh } = useCases();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const pick = (f) => {
    setError(null);
    if (!f) return;
    if (!/\.eml$/i.test(f.name)) return setError('Only .eml files are supported. In Gmail, open the email, choose "Download message", and upload that file.');
    if (f.size > MAX_MB * 1024 * 1024) return setError(`That file is larger than ${MAX_MB} MB.`);
    if (f.size === 0) return setError('That file is empty.');
    setFile(f);
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const c = await analyzeEmail(file);
      markSeen(c.case_id); // don't raise the alert banner for the user's own upload
      if (user?.role === 'reporter') { setResult(c); setBusy(false); return; }
      setDone(true);
      refresh();
      setTimeout(() => navigate(`/cases/${c.case_id}`), 700);
    } catch (e) {
      setError(`Analysis failed: ${e.message}. Check your connection and try again.`);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">Analyze an email</h1>
        <p className="text-sm text-slate-400">Upload a suspicious email and MailRakshak runs it through ML detection, header forensics and origin tracing.</p>
      </div>

      {result ? (
        <Verdict c={result} onAgain={() => { setResult(null); setFile(null); }} />
      ) : !busy ? (
        <div className="panel p-5">
          <div
            role="button"
            tabIndex={0}
            onClick={() => input.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${drag ? 'border-accent bg-accent/10' : 'border-white/15 hover:border-accent/60 hover:bg-white/[0.03]'}`}
          >
            <UploadCloud className={`h-10 w-10 ${drag ? 'text-accent' : 'text-slate-400'}`} />
            <p className="text-slate-100">Drop an .eml file here, or click to browse</p>
            <p className="text-xs text-slate-500">The original email with full headers, up to {MAX_MB} MB</p>
            <input ref={input} type="file" accept=".eml,message/rfc822" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          </div>

          {file && (
            <div className="mt-4 flex animate-pop items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
              <FileText className="h-5 w-5 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button aria-label="Remove file" onClick={() => setFile(null)} className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
          )}

          {error && <p role="alert" className="mt-4 rounded-lg border border-risk-critical/40 bg-risk-critical/10 px-4 py-3 text-sm text-risk-critical">{error}</p>}

          <button onClick={run} disabled={!file} className="btn mt-5 w-full justify-center border-accent/40 bg-accent/15 py-2.5 font-semibold text-accent-soft hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-40">
            <ShieldCheck className="h-4 w-4" /> Run analysis
          </button>
        </div>
      ) : (
        <div className="panel p-5">
          <p className="panel-title">{done ? 'Analysis complete. Opening the case…' : 'Analyzing…'}</p>
          <p className="mb-4 truncate text-xs text-slate-500">{file?.name}</p>
          <ul className="space-y-3">
            {STAGES.map(({ key, name, desc, Icon }, i) => (
              <li key={key} className="flex animate-rowIn items-center gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4" style={{ animationDelay: `${i * 120}ms` }}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-100">{name}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                  {!done && (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-1/3 rounded-full bg-accent" style={{ animation: `scanbar 1.3s ${i * 0.25}s ease-in-out infinite alternate` }} />
                    </div>
                  )}
                </div>
                {done ? <CheckCircle2 className="h-5 w-5 text-risk-low" /> : <Loader2 className="h-5 w-5 animate-spin text-accent" />}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">The three checks run in parallel. This usually takes a few seconds.</p>
        </div>
      )}
      <style>{`@keyframes scanbar { from { transform: translateX(0); } to { transform: translateX(200%); } }`}</style>
    </div>
  );
}

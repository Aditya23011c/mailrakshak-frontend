import { useRef, useState } from 'react';
import InfoTip from '../components/InfoTip';
import PageIntro from '../components/PageIntro';
import { EML_STEPS, RISK_BANDS } from '../content/knowledge';
import { RISK } from '../lib/risk';
import { FileText, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { useReportTracker } from '../context/ReportTrackerContext';

const MAX_MB = 10;

function EmlHelp() {
  const [tab, setTab] = useState('Gmail');
  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">How to get a .eml file <InfoTip term="eml" /></h2>
      <div role="tablist" aria-label="Email program" className="mt-3 flex flex-wrap gap-2">
        {Object.keys(EML_STEPS).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full border px-3 py-1 text-xs transition-colors ${tab === k ? 'border-accent/60 bg-accent/15 text-accent-soft' : 'border-white/10 text-slate-400 hover:border-accent/30 hover:text-slate-100'}`}>{k}</button>
        ))}
      </div>
      <ol className="mt-4 space-y-2">
        {EML_STEPS[tab].map((st, i) => (
          <li key={st} className="flex gap-3 text-sm text-slate-300">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-mono text-[11px] text-accent-soft">{i + 1}</span>
            <span>{st}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-slate-500">Forwarding the email is not enough: forwarding drops the headers MailRakshak needs.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-4" aria-label="What the score means">
        {RISK_BANDS.map((b) => (
          <div key={b.key} className={`rounded-lg border px-3 py-2 text-xs ${RISK[b.key].border} ${RISK[b.key].bg}`}>
            <p className={`flex justify-between font-semibold ${RISK[b.key].text}`}>{b.label}<span className="font-mono opacity-80">{b.range}</span></p>
            <p className="mt-0.5 text-slate-400">{b.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Upload() {
  const { job, submitReport } = useReportTracker();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState(null);
  const busy = job?.status === 'analyzing';

  const pick = (f) => {
    setError(null);
    if (!f) return;
    if (!/\.eml$/i.test(f.name)) return setError('Only .eml files are supported. In Gmail, open the email, choose "Download message", and upload that file.');
    if (f.size > MAX_MB * 1024 * 1024) return setError(`That file is larger than ${MAX_MB} MB.`);
    if (f.size === 0) return setError('That file is empty.');
    setFile(f);
  };

  // The analysis continues in the floating report card, so the person is free to browse elsewhere.
  const run = async () => {
    setError(null);
    try {
      await submitReport(file);
      setFile(null);
    } catch (e) {
      setError(`Could not read that file: ${e.message}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">Analyze an email</h1>
        <p className="text-sm text-slate-400">Upload a suspicious email and MailRakshak runs it through ML detection, header forensics and origin tracing.</p>
      </div>

      <PageIntro id="upload" title="Three steps">
        <p>1. Save the suspicious email as a <b className="text-slate-200">.eml</b> file (steps below). 2. Drop it in the box and press <b className="text-slate-200">Run analysis</b>. 3. Read the verdict in the card at the bottom right. You can leave the page while it runs.</p>
      </PageIntro>

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

        <button onClick={run} disabled={!file || busy} className="btn mt-5 w-full justify-center border-accent/40 bg-accent/15 py-2.5 font-semibold text-accent-soft hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-40">
          <ShieldCheck className="h-4 w-4" /> {busy ? 'Analysing your last report…' : 'Run analysis'}
        </button>

        {job && job.status !== 'error' && (
          <p className="mt-3 text-center text-xs text-slate-400">
            {busy ? 'Your report is being analysed. You can leave this page. Progress and the result appear in the card at the bottom right.' : 'Your result is in the card at the bottom right.'}
          </p>
        )}
      </div>

      <EmlHelp />
    </div>
  );
}

import { useRef, useState } from 'react';
import { FileText, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { useReportTracker } from '../context/ReportTrackerContext';

const MAX_MB = 10;

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
    </div>
  );
}

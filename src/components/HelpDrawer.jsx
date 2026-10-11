import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen, HelpCircle, MessageCircleQuestion, Search, X } from 'lucide-react';
import { FAQ, GLOSSARY, PAGE_GUIDE } from '../content/knowledge';

const TABS = [['page', 'This page', HelpCircle], ['terms', 'Glossary', BookOpen], ['faq', 'FAQ', MessageCircleQuestion]];

function guideFor(path) {
  if (path.startsWith('/cases/')) return PAGE_GUIDE.case;
  if (path.startsWith('/upload')) return PAGE_GUIDE.upload;
  if (path.startsWith('/campaigns')) return PAGE_GUIDE.campaigns;
  if (path.startsWith('/team')) return PAGE_GUIDE.team;
  return PAGE_GUIDE.dashboard;
}

// Slide-over help centre, opened from the Help button (or by pressing "?").
export default function HelpDrawer({ open, onClose }) {
  const { pathname } = useLocation();
  const [tab, setTab] = useState('page');
  const [q, setQ] = useState('');
  const closeBtn = useRef(null);
  const guide = guideFor(pathname);

  useEffect(() => {
    if (!open) return undefined;
    closeBtn.current?.focus();
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, onClose]);

  const terms = useMemo(() => Object.values(GLOSSARY).filter((g) => `${g.term} ${g.short} ${g.long}`.toLowerCase().includes(q.trim().toLowerCase())), [q]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close help" onClick={onClose} className="absolute inset-0 cursor-default bg-black/60" />
      <aside role="dialog" aria-modal="true" aria-label="Help" className="absolute right-0 top-0 flex h-full w-full max-w-md animate-slideDown flex-col border-l border-accent/30 bg-ink-900/95 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <p className="flex items-center gap-2 font-semibold text-slate-50"><HelpCircle className="h-5 w-5 text-accent" /> Help</p>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close help" className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div role="tablist" className="flex gap-1 border-b border-white/10 px-3 py-2">
          {TABS.map(([k, label, Icon]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${tab === k ? 'bg-accent/15 text-accent-soft' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm">
          {tab === 'page' && (
            <div>
              <h2 className="text-lg font-bold text-slate-50">{guide.title}</h2>
              <p className="mt-1 text-slate-400">{guide.what}</p>
              <ol className="mt-4 space-y-3">
                {guide.steps.map((s, i) => (
                  <li key={s} className="flex gap-3 text-slate-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-mono text-xs text-accent-soft">{i + 1}</span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">Tip: wherever you see a small <HelpCircle className="inline h-3.5 w-3.5 align-text-bottom text-accent" /> icon, hover or tap it for a plain-language explanation. Press <kbd className="rounded border border-white/20 px-1">?</kbd> any time to open this panel.</p>
            </div>
          )}
          {tab === 'terms' && (
            <div>
              <label className="relative mb-4 block">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input className="input w-full pl-9" placeholder="Search terms, e.g. SPF" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the glossary" />
              </label>
              <dl className="space-y-3">
                {terms.map((g) => (
                  <div key={g.term} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <dt className="font-semibold text-accent-soft">{g.term}</dt>
                    <dd className="mt-0.5 text-slate-200">{g.short}</dd>
                    <dd className="mt-1 text-xs text-slate-400">{g.long}</dd>
                  </div>
                ))}
                {!terms.length && <p className="text-slate-500">No terms match "{q}".</p>}
              </dl>
            </div>
          )}
          {tab === 'faq' && (
            <div className="space-y-2">
              {FAQ.map((f) => (
                <details key={f.q} className="group rounded-lg border border-white/10 bg-white/[0.03] p-3 open:border-accent/30">
                  <summary className="cursor-pointer list-none font-medium text-slate-100 marker:hidden">{f.q}</summary>
                  <p className="mt-2 text-slate-400">{f.a}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

// A short "how this page works" note. Open on a person's first visit, then it stays hidden once they close it.
export default function PageIntro({ id, title = 'How this page works', children }) {
  const key = `mr_intro_${id}`;
  const [open, setOpen] = useState(() => { try { return localStorage.getItem(key) !== '0'; } catch { return true; } });
  const set = (v) => { setOpen(v); try { localStorage.setItem(key, v ? '1' : '0'); } catch { /* storage blocked */ } };

  if (!open) {
    return (
      <button type="button" onClick={() => set(true)} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-accent">
        <Lightbulb className="h-3.5 w-3.5" /> How this page works
      </button>
    );
  }
  return (
    <aside className="panel animate-slideDown border-accent/30 bg-accent/[0.04] p-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold text-slate-100">{title}</p>
          <div className="mt-1 space-y-1 text-slate-400">{children}</div>
        </div>
        <button type="button" onClick={() => set(false)} aria-label="Hide this tip" className="rounded-md p-1 text-slate-500 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
    </aside>
  );
}

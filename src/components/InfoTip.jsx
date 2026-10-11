import { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { GLOSSARY } from '../content/knowledge';

// A small (i) icon that explains a technical term in plain words. Opens on hover, focus or tap; Esc or an outside tap closes it.
export default function InfoTip({ term, className = '' }) {
  const g = GLOSSARY[term];
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  if (!g) return null;
  return (
    <span ref={ref} className={`relative inline-flex align-middle ${className}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={`What is ${g.term}?`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        className="rounded-full text-slate-500 transition-colors hover:text-accent focus-visible:text-accent"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span role="tooltip" id={id} className="absolute left-1/2 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border border-accent/30 bg-ink-900 p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-slate-200 shadow-xl">
          <b className="block text-accent-soft">{g.term}</b>
          {g.short}
          <span className="mt-1.5 block text-slate-400">{g.long}</span>
        </span>
      )}
    </span>
  );
}

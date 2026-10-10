// MailRakshak logo: the shield mark (public/logo-mark.png) plus the name as live text,
// so it stays sharp at any size. The name is hidden on very small screens (mark only).
//   size     height class for the shield, e.g. 'h-11'
//   stacked  put the name under the shield (sign-in pages) instead of beside it
export default function Logo({ size = 'h-11', stacked = false, className = '' }) {
  return (
    <span className={`inline-flex items-center ${stacked ? 'flex-col gap-2' : 'gap-2.5'} ${className}`}>
      <img src="/logo-mark.png" alt="" width="256" height="280" draggable="false" className={`${size} w-auto select-none drop-shadow-[0_0_14px_rgba(56,189,248,0.25)]`} />
      <span className={`${stacked ? 'text-2xl' : 'hidden text-xl sm:inline'} font-bold leading-none tracking-tight text-slate-50`}>
        Mail<span className="text-[#d9ad4a]">Rakshak</span>
      </span>
    </span>
  );
}

import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Layers, ShieldCheck, RefreshCw, UploadCloud, LogOut } from 'lucide-react';
import LiveBackground from './LiveBackground';
import AlertBanner from './AlertBanner';
import { useCases } from '../context/CasesContext';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, end: true, roles: ['analyst', 'admin'] },
  { to: '/upload', label: 'Analyze email', Icon: UploadCloud, roles: ['reporter', 'analyst', 'admin'] },
  { to: '/campaigns', label: 'Campaigns', Icon: Layers, roles: ['analyst', 'admin'] },
];

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-xs text-slate-400">{t.toLocaleTimeString('en-GB', { hour12: false })} IST</span>;
}

export default function Layout() {
  const { error, refresh, lastSync } = useCases();
  const { user, logout } = useAuth();
  const link = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-accent/15 text-accent-soft' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`;

  return (
    <div className="relative min-h-screen">
      <LiveBackground />
      <AlertBanner />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2" title="Home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-50">MailRakshak</p>
              <p className="text-[11px] text-slate-500">Email threat console</p>
            </div>
          </Link>
          <nav className="ml-4 flex gap-1">
            {NAV.filter((n) => n.roles.includes(user?.role)).map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={link}>
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className={`hidden items-center gap-2 text-xs sm:flex ${error ? 'text-risk-critical' : 'text-risk-low'}`}>
              <span className={`h-2 w-2 rounded-full ${error ? 'bg-risk-critical' : 'bg-risk-low animate-blink'}`} />
              {error ? 'API unreachable' : 'Live'}
            </span>
            <Clock />
            {user && (
              <div className="hidden border-l border-white/10 pl-3 text-right leading-tight sm:block">
                <p className="max-w-[10rem] truncate text-xs text-slate-200">{user.email}</p>
                <p className="text-[11px] capitalize text-accent-soft">{user.role}</p>
              </div>
            )}
            <button onClick={refresh} className="btn px-2" aria-label="Refresh cases" title={lastSync ? `Last sync ${new Date(lastSync).toLocaleTimeString()}` : 'Refresh'}>
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={logout} className="btn px-2" aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {error && (
          <div className="panel mb-4 border-risk-critical/40 p-3 text-sm text-risk-critical">
            Could not load cases ({error}). Check that the backend is running and VITE_API_BASE_URL is correct. Retrying automatically.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}

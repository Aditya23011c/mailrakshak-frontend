import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { HelpCircle, LayoutDashboard, Layers, RefreshCw, UploadCloud, LogOut, Users } from 'lucide-react';
import LiveBackground from './LiveBackground';
import Logo from './Logo';
import AlertBanner from './AlertBanner';
import HelpDrawer from './HelpDrawer';
import { useCases } from '../context/CasesContext';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, end: true, roles: ['analyst', 'admin', 'superadmin'] },
  { to: '/upload', label: 'Analyze email', Icon: UploadCloud, roles: ['reporter', 'analyst', 'admin', 'superadmin'] },
  { to: '/campaigns', label: 'Campaigns', Icon: Layers, roles: ['analyst', 'admin', 'superadmin'] },
  { to: '/team', label: 'Team', Icon: Users, roles: ['admin', 'superadmin'] },
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
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (e.key !== '?' || e.ctrlKey || e.metaKey || /input|textarea|select/i.test(t?.tagName) || t?.isContentEditable) return;
      setHelp(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const link = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-accent/15 text-accent-soft' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`;

  return (
    <div className="relative min-h-screen">
      <LiveBackground />
      <AlertBanner />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2">
          <Link to="/" className="flex shrink-0 items-center" title="MailRakshak home" aria-label="MailRakshak home">
            <Logo size="h-11" />
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
            <button onClick={() => setHelp(true)} className="btn border-accent/30 px-2.5 text-accent-soft" aria-label="Open help" title="Help and glossary (press ?)">
              <HelpCircle className="h-4 w-4" /> <span className="hidden md:inline">Help</span>
            </button>
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
      <HelpDrawer open={help} onClose={() => setHelp(false)} />
    </div>
  );
}

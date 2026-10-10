import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import LiveBackground from '../components/LiveBackground';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { forgotPassword } from '../services/api';

const PORTALS = [
  { key: 'reporter', label: 'Reporter', blurb: 'Report a suspicious email and get a plain-language verdict. We verify your email with a one-time code.' },
  { key: 'analyst', label: 'Analyst', blurb: 'Analyst console: case triage and investigation.' },
  { key: 'admin', label: 'Admin', blurb: 'Admin console: case management, threat confirmation and report export.' },
];

const homeFor = (role) => (role === 'reporter' ? '/upload' : '/dashboard');

export default function Login() {
  const { user, signIn, requestCode, verifyCode, verifyStaffOtp, setInitialPassword, signupReporter } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;

  const [role, setRole] = useState('analyst');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  // reporter: credentials -> (signup, if no account yet) -> code
  // staff:    credentials -> otp (every login) | newpw (first login only)
  const [step, setStep] = useState('credentials');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [org, setOrg] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  if (user) return <Navigate to={from && user.role !== 'reporter' ? from : homeFor(user.role)} replace />;

  const portal = PORTALS.find((p) => p.key === role);
  const pickRole = (k) => { setRole(k); setStep('credentials'); setError(null); setInfo(null); setCode(''); setNewPw(''); setConfirmPw(''); };
  const backToStart = () => { setStep('credentials'); setCode(''); setNewPw(''); setConfirmPw(''); setInfo(null); setError(null); };

  const wrap = async (fn) => {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (e) { setError(e.message || 'Something went wrong. Please try again.'); } finally { setBusy(false); }
  };

  const submit = (e) => {
    e.preventDefault();
    const mail = email.trim();

    if (role === 'reporter') {
      if (step === 'credentials') {
        if (!mail) return setError('Enter your email address.');
        return wrap(async () => {
          try {
            await requestCode(mail);
          } catch (err) {
            if (err.status === 404) { setStep('signup'); setInfo('No reporter account exists for this email yet. Add your details to register.'); return; }
            throw err;
          }
          setStep('code');
          setInfo(`We sent a 6-digit code to ${mail}. It expires in 5 minutes.`);
        });
      }
      if (step === 'signup') {
        if (!name.trim()) return setError('Enter your name.');
        if (!/^\+?[\d\s-]{7,15}$/.test(phone.trim())) return setError('Enter a valid phone number.');
        return wrap(async () => {
          await signupReporter({ name: name.trim(), phone: phone.trim(), email: mail, organization: org.trim() || undefined });
          setStep('code');
          setInfo(`We sent a 6-digit code to ${mail}. It expires in 5 minutes.`);
        });
      }
      if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit code from your email.');
      return wrap(async () => { const u = await verifyCode(mail, code.trim()); navigate(homeFor(u.role), { replace: true }); });
    }

    // Staff (analyst / admin)
    if (step === 'forgot') {
      if (!mail) return setError('Enter your email address.');
      return wrap(async () => { const r = await forgotPassword({ email: mail }); setInfo(r?.message || 'If that email is registered, a password reset link has been sent.'); });
    }
    if (step === 'otp') {
      if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit code from your email.');
      return wrap(async () => { const u = await verifyStaffOtp(code.trim()); navigate(from || homeFor(u.role), { replace: true }); });
    }
    if (step === 'newpw') {
      if (newPw.length < 8) return setError('Use at least 8 characters for the new password.');
      if (newPw !== confirmPw) return setError('The two passwords do not match.');
      return wrap(async () => { const u = await setInitialPassword(newPw); navigate(from || homeFor(u.role), { replace: true }); });
    }
    if (!mail) return setError('Enter your email address.');
    if (!password) return setError('Enter your password.');
    return wrap(async () => {
      try {
        const u = await signIn(role, mail, password);
        navigate(from || homeFor(u.role), { replace: true });
      } catch (err) {
        if (err.pending === 'MFA') { setStep('otp'); setInfo(`We emailed a 6-digit code to ${mail}.`); return; }
        if (err.pending === 'PASSWORD_CHANGE') { setStep('newpw'); setInfo('This is your first sign-in. Choose a new password to continue.'); return; }
        throw err;
      }
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <LiveBackground />
      <div className="panel w-full max-w-md animate-slideDown p-7">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100"><ArrowLeft className="h-3.5 w-3.5" /> Back to home</Link>
        <div className="mb-3 flex justify-center">
          <Logo size="h-20" stacked />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-slate-50">Sign in to continue</h1>
        <p className="mt-1 text-sm text-slate-400">Choose the portal you are signing in to.</p>

        <div role="tablist" aria-label="Portal" className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-ink-800/70 p-1">
          {PORTALS.map((p) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={role === p.key}
              onClick={() => pickRole(p.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${role === p.key ? 'bg-accent/20 text-accent-soft shadow-[0_0_0_1px_rgba(34,255,156,.45)]' : 'text-slate-400 hover:text-slate-100'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">{portal.blurb}</p>

        <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-300">Email</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                autoComplete="email"
                autoFocus
                className="input w-full pl-9 disabled:opacity-60"
                placeholder="you@example.com"
                value={email}
                disabled={step !== 'credentials' && step !== 'forgot'}
                onChange={(e) => setEmail(e.target.value)}
              />
            </span>
          </label>

          {role !== 'reporter' && step === 'credentials' && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-300">Password</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input w-full px-9"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)} className="absolute right-2 top-1.5 rounded-md p-1 text-slate-400 hover:text-white">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
              <button type="button" onClick={() => { setStep('forgot'); setError(null); setInfo(null); }} className="mt-1.5 text-xs text-accent-soft hover:underline">Forgot your password?</button>
            </label>
          )}

          {role === 'reporter' && step === 'signup' && (
            <div className="animate-pop space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-300">Full name</span>
                <input autoComplete="name" autoFocus className="input w-full" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-300">Phone number</span>
                <input type="tel" autoComplete="tel" className="input w-full" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <span className="mt-1 block text-[11px] text-slate-500">Used for contact only. Verification codes go to your email.</span>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-300">Organization <span className="text-slate-500">(optional)</span></span>
                <input autoComplete="organization" className="input w-full" placeholder="Your organization" value={org} onChange={(e) => setOrg(e.target.value)} />
              </label>
            </div>
          )}

          {role !== 'reporter' && step === 'newpw' && (
            <div className="animate-pop space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-300">New password</span>
                <input type={show ? 'text' : 'password'} autoComplete="new-password" autoFocus className="input w-full" placeholder="At least 8 characters" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-300">Confirm new password</span>
                <input type={show ? 'text' : 'password'} autoComplete="new-password" className="input w-full" placeholder="Repeat the new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
              </label>
            </div>
          )}

          {((role === 'reporter' && step === 'code') || (role !== 'reporter' && step === 'otp')) && (
            <label className="block animate-pop">
              <span className="mb-1 block text-xs font-medium text-slate-300">Verification code</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                className="input w-full text-center font-mono text-xl tracking-[0.5em]"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </label>
          )}

          {info && <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent-soft">{info}</p>}
          {error && <p role="alert" className="rounded-lg border border-risk-critical/40 bg-risk-critical/10 px-3 py-2 text-sm text-risk-critical">{error}</p>}

          <button type="submit" disabled={busy} className="btn w-full justify-center border-accent/40 bg-accent/20 py-2.5 font-semibold text-accent-soft hover:bg-accent/30 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {role === 'reporter'
              ? (step === 'credentials' ? 'Send verification code' : step === 'signup' ? 'Register and send code' : 'Verify and continue')
              : (step === 'otp' ? 'Verify and sign in' : step === 'newpw' ? 'Set password and sign in' : step === 'forgot' ? 'Send reset link' : 'Sign in')}
          </button>

          {step !== 'credentials' && (
            <button type="button" onClick={backToStart} className="mx-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100">
              <ArrowLeft className="h-3.5 w-3.5" /> {role === 'reporter' ? 'Use a different email' : 'Back to sign in'}
            </button>
          )}
        </form>

      </div>
    </div>
  );
}

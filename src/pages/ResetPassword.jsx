import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Lock } from 'lucide-react';
import LiveBackground from '../components/LiveBackground';
import Logo from '../components/Logo';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') || '');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!token.trim()) return setError('Paste the reset code from your email.');
    if (pw.length < 8) return setError('Use at least 8 characters for the new password.');
    if (pw !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      await resetPassword({ token: token.trim(), newPassword: pw });
      setDone(true);
    } catch (err) {
      if (err.payload?.error === 'INVALID_OR_EXPIRED_TOKEN') setExpired(true);
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <LiveBackground />
      <div className="panel w-full max-w-md animate-slideDown p-7">
        <Link to="/login" className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</Link>
        <div className="mb-3 flex justify-center">
          <Logo size="h-16" stacked />
        </div>
        <h1 className="mb-5 text-lg font-bold text-slate-50">Reset your password</h1>

        {done ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-risk-low" />
            <p className="text-sm text-slate-300">Your password has been reset. You can now sign in with it.</p>
            <Link to="/login" className="btn w-full justify-center border-accent/40 bg-accent/20 py-2.5 font-semibold text-accent-soft hover:bg-accent/30">Go to sign in</Link>
          </div>
        ) : expired ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-300">This reset link is no longer valid. Links expire after 30 minutes and work only once.</p>
            <Link to="/login" className="btn w-full justify-center border-accent/40 bg-accent/20 py-2.5 font-semibold text-accent-soft hover:bg-accent/30">Request a new reset link</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            {!params.get('token') && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-300">Reset code from your email</span>
                <input className="input w-full font-mono" autoFocus value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste the code" />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-300">New password</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input type="password" autoComplete="new-password" className="input w-full pl-9" placeholder="At least 8 characters" value={pw} onChange={(e) => setPw(e.target.value)} />
              </span>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-300">Confirm new password</span>
              <input type="password" autoComplete="new-password" className="input w-full" placeholder="Repeat the new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            {error && <p role="alert" className="rounded-lg border border-risk-critical/40 bg-risk-critical/10 px-3 py-2 text-sm text-risk-critical">{error}</p>}
            <button type="submit" disabled={busy} className="btn w-full justify-center border-accent/40 bg-accent/20 py-2.5 font-semibold text-accent-soft hover:bg-accent/30 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

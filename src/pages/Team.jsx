import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Loader2, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { assignableRoles, creatableRoles, ROLE_LABEL } from '../lib/roles';
import { changeUserRole, fetchAnalysts, fetchUsers, registerStaffAccount } from '../services/api';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
function tempPassword() {
  const buf = new Uint32Array(12);
  crypto.getRandomValues(buf);
  return `${Array.from(buf, (n) => CHARS[n % CHARS.length]).join('')}#7`;
}

const ROLE_STYLE = {
  superadmin: 'border-risk-critical/40 bg-risk-critical/10 text-risk-critical',
  admin: 'border-accent/40 bg-accent/10 text-accent-soft',
  analyst: 'border-white/15 bg-white/5 text-slate-300',
};

export default function Team() {
  const { user } = useAuth();
  const roles = creatableRoles(user.role);

  const [members, setMembers] = useState(null);
  const [listNote, setListNote] = useState(null);
  const [listError, setListError] = useState(null);

  const [form, setForm] = useState({ name: '', email: '', password: tempPassword(), role: roles[0] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rowBusy, setRowBusy] = useState(null);

  const load = useCallback(async () => {
    setListError(null);
    setListNote(null);
    try {
      setMembers(await fetchUsers());
    } catch (e) {
      if (e.status === 404 || e.status === 405) {
        // The server has no user-list route yet: fall back to the analysts list so the page still works.
        try {
          setMembers((await fetchAnalysts()).map((a) => ({ ...a, role: 'analyst' })));
          setListNote('The server cannot list admins yet, so only analysts are shown.');
        } catch (e2) { setMembers([]); setListError(e2.message); }
      } else { setMembers([]); setListError(e.message); }
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setCreated(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Enter a valid email address.');
    if (form.password.length < 8) return setError('The temporary password needs at least 8 characters.');
    setBusy(true);
    try {
      await registerStaffAccount({ email: form.email.trim(), password: form.password, role: form.role, name: form.name.trim() || undefined });
      setCreated({ email: form.email.trim(), role: form.role, password: form.password });
      setForm({ name: '', email: '', password: tempPassword(), role: roles[0] });
      load();
    } catch (err) {
      setError(err.status === 403 ? 'You are not allowed to create that kind of account.' : err.message);
    } finally { setBusy(false); }
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  const setRole = async (m, role) => {
    setRowBusy(m.id);
    setListError(null);
    try { await changeUserRole(m.id, role); await load(); } catch (err) { setListError(err.message); } finally { setRowBusy(null); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50"><Users className="h-5 w-5 text-accent" /> Team management</h1>
        <p className="mt-1 text-sm text-slate-400">
          {user.role === 'superadmin'
            ? 'As super admin you can add admins and analysts, and change anyone\'s role.'
            : 'As an admin you can add analysts to the team.'}
        </p>
      </div>

      <section className="panel p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100"><UserPlus className="h-4 w-4 text-accent" /> Add a team member</h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-300">Name <span className="text-slate-500">(optional)</span></span>
            <input className="input w-full" value={form.name} onChange={set('name')} placeholder="Full name" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-300">Email</span>
            <input type="email" className="input w-full" value={form.email} onChange={set('email')} placeholder="name@organization.com" autoComplete="off" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-300">Temporary password</span>
            <span className="flex gap-2">
              <input className="input w-full font-mono" value={form.password} onChange={set('password')} autoComplete="off" />
              <button type="button" title="Generate a new one" onClick={() => setForm((f) => ({ ...f, password: tempPassword() }))} className="btn px-3"><KeyRound className="h-4 w-4" /></button>
              <button type="button" title="Copy" onClick={() => copy(form.password)} className="btn px-3">{copied ? <Check className="h-4 w-4 text-risk-low" /> : <Copy className="h-4 w-4" />}</button>
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-300">Role</span>
            <select className="input w-full" value={form.role} onChange={set('role')} disabled={roles.length < 2}>
              {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </label>
          <div className="sm:col-span-2">
            {error && <p role="alert" className="mb-3 rounded-lg border border-risk-critical/40 bg-risk-critical/10 px-3 py-2 text-sm text-risk-critical">{error}</p>}
            {created && (
              <div className="mb-3 rounded-lg border border-risk-low/40 bg-risk-low/10 px-3 py-2 text-sm text-slate-200">
                <p>Added <b>{created.email}</b> as {ROLE_LABEL[created.role]}. Share this temporary password with them privately; they must choose a new one at first sign-in:</p>
                <p className="mt-1 flex items-center gap-2 font-mono text-risk-low">{created.password}
                  <button type="button" onClick={() => copy(created.password)} className="text-slate-400 hover:text-slate-100"><Copy className="h-3.5 w-3.5" /></button>
                </p>
              </div>
            )}
            <button type="submit" disabled={busy} className="btn border-accent/40 bg-accent/20 px-5 py-2 font-semibold text-accent-soft hover:bg-accent/30 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add to team'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Team members {members && <span className="ml-1 font-mono text-slate-500">{members.length}</span>}</h2>
          {members === null && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
        {listNote && <p className="border-b border-white/5 px-5 py-2 text-xs text-slate-400">{listNote}</p>}
        {listError && <p role="alert" className="border-b border-white/5 px-5 py-2 text-xs text-risk-critical">{listError}</p>}
        {members && members.length === 0 && !listError && <p className="px-5 py-6 text-sm text-slate-400">No team members yet.</p>}
        {members && members.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr><th className="px-5 py-2 font-medium">Member</th><th className="px-5 py-2 font-medium">Role</th><th className="px-5 py-2 font-medium">Change role</th></tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const options = assignableRoles(user, m);
                  return (
                    <tr key={m.id} className="border-t border-white/5">
                      <td className="px-5 py-3">
                        <p className="text-slate-100">{m.name || m.email}{m.id === user.id && <span className="ml-2 text-xs text-slate-500">(you)</span>}</p>
                        {m.name && <p className="text-xs text-slate-500">{m.email}</p>}
                      </td>
                      <td className="px-5 py-3"><span className={`rounded-md border px-2 py-0.5 text-xs ${ROLE_STYLE[m.role] || ROLE_STYLE.analyst}`}>{ROLE_LABEL[m.role] || m.role}</span></td>
                      <td className="px-5 py-3">
                        {options.length ? (
                          <span className="flex items-center gap-2">
                            <select className="input py-1 text-xs" value={m.role} disabled={rowBusy === m.id} onChange={(e) => setRole(m, e.target.value)}>
                              {options.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                            </select>
                            {rowBusy === m.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                          </span>
                        ) : <span className="text-xs text-slate-600">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

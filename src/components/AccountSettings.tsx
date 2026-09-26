import React, { useEffect, useState } from 'react';
import { KeyRound, Mail, Trash2, AlertCircle, CheckCircle2, Loader, ShieldAlert, LogOut, Copy } from 'lucide-react';
import { ApiKeySummary } from '../types';

interface AccountSettingsProps {
  currentEmail: string;
  onEmailChanged: (newEmail: string) => void;
  onAccountDeleted: () => void;
}

function useAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
}

export default function AccountSettings({ currentEmail, onEmailChanged, onAccountDeleted }: AccountSettingsProps) {
  // Change password
  const [currentPasswordForPw, setCurrentPasswordForPw] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [isPwLoading, setIsPwLoading] = useState(false);

  // Change email
  const [newEmail, setNewEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // Sign out everywhere
  const [logoutMsg, setLogoutMsg] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  // API keys
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [keyName, setKeyName] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isKeyLoading, setIsKeyLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const loadKeys = async () => {
    try {
      const res = await fetch('/api/api-keys', { headers: useAuthHeaders() });
      if (res.ok) setApiKeys(await res.json());
    } catch {
      // Non-fatal: the section just shows an empty list.
    }
  };

  useEffect(() => { loadKeys(); }, []);

  const handleLogoutAll = async () => {
    setLogoutMsg('');
    setLogoutError('');
    setIsLogoutLoading(true);
    try {
      const res = await fetch('/api/auth/logout-all', { method: 'POST', headers: useAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign out other sessions');
      // Every older token is now revoked; keep this tab signed in with the fresh one.
      if (data.token) localStorage.setItem('token', data.token);
      setLogoutMsg('All other sessions have been signed out.');
    } catch (err: any) {
      setLogoutError(err.message);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    setNewKey(null);
    setKeyCopied(false);
    setIsKeyLoading(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: useAuthHeaders(),
        body: JSON.stringify({ name: keyName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create API key');
      setNewKey(data.key);
      setKeyName('');
      await loadKeys();
    } catch (err: any) {
      setKeyError(err.message);
    } finally {
      setIsKeyLoading(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Revoke this API key? Anything using it will stop working immediately.')) return;
    setKeyError('');
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE', headers: useAuthHeaders() });
      if (!res.ok) throw new Error('Failed to revoke API key');
      await loadKeys();
    } catch (err: any) {
      setKeyError(err.message);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setKeyCopied(true);
    } catch {
      setKeyError('Could not copy automatically — select the key and copy it manually.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setPwError('New passwords do not match');
      return;
    }

    setIsPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PATCH',
        headers: useAuthHeaders(),
        body: JSON.stringify({ currentPassword: currentPasswordForPw, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');

      // Changing the password revokes every existing token, including this tab's; the server
      // returns a fresh one so the user stays signed in.
      if (data.token) localStorage.setItem('token', data.token);
      setPwSuccess(true);
      setCurrentPasswordForPw('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPwError(err.message);
    } finally {
      setIsPwLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess(false);
    setIsEmailLoading(true);

    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'PATCH',
        headers: useAuthHeaders(),
        body: JSON.stringify({ newEmail, currentPassword: currentPasswordForEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change email');

      setEmailSuccess(true);
      onEmailChanged(data.email);
      setCurrentPasswordForEmail('');
      setNewEmail('');
    } catch (err: any) {
      setEmailError(err.message);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    setIsDeleteLoading(true);

    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: useAuthHeaders(),
        body: JSON.stringify({ currentPassword: deletePassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');

      localStorage.removeItem('token');
      onAccountDeleted();
    } catch (err: any) {
      setDeleteError(err.message);
      setIsDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Change Password */}
      <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
          <KeyRound className="h-5 w-5 text-blue-400" />
          Change Password
        </h3>
        <p className="text-xs text-slate-400 mb-5">Requires your current password to confirm it's you.</p>

        {pwError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{pwError}</p>
          </div>
        )}
        {pwSuccess && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-300">Password updated successfully.</p>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={currentPasswordForPw}
            onChange={(e) => setCurrentPasswordForPw(e.target.value)}
            required
            disabled={isPwLoading}
            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <input
            type="password"
            placeholder="New password (min 8 chars, 1 letter, 1 number)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={isPwLoading}
            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            disabled={isPwLoading}
            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPwLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isPwLoading && <Loader className="h-4 w-4 animate-spin" />}
            {isPwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Change Email */}
      <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
          <Mail className="h-5 w-5 text-indigo-400" />
          Change Email Address
        </h3>
        <p className="text-xs text-slate-400 mb-1">Current: <span className="text-slate-300 font-mono">{currentEmail}</span></p>
        <p className="text-xs text-slate-400 mb-5">Requires your current password to confirm it's you.</p>

        {emailError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{emailError}</p>
          </div>
        )}
        {emailSuccess && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-300">Email updated successfully.</p>
          </div>
        )}

        <form onSubmit={handleChangeEmail} className="space-y-3">
          <input
            type="email"
            placeholder="New email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            disabled={isEmailLoading}
            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <input
            type="password"
            placeholder="Current password"
            value={currentPasswordForEmail}
            onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
            required
            disabled={isEmailLoading}
            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isEmailLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isEmailLoading && <Loader className="h-4 w-4 animate-spin" />}
            {isEmailLoading ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      </div>

      {/* Sign out everywhere */}
      <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
          <LogOut className="h-5 w-5 text-amber-400" />
          Sign Out Everywhere
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Ends every other browser session signed in to this account. This tab stays signed in. API keys are not affected.
        </p>
        {logoutError && <p className="mb-3 text-xs text-red-300">{logoutError}</p>}
        {logoutMsg && <p className="mb-3 text-xs text-emerald-300">{logoutMsg}</p>}
        <button
          onClick={handleLogoutAll}
          disabled={isLogoutLoading}
          className="flex items-center gap-2 text-sm font-bold text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50 rounded-lg px-4 py-2.5 transition disabled:opacity-50 cursor-pointer"
        >
          {isLogoutLoading && <Loader className="h-4 w-4 animate-spin" />}
          Sign out other sessions
        </button>
      </div>

      {/* API keys */}
      <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
          <KeyRound className="h-5 w-5 text-emerald-400" />
          API Keys
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Keys let scripts and CI start scans and read results. They cannot change your password, email or keys.
        </p>

        {keyError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{keyError}</p>
          </div>
        )}

        {newKey && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
            <p className="text-xs text-amber-200 font-bold">Copy this key now. You won't see it again.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-white bg-black/40 rounded px-2.5 py-2 break-all select-all">{newKey}</code>
              <button
                onClick={copyKey}
                className="flex items-center gap-1 text-xs font-bold text-slate-200 border border-white/20 hover:border-white/40 rounded-lg px-2.5 py-2 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" /> {keyCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreateKey} className="flex gap-2 mb-4">
          <input
            placeholder="Key name (e.g. CI pipeline)"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            required
            maxLength={80}
            disabled={isKeyLoading}
            className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isKeyLoading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isKeyLoading && <Loader className="h-4 w-4 animate-spin" />}
            Create key
          </button>
        </form>

        {apiKeys.length === 0 ? (
          <p className="text-xs text-slate-500 mb-4">No API keys yet.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {apiKeys.map(k => (
              <li key={k.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{k.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {k.prefix}… · created {new Date(k.createdAt).toLocaleDateString()} ·{' '}
                    {k.lastUsedAt ? `last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : 'never used'}
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeKey(k.id)}
                  className="text-xs font-bold text-red-400 hover:text-red-300 px-2 py-1 rounded-md hover:bg-red-500/10 cursor-pointer"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Example</div>
        <pre className="text-[11px] font-mono text-slate-300 bg-black/40 rounded-lg p-3 overflow-x-auto">{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/scan \
  -H "Authorization: Bearer ssp_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"example.com"}'`}</pre>
      </div>

      {/* Delete Account */}
      <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl border-2 border-red-500/20">
        <h3 className="text-lg font-bold text-red-300 flex items-center gap-2 mb-1">
          <ShieldAlert className="h-5 w-5" />
          Danger Zone
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Permanently deletes your account, all scans, and all settings. This cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg px-4 py-2.5 transition cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete My Account
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="space-y-3">
            {deleteError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{deleteError}</p>
              </div>
            )}
            <p className="text-xs text-red-300 font-semibold">
              Enter your password to permanently delete your account.
            </p>
            <input
              type="password"
              placeholder="Current password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
              disabled={isDeleteLoading}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-red-500/30 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isDeleteLoading}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleteLoading && <Loader className="h-4 w-4 animate-spin" />}
                {isDeleteLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                disabled={isDeleteLoading}
                className="px-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm py-2.5 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

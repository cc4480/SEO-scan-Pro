import React, { useState } from 'react';
import { KeyRound, Mail, Trash2, AlertCircle, CheckCircle2, Loader, ShieldAlert } from 'lucide-react';

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

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

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

'use client';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  X, ChevronLeft, Lock, LogOut, Eye, EyeOff,
  CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import api from '@/lib/axios';
import { clearCredentials } from '@/store/slices/authSlice';
import ProfilePictureEditor from '@/components/common/ProfilePictureEditor';

/**
 * UserProfileDropdown
 *
 * LeetCode-style profile panel triggered by clicking the user chip.
 * Three internal views (no page navigation):
 *  - 'profile'           → avatar, username, email, actions
 *  - 'change-password'   → old / new / confirm password
 *  - 'forgot-password'   → email → code + new password
 */
export default function UserProfileDropdown({ editable = true }) {
  const dispatch = useDispatch();
  const router   = useRouter();
  const user     = useSelector(s => s.auth.user);
  const [open, setOpen]   = useState(false);
  const [view, setView]   = useState('profile');   // 'profile' | 'change-password' | 'forgot-password'
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (open && panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
        setView('profile');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const close = () => { setOpen(false); setView('profile'); };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    dispatch(clearCredentials());
    router.push('/login');
  };

  const initials = user?.username?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Trigger chip ─────────────────────────────────────────────── */}
      <button
        id="profile-chip-btn"
        onClick={() => { setOpen(o => !o); setView('profile'); }}
        className="flex items-center gap-2 px-2 py-1.5 bg-white/80 border border-slate-200 rounded-full shadow-sm hover:border-slate-300 hover:bg-white transition-all"
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        {/* tiny avatar in chip */}
        <span className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
          {user?.profilePictureKey
            ? <ProfilePictureEditor
                userId={user?.id}
                username={user?.username}
                photoKey={user?.profilePictureKey}
                size="w-6 h-6"
                editable={false}
              />
            : initials
          }
        </span>
        <span className="text-sm font-semibold text-slate-800 pr-1 max-w-[100px] truncate">
          {user?.username}
        </span>
      </button>

      {/* ── Dropdown panel ───────────────────────────────────────────── */}
      {open && (
        <div className="
          absolute right-0 top-[calc(100%+10px)] z-[100]
          w-72 bg-white rounded-2xl shadow-2xl shadow-slate-900/15
          border border-slate-100 overflow-hidden
          animate-in fade-in slide-in-from-top-2 duration-150
        ">
          {/* ── VIEW: profile ──────────────────────────────────────── */}
          {view === 'profile' && (
            <ProfileView
              user={user}
              editable={editable}
              onChangePassword={() => setView('change-password')}
              onForgotPassword={() => setView('forgot-password')}
              onLogout={handleLogout}
              onClose={close}
            />
          )}

          {/* ── VIEW: change password ──────────────────────────────── */}
          {view === 'change-password' && (
            <ChangePasswordView
              onBack={() => setView('profile')}
              onForgot={() => setView('forgot-password')}
              onClose={close}
            />
          )}

          {/* ── VIEW: forgot password ──────────────────────────────── */}
          {view === 'forgot-password' && (
            <ForgotPasswordView
              onBack={() => setView('change-password')}
              onClose={close}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-view: Profile
// ─────────────────────────────────────────────────────────────────────────────
function ProfileView({ user, editable, onChangePassword, onForgotPassword, onLogout, onClose }) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Profile</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Avatar + info */}
      <div className="flex flex-col items-center gap-2 px-5 py-5">
        <div className="relative group/profilepic">
          <ProfilePictureEditor
            userId={user?.id}
            username={user?.username}
            photoKey={user?.profilePictureKey}
            size="w-16 h-16"
            editable={editable}
          />
          {editable && (
            <span className="
              absolute -bottom-0.5 -right-0.5
              w-5 h-5 rounded-full bg-slate-900 ring-2 ring-white
              flex items-center justify-center
              pointer-events-none
            ">
              {/* pencil icon */}
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 1 1 3.182 3.182L6.75 21H3v-3.75L16.862 4.487z" />
              </svg>
            </span>
          )}
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-900 text-base leading-tight">{user?.username}</p>
          <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
        </div>
      </div>

      <div className="h-px bg-slate-100 mx-4" />

      {/* Actions */}
      <div className="p-2">
        <button
          onClick={onChangePassword}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left font-medium"
        >
          <Lock className="w-4 h-4 text-slate-400" />
          Change Password
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-view: Change Password (old → new → confirm)
// ─────────────────────────────────────────────────────────────────────────────
function ChangePasswordView({ onBack, onForgot, onClose }) {
  const [oldPass, setOldPass]         = useState('');
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld, setShowOld]         = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPass !== confirmPass) {
      setError('New password and confirm password do not match.');
      return;
    }
    if (newPass.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: oldPass,
        newPassword: newPass,
      });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Change Password</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 pb-5">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700 text-center">Password changed!</p>
            <p className="text-xs text-slate-400 text-center">You'll be signed out on other devices.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 font-medium leading-snug">{error}</p>
              </div>
            )}

            <PasswordField
              label="Current Password"
              value={oldPass}
              onChange={e => setOldPass(e.target.value)}
              show={showOld}
              onToggle={() => setShowOld(s => !s)}
              disabled={loading}
              autoComplete="current-password"
            />
            <PasswordField
              label="New Password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              show={showNew}
              onToggle={() => setShowNew(s => !s)}
              disabled={loading}
              autoComplete="new-password"
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              show={showConfirm}
              onToggle={() => setShowConfirm(s => !s)}
              disabled={loading}
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={loading || !oldPass || !newPass || !confirmPass}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Saving…' : 'Change Password'}
            </button>

            <button
              type="button"
              onClick={onForgot}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors pt-1"
            >
              Forgot your password?
            </button>
          </form>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-view: Forgot Password (email → code + new password — inline, no redirect)
// ─────────────────────────────────────────────────────────────────────────────
function ForgotPasswordView({ onBack, onClose }) {
  const [step, setStep]   = useState(1); // 1=email  2=code+newPass
  const [email, setEmail] = useState('');
  const [code, setCode]   = useState('');
  const [newPass, setNewPass]     = useState('');
  const [showNew, setShowNew]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  const sendCode = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to send reset code.');
    } finally { setLoading(false); }
  };

  const resetPass = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, newPassword: newPass });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to reset password.');
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {step === 1 ? 'Forgot Password' : 'Enter Reset Code'}
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 pb-5">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700 text-center">Password reset!</p>
            <p className="text-xs text-slate-400 text-center">Please log in with your new password.</p>
          </div>
        ) : step === 1 ? (
          <form onSubmit={sendCode} className="space-y-3">
            {error && <ErrorBanner message={error} />}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="name@clashcode.com"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Sending…' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPass} className="space-y-3">
            {error && <ErrorBanner message={error} />}
            <p className="text-xs text-slate-500">Code sent to <strong>{email}</strong></p>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">6-Digit Code</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                maxLength={6}
                disabled={loading}
                placeholder="000000"
                className="w-full px-3 py-2 text-lg text-center font-mono tracking-[0.5em] border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              />
            </div>
            <PasswordField
              label="New Password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              show={showNew}
              onToggle={() => setShowNew(s => !s)}
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={loading || !code || !newPass}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────
function PasswordField({ label, value, onChange, show, onToggle, disabled, autoComplete }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className="w-full px-3 py-2 pr-9 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
      <p className="text-xs text-red-600 font-medium leading-snug">{message}</p>
    </div>
  );
}

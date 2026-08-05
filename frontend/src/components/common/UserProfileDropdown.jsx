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

export default function UserProfileDropdown({ editable = true }) {
  const dispatch = useDispatch();
  const router   = useRouter();
  const user     = useSelector(s => s.auth.user);
  const [open, setOpen]   = useState(false);
  const [view, setView]   = useState('profile');
  const panelRef = useRef(null);

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
      <button
        id="profile-chip-btn"
        onClick={() => { setOpen(o => !o); setView('profile'); }}
        className="flex items-center gap-3 px-3 py-2 border-2 border-retro-ink bg-white shadow-retro transition-all hover:bg-retro-paper active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm"
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        <span className="w-8 h-8 border-2 border-retro-ink bg-retro-blue flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden shadow-retro-sm">
          {user?.profilePictureKey
            ? <ProfilePictureEditor
                userId={user?.id}
                username={user?.username}
                photoKey={user?.profilePictureKey}
                size="w-8 h-8"
                editable={false}
              />
            : initials
          }
        </span>
        <span className="text-sm font-black uppercase text-retro-ink pr-1 max-w-[120px] truncate">
          {user?.username}
        </span>
      </button>

      {open && (
        <div className="
          absolute right-0 top-[calc(100%+12px)] z-[100]
          w-80 bg-white border-2 border-retro-ink shadow-retro
          animate-in fade-in slide-in-from-top-2 duration-150
        ">
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

          {view === 'change-password' && (
            <ChangePasswordView
              onBack={() => setView('profile')}
              onForgot={() => setView('forgot-password')}
              onClose={close}
            />
          )}

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

function ProfileView({ user, editable, onChangePassword, onLogout, onClose }) {
  return (
    <>
      <div className="flex items-center justify-between px-5 pt-5 pb-2 border-b-2 border-retro-ink bg-retro-paper">
        <span className="text-xs font-mono font-black text-retro-ink uppercase tracking-widest">Profile</span>
        <button onClick={onClose} className="w-6 h-6 border-2 border-retro-ink bg-white flex items-center justify-center shadow-retro-sm hover:bg-retro-orange hover:text-white transition-colors">
          <X className="w-4 h-4" strokeWidth={3} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 px-5 py-6 border-b-2 border-retro-ink">
        <div className="relative group/profilepic">
          <ProfilePictureEditor
            userId={user?.id}
            username={user?.username}
            photoKey={user?.profilePictureKey}
            size="w-20 h-20"
            editable={editable}
          />
          {editable && (
            <span className="
              absolute -bottom-1 -right-1
              w-6 h-6 border-2 border-retro-ink bg-retro-yellow
              flex items-center justify-center shadow-retro-sm
              pointer-events-none
            ">
              <svg className="w-3 h-3 text-retro-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 1 1 3.182 3.182L6.75 21H3v-3.75L16.862 4.487z" />
              </svg>
            </span>
          )}
        </div>
        <div className="text-center">
          <p className="font-sans font-black text-retro-ink text-2xl uppercase tracking-tighter">{user?.username}</p>
          <p className="text-xs font-mono font-bold text-retro-muted mt-1 uppercase">{user?.email}</p>
        </div>
      </div>

      <div className="p-4 bg-retro-cream">
        <button
          onClick={onChangePassword}
          className="w-full flex items-center gap-3 px-4 py-3 border-2 border-retro-ink bg-white shadow-retro-sm hover:bg-retro-paper active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-left font-sans font-black uppercase text-sm text-retro-ink transition-all mb-3"
        >
          <div className="w-6 h-6 flex items-center justify-center border-2 border-retro-ink bg-retro-blue text-white shadow-retro-sm">
            <Lock className="w-3.5 h-3.5" strokeWidth={3} />
          </div>
          Change Password
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 border-2 border-retro-ink bg-retro-orange text-white shadow-retro-sm hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-left font-sans font-black uppercase text-sm transition-all"
        >
          <div className="w-6 h-6 flex items-center justify-center border-2 border-retro-ink bg-white text-retro-orange shadow-retro-sm">
            <LogOut className="w-3.5 h-3.5" strokeWidth={3} />
          </div>
          Logout
        </button>
      </div>
    </>
  );
}

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
    e.preventDefault(); setError('');
    if (newPass !== confirmPass) return setError('Passwords do not match.');
    if (newPass.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword: oldPass, newPassword: newPass });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to change password.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-5 pb-2 border-b-2 border-retro-ink bg-retro-paper">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-6 h-6 border-2 border-retro-ink bg-white flex items-center justify-center shadow-retro-sm hover:bg-retro-paper transition-colors">
            <ChevronLeft className="w-4 h-4 text-retro-ink" strokeWidth={3} />
          </button>
          <span className="text-xs font-mono font-black text-retro-ink uppercase tracking-widest">Change Password</span>
        </div>
        <button onClick={onClose} className="w-6 h-6 border-2 border-retro-ink bg-white flex items-center justify-center shadow-retro-sm hover:bg-retro-orange hover:text-white transition-colors">
          <X className="w-4 h-4" strokeWidth={3} />
        </button>
      </div>

      <div className="px-5 py-5 bg-retro-cream">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-retro-mint" strokeWidth={3} />
            <p className="font-sans font-black uppercase text-xl text-retro-ink">Password updated!</p>
            <p className="text-xs font-mono font-bold text-retro-muted uppercase">You'll be signed out elsewhere.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorBanner message={error} />}
            <PasswordField label="Current" value={oldPass} onChange={e => setOldPass(e.target.value)} show={showOld} onToggle={() => setShowOld(s => !s)} disabled={loading} />
            <PasswordField label="New" value={newPass} onChange={e => setNewPass(e.target.value)} show={showNew} onToggle={() => setShowNew(s => !s)} disabled={loading} />
            <PasswordField label="Confirm" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} show={showConfirm} onToggle={() => setShowConfirm(s => !s)} disabled={loading} />
            
            <button
              type="submit" disabled={loading || !oldPass || !newPass || !confirmPass}
              className="w-full flex items-center justify-center gap-2 bg-retro-orange border-2 border-retro-ink text-white font-sans font-black uppercase shadow-retro hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm py-3 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={3} />}
              {loading ? 'Saving...' : 'Save Password'}
            </button>
            <button type="button" onClick={onForgot} className="w-full text-center text-[10px] font-mono font-bold uppercase tracking-widest text-retro-muted hover:text-retro-ink transition-colors mt-2">
              Forgot password?
            </button>
          </form>
        )}
      </div>
    </>
  );
}

function ForgotPasswordView({ onBack, onClose }) {
  const [step, setStep]   = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode]   = useState('');
  const [newPass, setNewPass] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const sendCode = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await api.post('/auth/forgot-password', { email }); setStep(2); } catch (err) { setError(err?.response?.data?.message ?? 'Failed to send.'); } finally { setLoading(false); }
  };
  const resetPass = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await api.post('/auth/reset-password', { email, code, newPassword: newPass }); setSuccess(true); } catch (err) { setError(err?.response?.data?.message ?? 'Failed to reset.'); } finally { setLoading(false); }
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-5 pb-2 border-b-2 border-retro-ink bg-retro-paper">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-6 h-6 border-2 border-retro-ink bg-white flex items-center justify-center shadow-retro-sm hover:bg-retro-paper transition-colors">
            <ChevronLeft className="w-4 h-4 text-retro-ink" strokeWidth={3} />
          </button>
          <span className="text-xs font-mono font-black text-retro-ink uppercase tracking-widest">{step === 1 ? 'Recover' : 'Reset'}</span>
        </div>
        <button onClick={onClose} className="w-6 h-6 border-2 border-retro-ink bg-white flex items-center justify-center shadow-retro-sm hover:bg-retro-orange hover:text-white transition-colors">
          <X className="w-4 h-4" strokeWidth={3} />
        </button>
      </div>

      <div className="px-5 py-5 bg-retro-cream">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-retro-mint" strokeWidth={3} />
            <p className="font-sans font-black uppercase text-xl text-retro-ink">Password reset!</p>
            <p className="text-xs font-mono font-bold text-retro-muted uppercase">Log in with new password.</p>
          </div>
        ) : step === 1 ? (
          <form onSubmit={sendCode} className="space-y-4">
            {error && <ErrorBanner message={error} />}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-retro-muted mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} className="w-full px-3 py-3 border-2 border-retro-ink bg-white font-sans font-bold text-retro-ink shadow-retro-sm focus:outline-none focus:border-retro-orange focus:translate-y-[-2px] focus:shadow-retro transition-all disabled:opacity-50" />
            </div>
            <button type="submit" disabled={loading || !email} className="w-full flex items-center justify-center gap-2 bg-retro-ink border-2 border-retro-ink text-white font-sans font-black uppercase shadow-retro hover:bg-retro-orange active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm py-3 transition-all disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={3} />}
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPass} className="space-y-4">
            {error && <ErrorBanner message={error} />}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-retro-muted mb-1.5">6-Digit Code</label>
              <input value={code} onChange={e => setCode(e.target.value)} required maxLength={6} disabled={loading} className="w-full px-3 py-3 text-center border-2 border-retro-ink bg-white font-mono font-black text-xl tracking-[0.5em] text-retro-ink shadow-retro-sm focus:outline-none focus:border-retro-orange focus:translate-y-[-2px] focus:shadow-retro transition-all disabled:opacity-50 uppercase" />
            </div>
            <PasswordField label="New Password" value={newPass} onChange={e => setNewPass(e.target.value)} show={showNew} onToggle={() => setShowNew(s => !s)} disabled={loading} />
            <button type="submit" disabled={loading || !code || !newPass} className="w-full flex items-center justify-center gap-2 bg-retro-mint border-2 border-retro-ink text-white font-sans font-black uppercase shadow-retro hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm py-3 transition-all disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={3} />}
              {loading ? 'Resetting...' : 'Confirm Reset'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, disabled }) {
  return (
    <div>
      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-retro-muted mb-1.5">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} required disabled={disabled} className="w-full px-3 py-3 pr-10 border-2 border-retro-ink bg-white font-sans font-bold text-retro-ink shadow-retro-sm focus:outline-none focus:border-retro-orange focus:translate-y-[-2px] focus:shadow-retro transition-all disabled:opacity-50" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center border-2 border-retro-ink bg-retro-paper shadow-retro-sm hover:bg-white transition-colors" tabIndex={-1}>
          {show ? <EyeOff className="w-3 h-3 text-retro-ink" strokeWidth={3} /> : <Eye className="w-3 h-3 text-retro-ink" strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-3 border-2 border-retro-ink bg-retro-orange text-white p-3 shadow-retro-sm">
      <div className="w-6 h-6 flex items-center justify-center border-2 border-retro-ink bg-white shrink-0 shadow-retro-sm">
        <AlertCircle className="w-3.5 h-3.5 text-retro-orange" strokeWidth={3} />
      </div>
      <p className="text-xs font-mono font-black uppercase tracking-wider leading-snug">{message}</p>
    </div>
  );
}

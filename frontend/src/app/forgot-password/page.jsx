'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Mail, KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep]   = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode]   = useState('');
  const [pass, setPass]   = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]   = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const sendCode = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send reset code');
    } finally { setLoading(false); }
  };

  const reset = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, newPassword: pass });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  const inputClass = "input-vantage w-full px-4 py-2.5 rounded-xl text-sm disabled:opacity-50";
  const StepIcon = done ? ShieldCheck : step === 1 ? Mail : KeyRound;

  return (
    <div className="min-h-screen bg-vantage-base flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-amber-DEFAULT/5 blur-3xl rounded-full" />
      </div>

      <div
        className="relative w-full max-w-[380px] z-10"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.4s ease, transform 0.4s ease' }}
      >
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 animate-float ${done ? 'bg-neon-green/20 border border-neon-green/30' : 'bg-vantage-card border border-vantage-border'}`}>
            <StepIcon className={`w-6 h-6 ${done ? 'text-neon-green' : 'text-amber-DEFAULT'}`} strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-bold text-vantage-text tracking-tight">
            {done ? 'Password Reset!' : step === 1 ? 'Forgot Password?' : 'Enter Code'}
          </h1>
          <p className="text-vantage-muted text-sm font-mono mt-1.5 leading-relaxed">
            {done
              ? 'Your password has been updated.'
              : step === 1
                ? 'Enter your email to receive a reset code.'
                : `Code sent to ${email}`}
          </p>
        </div>

        {!done && (
          <div className="flex items-center justify-between mb-4 px-0.5">
            <span className="font-mono text-[10px] text-vantage-faint uppercase tracking-widest">STEP {step} / 2</span>
            <div className="flex items-center gap-1.5">
              {[1, 2].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-6 bg-amber-DEFAULT shadow-amber-sm'
                  : s < step ? 'w-4 bg-neon-green'
                  : 'w-4 bg-vantage-border'
                }`} />
              ))}
            </div>
          </div>
        )}

        <div className="bg-vantage-surface border border-vantage-border rounded-2xl shadow-vantage overflow-hidden">
          <div className="p-7">
            {error && (
              <div className="mb-5 px-3.5 py-2.5 rounded-xl badge-red text-xs font-medium">✗ {error}</div>
            )}

            {done ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-neon-green" />
                </div>
                <Link href="/login">
                  <button className="btn-amber w-full py-3 rounded-xl text-sm font-semibold mt-2">Sign In Now</button>
                </Link>
              </div>
            ) : step === 1 ? (
              <form onSubmit={sendCode} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-vantage-muted mb-1.5">Email Address</label>
                  <input type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" disabled={loading} className={inputClass} />
                </div>
                <button type="submit" disabled={loading} className="btn-amber w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  {loading ? <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />Sending...</> : 'Send Reset Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={reset} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-vantage-muted mb-1.5">Reset Code</label>
                  <input value={code} onChange={e => setCode(e.target.value)} maxLength={6} required placeholder="000000" disabled={loading}
                    className="input-vantage w-full px-4 py-4 rounded-xl text-2xl font-mono font-black tracking-[0.5em] text-center disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-vantage-muted mb-1.5">New Password</label>
                  <input type="password" value={pass} onChange={e => setPass(e.target.value)} required minLength={6} placeholder="••••••••" disabled={loading} className={inputClass} />
                </div>
                <button type="submit" disabled={loading} className="btn-amber w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  {loading ? <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />Resetting...</> : 'Reset Password'}
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-vantage-border text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-[11px] font-mono text-vantage-muted hover:text-vantage-text transition-colors">
                <ArrowLeft className="w-3 h-3" />Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const register = async e => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try { await api.post('/auth/register', form); setEmail(form.email); setStep(2); }
    catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const verify = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await api.post('/auth/verify', { email, code }); router.push('/login?verified=true'); }
    catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'Verification failed'); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    try { await api.post('/auth/resend-verification', { email }); }
    catch (err) { setError(err.response?.data?.message || 'Failed to resend'); }
  };

  if (!mounted) return null;

  const inputClass = "w-full border-2 border-retro-ink bg-retro-paper px-4 py-3 text-retro-ink font-medium focus:outline-none focus:border-retro-orange focus:bg-white transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-retro-ink uppercase">
            Clash<span className="text-retro-orange">Code</span>
          </h1>
          <p className="mt-2 font-mono text-sm font-bold text-retro-muted uppercase tracking-widest">
            {step === 1 ? '// Registration' : '// Verification'}
          </p>
        </div>

        <div className="border-2 border-retro-ink bg-white p-8 shadow-retro">
          {error && (
            <div className="mb-6 border-2 border-retro-ink bg-retro-orange/20 p-3 text-sm font-bold text-retro-ink flex items-center gap-2">
              <span className="bg-retro-orange text-white px-2 py-0.5 rounded-full border border-retro-ink text-xs">!</span> {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={register} className="space-y-6">
              {[
                { name: 'username', label: 'Username', type: 'text', placeholder: 'your_handle' },
                { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
                { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
                { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block mb-2 font-mono text-xs font-black uppercase text-retro-ink tracking-widest">{f.label}</label>
                  <input type={f.type} name={f.name} value={form[f.name]} onChange={handle} required placeholder={f.placeholder} disabled={loading}
                    className={inputClass} />
                </div>
              ))}
              <button
                type="submit" disabled={loading}
                className="w-full border-2 border-retro-ink bg-retro-blue px-8 py-4 font-black uppercase text-white shadow-retro transition-all hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-6">
              <div className="p-4 border-2 border-retro-ink bg-retro-paper text-center">
                <p className="font-mono text-xs font-bold uppercase text-retro-muted mb-1">Code sent to</p>
                <p className="text-sm font-black text-retro-ink">{email}</p>
              </div>
              <div>
                <label className="block mb-2 font-mono text-xs font-black uppercase text-retro-ink tracking-widest">Verification Code</label>
                <input type="text" maxLength={6} value={code} onChange={e => setCode(e.target.value)} required placeholder="000000" disabled={loading}
                  className="w-full border-2 border-retro-ink bg-retro-paper px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono font-black text-retro-ink focus:outline-none focus:border-retro-orange focus:bg-white transition-colors" />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full border-2 border-retro-ink bg-retro-mint px-8 py-4 font-black uppercase text-white shadow-retro transition-all hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
              <button type="button" onClick={resend} className="w-full text-center font-mono text-xs font-bold uppercase tracking-widest text-retro-muted hover:text-retro-orange transition-colors cursor-pointer mt-4 block">
                Resend Code
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t-2 border-retro-ink flex items-center justify-center font-mono text-xs font-bold uppercase tracking-widest gap-2">
            <span className="text-retro-muted">Have an account?</span>
            <Link href="/login" className="text-retro-ink hover:text-retro-orange transition-colors">
              Sign In →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

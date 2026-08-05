'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import api from '@/lib/axios';
import { setCredentials } from '@/store/slices/authSlice';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (searchParams?.get('verified') === 'true') setInfo('Email verified! You can now sign in.');
  }, [searchParams]);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setError(''); setInfo(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.success && data.data) {
        dispatch(setCredentials({ token: data.data.accessToken, refreshToken: data.data.refreshToken, user: data.data.user }));
        router.push('/rooms');
      } else { setError(data.message || 'Login failed'); }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight uppercase text-retro-ink">
            Clash<span className="text-retro-orange">Code</span>
          </h1>
          <p className="mt-2 font-mono text-sm font-bold text-retro-muted uppercase tracking-widest">
            // Authenticate
          </p>
        </div>

        <div className="border-2 border-retro-ink bg-white p-8 shadow-retro">
          {info && (
            <div className="mb-6 border-2 border-retro-ink bg-retro-mint/20 p-3 text-sm font-bold text-retro-ink flex items-center gap-2">
              <span className="bg-retro-mint text-white px-2 py-0.5 rounded-full border border-retro-ink text-xs">✓</span> {info}
            </div>
          )}
          {error && (
            <div className="mb-6 border-2 border-retro-ink bg-retro-orange/20 p-3 text-sm font-bold text-retro-ink flex items-center gap-2">
              <span className="bg-retro-orange text-white px-2 py-0.5 rounded-full border border-retro-ink text-xs">!</span> {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block mb-2 font-mono text-xs font-black uppercase text-retro-ink tracking-widest">Email Address</label>
              <input
                type="email" name="email" value={form.email} onChange={handle} required placeholder="you@example.com" disabled={loading}
                className="w-full border-2 border-retro-ink bg-retro-paper px-4 py-3 text-retro-ink font-medium focus:outline-none focus:border-retro-orange focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block mb-2 font-mono text-xs font-black uppercase text-retro-ink tracking-widest">Password</label>
              <input
                type="password" name="password" value={form.password} onChange={handle} required placeholder="••••••••" disabled={loading}
                className="w-full border-2 border-retro-ink bg-retro-paper px-4 py-3 text-retro-ink font-medium focus:outline-none focus:border-retro-orange focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full border-2 border-retro-ink bg-retro-orange px-8 py-4 font-black uppercase text-white shadow-retro transition-all hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-retro-ink flex items-center justify-between font-mono text-xs font-bold uppercase tracking-widest">
            <Link href="/forgot-password" className="text-retro-muted hover:text-retro-orange transition-colors">
              Forgot Password?
            </Link>
            <Link href="/register" className="text-retro-ink hover:text-retro-orange transition-colors">
              Register →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import api from '@/lib/axios';
import { setCredentials } from '@/store/slices/authSlice';
import AuthTabs from '@/components/auth/AuthTabs';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { PageTransition } from '@/components/common/PageTransition';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      dispatch(setCredentials(data));
      router.push('/rooms');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center p-4">
      <PageTransition className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Logo Area */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md">
              Λ
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in to ClashCode</h1>
            <p className="text-sm text-gray-600 font-medium tracking-tight">Access your account and battle</p>
          </div>

          <AuthTabs activeTab="signin" />

          {error && <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl px-4 py-3 mb-6 text-xs font-semibold">{error}</div>}

          <form onSubmit={submit} className="space-y-6">
            <Input
              name="email"
              label="EMAIL"
              type="email"
              value={form.email}
              onChange={handle}
              required
              placeholder="name@clashcode.com"
              disabled={loading}
            />

            <Input
              name="password"
              label="PASSWORD"
              type="password"
              value={form.password}
              onChange={handle}
              required
              placeholder="••••••••"
              disabled={loading}
            />

            <div className="flex justify-end !mt-2">
              <Link href="/forgot-password" title="Coming soon!" className="text-[10px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest">Forgot password?</Link>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full font-bold uppercase tracking-widest text-xs py-6"
            >
              Sign in with Email
            </Button>
          </form>

          <p className="text-[11px] text-gray-500 text-center mt-8 font-medium leading-relaxed">
            By signing in, you agree to our{' '}
            <a href="#" className="underline hover:text-gray-900">Terms</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-gray-900">Privacy Policy</a>
          </p>
        </div>
      </PageTransition>
    </div>
  );
}

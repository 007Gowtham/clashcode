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

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const register = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setEmail(form.email);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const verify = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/verify', { email, code });
      router.push('/login?verified=true');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Verification failed');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    setError('');
    try {
      await api.post('/auth/resend-verification', { email });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to resend verification code');
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center p-4">
      <PageTransition className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md">
              Λ
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{step === 1 ? 'Create Account' : 'Verify Email'}</h1>
            <p className="text-sm text-gray-500 font-medium tracking-tight leading-relaxed">{step === 1 ? 'Join the ultimate coding battle' : `Enter the code sent to ${email}`}</p>
          </div>

          {step === 1 && <AuthTabs activeTab="signup" />}

          {error && <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl px-4 py-3 mb-6 text-xs font-semibold">{error}</div>}

          {step === 1 ? (
            <form onSubmit={register} className="space-y-4">
              <Input
                name="username"
                label="USERNAME"
                value={form.username}
                onChange={handle}
                required
                placeholder="john_doe"
                disabled={loading}
              />
              <Input
                name="email"
                label="EMAIL"
                type="email"
                value={form.email}
                onChange={handle}
                required
                placeholder="name@example.com"
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
              <Input
                name="confirmPassword"
                label="CONFIRM PASSWORD"
                type="password"
                value={form.confirmPassword}
                onChange={handle}
                required
                placeholder="••••••••"
                disabled={loading}
              />
              <Button type="submit" isLoading={loading} className="w-full font-bold uppercase tracking-widest text-xs py-6 !mt-6">
                Create Account
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-6">
              <Input
                label="VERIFICATION CODE"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                maxLength={6}
                placeholder="000000"
                className="text-2xl text-center tracking-[0.5em] font-mono py-4"
                disabled={loading}
              />
              <Button type="submit" isLoading={loading} className="w-full font-bold uppercase tracking-widest text-xs py-6">
                Verify Email
              </Button>
              <button type="button" onClick={resend} className="w-full text-[10px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors">
                Resend code
              </button>
            </form>
          )}

          <p className="text-[11px] text-gray-500 text-center mt-8 font-medium leading-relaxed">
            Already have an account?{' '}
            <Link href="/login" className="underline hover:text-gray-900">Sign in</Link>
          </p>
        </div>
      </PageTransition>
    </div>
  );
}

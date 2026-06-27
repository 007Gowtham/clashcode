'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { PageTransition } from '@/components/common/PageTransition';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const sendCode = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send reset code'); }
    finally { setLoading(false); }
  };

  const reset = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, newPassword: pass });
      setDone(true);
    } catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'Failed to reset password'); }
    finally { setLoading(false); }
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {done ? 'Success!' : step === 1 ? 'Forgot Password?' : 'Reset Password'}
            </h1>
            <p className="text-sm text-gray-500 font-medium tracking-tight leading-relaxed px-4 mx-auto">
              {done ? 'Your password has been changed.' : step === 1 ? 'Enter your email to receive a reset code.' : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl px-4 py-3 mb-6 text-xs font-semibold">{error}</div>}

          {done ? (
            <div className="text-center space-y-4">
              <Link href="/login" className="block w-full">
                <Button className="w-full font-bold uppercase tracking-widest text-xs py-6">
                  Sign In Now
                </Button>
              </Link>
            </div>
          ) : step === 1 ? (
            <form onSubmit={sendCode} className="space-y-6">
              <Input
                name="email"
                label="EMAIL ADDRESS"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="name@clashcode.com"
                disabled={loading}
              />
              <Button type="submit" isLoading={loading} className="w-full font-bold uppercase tracking-widest text-xs py-6">
                Send Reset Code
              </Button>
            </form>
          ) : (
            <form onSubmit={reset} className="space-y-6">
              <Input
                label="RESET CODE"
                value={code}
                onChange={e => setCode(e.target.value)}
                maxLength={6}
                required
                placeholder="000000"
                className="text-2xl text-center tracking-[0.5em] font-mono py-4"
                disabled={loading}
              />
              <Input
                label="NEW PASSWORD"
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                disabled={loading}
              />
              <Button type="submit" isLoading={loading} className="w-full font-bold uppercase tracking-widest text-xs py-6">
                Reset Password
              </Button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="text-[11px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-all">
              ← Back to login
            </Link>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}

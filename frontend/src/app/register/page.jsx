'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { PageTransition } from '@/components/common/PageTransition';

export default function RegisterPage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-[#f5f7f9] dark:bg-[#111111] text-[#262626] dark:text-[#eff1f6] flex flex-col items-center justify-center p-4 antialiased select-none transition-colors duration-300" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <PageTransition className="w-full max-w-[360px]">
        
        {/* Form Container Card - pops out from the page background (white on light theme, dark charcoal on dark theme) */}
        <div className="bg-white dark:bg-[#1e1e1e] border border-[#e5e8eb] dark:border-[#2d2d2d] rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-colors duration-300">
          
          {/* Logo & Header inside the card */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 bg-[#262626] dark:bg-[#2d2d2d] border border-transparent dark:border-[#3d3d3d] rounded-xl text-white font-bold text-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] select-none">
              Λ
            </div>
            <span className="mt-3 text-lg font-semibold tracking-tight text-[#262626] dark:text-white">ClashCode</span>
          </div>

          {error && <div className="bg-[#fff2f0] dark:bg-[#2c1b1b] border border-[#ffccc7] dark:border-[#5c2727] text-[#ff4d4f] rounded-lg px-4 py-2.5 mb-5 text-[13px] font-medium">{error}</div>}

          {step === 1 ? (
            <form onSubmit={register} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handle}
                  required
                  placeholder="Username"
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#262626] border border-[#d9d9d9] dark:border-[#333333] rounded-lg text-sm text-[#262626] dark:text-white placeholder-[#bfbfbf] dark:placeholder-[#8c8c8c] focus:outline-none focus:border-[#262626] dark:focus:border-[#ffa116] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handle}
                  required
                  placeholder="Email Address"
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#262626] border border-[#d9d9d9] dark:border-[#333333] rounded-lg text-sm text-[#262626] dark:text-white placeholder-[#bfbfbf] dark:placeholder-[#8c8c8c] focus:outline-none focus:border-[#262626] dark:focus:border-[#ffa116] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handle}
                  required
                  placeholder="Password"
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#262626] border border-[#d9d9d9] dark:border-[#333333] rounded-lg text-sm text-[#262626] dark:text-white placeholder-[#bfbfbf] dark:placeholder-[#8c8c8c] focus:outline-none focus:border-[#262626] dark:focus:border-[#ffa116] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handle}
                  required
                  placeholder="Confirm Password"
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#262626] border border-[#d9d9d9] dark:border-[#333333] rounded-lg text-sm text-[#262626] dark:text-white placeholder-[#bfbfbf] dark:placeholder-[#8c8c8c] focus:outline-none focus:border-[#262626] dark:focus:border-[#ffa116] transition-all disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#262626] dark:bg-[#ffa116] hover:bg-[#333333] dark:hover:bg-[#e08e12] active:bg-black dark:active:bg-[#1a1a1a] text-white dark:text-black rounded-lg text-sm font-semibold tracking-wide transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registering...' : 'Sign Up'}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div className="text-center text-sm text-[#595959] dark:text-[#8c8c8c] mb-2 leading-relaxed">
                We've sent a 6-digit verification code to <span className="font-semibold text-[#262626] dark:text-white">{email}</span>
              </div>
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  placeholder="Verification Code (000000)"
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#262626] border border-[#d9d9d9] dark:border-[#333333] rounded-lg text-sm text-center font-mono tracking-widest text-[#262626] dark:text-white placeholder-[#bfbfbf] dark:placeholder-[#8c8c8c] focus:outline-none focus:border-[#262626] dark:focus:border-[#ffa116] transition-all disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#262626] dark:bg-[#ffa116] hover:bg-[#333333] dark:hover:bg-[#e08e12] active:bg-black dark:active:bg-[#1a1a1a] text-white dark:text-black rounded-lg text-sm font-semibold tracking-wide transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <button
                type="button"
                onClick={resend}
                className="w-full text-center text-xs text-[#8c8c8c] hover:text-[#595959] dark:hover:text-white transition-colors font-medium mt-2"
              >
                Resend Code
              </button>
            </form>
          )}

          {/* Links */}
          <div className="flex justify-center mt-5 text-[13px] font-medium">
            <span className="text-[#8c8c8c] mr-1">Have an account?</span>
            <Link href="/login" className="text-[#ffa116] hover:text-[#e08e12] transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-[12px] text-[#8c8c8c] font-medium space-x-1">
          <span>By signing up, you agree to our</span>
          <a href="#" className="text-[#595959] dark:text-[#bfbfbf] hover:underline">Terms</a>
          <span>and</span>
          <a href="#" className="text-[#595959] dark:text-[#bfbfbf] hover:underline">Privacy Policy</a>
        </div>
      </PageTransition>
    </div>
  );
}

'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import api from '@/lib/axios';
import { setCredentials } from '@/store/slices/authSlice';
import { PageTransition } from '@/components/common/PageTransition';

<<<<<<< HEAD
// Inner component that safely uses useSearchParams (must be inside Suspense)
=======
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams && searchParams.get('verified') === 'true') {
      setInfo('Email verified successfully! Please sign in with your credentials.');
    }
  }, [searchParams]);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      const response = await api.post('/auth/login', form);
      const resData = response.data;
      if (resData.success && resData.data) {
        dispatch(setCredentials({
          token:        resData.data.accessToken,
          refreshToken: resData.data.refreshToken,
          user:         resData.data.user,
        }));
        router.push('/rooms');
      } else {
        setError(resData.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
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

          {info && <div className="bg-[#f6ffed] dark:bg-[#1b2b1b] border border-[#b7eb8f] dark:border-[#274c27] text-[#52c41a] rounded-lg px-4 py-2.5 mb-5 text-[13px] font-medium">{info}</div>}
          {error && <div className="bg-[#fff2f0] dark:bg-[#2c1b1b] border border-[#ffccc7] dark:border-[#5c2727] text-[#ff4d4f] rounded-lg px-4 py-2.5 mb-5 text-[13px] font-medium">{error}</div>}

<<<<<<< HEAD
          <AuthTabs activeTab="signin" />

          {info && <div className="bg-green-50 border border-green-100 text-green-600 rounded-xl px-4 py-3 mb-6 text-xs font-semibold">{info}</div>}
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
              <Link href="/forgot-password" className="text-[10px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest">Forgot password?</Link>
=======
          <form onSubmit={submit} className="space-y-4">
            <div>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handle}
                required
                placeholder="Username or Email"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-white dark:bg-[#262626] border border-[#d9d9d9] dark:border-[#333333] rounded-lg text-sm text-[#262626] dark:text-white placeholder-[#bfbfbf] dark:placeholder-[#8c8c8c] focus:outline-none focus:border-[#262626] dark:focus:border-[#ffa116] transition-all disabled:opacity-50"
              />
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#262626] dark:bg-[#ffa116] hover:bg-[#333333] dark:hover:bg-[#e08e12] active:bg-black dark:active:bg-[#1a1a1a] text-white dark:text-black rounded-lg text-sm font-semibold tracking-wide transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Links */}
          <div className="flex items-center justify-between mt-6 pt-1 text-[13px] font-medium">
            <Link href="/forgot-password" className="text-[#8c8c8c] hover:text-[#595959] dark:hover:text-white transition-colors">
              Forgot Password?
            </Link>
            <Link href="/register" className="text-[#ffa116] hover:text-[#e08e12] transition-colors">
              Sign Up
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-[12px] text-[#8c8c8c] font-medium space-x-1">
          <span>By signing in, you agree to our</span>
          <a href="#" className="text-[#595959] dark:text-[#bfbfbf] hover:underline">Terms</a>
          <span>and</span>
          <a href="#" className="text-[#595959] dark:text-[#bfbfbf] hover:underline">Privacy Policy</a>
        </div>
      </PageTransition>
    </div>
  );
}

<<<<<<< HEAD
// Wrap in Suspense — required by Next.js for components that call useSearchParams()
=======
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

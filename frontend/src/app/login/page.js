'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const redirect = searchParams.get('redirect') || '/dashboard';

  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      router.push(redirect);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="w-full max-w-sm mx-auto p-6 mt-12">
      <div className="border border-[var(--ink-border)] rounded-[6px] p-6 bg-[var(--paper)]">
        <div className="mb-6">
          <h1 className="text-[20px] font-semibold text-[var(--ink)] mb-1">
            Sign In to ClashCode
          </h1>
          <p className="text-[12px] opacity-60">
            Enter your username or email to continue.
          </p>
        </div>

        {registered && (
          <div className="mb-4 p-2.5 rounded-[6px] text-[12px] border border-[var(--ink-border)] bg-[var(--ink-hover)]">
            Account created successfully. Please sign in below.
          </div>
        )}

        {error && (
          <div className="mb-4 p-2.5 rounded-[6px] text-[12px] border border-[var(--ink)] bg-[var(--ink-hover)] font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.04em] mb-1">
              Username or Email
            </label>
            <Input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. coder or user@example.com"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.04em] mb-1">
              Password
            </label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--ink-border)] text-center text-[12px] opacity-70">
          Need an account?{' '}
          <Link href="/register" className="font-semibold underline hover:opacity-100">
            Register here
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[12px]">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(username.trim(), email.trim(), password, confirmPassword);
      router.push('/login?registered=true');
    } catch (err) {
      setError(err.message || 'Registration failed');
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
            Create a ClashCode Account
          </h1>
          <p className="text-[12px] opacity-60">
            Sign up to compete in multiplayer team coding contests.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-[6px] text-[12px] border border-[var(--ink)] bg-[var(--ink-hover)] font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.04em] mb-1">
              Username
            </label>
            <Input
              type="text"
              required
              minLength={3}
              maxLength={30}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. coder_alice"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.04em] mb-1">
              Email Address
            </label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@example.com"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.04em] mb-1">
              Password (min 8 characters)
            </label>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.04em] mb-1">
              Confirm Password
            </label>
            <Input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--ink-border)] text-center text-[12px] opacity-70">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold underline hover:opacity-100">
            Sign in
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}

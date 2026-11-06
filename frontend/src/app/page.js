'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-[1000px] mx-auto px-4 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-[var(--ink)] mb-2">
            ClashCode
          </h1>
          <p className="text-[16px] text-[var(--ink)] opacity-70 max-w-2xl leading-normal">
            A real-time multiplayer coding competition platform. Form a squad or battle solo, solve algorithmic problems in real time, and earn points as test cases pass.
          </p>
        </div>

        <div className="border border-[var(--ink-border)] rounded-[6px] p-6 mb-8 bg-[var(--paper)]">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] mb-4">
            How it works
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-[14px] text-[var(--ink)] leading-normal">
            <li>Create a room, or join one with its room code.</li>
            <li>Create a team, or join one with its team code.</li>
            <li>When the host starts, every player gets their assigned problem.</li>
            <li>Passed test cases add points to your team. The highest score wins.</li>
          </ol>
        </div>

        <div className="flex items-center space-x-4">
          <Link href={user ? '/dashboard' : '/login'}>
            <Button variant="primary">
              {user ? 'Go to Dashboard' : 'Sign In to Play'}
            </Button>
          </Link>
          <Link href="/problems">
            <Button variant="secondary">Browse Problems</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { roomsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function RoomsRedirectPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [statusText, setStatusText] = useState('Checking active session...');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login?redirect=/rooms');
      return;
    }

    let isMounted = true;

    async function checkActiveRoom() {
      try {
        setStatusText('Checking active contest room...');
        const res = await roomsApi.getActive();

        if (!isMounted) return;

        if (res && res.hasActiveRoom) {
          const destination = res.roomCode || res.roomId;
          setStatusText(`Found active room (${res.roomCode || 'session'}). Redirecting...`);
          router.replace(`/rooms/${destination}`);
        } else {
          setStatusText('No active room found. Redirecting to dashboard...');
          router.replace('/dashboard');
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn('Error checking active room:', err);
        // Fallback to dashboard on error
        router.replace('/dashboard');
      }
    }

    checkActiveRoom();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user, router]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-[var(--paper)] text-[var(--ink)]">
      <div className="max-w-[420px] w-full border border-[var(--ink-border)] rounded-lg p-6 bg-[var(--paper)] text-center space-y-4 shadow-xs">
        <div className="flex justify-center">
          <div className="w-6 h-6 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
        </div>

        <div className="space-y-1">
          <h2 className="text-[16px] font-semibold tracking-tight text-[var(--ink)]">
            Locating Contest Room
          </h2>
          <p className="text-[13px] opacity-70">
            {statusText}
          </p>
        </div>

        {error && (
          <div className="p-2.5 border border-[var(--ink-border)] bg-[var(--ink-hover)] rounded text-[12px]">
            {error}
          </div>
        )}

        <div className="pt-2 border-t border-[var(--ink-border)] flex justify-center">
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { roomsApi } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Poll for active room when logged in
  useEffect(() => {
    if (!mounted || !user) {
      setActiveRoom(null);
      return;
    }
    let isCurrent = true;
    const checkActiveRoom = async () => {
      try {
        const res = await roomsApi.getActive();
        if (isCurrent && res && res.hasActiveRoom) {
          setActiveRoom(res);
        } else if (isCurrent) {
          setActiveRoom(null);
        }
      } catch {
        if (isCurrent) setActiveRoom(null);
      }
    };
    checkActiveRoom();
    const interval = setInterval(checkActiveRoom, 15000);
    return () => {
      isCurrent = false;
      clearInterval(interval);
    };
  }, [mounted, user, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/problems', label: 'Problems' },
  ];

  if (mounted && user && user.role === 'ROLE_ADMIN') {
    navLinks.push({ href: '/admin/problems', label: 'Admin' });
  }

  // Hide Navbar on full-screen code editor pages
  const isCodeEditorPage =
    (pathname.startsWith('/rooms/') && pathname !== '/rooms') ||
    (pathname.startsWith('/problems/') && pathname !== '/problems');

  if (isCodeEditorPage) {
    return null;
  }

  return (
    <header className="border-b border-[var(--ink-border)] bg-[var(--paper)]">
      <div className="max-w-[1000px] mx-auto px-4 h-12 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link
            href="/dashboard"
            className="font-semibold text-[16px] text-[var(--ink)] tracking-tight hover:opacity-80 transition-hover"
          >
            ClashCode
          </Link>

          {/* Nav links */}
          <nav className="flex items-center space-x-4">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/dashboard'
                  ? pathname === '/dashboard' || pathname === '/rooms'
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[14px] transition-hover ${
                    isActive
                      ? 'font-semibold text-[var(--ink)]'
                      : 'text-[var(--ink)] opacity-60 hover:opacity-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User state & Active Room pill */}
        <div className="flex items-center space-x-4 text-[14px]">
          {activeRoom && (
            <Link
              href={`/rooms/${activeRoom.roomCode || activeRoom.roomId}`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 text-[12px] font-semibold rounded border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] hover:opacity-85 transition-opacity"
              title="Resume active room session"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--paper)] animate-pulse" />
              <span>Active: {activeRoom.roomCode}</span>
              <span>→</span>
            </Link>
          )}

          {!mounted || loading ? (
            <span className="text-[12px] opacity-40">Loading...</span>
          ) : user ? (
            <div className="flex items-center space-x-3">
              <span className="text-[14px]">
                {user.username}
                {user.role === 'ROLE_ADMIN' && (
                  <span className="ml-1 text-[12px] opacity-60 font-semibold">(Admin)</span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="text-[14px] underline hover:opacity-70 transition-hover cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-[14px] hover:underline transition-hover"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-[14px] font-semibold underline hover:opacity-70 transition-hover"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

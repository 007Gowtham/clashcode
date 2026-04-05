'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

export default function HomePage() {
  const router          = useRouter();
  const isAuthenticated = useSelector(s => s.auth.isAuthenticated);

  useEffect(() => {
    router.replace(isAuthenticated ? '/rooms' : '/login');
  }, [isAuthenticated, router]);

  return null;
}

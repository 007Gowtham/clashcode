'use client';

import { useAuthInit } from '@/hooks/useAuthInit';
import FullPageLoader from './FullPageLoader';

export default function AuthInitializer({ children }) {
  const { isInitializing } = useAuthInit();

  if (isInitializing) {
    return <FullPageLoader message="Loading your session..." />;
  }

  return <>{children}</>;
}

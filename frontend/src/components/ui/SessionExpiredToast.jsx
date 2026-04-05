'use client';

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function SessionExpiredToast() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason');
    if (reason === 'session_expired') {
      toast.error('Your session expired. Please log in again.');
    }
    if (reason === 'force_logout') {
      toast.error('You were logged out from all devices.');
    }
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  return null;
}

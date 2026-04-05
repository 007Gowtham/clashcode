'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import Button from '@/components/common/Button';

export default function FooterAction() {
  const [isLoading, setIsLoading] = useState(false);
  const isAdmin = true; // This should come from your auth/context

  const handleStartRoom = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Room started');
      // TODO: Implement actual start room logic
    } catch (error) {
      console.error('Error starting room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium flex items-center justify-center gap-2">
        <span>Waiting for Admin to Start</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleStartRoom}
      isLoading={isLoading}
      disabled={isLoading}
      className="w-full"
      icon={<Play className="w-4 h-4" />}
    >
      Start Room
    </Button>
  );
}

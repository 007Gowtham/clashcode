'use client';

import { useState } from 'react';
import { Clock, Play, RefreshCw, Trophy, Users, Shield } from 'lucide-react';
import StatsStrip from './statsStrip';
import Button from '@/components/common/Button';

export default function ContestHeader({ isAdmin = false, onStartRoom, onRefresh, isRefreshing = false, room }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartRoom = async () => {
    if (!onStartRoom) return;
    setIsLoading(true);
    try {
      await onStartRoom();
    } catch (error) {
      console.error('Error starting room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="px-8 py-8 border-b border-gray-200/60 bg-white">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {room?.name || 'Room'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wide flex items-center gap-1.5 ${room?.mode === 'team'
                ? 'bg-blue-50 text-blue-700 border-blue-100'
                : 'bg-purple-50 text-purple-700 border-purple-100'
                }`}>
                {room?.mode === 'team' ? <Users className="w-3 h-3" /> : <Trophy className="w-3 h-3" />}
                {room?.mode === 'team' ? 'Team Mode' : 'Solo Mode'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
              {room?.admin?.username && (
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Host: <span className="text-gray-900">{room.admin.username}</span>
                </span>
              )}
              {room?.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Duration: <span className="text-gray-900">{room.duration} mins</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-start">
            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                title="Refresh teams"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Start Room Button (Admin Only) */}
            {isAdmin ? (
              <Button
                onClick={handleStartRoom}
                isLoading={isLoading}
                disabled={isLoading}
                icon={<Play className="w-4 h-4" />}
                size="md"
                className="font-bold shadow-md shadow-blue-500/20"
              >
                Start Battle
              </Button>

            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm font-bold shadow-sm animate-pulse-subtle">
                <Clock className="w-4 h-4" />
                Waiting for Host
              </div>
            )}
          </div>
        </div>
        <StatsStrip room={room} />
      </div>
    </header>
  );
}

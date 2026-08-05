'use client';
import { cn } from '@/lib/utils';
import { ArrowRight, Lock, Zap, Wifi, Clock, Users, BarChart2, Loader2 } from 'lucide-react';

export default function RoomCard({ room, onJoin, activeRoomId, isJoining }) {
  const isPlaying = room.status === 'PLAYING' || room.status === 'IN_PROGRESS';
  const isPrivate = room.settings?.privacy === 'private' || room.hasPassword;
  const isMyRoom  = activeRoomId === (room._id || room.id);

  let statusText  = 'WAITING';
  let isAvailable = true;
  let StatusIcon  = Wifi;
  let statusStyle = 'bg-retro-mint text-retro-ink';

  if (isMyRoom) {
    statusText = 'ACTIVE'; isAvailable = true;
    StatusIcon = Zap; statusStyle = 'bg-retro-blue text-white';
  } else if (activeRoomId) {
    statusText = 'LOCKED'; isAvailable = false;
    StatusIcon = Lock; statusStyle = 'bg-retro-paper text-retro-muted';
  } else if (isPlaying) {
    statusText = 'LIVE'; isAvailable = false;
    StatusIcon = Zap; statusStyle = 'bg-retro-orange text-white';
  } else if (room.status === 'ENDED') {
    statusText = 'ENDED'; isAvailable = false;
    StatusIcon = Lock; statusStyle = 'bg-retro-paper text-retro-muted';
  }

  const diffKey = (room.difficulty || 'MIXED').toUpperCase();

  return (
    <div className="group border-2 border-retro-ink bg-white p-6 shadow-retro transition-all hover:-translate-y-1 hover:shadow-retro-lg flex flex-col relative">

      <div className="absolute top-4 right-4">
        <span className={cn('flex items-center gap-1 px-2.5 py-1 font-mono text-xs font-bold border-2 border-retro-ink', statusStyle, isPlaying && 'animate-pulse')}>
          <StatusIcon className="w-3 h-3" strokeWidth={3} />
          {statusText}
        </span>
      </div>

      <div className="mb-4 pr-24">
        <h3 className="text-xl font-black uppercase text-retro-ink truncate group-hover:text-retro-orange transition-colors">
          {room.name || 'Unnamed Room'}
        </h3>
        {isPrivate && (
          <span className="inline-flex items-center gap-1.5 border-2 border-retro-ink bg-retro-yellow text-retro-ink px-2 py-1 text-[10px] font-mono font-black shadow-retro-sm mt-3 uppercase tracking-widest">
            <Lock className="w-3 h-3" strokeWidth={3} /> PRIVATE
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Users,    label: 'Teams',      value: room.teams?.length || 0, boxColor: 'bg-[#BCA5FF] text-retro-ink' },
          { icon: Clock,    label: 'Time',        value: `${room.timeLimitMinutes || 30}m`, boxColor: 'bg-[#86EFAC] text-retro-ink' },
          { icon: BarChart2,label: 'Difficulty',  value: diffKey, boxColor: 'bg-[#FDBA74] text-retro-ink' },
        ].map(({ icon: Icon, label, value, boxColor }) => (
          <div key={label} className={`border-2 border-retro-ink p-3 flex flex-col gap-3 shadow-retro-sm ${boxColor}`}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center border-2 border-retro-ink bg-white shadow-retro-sm">
                <Icon className="w-3.5 h-3.5 text-retro-ink" strokeWidth={3} />
              </div>
              <span className="text-[10px] font-mono font-black uppercase tracking-widest opacity-90">
                {label}
              </span>
            </div>
            <span className="text-xl font-sans font-black tracking-tighter uppercase truncate">{value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onJoin(room)}
        disabled={!isAvailable || isJoining}
        className={cn(
          'mt-auto w-full py-3 font-black uppercase text-sm border-2 border-retro-ink flex items-center justify-center gap-2 transition-all',
          isAvailable
            ? 'bg-retro-orange text-white shadow-retro hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm disabled:opacity-50'
            : 'bg-retro-paper text-retro-muted cursor-not-allowed disabled:opacity-50'
        )}
      >
        {isJoining ? (
          <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={3} /> JOINING...</>
        ) : isAvailable ? (
          <>{isMyRoom ? 'Rejoin Room' : 'Join Room'} <ArrowRight className="w-4 h-4" strokeWidth={3} /></>
        ) : statusText}
      </button>
    </div>
  );
}
'use client';

import { Plus, Users, CheckCircle2, LogOut, Shield, X } from 'lucide-react';

function Badge({ children, className }) {
 return (
 <span
 className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}
 >
 {children}
 </span>
 );
}

export default function TeamCard({ team, onJoinTeam, onLeaveTeam, onReady, onKickMember, myTeamId }) {
  const filledSlots = team.members ? team.members.length : 0;
  const maxSize = team.maxSize || 4;
  const emptySlots = maxSize - filledSlots;
  const isMyTeam = myTeamId === team.id;
  const isDisabled = !!myTeamId && !isMyTeam;
  const isPublic = team.visibility !== 'PRIVATE';

 // Determine if the current user is the leader
 const me = (team.members || []).find(m => m.name === 'You');
 const iAmLeader = me?.isLeader ?? false;
 const iAmReady = me?.isReady ?? false;

 // All-ready: every filled slot is ready
 const allReady = filledSlots > 0 && (team.members || []).every(m => m.isReady);

  const bgColors = [
    'bg-yellow-300',
    'bg-green-300',
    'bg-cyan-300',
    'bg-pink-300',
    'bg-purple-300',
    'bg-orange-300',
    'bg-retro-paper'
  ];
  
  const charSum = (team.id || team._id || team.name || 'a').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bgColor = bgColors[charSum % bgColors.length];

  return (
  <div
  className={`relative flex border-[3px] border-retro-ink transition-all duration-300 shadow-[6px_6px_0px_rgba(15,23,42,1)] ${
  isDisabled
  ? 'bg-slate-200 opacity-60 grayscale pointer-events-none select-none'
  : isMyTeam && allReady
  ? 'bg-retro-mint rotate-[-1deg]'
  : isMyTeam
  ? 'bg-retro-yellow rotate-[1deg]'
  : `${bgColor} hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(15,23,42,1)]`
  }`}
  >
  {/* Left Bar / Spine */}
  <div className="w-8 shrink-0 border-r-[3px] border-retro-ink bg-retro-ink flex flex-col items-center justify-between py-4">
  <div className="w-4 h-4 rounded-full bg-retro-paper border-2 border-retro-ink" />
  <span className="text-white font-mono font-black text-xs tracking-[0.3em] uppercase [writing-mode:vertical-lr] rotate-180">
  {isPublic ? 'PUBLIC SQUAD' : 'RESTRICTED'}
  </span>
  <div className="w-4 h-4 rounded-full bg-retro-paper border-2 border-retro-ink" />
  </div>

  <div className="flex-1 flex flex-col p-4 relative">
  {/* Vintage Stamp for Ready */}
  {allReady && (
  <div className="absolute top-2 right-4 border-4 border-retro-orange text-retro-orange px-2 py-1 rotate-[15deg] font-black font-mono text-xs uppercase tracking-widest opacity-80 pointer-events-none z-10">
  LOCKED & LOADED
  </div>
  )}

  {/* ── Header ── */}
  <div className="flex items-start justify-between w-full mb-4 border-b-[3px] border-retro-ink border-dashed pb-3">
  <div>
  <h3 className="text-2xl font-heading text-retro-ink uppercase tracking-tighter leading-none mb-1">
  {team.name}
  </h3>
  <div className={`mt-2 inline-flex items-center gap-2 bg-retro-yellow border-[3px] border-retro-ink px-2 py-1 shadow-[3px_3px_0px_rgba(15,23,42,1)] rotate-[-1deg] ${!iAmLeader ? 'opacity-60 grayscale' : ''}`}>
    <span className="text-[9px] font-black font-sans uppercase tracking-widest text-retro-ink bg-white border-[2px] border-retro-ink px-1.5 py-0.5">
      TEAM CODE
    </span>
    <span className="text-sm font-mono font-black text-retro-ink tracking-[0.2em]">
      {iAmLeader ? (team.code || 'NO-CODE') : 'XXXXXX'}
    </span>
  </div>
  </div>
  
  <div className="flex items-center gap-1.5 px-2 py-1 border-[2px] border-retro-ink bg-white shadow-[2px_2px_0px_rgba(15,23,42,1)]">
  <Users className="w-3 h-3 text-retro-ink" strokeWidth={3} />
  <span className="text-[10px] font-mono font-black uppercase text-retro-ink">
  {filledSlots}/{maxSize}
  </span>
  </div>
  </div>

  {/* ── Player Slots (Floating Block Style) ── */}
  <div className="mb-4 flex-1 flex flex-col gap-2">
  {(team.members || []).map((member, i) => {
    const slotColors = [
      'bg-[#ff90e8]', // Pink
      'bg-[#00e5ff]', // Cyan
      'bg-[#b2ff59]', // Lime
      'bg-[#ffd740]', // Amber
    ];
    const rowColor = slotColors[i % slotColors.length];

    return (
    <div
    key={member.id || i}
    className={`flex items-center gap-2 px-2 py-1.5 border-[2px] border-retro-ink shadow-[2px_2px_0px_rgba(15,23,42,1)] transition-transform hover:-translate-y-0.5 ${
    member.isReady ? rowColor : 'bg-white'
    }`}
    >
    <div className={`w-6 h-6 flex items-center justify-center text-[12px] font-black border-2 border-retro-ink ${member.isReady ? 'bg-white text-retro-ink' : 'bg-retro-ink text-white'} shrink-0 rotate-[-3deg]`}>
    {member.name?.[0]?.toUpperCase() || '?'}
    </div>

    <span className="text-xs font-mono font-black text-retro-ink uppercase tracking-tight flex-1 truncate ml-1">
    {member.name}
    </span>

    {member.isReady && (
    <CheckCircle2 className="w-4 h-4 text-retro-ink shrink-0" strokeWidth={3} />
    )}
    {member.name === 'You' && (
    <span className="text-[9px] font-mono font-black text-white bg-retro-blue px-1.5 py-0.5 ml-1 border-2 border-retro-ink shadow-[1px_1px_0px_rgba(15,23,42,1)] rotate-3">YOU</span>
    )}
    {member.isLeader && (
    <span className="text-[9px] font-mono font-black text-retro-ink bg-retro-orange px-1.5 py-0.5 ml-1 border-2 border-retro-ink shadow-[1px_1px_0px_rgba(15,23,42,1)] rotate-[-2deg]">HQ</span>
    )}
    
    {iAmLeader && !member.isLeader && (
    <button
    onClick={(e) => {
    e.stopPropagation();
    onKickMember && onKickMember(member.id);
    }}
    className="w-6 h-6 flex items-center justify-center bg-red-500 border-2 border-retro-ink text-white hover:bg-retro-ink shadow-[1px_1px_0px_rgba(15,23,42,1)] hover:translate-y-px hover:shadow-none transition-all ml-1"
    title="Kick player"
    >
    <X className="w-3.5 h-3.5" strokeWidth={4} />
    </button>
    )}
    </div>
    );
  })}

  {Array.from({ length: Math.max(0, emptySlots) }).map((_, i) => (
  <div
  key={`empty-${i}`}
  className="flex items-center gap-2 px-2 py-1.5 border-[2px] border-dashed border-retro-ink/40 bg-white/40 shadow-none"
  >
  <div className="w-6 h-6 flex items-center justify-center bg-transparent border-2 border-dashed border-retro-ink/30 text-retro-ink/30 shrink-0">
  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
  </div>
  <span className="text-[10px] font-mono font-bold text-retro-ink/50 uppercase tracking-widest ml-1">
  EMPTY SLOT
  </span>
  </div>
  ))}
  </div>

  {/* ── Footer Actions ── */}
  <div className="mt-auto w-full flex items-center gap-2">
  {!isMyTeam ? (
  <button
  onClick={() => onJoinTeam(team)}
  disabled={emptySlots === 0}
  className="w-full flex justify-center items-center gap-2 px-4 py-2 border-[3px] border-retro-ink bg-retro-mint text-retro-ink text-sm font-black font-mono uppercase tracking-widest shadow-[3px_3px_0px_rgba(15,23,42,1)] hover:bg-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_rgba(15,23,42,1)] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-1 disabled:translate-y-1 disabled:cursor-not-allowed"
  >
  <Plus className="w-4 h-4" strokeWidth={3} /> JOIN SQUAD
  </button>
  ) : (
  <div className="flex w-full gap-2">
  <button
  onClick={() => onReady && onReady()}
  className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 border-[3px] border-retro-ink text-sm font-black font-mono uppercase tracking-widest shadow-[3px_3px_0px_rgba(15,23,42,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_rgba(15,23,42,1)] transition-all ${
  iAmReady
  ? 'bg-retro-orange text-white'
  : 'bg-retro-ink text-white hover:bg-retro-blue'
  }`}
  >
  {iAmReady ? (
  <>
  <CheckCircle2 className="w-4 h-4" strokeWidth={3} /> LOCKED IN
  </>
  ) : (
  'READY UP'
  )}
  </button>

  <button
  onClick={() => onLeaveTeam()}
  className="flex items-center justify-center gap-1 shrink-0 px-3 border-[3px] border-retro-ink bg-red-500 text-white font-mono font-black text-xs shadow-[3px_3px_0px_rgba(15,23,42,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_rgba(15,23,42,1)] transition-all uppercase"
  title="Leave Team"
  >
  <LogOut className="w-3.5 h-3.5" strokeWidth={3} /> LEAVE
  </button>
  </div>
  )}
  </div>
  </div>
  </div>
  );
}

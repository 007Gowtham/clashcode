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

  return (
  <div
  className={`flex flex-col bg-white dark:bg-[#1e1e1e] rounded-xl p-5 transition-all duration-300 ${
  isMyTeam && allReady
  ? 'border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-[0_0_0_4px_rgba(16,185,129,0.08)]'
  : isMyTeam
  ? 'border-2 border-slate-900 dark:border-white'
  : isDisabled
  ? 'border border-slate-100 dark:border-[#2d2d2d] opacity-40 dark:opacity-20 grayscale pointer-events-none select-none'
  : 'border border-slate-200 dark:border-[#2d2d2d] hover:border-slate-300 dark:hover:border-[#3d3d3d]'
  }`}
  >
  {/* ── Header ── */}
  <div className="flex items-start justify-between w-full mb-4">
  <div className="flex flex-col gap-0.5">
  <div className="flex items-center gap-2">
  {/* Team icon */}
  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
  allReady && isMyTeam 
    ? 'bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800' 
    : 'bg-slate-100 border-slate-200 dark:bg-[#2c2c2c] dark:border-[#3c3c3c]'
  }`}>
  {isPublic
  ? <Users className={`w-4 h-4 ${allReady && isMyTeam ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`} strokeWidth={1.8} />
  : <Shield className="w-4 h-4 text-slate-600 dark:text-slate-300" strokeWidth={1.8} />
  }
  </div>
  <div>
  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
  {team.name}
  </h3>
  {/* Team code — only for leader */}
  {iAmLeader && (
  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-[#8c8c8c] tracking-widest uppercase">
  Code: {team.code}
  </span>
  )}
  </div>
  </div>
  </div>

  {/* Public/Private pill + all-ready badge */}
  <div className="flex flex-col items-end gap-1 shrink-0">
  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-[#2c2c2c] text-slate-500 dark:text-slate-400">
  {isPublic ? 'Public' : 'Private'}
  </span>
  {allReady && (
  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
  <CheckCircle2 className="w-3 h-3" /> All Ready
  </span>
  )}
  </div>
  </div>

  {/* ── Player Slots ── */}
  <div className="mb-4 w-full">
  <p className="text-[10px] font-bold text-slate-400 dark:text-[#8c8c8c] uppercase tracking-widest mb-2">
  {filledSlots}/{maxSize} Players
  </p>
  <div className="flex flex-col gap-1.5">
  {(team.members || []).map((member, i) => (
  <div
  key={member.id || i}
  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${
  member.isReady
  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
  : 'bg-slate-50 dark:bg-[#262626] border-slate-100 dark:border-[#333333]'
  }`}
  >
  {/* Avatar */}
  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
  member.isReady 
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' 
    : 'bg-slate-200 text-slate-600 dark:bg-[#333333] dark:text-[#eff1f6]'
  }`}>
  {member.name?.[0]?.toUpperCase() || '?'}
  </div>

  <span className="text-sm font-semibold text-slate-800 dark:text-white leading-none flex-1 truncate">
  {member.name}
  </span>

  <div className="flex items-center gap-1.5 ml-auto">
  {member.isReady && (
  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
  )}
  {member.name === 'You' && (
  <Badge className="bg-blue-600 text-white">YOU</Badge>
  )}
  {member.isLeader && (
  <Badge className="bg-slate-900 dark:bg-white dark:text-black text-white">LEADER</Badge>
  )}
  {iAmLeader && !member.isLeader && (
  <button
  onClick={(e) => {
  e.stopPropagation();
  onKickMember && onKickMember(member.id);
  }}
  className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all shrink-0 ml-1.5"
  title="Kick player"
  >
  <X className="w-3.5 h-3.5" />
  </button>
  )}
  </div>
  </div>
  ))}

  {/* Empty slots */}
  {Array.from({ length: Math.max(0, emptySlots) }).map((_, i) => (
  <div
  key={`empty-${i}`}
  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50/50 dark:bg-[#1a1a1a]/30 border border-dashed border-slate-200 dark:border-[#333333]"
  >
  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#262626] flex items-center justify-center">
  <Plus className="w-3.5 h-3.5 text-slate-300 dark:text-[#333333]" strokeWidth={2} />
  </div>
  <span className="text-xs text-slate-400 dark:text-[#8c8c8c] font-medium">
  Open slot
  </span>
  </div>
  ))}
  </div>
  </div>

  {/* ── Footer Actions ── */}
  <div className="mt-auto w-full flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-[#2d2d2d]">
  {/* Left: Join or Ready+Leave */}
  <div className="flex items-center gap-2">
  {!isMyTeam ? (
  <button
  onClick={() => onJoinTeam(team)}
  disabled={emptySlots === 0}
  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#262626] text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#333333] hover:border-slate-300 dark:hover:border-[#3d3d3d] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
  >
  <Plus className="w-4 h-4" strokeWidth={2} />
  Join
  </button>
  ) : (
  <>
  {/* Ready toggle */}
  <button
  onClick={() => onReady && onReady()}
  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
  iAmReady
  ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400'
  : 'border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#262626] text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-[#333333] hover:border-slate-300 dark:hover:border-[#3d3d3d]'
  }`}
  >
  <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
  {iAmReady ? 'Ready!' : 'Ready Up'}
  </button>

  {/* Leave */}
  <button
  onClick={() => onLeaveTeam()}
  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-[#3a1d1d] text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-[#4a2424] hover:text-red-700 dark:hover:text-red-300 transition-all"
  >
  <LogOut className="w-4 h-4" strokeWidth={2} />
  Leave
  </button>
  </>
  )}
  </div>

  {/* Right: Slots remaining */}
  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
  <Users className="w-3.5 h-3.5 text-slate-400 dark:text-[#8c8c8c]" strokeWidth={2} />
  {emptySlots} {emptySlots === 1 ? 'slot' : 'slots'} left
  </span>
  </div>
  </div>
  );
}

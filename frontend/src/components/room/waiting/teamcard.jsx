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
 className={`flex flex-col bg-white rounded-xl p-5 transition-all duration-300 ${
 isMyTeam && allReady
 ? 'border-2 border-emerald-500 bg-emerald-50/30 shadow-[0_0_0_4px_rgba(16,185,129,0.08)]'
 : isMyTeam
 ? 'border-2 border-slate-900'
 : isDisabled
 ? 'border border-slate-100 opacity-40 grayscale pointer-events-none select-none'
 : 'border border-slate-200 hover:border-slate-300'
 }`}
 >
 {/* ── Header ── */}
 <div className="flex items-start justify-between w-full mb-4">
 <div className="flex flex-col gap-0.5">
 <div className="flex items-center gap-2">
 {/* Team icon */}
 <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
 allReady && isMyTeam ? 'bg-emerald-100 border border-emerald-200' : 'bg-slate-100 border border-slate-200'
 }`}>
 {isPublic
 ? <Users className={`w-4 h-4 ${allReady && isMyTeam ? 'text-emerald-600' : 'text-slate-600'}`} strokeWidth={1.8} />
 : <Shield className="w-4 h-4 text-slate-600" strokeWidth={1.8} />
 }
 </div>
 <div>
 <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
 {team.name}
 </h3>
 {/* Team code — only for leader */}
 {iAmLeader && (
 <span className="text-[10px] font-mono font-bold text-slate-400 tracking-widest uppercase">
 Code: {team.code}
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Public/Private pill + all-ready badge */}
 <div className="flex flex-col items-end gap-1 shrink-0">
 <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 ">
 {isPublic ? 'Public' : 'Private'}
 </span>
 {allReady && (
 <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold ">
 <CheckCircle2 className="w-3 h-3" /> All Ready
 </span>
 )}
 </div>
 </div>

 {/* ── Player Slots ── */}
 <div className="mb-4 w-full">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ">
 {filledSlots}/{maxSize} Players
 </p>
 <div className="flex flex-col gap-1.5">
 {(team.members || []).map((member, i) => (
 <div
 key={member.id || i}
 className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${
 member.isReady
 ? 'bg-emerald-50/60 border-emerald-100'
 : 'bg-slate-50 border-slate-100'
 }`}
 >
 {/* Avatar */}
 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
 member.isReady ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
 }`}>
 {member.name?.[0]?.toUpperCase() || '?'}
 </div>

 <span className="text-sm font-semibold text-slate-800 leading-none flex-1 truncate">
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
 <Badge className="bg-slate-900 text-white">LEADER</Badge>
 )}
 {iAmLeader && !member.isLeader && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 onKickMember && onKickMember(member.id);
 }}
 className="p-1 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 transition-all shrink-0 ml-1.5"
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
 className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50/50 border border-dashed border-slate-200"
 >
 <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
 <Plus className="w-3.5 h-3.5 text-slate-300" strokeWidth={2} />
 </div>
 <span className="text-xs text-slate-400 font-medium ">
 Open slot
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* ── Footer Actions ── */}
 <div className="mt-auto w-full flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
 {/* Left: Join or Ready+Leave */}
 <div className="flex items-center gap-2">
 {!isMyTeam ? (
 <button
 onClick={() => onJoinTeam(team)}
 disabled={emptySlots === 0}
 className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed "
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
 ? 'bg-emerald-600 text-white hover:bg-emerald-700'
 : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
 }`}
 >
 <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
 {iAmReady ? 'Ready!' : 'Ready Up'}
 </button>

 {/* Leave */}
 <button
 onClick={() => onLeaveTeam()}
 className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-100 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 hover:text-red-700 transition-all "
 >
 <LogOut className="w-4 h-4" strokeWidth={2} />
 Leave
 </button>
 </>
 )}
 </div>

 {/* Right: Slots remaining */}
 <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 ">
 <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
 {emptySlots} {emptySlots === 1 ? 'slot' : 'slots'} left
 </span>
 </div>
 </div>
 );
}

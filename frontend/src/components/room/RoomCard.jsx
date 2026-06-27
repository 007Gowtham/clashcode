'use client';
import { cn } from '@/lib/utils';
import { ArrowRight, Lock, Wifi, Zap } from 'lucide-react';

export default function RoomCard({ room, onJoin, activeRoomId }) {
 const isPlaying = room.status === 'PLAYING' || room.status === 'IN_PROGRESS';
 const isWaiting = room.status === 'WAITING';
 const isPrivate = room.settings?.privacy === 'private' || room.hasPassword;
 const isMyRoom = activeRoomId === (room._id || room.id);

 let statusText = 'Ready';
 let isAvailable = true;
 let StatusIcon = Wifi;
 let statusColor = 'text-slate-700';

 if (isMyRoom) {
 statusText = 'Active';
 isAvailable = true;
 StatusIcon = Zap;
 statusColor = 'text-emerald-500';
 } else if (activeRoomId) {
 statusText = 'Locked';
 isAvailable = false;
 StatusIcon = Lock;
 statusColor = 'text-slate-400';
 } else if (isPlaying) {
 statusText = 'Live Now';
 isAvailable = false;
 StatusIcon = Zap;
 statusColor = 'text-green-700';
 } else if (room.status === 'ENDED') {
 statusText = 'Ended';
 isAvailable = false;
 StatusIcon = Lock;
 statusColor = 'text-red-500';
 }

 return (
 <div className={cn(
 "flex flex-col items-start bg-white rounded-xl border p-6 transition-all duration-200 relative overflow-hidden group",
 isMyRoom 
 ? "border-emerald-400 shadow-md shadow-emerald-500/10 ring-4 ring-emerald-500/20" 
 : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
 )}>

 {/* Icon & Title Row */}
 <div className="flex items-center gap-4 mb-6 w-full">
 <div className="w-12 h-12 rounded-lg flex items-center justify-center border border-slate-200/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-[0_4px_8px_-2px_rgba(0,0,0,0.05),0_1px_0_inset_rgba(255,255,255,1)] shrink-0">
 <StatusIcon width={20} height={20} strokeWidth={1.5} className={statusColor} />
 </div>
 <h3 className="text-xl font-medium text-slate-900  truncate w-full ">
 {room.name || 'Unnamed Room'}
 </h3>
 {isPrivate && (
 <div className="bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0">
 <Lock className="w-3.5 h-3.5 text-slate-500" />
 <span className="text-xs font-medium text-slate-600 ">Private</span>
 </div>
 )}
 </div>

 {/* Details */}
 <div className="w-full mb-6">
 <div className="mb-3 px-1">
 <span className="text-[10px] font-medium text-slate-400   ">Battle Intel</span>
 </div>
 <div className="flex flex-wrap items-center justify-between gap-4 w-full border-t border-b border-gray-100 py-4">
 <div className="flex flex-col gap-0.5">
 <span className="text-xs text-slate-500 font-medium   ">Teams</span>
 <span className="text-lg font-semibold text-slate-900 ">{room.teams?.length || 0}</span>
 </div>

 <div className="flex flex-col gap-0.5 pl-4 border-l border-gray-200">
 <span className="text-xs text-slate-500 font-medium   ">Time Limit</span>
 <span className="text-lg font-semibold text-slate-900 ">{room.timeLimitMinutes || 30}m</span>
 </div>

 <div className="flex flex-col gap-0.5 pl-4 border-l border-gray-200">
 <span className="text-xs text-slate-500 font-medium   ">Status</span>
 <span className={cn("text-lg font-semibold truncate max-w-[120px] ", statusColor)}>{statusText}</span>
 </div>
 </div>
 </div>

 {/* Action Button */}
 <button
 onClick={() => onJoin(room)}
 disabled={!isAvailable}
 className={cn(
 "w-full mt-auto py-2 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all",
 isAvailable
 ? "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10"
 : "bg-slate-100 text-slate-400 cursor-not-allowed"
 )}
 >
 {isAvailable ? (
 <>
 {isMyRoom ? 'Rejoin Room' : 'Join Room'} <ArrowRight className="w-4 h-4" />
 </>
 ) : (
 <span>{statusText}</span>
 )}
 </button>

 </div>
 );
}
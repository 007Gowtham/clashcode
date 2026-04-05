import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Crown, User } from 'lucide-react';

export default function ParticipantsList({ teams, currentUserId, onJoinTeam, onLeaveTeam }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
            {teams.map((team) => {
                const isUserInTeam = team.members.some(m => m.id === currentUserId);
                const isFull = team.members.length >= team.maxSize;

                return (
                    <div
                        key={team.id}
                        className={cn(
                            "group relative flex flex-col bg-white rounded-2xl border transition-all duration-300 overflow-hidden",
                            isUserInTeam
                                ? "border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50"
                                : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                        )}
                    >
                        {/* Team Header */}
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 line-clamp-1">{team.name}</h3>
                                <p className="text-xs text-slate-500 mt-1 font-medium">{team.members.length} / {team.maxSize} Members</p>
                            </div>
                            {isUserInTeam && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                    Your Team
                                </span>
                            )}
                        </div>

                        {/* Members List */}
                        <div className="p-4 space-y-3 flex-1">
                            {team.members.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-900 truncate">{member.name}</span>
                                            {member.isLeader && (
                                                <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                                            )}
                                        </div>
                                    </div>
                                    {member.isReady ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-slate-300" />
                                    )}
                                </div>
                            ))}

                            {/* Empty Slots */}
                            {Array.from({ length: Math.max(0, team.maxSize - team.members.length) }).map((_, i) => (
                                <div key={`empty-${i}`} className="flex items-center gap-3 p-2 rounded-xl border border-dashed border-slate-200">
                                    <div className="w-8 h-8 rounded-full bg-slate-50/50 flex items-center justify-center text-slate-300">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm text-slate-400 italic">Empty Slot</span>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="p-4 pt-0 mt-auto">
                            {isUserInTeam ? (
                                <button
                                    onClick={() => onLeaveTeam(team.id)}
                                    className="w-full py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                >
                                    Leave Team
                                </button>
                            ) : (
                                <button
                                    onClick={() => onJoinTeam(team.id)}
                                    disabled={isFull}
                                    className={cn(
                                        "w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                        isFull
                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10"
                                    )}
                                >
                                    {isFull ? 'Team Full' : 'Join Team'}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

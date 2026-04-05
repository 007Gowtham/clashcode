import { Clock, Trophy, Users } from 'lucide-react';

export default function LobbyHeader({ roomName, status, participantCount, maxParticipants }) {
    return (
        <div className="w-full max-w-4xl max-auto mb-8">
            <div className="flex flex-col items-center text-center space-y-4">
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider">{status}</span>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                    {roomName}
                </h1>

                {/* Meta Row */}
                <div className="flex items-center gap-6 text-slate-500 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{participantCount} / {maxParticipants} Teams</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Waiting for host</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        <span>Ranked Match</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useMemo } from "react";
import { Flame } from "lucide-react";

function buildTeamHoverStats(team) {
  // Premium-but-simple derived stats (replace with real API fields later)
  const avgRuntimeMs = Math.round((team?.averageTime ?? 40) * 3);
  const avgMemoryMb = Math.round(28 + (team?.members?.length ?? 0) * 2);
  const topics = ["Graphs", "DP", "Trees", "Arrays", "Greedy", "Strings"];
  const topicIndex =
    typeof team?.id === "string"
      ? team.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % topics.length
      : 0;

  return {
    membersCount: team?.members?.length ?? 0,
    avgRuntime: `${avgRuntimeMs}ms`,
    avgMemory: `${avgMemoryMb}MB`,
    strongestTopic: topics[topicIndex],
    winStreak: team?.streak ?? 0,
  };
}

export default function TeamHoverCardContent({ team }) {
  const stats = useMemo(() => buildTeamHoverStats(team), [team]);

  if (!team) return null;

  return (
    <div>
      {/* small highlight line */}
      <div className="h-0.5 w-10 rounded-full bg-emerald-500/80 mb-3" />

      <div className="text-sm font-semibold text-slate-900 truncate">{team.name}</div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Members</span>
          <span className="text-slate-800 font-medium">{stats.membersCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Avg Runtime</span>
          <span className="text-slate-800 font-medium">{stats.avgRuntime}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Avg Memory</span>
          <span className="text-slate-800 font-medium">{stats.avgMemory}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Strongest Topic</span>
          <span className="text-slate-800 font-medium">{stats.strongestTopic}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Win Streak</span>
          <span className="text-slate-800 font-medium flex items-center gap-1">
            <Flame className="w-4 h-4 text-slate-400" />
            <span className="text-emerald-600 font-semibold">{stats.winStreak}</span>
          </span>
        </div>
      </div>
    </div>
  );
}


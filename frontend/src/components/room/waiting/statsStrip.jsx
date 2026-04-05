export default function StatsStrip({ room }) {
  if (!room) return (
    <div className="grid grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100 h-[62px]"></div>
      ))}
    </div>
  );

  const teamsJoined = room.teams ? room.teams.length : 0;
  const maxTeams = room.settings?.maxTeams || 20;
  const maxTeamSize = room.settings?.maxMembers || 3;
  const problems = room.questions || [];
  const myTeam = room.myTeam;
  const isReady = !!myTeam;

  const getDifficultyColor = (diff) => {
    switch (diff?.toUpperCase()) {
      case 'EASY': return 'bg-emerald-500';
      case 'MEDIUM': return 'bg-amber-500'; // Changed to amber for better visibility
      case 'HARD': return 'bg-rose-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
        <span className="block text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Teams Joined</span>
        <span className="text-lg font-semibold text-gray-900">
          {teamsJoined}<span className="text-gray-400 text-sm font-normal">/{maxTeams}</span>
        </span>
      </div>

      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
        <span className="block text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Max Team Size</span>
        <span className="text-lg font-semibold text-gray-900">
          {maxTeamSize} <span className="text-sm font-normal text-gray-500">Members</span>
        </span>
      </div>

      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
        {/* <span className="block text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Difficulty</span>
        <div className="flex gap-1 mt-2 flex-wrap">
          {problems.length > 0 ? (
            problems.slice(0, 8).map((p, i) => (
              <div
                key={p.id || i}
                className={`h-1.5 w-4 rounded-full ${getDifficultyColor(p.difficulty)}`}
                title={p.difficulty || 'Unknown'}
              />
            ))
          ) : (
            <div className="h-1.5 w-12 rounded-full bg-gray-200"></div>
          )}
          {problems.length > 8 && (
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
          )}
        </div> */}
        <span className="block text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Status</span>
        <span className="text-lg font-semibold text-gray-900">Active</span>
      </div>

      <div className={`p-3 rounded-lg border flex items-center justify-between transition-all ${isReady ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100'
        }`}>
        <div className="flex flex-col">
          <span className="block text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">My Status</span>
          {isReady ? (
            <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Ready
            </span>
          ) : (
            <span className="text-sm font-semibold text-amber-600 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              Join a Team
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

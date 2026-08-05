export default function StatsOverview({ stats, variant = 'default' }) {
  const descriptions = {
    // Rooms Page Stats
    'Total Rooms': 'Active battlegrounds instantiated across the global network.',
    'Live Battles': 'Real-time competitive algorithmic matches currently in progress.',
    'Active Coders': 'Engineers currently deployed and writing code in the arena.',
    'Available': 'Open lobbies awaiting challengers to join the competition.',

    // Waiting Room Stats
    'Active Teams': 'Squads formed and preparing for the upcoming clash.',
    'Total Players': 'Total combatants logged in and standing by in this lobby.',
    'Ready Teams': 'Teams fully armed and ready to initiate sequence.',
    'Waiting': 'Players currently unassigned or pending readiness confirmation.',
  };

  const iconColors = {
    // Rooms Page Stats
    'Total Rooms': 'bg-retro-blue text-white',
    'Live Battles': 'bg-retro-orange text-white',
    'Active Coders': 'bg-retro-mint text-white',
    'Available': 'bg-retro-yellow text-retro-ink',

    // Waiting Room Stats
    'Active Teams': 'bg-retro-blue text-white',
    'Total Players': 'bg-retro-mint text-white',
    'Ready Teams': 'bg-retro-orange text-white',
    'Waiting': 'bg-retro-yellow text-retro-ink',
  };

  if (variant === 'compact') {
    const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-3'];
    const bgColors = [
      'bg-retro-blue text-white', 
      'bg-retro-mint text-retro-ink', 
      'bg-retro-orange text-white', 
      'bg-retro-yellow text-retro-ink'
    ];
    
    return (
      <div className="w-full max-w-6xl mx-auto mb-16 px-4 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
          {stats.map((stat, i) => {
            const isHighlight = stat.highlighted;
            return (
              <div 
                key={i}
                className={`relative border-[3px] border-retro-ink p-6 shadow-[6px_6px_0px_rgba(15,23,42,1)] transition-all hover:-translate-y-2 hover:shadow-[10px_10px_0px_rgba(15,23,42,1)] flex flex-col justify-between ${bgColors[i % bgColors.length]} ${rotations[i % rotations.length]} hover:rotate-0`}
              >
                {/* Fake tape / pinned element */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#fefcd0] border-2 border-retro-ink opacity-90 -rotate-3 z-10 shadow-sm" />

                <div>
                  <div className="flex items-start justify-between mb-6 relative z-0">
                    <div className="w-12 h-12 flex items-center justify-center border-2 border-retro-ink bg-white text-retro-ink shadow-[3px_3px_0px_rgba(15,23,42,1)]">
                      <stat.icon strokeWidth={3} className="w-6 h-6" />
                    </div>
                    {isHighlight && (
                      <span className="px-2 py-1 border-2 border-retro-ink bg-white text-retro-ink text-[10px] font-mono font-black uppercase tracking-widest shadow-[3px_3px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 rotate-6">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full bg-retro-orange opacity-75 rounded-full" />
                          <span className="relative inline-flex h-2 w-2 bg-retro-orange rounded-full" />
                        </span>
                        HOT
                      </span>
                    )}
                  </div>
                  <h3 className="font-mono text-sm font-black uppercase tracking-widest mb-1 leading-tight">
                    {stat.label}
                  </h3>
                  <div className="text-5xl font-sans font-black tracking-tighter mb-4 mt-2">
                    {stat.value}
                  </div>
                  <div className="h-1 w-full bg-retro-ink opacity-20 mb-4" />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider leading-relaxed opacity-90">
                    {descriptions[stat.label]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mb-14">
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`}>
        {stats.map((stat, i) => {
          const isHighlight = stat.highlighted;

          return (
            <div
              key={i}
              className={`border-2 border-retro-ink p-6 shadow-retro transition-all hover:-translate-y-1 hover:shadow-retro-lg flex flex-col justify-between ${isHighlight ? 'bg-retro-orange text-white' : 'bg-white text-retro-ink'
                }`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 flex items-center justify-center border-2 border-retro-ink shadow-retro-sm ${iconColors[stat.label] || 'bg-retro-paper text-retro-ink'
                    }`}>
                    <stat.icon strokeWidth={3} className="w-6 h-6" />
                  </div>
                  {isHighlight && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 border-2 border-retro-ink bg-white text-retro-ink text-[10px] font-mono font-black uppercase tracking-widest shadow-retro-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full bg-retro-orange opacity-75" />
                        <span className="relative inline-flex h-2 w-2 bg-retro-orange" />
                      </span>
                      HOT
                    </span>
                  )}
                </div>

                <h3 className="font-mono text-sm font-black uppercase tracking-widest mb-2">
                  {stat.label}
                </h3>

                <p className={`font-mono text-[10px] font-bold uppercase tracking-wider leading-relaxed mb-6 ${isHighlight ? 'text-white/90' : 'text-retro-muted'
                  }`}>
                  {descriptions[stat.label]}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t-2 border-retro-ink/20">
                <span className="text-6xl font-sans font-black tracking-tighter">
                  {stat.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

function AnimatedNumber({ value }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const target = Number(value) || 0;
        if (target === 0) {
            setDisplay(0);
            return;
        }

        let frame;
        const start = performance.now();
        const duration = 800;

        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const current = Math.round(target * eased);
            setDisplay(current);
            if (t < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value]);

    return <>{display}</>;
}

export default function StatsOverview({ stats }) {
    // stats is an array of objects: { label, value, icon, highlighted, className }

    const totalPlayers = stats.find((s) => s.label === 'Total Players')?.value || 0;

    return (
        <div className="w-full max-w-6xl mx-auto mb-12">
            {/* Main Card Container */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-[2rem] border border-slate-200/90 dark:border-[#2d2d2d] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors duration-300">
                {/* Grid Layout */}
                <div className={`grid grid-cols-1 ${stats.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'} divide-y md:divide-y-0 md:divide-x divide-slate-200/90 dark:divide-[#2d2d2d] items-stretch`}>

                    {stats.map((stat, index) => {
                        const isActiveTeams = stat.label === 'Active Teams';
                        const isReady = stat.label === 'Ready';
                        const readyCount = isReady ? Number(stat.value) || 0 : 0;
                        const readyPercent =
                            isReady && totalPlayers > 0
                                ? Math.min(100, Math.max(0, (readyCount / totalPlayers) * 100))
                                : 0;

                        return (
                            <div
                                key={index}
                                className={cn(
                                    'flex flex-col items-center py-8 px-6 text-center group relative',
                                    stat.className
                                )}
                            >
                                {stat.highlighted ? (
                                    <div className="w-20 h-20 mb-8 bg-emerald-500 rounded-[1.25rem] shadow-[0_8px_20px_-4px_rgba(16,185,129,0.4)] flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-[1.03] group-hover:shadow-[0_0_22px_rgba(16,185,129,0.7)]">
                                        <stat.icon
                                            strokeWidth={1.5}
                                            className="w-9 h-9 text-white transition-transform duration-300"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 mb-8 bg-white dark:bg-[#2c2c2c] rounded-[1.25rem] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-[#3d3d3d] flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_0_18px_rgba(16,185,129,0.4)]">
                                        <stat.icon strokeWidth={1.5} className="w-9 h-9 text-slate-800 dark:text-white" />
                                    </div>
                                )}

                                <h3 className="text-4xl font-semibold text-slate-900 dark:text-white tracking-tight mb-1">
                                    <AnimatedNumber value={stat.value} />
                                </h3>

                                {isActiveTeams && (
                                    <p className="text-xs text-emerald-600 font-medium mb-1">
                                        ↑ +1 in last 5 min
                                    </p>
                                )}

                                {isReady && (
                                    <div className="w-full max-w-[160px] mb-1">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {readyCount} / {totalPlayers || 0} Ready
                                        </p>
                                        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#2c2c2c] overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
                                                style={{ width: `${readyPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium mt-1">{stat.label}</p>
                            </div>
                        );
                    })}

                </div>
            </div>
        </div>
    );
}
import WorldMap from '@/components/ui/world-map';
import { memo } from 'react';

function WorldMapBackground() {
    return (
        <>
            {/* Background World Map Container */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] z-0 opacity-40 pointer-events-none">
                <WorldMap
                    lineColor="#10b981"
                    
                    dots={[
                        {
                            start: { lat: 64.2008, lng: -149.4937 }, // Alaska
                            end: { lat: 34.0522, lng: -118.2437 }, // LA
                        },
                        {
                            start: { lat: 64.2008, lng: -149.4937 },
                            end: { lat: -15.7975, lng: -47.8919 }, // Brazil
                        },
                        {
                            start: { lat: -15.7975, lng: -47.8919 },
                            end: { lat: 38.7223, lng: -9.1393 }, // Lisbon
                        },
                        {
                            start: { lat: 51.5074, lng: -0.1278 }, // London
                            end: { lat: 28.6139, lng: 77.209 }, // New Delhi
                        },
                        {
                            start: { lat: 28.6139, lng: 77.209 },
                            end: { lat: 43.1332, lng: 131.9113 }, // Vladivostok
                        },
                        {
                            start: { lat: 28.6139, lng: 77.209 },
                            end: { lat: -1.2921, lng: 36.8219 }, // Nairobi
                        },
                    ]}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
            </div>

            {/* Catchy Connect Text - Outside Map Container */}
            <div className="absolute top-[450px] left-0 right-0 text-center flex flex-col items-center justify-center pointer-events-none z-0 px-4">
                <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-slate-50 border border-slate-200/60 mb-4 shadow-sm backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold tracking-[0.15em] text-slate-500 uppercase font-mono">Global Battleground</span>
                </div>

                <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2 font-[family-name:var(--font-space)]">
                    The <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Arena Awaits.</span>
                </h3>
                <p className="text-lg text-slate-500 font-medium max-w-lg leading-relaxed">
                    Assemble your squad, optimize your logic, and dominate the world map.
                </p>
            </div>
        </>
    );
}

export default memo(WorldMapBackground);

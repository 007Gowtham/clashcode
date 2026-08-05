import { cn } from '@/lib/utils';

export default function RoomHeader({
  title = 'DSA Multiplayer',
  description = 'Join active competitions or start your own.',
  className
}) {
  const words = title.split(' ');

  return (
    <div className={cn("text-center mb-16 space-y-8", className)}>
      <span className="inline-block border-[3px] border-retro-ink bg-retro-yellow px-4 py-1.5 font-mono text-xs font-black uppercase text-retro-ink shadow-[3px_3px_0px_rgba(15,23,42,1)] rotate-[-2deg] mb-4">
        BATTLE ARENA // ONLINE
      </span>
      <h1 className="text-6xl md:text-8xl uppercase tracking-tight text-retro-ink flex flex-wrap justify-center gap-x-6 gap-y-2">
        {words.map((word, i) => (
          <span key={i} className={i % 2 === 1 ? 'font-heading-outline text-[#ff4081]' : 'font-heading'}>
            {word}
          </span>
        ))}
      </h1>
      <p className="text-2xl md:text-4xl font-heading uppercase text-retro-ink max-w-4xl mx-auto leading-tight mt-6">
        {description}
      </p>
    </div>
  );
}
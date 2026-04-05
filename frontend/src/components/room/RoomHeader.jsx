import { cn } from "@/lib/utils";

export default function RoomHeader({
    title = "Clash Code",
    description = "Join active competitions or start your own.",
    titleClassName,
    descriptionClassName,
}) {
    return (
        <div className="text-center mb-16 space-y-4">
            <h1
                className={cn(
                    "text-5xl md:text-7xl font-black tracking-tighter font-[family-name:var(--font-space)] text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-700 drop-shadow-sm",
                    titleClassName
                )}
            >
                {title}
            </h1>
            <p
                className={cn(
                    "text-lg md:text-xl text-slate-500 font-normal max-w-2xl mx-auto",
                    descriptionClassName
                )}
            >
                {description}
            </p>
        </div>
    );
}
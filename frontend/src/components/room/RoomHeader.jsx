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
 "text-6xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight",
 titleClassName
 )}
 >
 {title}
 </h1>
 <p
 className={cn(
 "text-lg md:text-xl text-slate-500 dark:text-slate-400 font-normal max-w-2xl mx-auto",
 descriptionClassName
 )}
 >
 {description}
 </p>
 </div>
 );
}
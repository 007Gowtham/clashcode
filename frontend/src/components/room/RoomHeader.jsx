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
<<<<<<< HEAD
 "text-6xl md:text-7xl font-bold text-slate-900 tracking-tight",
=======
 "text-6xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight",
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
 titleClassName
 )}
 >
 {title}
 </h1>
 <p
 className={cn(
<<<<<<< HEAD
 "text-lg md:text-xl text-slate-500 font-normal max-w-2xl mx-auto",
=======
 "text-lg md:text-xl text-slate-500 dark:text-slate-400 font-normal max-w-2xl mx-auto",
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
 descriptionClassName
 )}
 >
 {description}
 </p>
 </div>
 );
}
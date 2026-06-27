'use client';

import { TypographySmall } from "@/components/ui/typography";

export function ProblemMeta({
 difficulty = "Easy",
 timeLimit = "1s",
 memoryLimit = "256MB",
 solvedCount = "12,431",
 tags = ["Array", "HashMap"],
}) {
 const difficultyConfig = {
 Easy: {
 label: "Easy",
 className:
 "bg-emerald-50 text-emerald-700 border border-emerald-200",
 },
 Medium: {
 label: "Medium",
 className: "bg-amber-50 text-amber-700 border border-amber-200",
 },
 Hard: {
 label: "Hard",
 className: "bg-rose-50 text-rose-700 border border-rose-200",
 },
 }[difficulty] || {
 label: difficulty,
 className: "bg-slate-50 text-slate-700 border border-slate-200",
 };

 return (
 <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 ">
 <span
 className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${difficultyConfig.className}`}
 >
 <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
 <span>{difficultyConfig.label}</span>
 </span>

 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
 <span>⏱</span>
 <TypographySmall className="text-[11px] font-medium">
 {timeLimit}
 </TypographySmall>
 </span>

 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
 <span>💾</span>
 <TypographySmall className="text-[11px] font-medium">
 {memoryLimit}
 </TypographySmall>
 </span>

 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
 <span>👥</span>
 <TypographySmall className="text-[11px] font-medium">
 {solvedCount} solved
 </TypographySmall>
 </span>

 <div className="flex flex-wrap items-center gap-1 ml-1">
 {tags.map((tag) => (
 <span
 key={tag}
 className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200"
 >
 #{tag}
 </span>
 ))}
 </div>
 </div>
 );
}


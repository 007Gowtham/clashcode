'use client';

import { TypographySmall } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { Code2 } from 'lucide-react';

export const EditorHeader = () => {
    // Single tab for now, but keeping structure consistent
    const tabs = [
        { id: 'code', label: 'Code', icon: Code2, color: 'text-green-600' },
    ];
    const activeTab = 'code';

    return (
        <div className="flex items-center justify-between px-2 pt-2 border-b border-gray-200 bg-gray-50/50 shrink-0">
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all relative",
                            activeTab === tab.id
                                ? "text-gray-900 "
                                : "text-gray-500 border-b-2 border-transparent hover:text-gray-700"
                        )}
                    >
                        <tab.icon className={cn("w-4 h-4 stroke-[1.5]", tab.color)} />
                        <TypographySmall className="text-[13px] font-semibold">{tab.label}</TypographySmall>
                    </button>
                ))}
            </div>
        </div>
    );
};

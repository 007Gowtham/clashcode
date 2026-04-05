'use client';

import { TypographySmall } from "@/components/ui/typography";
import { useProblemPanel } from '@/contexts/ProblemPanelContext';
import { cn } from "@/lib/utils";
import { BookOpen, ChevronLeft, ChevronRight, FileText, History, Scan } from 'lucide-react';

export const ProblemHeader = ({ activeTab, onTabChange }) => {
    const { isCollapsed, toggleCollapse, expand } = useProblemPanel();

    const tabs = [
        { id: 'description', label: 'Description', icon: FileText, color: 'text-blue-500' },
        { id: 'editorial', label: 'Editorial', icon: BookOpen, color: 'text-yellow-500' },
        { id: 'submissions', label: 'Submissions', icon: History, color: 'text-gray-400' },
    ];

    if (isCollapsed) {
        return (
            <div className="flex flex-col items-center py-3 px-1 bg-white border-r border-gray-200 h-full">
                {/* Vertical Tabs */}
                <div className="flex flex-col gap-3 flex-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (onTabChange) onTabChange(tab.id);
                                expand();
                            }}
                            className={cn(
                                "flex flex-col items-center gap-1.5 px-1.5 py-2 text-xs font-medium transition-all rounded-lg",
                                activeTab === tab.id
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4 stroke-[1.5]", activeTab === tab.id ? "text-blue-600" : tab.color)} />
                            <span className="writing-mode-vertical text-[10px] font-semibold whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Expand Button */}
                <button
                    onClick={toggleCollapse}
                    className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100 mt-3"
                    title="Expand"
                >
                    <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
                </button>
            </div>
        );
    }

    return (
        <div className={cn(
            "flex items-center justify-between px-2 shrink-0 transition-all",
            "pt-2 border-b border-gray-200 bg-gray-50/50"
        )}>
            <div className="relative">
                <div className="flex gap-1 overflow-x-auto no-scrollbar relative">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange && onTabChange(tab.id)}
                            className={cn(
                                "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                                activeTab === tab.id
                                    ? "text-gray-900"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4 stroke-[1.5]", tab.color)} />
                            <TypographySmall className="text-[13px] font-semibold">{tab.label}</TypographySmall>
                            {tab.id === 'submissions' && (
                                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold px-1.5 py-0.5 text-slate-600">
                                    5
                                </span>
                            )}
                            {activeTab === tab.id && (
                                <span className="absolute left-2 right-2 -bottom-1 h-0.5 rounded-full bg-gray-900 transition-all duration-200" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Window Actions */}
            <div className="flex items-center gap-2">
                <button className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100" title="Full Screen">
                    <Scan className="w-4 h-4 stroke-[1.5]" />
                </button>
                <button
                    onClick={toggleCollapse}
                    className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100"
                    title="Collapse"
                >
                    <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
                </button>
            </div>
        </div>
    );
};

'use client';

import { TypographySmall } from "@/components/ui/typography";
import { useResultsPanel } from '@/contexts/ResultsPanelContext';
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Scan, Square, Terminal } from 'lucide-react';

export const ResultsHeader = ({ activeView, onViewChange }) => {
    const { isCollapsed, toggleCollapse, expand } = useResultsPanel();

    const tabs = [
        { id: 'result', label: 'Test Result', icon: Terminal, color: 'text-green-600' },
    ];

    return (
        <div className={cn(
            "flex items-center justify-between px-4 shrink-0 transition-all",
            isCollapsed ? "py-2 border-t border-gray-200 bg-white" : "pt-2 border-b border-gray-200 bg-gray-50/50"
        )}>
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if (onViewChange) onViewChange(tab.id);
                            if (isCollapsed) expand();
                        }}
                        className={cn(
                            "flex items-center gap-2 px-3 text-sm font-medium transition-all relative",
                            isCollapsed ? "py-1.5" : "py-2",
                            activeView === tab.id && !isCollapsed
                                ? "text-gray-900 border-b-2 border-gray-500"
                                : "text-gray-500 border-b-2 border-transparent hover:text-gray-700"
                        )}
                    >
                        <tab.icon className={cn("w-4 h-4 stroke-[1.5]", tab.color)} />
                        <TypographySmall className="text-[13px] font-semibold">{tab.label}</TypographySmall>
                    </button>
                ))}
            </div>

            {/* Window Actions */}
            <div className="flex items-center gap-2">
                {!isCollapsed && (
                    <button className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100" title="Full Screen">
                        <Scan className="w-4 h-4 stroke-[1.5]" />
                    </button>
                )}
                <button
                    onClick={toggleCollapse}
                    className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100"
                    title={isCollapsed ? "Expand" : "Collapse"}
                >
                    {isCollapsed ? (
                        <ChevronUp className="w-4 h-4 stroke-[1.5]" />
                    ) : (
                        <ChevronDown className="w-4 h-4 stroke-[1.5]" />
                    )}
                </button>
            </div>
        </div>
    );
};

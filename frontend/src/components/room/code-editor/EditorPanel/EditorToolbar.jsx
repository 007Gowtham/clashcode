'use client';

import {
    AlignLeft,
    Bookmark,
    Braces,
    ChevronDown,
    Lock,
    Maximize2,
    RotateCcw
} from 'lucide-react';

export const EditorToolbar = () => {
    return (
        <div className="flex items-center justify-between p-2 border-b border-gray-100 bg-white shrink-0">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <button className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:bg-gray-100 px-2 py-1 rounded transition-colors font-sans">
                        Python3
                        <ChevronDown className="w-3 h-3 stroke-[1.5]" />
                    </button>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 font-sans">
                    <Lock className="w-3 h-3 stroke-[1.5]" />
                    <span>Auto</span>
                </div>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
                <button title="Format">
                    <AlignLeft className="w-4 h-4 hover:text-gray-600 cursor-pointer stroke-[1.5]" />
                </button>
                <button title="Bookmark">
                    <Bookmark className="w-4 h-4 hover:text-gray-600 cursor-pointer stroke-[1.5]" />
                </button>
                <button title="Brackets">
                    <Braces className="w-4 h-4 hover:text-gray-600 cursor-pointer stroke-[1.5]" />
                </button>
                <button title="Reset">
                    <RotateCcw className="w-4 h-4 hover:text-gray-600 cursor-pointer stroke-[1.5]" />
                </button>
                <button title="Fullscreen">
                    <Maximize2 className="w-4 h-4 hover:text-gray-600 cursor-pointer stroke-[1.5]" />
                </button>
            </div>
        </div>
    );
};

'use client';

import { TypographySmall } from "@/components/ui/typography";
import { HelpCircle, MessageSquare, Share2, Star, ThumbsDown, ThumbsUp } from 'lucide-react';

export const ProblemFooter = () => {
    return (
        <div className="border-t border-gray-200 p-2 px-3 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-4 text-gray-400">
                <button className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <TypographySmall className="text-[10px]">13.1K</TypographySmall>
                </button>
                <button className="hover:text-gray-700 transition-colors">
                    <ThumbsDown className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-1.5 hover:text-gray-700 transition-colors border-l border-gray-200 pl-4">
                    <MessageSquare className="w-4 h-4" />
                    <TypographySmall className="text-[10px]">251</TypographySmall>
                </button>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
                <button className="hover:text-gray-700 transition-colors">
                    <Star className="w-4 h-4" />
                </button>
                <button className="hover:text-gray-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                </button>
                <button className="hover:text-gray-700 transition-colors">
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

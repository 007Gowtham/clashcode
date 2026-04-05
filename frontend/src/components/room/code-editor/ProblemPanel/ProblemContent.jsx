'use client';

import {
    TypographyH3,
    TypographyInlineCode,
    TypographyLarge,
    TypographyP,
    TypographySmall
} from "@/components/ui/typography";
import { Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProblemHints } from './ProblemHints';
import { ProblemMeta } from "./ProblemMeta";

export const ProblemContent = () => {
    return (
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
            <div className="space-y-6">
                {/* Title and Metadata */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <TypographyH3 className="text-gray-900 border-none pb-0">1. Two Sum</TypographyH3>
                            <div className="flex items-center gap-1 ml-2">
                                <button className="h-8 w-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all active:scale-90" title="Previous Question">
                                    <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
                                </button>
                                <button className="h-8 w-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all active:scale-90" title="Next Question">
                                    <ChevronRight className="w-5 h-5 stroke-[1.5]" />
                                </button>
                            </div>
                        </div>

                        {/* Premium Marks Badge */}
                        <div className="flex items-center gap-2.5 px-3 py-1 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 rounded-lg shadow-[0_4px_12px_-4px_rgba(79,70,229,0.4)] border border-indigo-400/30 group hover:scale-105 transition-all cursor-default shrink-0">
                            <div className="relative group-hover:rotate-12 transition-transform duration-300">
                                <Award className="w-4 h-4 text-white drop-shadow-sm" />
                                <div className="absolute -inset-1 bg-white/20 blur-[4px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                                <TypographySmall className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">Score</TypographySmall>
                                <TypographySmall className="text-[10px] font-black text-white tabular-nums">100 Pts</TypographySmall>
                            </div>
                        </div>
                    </div>

                    <ProblemMeta />
                </div>

                {/* Description */}
                <div className="max-w-none text-gray-700 font-sans space-y-4">
                    <TypographyP className="mt-0 leading-relaxed text-[15px]">
                        Given an array of integers <TypographyInlineCode className="bg-gray-100 text-gray-500">nums</TypographyInlineCode> and an integer <TypographyInlineCode className="bg-gray-100 text-gray-500">target</TypographyInlineCode>, return indices of the two numbers such that they add up to target.
                    </TypographyP>
                    <TypographyP className="leading-relaxed text-[15px]">
                        You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.
                    </TypographyP>
                    <TypographyP className="leading-relaxed text-[15px]">
                        You can return the answer in any order.
                    </TypographyP>
                </div>

                {/* Examples */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <TypographyLarge className="text-gray-900">Example 1:</TypographyLarge>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 font-mono text-sm space-y-2">
                            <TypographyP className="mt-0 text-sm">
                                <span className="text-gray-500 font-sans font-medium">Input:</span> nums = [2,7,11,15], target = 9
                            </TypographyP>
                            <TypographyP className="mt-0 text-sm">
                                <span className="text-gray-500 font-sans font-medium">Output:</span> [0,1]
                            </TypographyP>
                            <TypographyP className="mt-0 text-sm leading-relaxed">
                                <span className="text-gray-500 font-sans font-medium">Explanation:</span> Because nums[0] + nums[1] == 9, we return [0, 1].
                            </TypographyP>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <TypographyLarge className="text-gray-900">Example 2:</TypographyLarge>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 font-mono text-sm space-y-2">
                            <TypographyP className="mt-0 text-sm">
                                <span className="text-gray-500 font-sans font-medium">Input:</span> nums = [3,2,4], target = 6
                            </TypographyP>
                            <TypographyP className="mt-0 text-sm">
                                <span className="text-gray-500 font-sans font-medium">Output:</span> [1,2]
                            </TypographyP>
                        </div>
                    </div>
                </div>

                {/* Constraints */}
                <div className="space-y-3 font-sans pt-4">
                    <TypographySmall className="font-bold text-gray-900 uppercase tracking-wider">Constraints:</TypographySmall>
                    <ul className="list-disc list-outside ml-5 space-y-2">
                        <li>
                            <div className="mt-0 text-[14px]">
                                <TypographyP className="bg-gray-100 text-gray-600 font-normal">2 &lt;= nums.length &lt;= 10⁴</TypographyP>
                            </div>
                        </li>
                        <li>
                            <div className="mt-0 text-[14px]">
                                <TypographyP className="bg-gray-100 text-gray-600 font-normal">-10⁹ &lt;= nums[i] &lt;= 10⁹</TypographyP>
                            </div>
                        </li>
                        <li>
                            <div className="mt-0 text-[14px]">
                                <TypographyP className="bg-gray-100 text-gray-600 font-normal">-10⁹ &lt;= target &lt;= 10⁹</TypographyP>
                            </div>
                        </li>
                        <li className="text-gray-700 text-[14px]">
                            <strong>Only one valid answer exists.</strong>
                        </li>
                    </ul>
                </div>

                {/* Hints Section */}
                <ProblemHints />
            </div>
        </div>
    );
};

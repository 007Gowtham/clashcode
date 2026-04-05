'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { TypographySmall } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from 'lucide-react';

const testCases = [
    {
        id: "case-1",
        label: "Case 1",
        status: "passed",
        input: "nums = [2,7,11,15], target = 9",
        expected: "[0,1]",
        actual: "[0,1]",
        output: "nums[0] + nums[1] == 9, so return [0, 1]."
    },
    {
        id: "case-2",
        label: "Case 2",
        status: "passed",
        input: "nums = [3,2,4], target = 6",
        expected: "[1,2]",
        actual: "[1,2]",
        output: ""
    },
    {
        id: "case-3",
        label: "Case 3",
        status: "passed",
        input: "nums = [3,3], target = 6",
        expected: "[0,1]",
        actual: "[0,1]",
        output: ""
    }
];

export const TestCase = () => {
    return (
        <div className="p-4 bg-white font-sans">
            <div className="mb-4 flex items-center justify-between">
                <TypographySmall className="font-bold text-gray-900 uppercase tracking-wider">Test Cases</TypographySmall>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" />
                        All Passed
                    </span>
                </div>
            </div>

            <Accordion type="multiple" defaultValue={["case-1"]} className="space-y-3">
                {testCases.map((test) => (
                    <AccordionItem
                        key={test.id}
                        value={test.id}
                        className="border border-gray-100 rounded-xl px-0 overflow-hidden bg-gray-50/30 transition-all hover:border-gray-200"
                    >
                        <AccordionTrigger className="hover:no-underline py-3 px-4 group">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    test.status === 'passed' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-rose-500"
                                )} />
                                <span className="text-sm font-semibold text-gray-700">{test.label}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-0">
                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <TypographySmall className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Input</TypographySmall>
                                    <div className="p-3 bg-white border border-gray-100 rounded-lg font-mono text-xs text-gray-600">
                                        {test.input}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <TypographySmall className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Expected</TypographySmall>
                                        <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-lg font-mono text-xs text-emerald-700 font-bold">
                                            {test.expected}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <TypographySmall className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Actual</TypographySmall>
                                        <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-lg font-mono text-xs text-emerald-700 font-bold">
                                            {test.actual}
                                        </div>
                                    </div>
                                </div>

                                {test.output && (
                                    <div className="space-y-1.5">
                                        <TypographySmall className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Stdout</TypographySmall>
                                        <div className="p-3 bg-white border border-gray-100 rounded-lg font-mono text-xs text-gray-500 italic">
                                            {test.output}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};

export default TestCase;

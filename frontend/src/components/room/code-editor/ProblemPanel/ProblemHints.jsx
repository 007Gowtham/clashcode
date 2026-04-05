'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { TypographyP, TypographySmall } from "@/components/ui/typography";
import { Lightbulb } from 'lucide-react';

const hints = [
    {
        id: "hint-1",
        trigger: "Hint 1",
        content: "A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Again, it's best to try out brute force solutions for just for completeness. It is from these brute force solutions that you can come up with optimizations."
    },
    {
        id: "hint-2",
        trigger: "Hint 2",
        content: "So, if we fix one of the numbers, say x, we have to scan the entire array to find the next number y which is value - x where value is the input target. Can we change our array somehow so that this search becomes faster?"
    },
    {
        id: "hint-3",
        trigger: "Hint 3",
        content: "The second train of thought is, can we use some extra space? For example, a hash map to store the index of each number. This would help us find the complement of the current number in O(1) time."
    }
];

export function ProblemHints() {
    return (
        <div className="pt-6 border-t border-gray-100 space-y-3 font-sans">
            <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <TypographySmall className="font-bold text-gray-900 uppercase tracking-wider">Hints</TypographySmall>
            </div>

            <Accordion type="single"
      collapsible className="w-full  mx-auto">
                {hints.map((hint) => (
                    <AccordionItem key={hint.id} value={hint.id} >
                        <AccordionTrigger className="hover:no-underline py-3 px-4 transition-all">
                            <span className="text-sm font-semibold text-gray-700">{hint.trigger}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pt-2 pb-4">
                            <TypographyP className="mt-0 text-sm leading-relaxed text-gray-600">
                                {hint.content}
                            </TypographyP>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {/* Bottom Separator */}
        </div>
    );
}

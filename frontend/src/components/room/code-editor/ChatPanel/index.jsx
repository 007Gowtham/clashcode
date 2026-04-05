'use client';

import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { useChatPanel } from "@/contexts/ChatPanelContext";
import { ChevronLeft, ChevronRight, MessageSquare, Scan, Send, Users } from 'lucide-react';

const ChatPanel = () => {
    const { isCollapsed, toggleCollapse, expand } = useChatPanel();

    if (isCollapsed) {
        return (
            <div className="flex flex-col items-center py-3 px-1 bg-white border-l border-gray-200 h-full">
                {/* Vertical Label */}
                <div className="flex flex-col gap-3 flex-1 pt-2">
                    <button
                        onClick={() => expand()}
                        className="flex flex-col items-center gap-1.5 px-1.5 py-2 text-xs font-medium transition-all rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-blue-50 text-blue-600"
                    >
                        <MessageSquare className="w-4 h-4 stroke-[1.5] text-blue-600" />
                        <span className="writing-mode-vertical text-[10px] font-semibold whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                            Team Chat
                        </span>
                    </button>
                </div>

                {/* Expand Button */}
                <button
                    onClick={toggleCollapse}
                    className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100 mt-3"
                    title="Expand"
                >
                    <ChevronLeft className="w-3.5 h-3.5 stroke-[1.5]" />
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Chat Header */}
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between shrink-0 h-[45px]">
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">JD</div>
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold">AS</div>
                    </div>
                    <div className="flex flex-col leading-none">
                        <TypographySmall className="text-xs font-bold text-gray-900">Team Chat</TypographySmall>
                    <div className="flex items-center gap-1.5">
                        <div className="relative">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">3 Online</span>
                    </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100">
                        <Users className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100" title="Full Screen">
                        <Scan className="w-4 h-4 stroke-[1.5]" />
                    </button>
                    <button
                        onClick={toggleCollapse}
                        className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100"
                        title="Collapse"
                    >
                        <ChevronRight className="w-4 h-4 stroke-[1.5]" />
                    </button>
                </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-slate-50/60 via-white to-slate-50/80">
                <div className="flex flex-col items-start gap-3">
                    <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white border border-slate-100 px-3 py-2 shadow-sm group relative">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                            <TypographySmall className="text-[11px] font-semibold text-slate-800">Afsal</TypographySmall>
                            <span className="text-[10px] text-slate-400">10:42 AM</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                            I&apos;ll take the edge cases. Can someone optimise the inner loop?
                        </p>
                        <div className="absolute -bottom-4 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-400">
                            <button className="px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">👍 2</button>
                            <button className="px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">🔥 1</button>
                        </div>
                    </div>

                    <div className="max-w-[70%] self-end rounded-2xl rounded-br-sm bg-indigo-500 text-white px-3 py-2 shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                            <TypographySmall className="text-[11px] font-semibold text-white/90">You</TypographySmall>
                            <span className="text-[10px] text-white/60">10:43 AM</span>
                        </div>
                        <p className="text-xs leading-relaxed">
                            On it. I&apos;ll switch to prefix sums if needed.
                        </p>
                    </div>

                    {/* Typing indicator */}
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold">
                            AS
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-gray-100 bg-gray-50/30">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="w-full pl-4 pr-12 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                    />
                    <button className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all shadow-sm active:scale-95 group-focus-within:shadow-indigo-200">
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;

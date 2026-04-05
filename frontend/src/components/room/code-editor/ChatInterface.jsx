'use client';

import { MessageSquare } from 'lucide-react';

export default function ChatInterface() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-white p-8 text-center">
      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 shadow-sm rotate-3">
        <MessageSquare className="w-10 h-10 text-gray-300" />
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Team Chat</h3>

      <p className="text-sm text-gray-500 leading-relaxed max-w-[240px] mb-8">
        This feature is currently under development and will be available in the next update.
      </p>

      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-gray-900/20">
        <span>🚀 Coming Soon</span>
      </div>
    </div>
  );
}

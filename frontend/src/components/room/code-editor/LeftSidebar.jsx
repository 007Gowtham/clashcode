'use client';

import { MessageSquare, Zap, Trophy, Rocket, Notebook, ChevronsRight } from 'lucide-react';
import { useState } from 'react';

export default function LeftSidebar() {
  const [activeIcon, setActiveIcon] = useState('message-square');

  const icons = [
    { id: 'message-square', icon: MessageSquare },
    { id: 'zap', icon: Zap },
    { id: 'trophy', icon: Trophy },
    { id: 'rocket', icon: Rocket },
    { id: 'notebook', icon: Notebook },
  ];

  return (
    <div className="w-16 border-r border-gray-200 flex flex-col items-center py-5 flex-shrink-0 bg-white z-20">
      {/* Logo */}
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-8">
        B
      </div>

      {/* Menu Icons */}
      <div className="flex flex-col gap-6 w-full px-3">
        {icons.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveIcon(id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activeIcon === id
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      <div className="mt-auto">
        <button className="w-10 h-10 text-gray-400 hover:text-gray-600 flex items-center justify-center">
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

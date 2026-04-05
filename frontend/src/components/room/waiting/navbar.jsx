import { Box, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Navbar({ onExitRoom }) {
  const router = useRouter();

  const handleExitClick = () => {
    if (onExitRoom) {
      onExitRoom();
    } else {
      // Fallback if no handler provided
      router.push('/room');
    }
  };

  return (
    <nav className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0 z-20">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center text-white font-bold text-xs">A</div>
        <span className="text-sm font-semibold text-gray-900 tracking-tight">Array of Hope</span>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-sm text-gray-500">Lobby</span>
      </div>
      <div className="flex items-center gap-4">
        {/* Exit Room Button */}
        <button
          onClick={handleExitClick}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-200"
          title="Exit Room"
        >
          <LogOut className="w-4 h-4" />
          Exit Room
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-full border border-gray-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Connected
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-inner"></div>
      </div>
    </nav>
  );
}

import { LogOut } from 'lucide-react';

export default function TeamHeader() {
  return (
    <div className="p-6 border-b border-gray-100 bg-gray-50/30">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Your Team</span>
        <button className="text-gray-400 hover:text-red-600 transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-500/20">
          BB
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">BinaryBosses</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">Invite Code:</span>
            <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">X92-JKS</code>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-medium text-gray-500 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
        <span>Members</span>
        <span className="text-gray-900">2 <span className="text-gray-400">/ 3</span></span>
      </div>
    </div>
  );
}

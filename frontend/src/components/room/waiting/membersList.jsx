import { Crown, UserX } from 'lucide-react';

export default function MembersList() {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Team Members</h3>
      <div className="space-y-2">
        {/* Leader */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">GO</div>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">Gowtham</p>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">You</span>
              </div>
              <p className="text-[10px] text-gray-500">Team Leader</p>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
        </div>

        {/* Member */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">AF</div>
            <div>
              <p className="text-sm font-medium text-gray-900">Afsal</p>
              <p className="text-[10px] text-gray-500">Member</p>
            </div>
          </div>
          <button className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
            <UserX className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Users, X } from 'lucide-react';
import { useState } from 'react';

<<<<<<< HEAD
const ROLES = [
 { id: 'architect', label: 'Architect', icon: '📐' },
 { id: 'builder', label: 'Builder', icon: '🛠️' },
 { id: 'debugger', label: 'Debugger', icon: '🐛' },
 { id: 'optimiser', label: 'Optimiser', icon: '⚡' },
];

export default function CreateTeamModal({
 isOpen,
 onClose,
 onCreate,
 isLoading
}) {
 const [teamName, setTeamName] = useState('');
 const [error, setError] = useState('');

 if (!isOpen) return null;

 const handleSubmit = async (e) => {
 e.preventDefault();
 setError('');

 if (!teamName.trim()) {
 setError('Team name is required');
 return;
 }

 try {
 await onCreate({
 teamName: teamName.trim()
 });
 // Reset form
 setTeamName('');
 setError('');
 } catch (err) {
 console.error('Create team error:', err);
 }
 };

 const handleClose = () => {
 setTeamName('');
 setError('');
 onClose();
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
 {/* Header */}
 <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between ">
 <h2 className="text-xl font-bold tracking-tight text-slate-900">Create Team</h2>
 <button
 onClick={handleClose}
 disabled={isLoading}
 className="text-gray-400 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-lg transition-colors disabled:opacity-50"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Content */}
 <form onSubmit={handleSubmit} className="p-6 ">
 {/* Info Card - Original Emerald Style */}
 <div className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
 <div className="flex items-center gap-2 mb-2">
 <Users className="w-4 h-4 text-emerald-600" />
 <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
 New Team
 </p>
 </div>
 <p className="text-sm text-gray-700">
 Create your team to get started!
 </p>
 </div>

 {/* Team Name Input */}
 <div className="mb-5">
 <Input
 label="Team Name"
 placeholder="Enter your team name"
 value={teamName}
 onChange={(e) => setTeamName(e.target.value)}
 required
 disabled={isLoading}
 helperText="Choose a unique and memorable name"
 maxLength={30}
 />
 </div>

 {/* Error Message */}
 {error && (
 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
 <p className="text-sm text-red-600 font-medium">{error}</p>
 </div>
 )}

 {/* Actions - Restoring original button classes */}
 <div className="flex gap-3 mt-4">
 <Button
 type="button"
 variant="primary"
 onClick={handleClose}
 className="flex-1"
 disabled={isLoading}
 >
 Cancel
 </Button>
 <Button
 type="submit"
 variant="primary"
 className="flex-1"
 isLoading={isLoading}
 >
 Create Team
 </Button>
 </div>
 </form>
 </div>
 </div>
 );
=======
export default function CreateTeamModal({
  isOpen,
  onClose,
  onCreate,
  isLoading
}) {
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      await onCreate({
        teamName: teamName.trim()
      });
      // Reset form
      setTeamName('');
      setError('');
    } catch (err) {
      console.error('Create team error:', err);
    }
  };

  const handleClose = () => {
    setTeamName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 dark:bg-black/50 backdrop-blur-sm p-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <div className="bg-white dark:bg-[#1e1e1e] border border-[#e5e8eb] dark:border-[#2d2d2d] rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2d2d2d] flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Create Team</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 dark:text-[#8c8c8c] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Info Card - Original Emerald Style */}
          <div className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs text-gray-600 dark:text-slate-400 font-semibold uppercase tracking-wide">
                New Team
              </p>
            </div>
            <p className="text-sm text-gray-700 dark:text-slate-300">
              Create your team to get started!
            </p>
          </div>

          {/* Team Name Input */}
          <div className="mb-5 space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-[#8c8c8c]">Team Name</label>
            <input
              type="text"
              placeholder="Enter your team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              disabled={isLoading}
              maxLength={30}
              className="w-full px-4 py-2 bg-[#fafafa] dark:bg-[#262626] border border-[#d9d9d9] dark:border-[#333333] rounded-lg text-sm text-[#262626] dark:text-white placeholder-[#bfbfbf] dark:placeholder-[#8c8c8c] focus:outline-none focus:border-[#262626] dark:focus:border-[#ffa116] focus:bg-[#fafafa] dark:focus:bg-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#262626] transition-all disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 dark:text-[#8c8c8c]">Choose a unique and memorable name</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-[#3a1d1d] border border-red-200 dark:border-red-900/40 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6 border-t border-slate-100 dark:border-[#2d2d2d] pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 py-2 bg-[#f5f5f5] dark:bg-[#262626] hover:bg-[#e8e8e8] dark:hover:bg-[#333333] active:bg-[#d9d9d9] dark:active:bg-[#1a1a1a] text-slate-700 dark:text-[#eff1f6] rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 bg-[#262626] dark:bg-[#ffa116] hover:bg-[#333333] dark:hover:bg-[#e08e12] active:bg-black dark:active:bg-[#1a1a1a] text-white dark:text-black rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
}

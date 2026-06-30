'use client';

import { Globe, Lock, X } from 'lucide-react';
import { useState } from 'react';

export default function JoinTeamModal({
  isOpen,
  onClose,
  selectedTeam,
  onJoin,
  isLoading
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !selectedTeam) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedTeam.visibility === 'PRIVATE' && !code.trim()) {
      setError('Team code is required for private teams');
      return;
    }

    try {
      await onJoin(selectedTeam.id, code || undefined);
      setCode('');
      setError('');
    } catch (err) {
      console.error('Join team error:', err);
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 dark:bg-black/50 backdrop-blur-sm p-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <div className="bg-white dark:bg-[#1e1e1e] border border-[#e5e8eb] dark:border-[#2d2d2d] rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2d2d2d] flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Join Team</h2>
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
          {/* Team Info Card */}
          <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-1 font-semibold uppercase tracking-wide">
              You're joining:
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">{selectedTeam.name}</p>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                {selectedTeam.visibility === 'PRIVATE' ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">Private Team</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Public Team</span>
                  </>
                )}
              </div>
              <div className="text-gray-500 dark:text-slate-400 font-medium">
                {selectedTeam.members?.length || 0} / {selectedTeam.maxSize || 4} members
              </div>
            </div>

            {selectedTeam.visibility === 'PRIVATE' && (
              <div className="mt-3 p-2 bg-amber-100/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Team code required - ask the team leader
                </p>
              </div>
            )}
          </div>

          {/* Code Input */}
          <div className="mb-5 space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-[#8c8c8c]">
              {selectedTeam.visibility === 'PRIVATE' ? 'Team Code (Required)' : 'Team Code (Optional)'}
            </label>
            <input
              type="text"
              placeholder={selectedTeam.visibility === 'PRIVATE' ? 'Enter the team code' : 'Enter code if provided'}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required={selectedTeam.visibility === 'PRIVATE'}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[#fafafa] dark:bg-[#262626] border border-[#d9d9d9] dark:border-[#333333] rounded-lg text-sm font-mono tracking-widest text-[#262626] dark:text-white placeholder-[#bfbfbf] dark:placeholder-[#8c8c8c] focus:outline-none focus:border-[#262626] dark:focus:border-[#ffa116] focus:bg-[#fafafa] dark:focus:bg-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#262626] transition-all disabled:opacity-50"
            />
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
              {isLoading ? 'Joining...' : 'Join Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

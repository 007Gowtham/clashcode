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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <div className="relative w-full max-w-md">
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute -top-4 -right-4 w-10 h-10 border-2 border-retro-ink bg-white flex items-center justify-center shadow-retro z-10 hover:bg-retro-paper active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm disabled:opacity-50"
        >
          <X className="w-5 h-5 text-retro-ink" strokeWidth={3} />
        </button>

        <form onSubmit={handleSubmit} className="space-y-8 text-retro-ink">
          <div className="border-2 border-retro-ink bg-retro-paper p-6 shadow-retro">
            <label className="flex items-center gap-3 font-mono text-xs font-black uppercase tracking-widest text-retro-ink mb-4">
              <div className="w-8 h-8 flex items-center justify-center border-2 border-retro-ink bg-retro-mint shadow-retro-sm">
                <Globe size={14} className="text-retro-ink" strokeWidth={3} />
              </div>
              Join Existing Squad
            </label>

            <div className="mb-6 p-4 bg-white border-2 border-retro-ink shadow-retro-sm">
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-retro-muted mb-1">
                YOU'RE JOINING:
              </p>
              <p className="text-xl font-black uppercase tracking-tight text-retro-ink mb-4">
                {selectedTeam.name}
              </p>

              <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  {selectedTeam.visibility === 'PRIVATE' ? (
                    <span className="flex items-center gap-1 text-retro-orange">
                      <Lock size={12} strokeWidth={3} /> PRIVATE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-retro-mint">
                      <Globe size={12} strokeWidth={3} /> PUBLIC
                    </span>
                  )}
                </div>
                <div className="text-retro-muted">
                  {selectedTeam.members?.length || 0} / {selectedTeam.maxSize || 4} MEMBERS
                </div>
              </div>

              {selectedTeam.visibility === 'PRIVATE' && (
                <div className="mt-4 pt-3 border-t-2 border-retro-ink/20 text-[10px] font-mono font-black uppercase tracking-widest text-retro-orange flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full bg-retro-orange opacity-75" />
                    <span className="relative inline-flex h-2 w-2 bg-retro-orange" />
                  </span>
                  REQUIRES TEAM CODE
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={selectedTeam.visibility === 'PRIVATE' ? 'ENTER CODE (REQUIRED)' : 'ENTER CODE (OPTIONAL)'}
                required={selectedTeam.visibility === 'PRIVATE'}
                disabled={isLoading}
                className="w-full px-4 py-4 text-center bg-white border-2 border-retro-ink text-lg font-mono font-black tracking-widest text-retro-ink placeholder:text-retro-muted/40 focus:outline-none focus:border-retro-orange focus:-translate-y-0.5 focus:shadow-retro transition-all disabled:opacity-50 shadow-retro-sm uppercase"
              />
            </div>

            {error && (
              <div className="mt-4 p-3 bg-white border-2 border-retro-ink shadow-retro-sm">
                <p className="text-xs font-mono font-black text-red-500 uppercase tracking-widest">{error}</p>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || (selectedTeam.visibility === 'PRIVATE' && !code.trim())}
              className="w-full py-4 bg-retro-mint border-2 border-retro-ink text-retro-ink font-sans font-black uppercase tracking-tight text-lg shadow-retro hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'JOINING...' : 'JOIN TEAM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

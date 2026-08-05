'use client';

import { Hash, X } from 'lucide-react';
import { useState } from 'react';

export default function JoinViaCodeModal({
  isOpen,
  onClose,
  onJoin,
  isLoading
}) {
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!teamCode.trim()) {
      setError('Team code is required');
      return;
    }

    try {
      await onJoin(teamCode.trim().toUpperCase());
      // Reset form
      setTeamCode('');
      setError('');
    } catch (err) {
      console.error('Join via code error:', err);
    }
  };

  const handleClose = () => {
    setTeamCode('');
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
              <div className="w-8 h-8 flex items-center justify-center border-2 border-retro-ink bg-retro-blue shadow-retro-sm">
                <Hash size={14} className="text-white" strokeWidth={3} />
              </div>
              Join Squad via Code
            </label>

            <div className="space-y-2">
              <input
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                maxLength={10}
                required
                disabled={isLoading}
                className="w-full px-4 py-6 text-center bg-white border-2 border-retro-ink text-2xl font-mono font-black tracking-widest text-retro-ink placeholder:text-retro-muted/40 focus:outline-none focus:border-retro-orange focus:-translate-y-0.5 focus:shadow-retro transition-all disabled:opacity-50 shadow-retro-sm uppercase"
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
              disabled={isLoading || !teamCode.trim()}
              className="w-full py-4 bg-retro-blue border-2 border-retro-ink text-white font-sans font-black uppercase tracking-tight text-lg shadow-retro hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'JOINING...' : 'JOIN TEAM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

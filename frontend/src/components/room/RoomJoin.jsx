'use client';
import { useState } from 'react';
import { Terminal, Key } from 'lucide-react';

const RoomJoin = ({ onJoin, isLoading = false }) => {
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomCode.length === 6) {
      onJoin(roomCode.toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-retro-ink">
      <div className="border-2 border-retro-ink bg-retro-paper p-6 shadow-retro-sm">
        <label className="flex items-center gap-3 font-mono text-xs font-black uppercase tracking-widest text-retro-ink mb-4">
          <div className="w-8 h-8 flex items-center justify-center border-2 border-retro-ink bg-retro-mint shadow-retro-sm">
            <Key size={14} className="text-white" strokeWidth={3} />
          </div>
          Join an Existing Room
        </label>

        <div className="space-y-2">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ABCXYZ"
            maxLength={6}
            required
            disabled={isLoading}
            className="w-full px-4 py-6 text-center bg-white border-2 border-retro-ink text-4xl font-mono font-black tracking-[0.5em] text-retro-ink placeholder:text-retro-muted/40 focus:outline-none focus:border-retro-orange focus:translate-y-[-2px] focus:shadow-retro transition-all disabled:opacity-50 shadow-retro-sm uppercase"
          />
        </div>
      </div>

      {/* Info panel */}
      <div className="border-2 border-dashed border-retro-ink bg-white p-4 flex gap-4 items-start">
        <div className="w-6 h-6 flex items-center justify-center border-2 border-retro-ink bg-retro-blue text-white flex-shrink-0 mt-0.5">
          <Terminal size={12} strokeWidth={3} />
        </div>
        <p className="text-xs font-mono font-bold text-retro-muted leading-relaxed">
          Enter the 6-character room code to join an active session. Ask the room admin for the code.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={roomCode.length !== 6 || isLoading}
          className="w-full py-4 bg-retro-orange border-2 border-retro-ink text-white font-sans font-black uppercase tracking-tight text-lg shadow-retro hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Joining Room...' : 'Join Room'}
        </button>
      </div>
    </form>
  );
};

export default RoomJoin;
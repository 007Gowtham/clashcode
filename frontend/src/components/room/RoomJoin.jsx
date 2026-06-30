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

<<<<<<< HEAD
 return (
 <form onSubmit={handleSubmit} className="space-y-8 py-4 ">
 <div className="space-y-4">
 <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
 <Key size={16} className="text-blue-500" />
 Join an Existing Room
 </label>
 
 <div className="relative group">
 <Input
 value={roomCode}
 onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
 placeholder="Room Code (6 Chars)"
 maxLength={6}
 className="text-center  text-lg font-medium text-slate-800 bg-white border-slate-200 focus:bg-white focus:border-blue-300 transition-all  rounded-xl"
 required
 />
 </div>

 <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-left">
 <Terminal size={18} className="text-blue-400 shrink-0 mt-0.5" />
 <p className="text-sm font-medium text-slate-600 leading-relaxed">
 Enter the 6-character room code to join an active session. You can ask the room admin for the code.
 </p>
 </div>
 </div>

 <div className="pt-2">
 <Button
 type="submit"
 disabled={roomCode.length !== 6 || isLoading}
 isLoading={isLoading}
 className='w-full font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800'
 >
 Join Room
 </Button>
 </div>
 </form>
 );
=======
  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-2 text-[#262626] dark:text-[#eff1f6]">
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-[#8c8c8c]">
          <Key size={16} className="text-[#ffa116]" />
          Join an Existing Room
        </label>
        
        <div>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Room Code (e.g. ABCXYZ)"
            maxLength={6}
            required
            disabled={isLoading}
            className="w-full px-4 py-2.5 text-center bg-[#fafafa] dark:bg-[#262626] border border-[#d9d9d9] dark:border-[#333333] rounded-lg text-lg font-mono tracking-widest text-[#262626] dark:text-white placeholder-[#bfbfbf] dark:placeholder-[#8c8c8c] focus:outline-none focus:border-[#262626] dark:focus:border-[#ffa116] focus:bg-[#fafafa] dark:focus:bg-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#262626] transition-all disabled:opacity-50"
          />
        </div>

        <div className="bg-[#e6f7ff] dark:bg-[#112a45] border border-[#91d5ff] dark:border-[#173f6b] rounded-xl p-4 flex gap-3 text-left">
          <Terminal size={18} className="text-[#1890ff] dark:text-[#40a9ff] shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-[#434343] dark:text-[#a6dbff] leading-relaxed">
            Enter the 6-character room code to join an active session. You can ask the room admin for the code.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-[#2d2d2d]">
        <button
          type="submit"
          disabled={roomCode.length !== 6 || isLoading}
          className="w-full py-2.5 bg-[#262626] dark:bg-[#ffa116] hover:bg-[#333333] dark:hover:bg-[#e08e12] active:bg-black dark:active:bg-[#1a1a1a] text-white dark:text-black rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Joining Room...' : 'Join Room'}
        </button>
      </div>
    </form>
  );
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
};

export default RoomJoin;
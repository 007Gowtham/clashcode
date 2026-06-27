'use client';
import { useState } from 'react';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { Terminal, Key, Activity } from 'lucide-react';

const RoomJoin = ({ onJoin, isLoading = false }) => {
 const [roomCode, setRoomCode] = useState('');

 const handleSubmit = (e) => {
 e.preventDefault();
 if (roomCode.length === 6) {
 onJoin(roomCode.toUpperCase());
 }
 };

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
};

export default RoomJoin;
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/lib/axios';
import { setRoom, setMyRole } from '@/store/slices/roomSlice';
import { updateUser } from '@/store/slices/authSlice';
import { cn } from '@/lib/utils';
import {
 Plus, User, Users, LayoutGrid, Zap, Trophy,
 MessageSquare, BarChart, Target, Star, Lock,
 Globe, Search, Terminal, Activity, Layout
} from 'lucide-react';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import { PageTransition } from '@/components/common/PageTransition';
import UserProfileDropdown from '@/components/common/UserProfileDropdown';
import { InteractiveGridPattern } from '@/components/ui/interactive-grid-pattern';

// Themed Components
import RoomHeader from '@/components/room/RoomHeader';
import StatsOverview from '@/components/room/StatsOverview';
import RoomGrid from '@/components/room/RoomGrid';
import { RoomForm, RoomJoin } from '@/components/room';

export default function RoomsPage() {
 const router = useRouter();
 const dispatch = useDispatch();
 const user = useSelector(s => s.auth.user);

 // Logic state
 const [rooms, setRooms] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [filterMode, setFilterMode] = useState('all'); // 'all', 'public', 'private'
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [showJoinModal, setShowJoinModal] = useState(false);
 const [activeRoomId, setActiveRoomId] = useState(null);
 const [creatingRoom, setCreatingRoom] = useState(false);
 const [joiningRoom, setJoiningRoom] = useState(false);
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 fetchRooms();
 fetchMe();
 
 // Auto-poll rooms every 10 seconds
 const interval = setInterval(() => {
 fetchRooms();
 }, 10000);
 return () => clearInterval(interval);
 }, []);

  const fetchMe = async () => {
    try {
      const response = await api.get('/auth/me');
      const profile = response.data?.data;
      if (profile) {
        setActiveRoomId(profile.activeRoomId || null);
        dispatch(updateUser(profile));
      }
    } catch { }
  };

 const fetchRooms = async () => {
 try {
 const { data } = await api.get('/rooms');
 if (data && Array.isArray(data.data)) {
 setRooms(data.data);
 } else {
 setRooms([]);
 }
 } catch (err) {
 console.error('Fetch error:', err);
 setRooms([]);
 } finally {
 setLoading(false);
 }
 };

 const handleCreateRoom = async (formData) => {
 setCreatingRoom(true);
 try {
 const { data: responseData } = await api.post('/rooms', {
 name: formData.roomName,
 difficulty: (formData.difficulty || 'MIXED').toUpperCase(),
 timeLimitMinutes: formData.timeLimitMinutes || 30,
 questionsPerUser: formData.questionsPerUser || 1,
 maxTeamSize: formData.maxTeamSize || 4,
 });
 const roomObj = responseData?.data;
 dispatch(setRoom(roomObj));
 setShowCreateModal(false);

 const targetRoomId = roomObj?._id || roomObj?.id;
 if (!targetRoomId) throw new Error('Created room ID missing');
 router.push(`/room/${targetRoomId}/waiting`);
 } catch (err) {
 console.error('Create error:', err);
 } finally {
 setCreatingRoom(false);
 }
 };

 const handleJoinRoom = async (roomData) => {
 setJoiningRoom(true);
 const rawCode = typeof roomData === 'string' ? roomData : (roomData.code || roomData.title || roomData.name);
 const roomCode = (rawCode || '').toString().trim();

 if (!roomCode) {
 console.error('Join error: room code missing');
 setJoiningRoom(false);
 return;
 }

 try {
 const { data: responseData } = await api.post('/rooms/join', { code: roomCode.toUpperCase() });
 const roomObj = responseData?.data;
 dispatch(setRoom(roomObj));
 setShowJoinModal(false);

 const targetRoomId = roomObj?._id || roomObj?.id;
 if (!targetRoomId) throw new Error('Joined room ID missing');
 router.push(`/room/${targetRoomId}/waiting`);
 } catch (err) {
 console.error('Join error:', err);
 } finally {
 setJoiningRoom(false);
 }
 };

 // Filter Logic
 const filteredRooms = rooms.filter(room => {
 const matchesSearch = room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 room.code?.toLowerCase().includes(searchTerm.toLowerCase());
 const isPrivate = room.settings?.privacy === 'private' || room.hasPassword;

 if (filterMode === 'all') return matchesSearch;
 if (filterMode === 'public') return matchesSearch && !isPrivate;
 if (filterMode === 'private') return matchesSearch && isPrivate;
 return matchesSearch;
 });

 // Stats Logic
 const stats = [
 { label: 'Total Rooms', value: rooms.length, icon: LayoutGrid },
 { label: 'Live Battles', value: rooms.filter(r => r.status === 'PLAYING').length, icon: Zap, highlighted: true },
 { label: 'Active Coders', value: rooms.reduce((s, r) => s + (r.teams?.length || 0), 0), icon: Users },
 { label: 'Available', value: rooms.filter(r => r.status === 'WAITING').length, icon: Globe },
 ];

 return (
  <div className="bg-[#f5f7f9] dark:bg-[#111111] text-slate-900 dark:text-[#eff1f6] min-h-screen flex flex-col relative antialiased overflow-hidden transition-colors duration-300" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>

  {/* Minimal Navigation Header */}
  <header className="relative z-50 w-full px-6 py-4 flex items-center justify-between bg-transparent">
  {/* Left: Logo icon only */}
  <div className="w-9 h-9 bg-slate-900 dark:bg-[#262626] border border-transparent dark:border-[#333333] rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg dark:shadow-none select-none">Λ</div>

   {/* Right: User profile dropdown + rejoin */}
   <div className="flex items-center gap-3">

    {/* Rejoin active room button */}
    {activeRoomId && (
     <button
      onClick={() => router.push(`/room/${activeRoomId}/waiting`)}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all active:scale-95"
     >
      <Zap className="w-3.5 h-3.5" />
      Rejoin Room
     </button>
    )}

    {/* Profile dropdown — editable only when NOT in a room */}
    {mounted && (
     <UserProfileDropdown editable={!activeRoomId} />
    )}

   </div>
  </header>
 
  <main className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-10 pb-20 flex flex-col items-center pointer-events-none [&>*]:pointer-events-auto">

  <RoomHeader
  title="Clash Of Code"
  description="Join active competitions or start your own."
  />

  {/* Rules & Guidelines Promo Card */}
  <div className="w-full max-w-5xl mx-auto mb-16 bg-white dark:bg-[#1e1e1e] border border-[#e5e8eb] dark:border-[#2d2d2d] rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-colors duration-300">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="flex flex-col gap-2 border-r border-[#e5e8eb] dark:border-[#2d2d2d] pr-6 last:border-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#262626] dark:text-white">
          <Zap className="w-4 h-4 text-[#ffa116]" /> Real-time Arena
        </div>
        <p className="text-xs text-[#8c8c8c] dark:text-slate-400 leading-relaxed">
          Create rooms, assemble squads, and battle head-to-head. Redirection and matchmaking updates sync instantly for all participants.
        </p>
      </div>
      <div className="flex flex-col gap-2 border-r border-[#e5e8eb] dark:border-[#2d2d2d] pr-6 last:border-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#262626] dark:text-white">
          <Trophy className="w-4 h-4 text-[#ffa116]" /> Optimized Judge
        </div>
        <p className="text-xs text-[#8c8c8c] dark:text-slate-400 leading-relaxed">
          All solutions are evaluated against rigorous test-suites. Slower runtimes automatically get higher buffers (e.g. 3.5x for Python).
        </p>
      </div>
      <div className="flex flex-col gap-2 last:border-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#262626] dark:text-white">
          <Target className="w-4 h-4 text-[#ffa116]" /> Competitive Format
        </div>
        <p className="text-xs text-[#8c8c8c] dark:text-slate-400 leading-relaxed">
          Choose from easy, medium, hard, or mixed problem lists. Solve faster than other teams to score points and dominate the arena.
        </p>
      </div>
    </div>
  </div>

  {/* Filter Selection Pills */}
  <nav className="flex flex-wrap justify-center gap-4 mb-20">
  <FilterPill active={filterMode === 'all'} onClick={() => setFilterMode('all')} icon={LayoutGrid} label="All Rooms" />
  <FilterPill active={filterMode === 'public'} onClick={() => setFilterMode('public')} icon={Globe} label="Public" />
  <FilterPill active={filterMode === 'private'} onClick={() => setFilterMode('private')} icon={Lock} label="Private" />
  </nav>

  <div className="w-full max-w-6xl mx-auto px-4 mb-8">
  <h2 className="text-xl font-medium text-slate-900 dark:text-white flex items-center gap-3 ">
  <span className="relative flex h-3 w-3">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
  </span>
  Arena Pulse
  </h2>
  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-6 ">Real-time statistics from active battlegrounds.</p>
  </div>

  <StatsOverview stats={stats} />

  <div className="w-full max-w-6xl mx-auto px-4 mb-8">
  <h2 className="text-xl font-medium text-slate-900 dark:text-white flex items-center gap-3 ">
  Find Your Battle
  </h2>
  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ">Join an existing room or create your own.</p>
  </div>

  {/* Tactical Interaction Console */}
  <div className="w-full max-w-6xl mx-auto px-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
  <div className="relative group/search w-full sm:w-auto flex-1">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/search:text-emerald-600 dark:group-focus-within/search:text-[#ffa116] transition-colors" />
  <input
  type="text"
  placeholder="Search rooms..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="w-full pl-12 pr-4 py-3 bg-[#fafafa] dark:bg-[#262626] border border-slate-200 dark:border-[#333333] rounded-xl text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#8c8c8c] focus:outline-none focus:border-slate-300 dark:focus:border-[#ffa116] focus:ring-1 focus:ring-slate-300 dark:focus:ring-[#ffa116] transition-all shadow-sm"
  />
  </div>

  <div className="flex gap-3 w-full sm:w-auto">
  <button
  onClick={() => {
  setLoading(true);
  fetchRooms();
  }}
  className="flex items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#262626] hover:bg-slate-50 dark:hover:bg-[#333333] text-slate-700 dark:text-white font-medium transition-all active:scale-95"
  title="Refresh Rooms"
  >
  <Activity className={cn("w-5 h-5 text-slate-500 dark:text-[#8c8c8c]", loading && "animate-spin")} />
  </button>
  <button
  onClick={() => setShowJoinModal(true)}
  disabled={!!activeRoomId}
  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#262626] hover:bg-slate-50 dark:hover:bg-[#333333] text-slate-700 dark:text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
  >
  <Terminal className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
  <span>Join via Code</span>
  </button>
  <button
  onClick={() => setShowCreateModal(true)}
  disabled={!!activeRoomId}
  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-[#ffa116] text-white dark:text-black hover:bg-slate-800 dark:hover:bg-[#e08e12] text-sm font-semibold transition-all shadow-lg dark:shadow-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
  >
  <Plus className="w-5 h-5" />
  <span>Create Room</span>
  </button>
  </div>
  </div>

  {/* Global Sector Listing */}
  <div className="w-full">
  {loading ? (
  <div className="flex flex-col items-center justify-center py-32 gap-6">
  <div className="relative">
  <div className="w-16 h-16 border-4 border-slate-100 rounded-full border-t-slate-900 animate-spin" />
  <Activity className="absolute inset-0 m-auto text-slate-300 animate-pulse" size={24} />
  </div>
  <span className="text-sm font-medium text-slate-400 animate-pulse">Loading Rooms...</span>
  </div>
  ) : (
  <RoomGrid
  rooms={filteredRooms}
  activeRoomId={activeRoomId}
  onJoin={(room) => {
  if (activeRoomId === (room._id || room.id)) {
  router.push(`/room/${activeRoomId}/waiting`);
  } else if (!room.code) {
  // If for some reason we click a card without a code, show the modal
  setShowJoinModal(true);
  } else {
  // Join immediately. handleJoinRoom will handle private checks on backend if needed
  // but for the UI flow, non-private should be seamless.
  handleJoinRoom(room);
  }
  }}
  />
  )}
  </div>
  </main>

  {/* Global Modals */}
  <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Room" maxWidth="max-w-xl">
  <RoomForm onSubmit={handleCreateRoom} isLoading={creatingRoom} />
  </Modal>

  <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join Private Room" maxWidth="max-w-md">
  <RoomJoin onJoin={handleJoinRoom} isLoading={joiningRoom} />
  </Modal>

  </div>
 );
}

function FilterPill({ active, onClick, icon: Icon, label }) {
  if (active) {
    return (
      <button
        onClick={onClick}
        className="group flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-full shadow-xl shadow-slate-900/10 dark:shadow-none hover:shadow-slate-900/20 transition-all duration-200"
      >
        <Icon className="w-5 h-5 text-white dark:text-black" />
        <span className="text-base font-semibold">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 bg-white dark:bg-[#1e1e1e] text-slate-600 dark:text-[#8c8c8c] border border-slate-200 dark:border-[#2d2d2d] px-6 py-3 rounded-full hover:border-slate-300 dark:hover:border-[#3d3d3d] hover:bg-slate-50 dark:hover:bg-[#262626] hover:text-slate-800 dark:hover:text-white transition-all duration-200"
    >
      <Icon className="w-5 h-5 text-current" />
      <span className="text-base font-medium">{label}</span>
    </button>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/lib/axios';
import { setRoom } from '@/store/slices/roomSlice';
import { updateUser } from '@/store/slices/authSlice';
import { cn } from '@/lib/utils';
import {
  Plus, Users, LayoutGrid, Zap, Trophy,
  Target, Lock, Globe, Search, Terminal, Activity,
  ChevronRight, RefreshCw
} from 'lucide-react';
import Modal from '@/components/common/Modal';
import UserProfileDropdown from '@/components/common/UserProfileDropdown';
import RoomHeader from '@/components/room/RoomHeader';
import StatsOverview from '@/components/room/StatsOverview';
import RoomGrid from '@/components/room/RoomGrid';
import { RoomForm, RoomJoin } from '@/components/room';

export default function RoomsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchRooms();
    fetchMe();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/me');
      const profile = data?.data;
      if (profile) {
        setActiveRoomId(profile.activeRoomId || null);
        dispatch(updateUser(profile));
      }
    } catch { }
  };

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(Array.isArray(data?.data) ? data.data : []);
    } catch { setRooms([]); }
    finally { setLoading(false); }
  };

  const handleCreateRoom = async (formData) => {
    setCreatingRoom(true);
    try {
      const { data: res } = await api.post('/rooms', {
        name: formData.roomName,
        difficulty: (formData.difficulty || 'MIXED').toUpperCase(),
        timeLimitMinutes: formData.timeLimitMinutes || 30,
        questionsPerUser: formData.questionsPerUser || 1,
        maxTeamSize: formData.maxTeamSize || 4,
      });
      const roomObj = res?.data;
      dispatch(setRoom(roomObj));
      setShowCreateModal(false);
      const id = roomObj?._id || roomObj?.id;
      if (!id) throw new Error('Created room ID missing');
      router.push(`/room/${id}/waiting`);
    } catch (err) { console.error('Create error:', err); }
    finally { setCreatingRoom(false); }
  };

  const handleJoinRoom = async (roomData) => {
    setJoiningRoom(true);
    const raw = typeof roomData === 'string' ? roomData : (roomData.code || roomData.title || roomData.name);
    const roomCode = (raw || '').toString().trim();
    const roomId = typeof roomData === 'object' ? (roomData._id || roomData.id) : null;
    if (roomId) setJoiningRoomId(roomId);

    if (!roomCode) { setJoiningRoom(false); setJoiningRoomId(null); return; }
    try {
      const { data: res } = await api.post('/rooms/join', { code: roomCode.toUpperCase() });
      const roomObj = res?.data;
      dispatch(setRoom(roomObj));
      setShowJoinModal(false);
      const id = roomObj?._id || roomObj?.id;
      if (!id) throw new Error('Joined room ID missing');
      router.push(`/room/${id}/waiting`);
    } catch (err) { console.error('Join error:', err); }
    finally { setJoiningRoom(false); setJoiningRoomId(null); }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const isPrivate = room.settings?.privacy === 'private' || room.hasPassword;
    if (filterMode === 'public') return matchesSearch && !isPrivate;
    if (filterMode === 'private') return matchesSearch && isPrivate;
    return matchesSearch;
  });

  const stats = [
    { label: 'Total Rooms', value: rooms.length, icon: LayoutGrid },
    { label: 'Live Battles', value: rooms.filter(r => r.status === 'PLAYING').length, icon: Zap, highlighted: true },
    { label: 'Active Coders', value: rooms.reduce((s, r) => s + (r.teams?.length || 0), 0), icon: Users },
    { label: 'Available', value: rooms.filter(r => r.status === 'WAITING').length, icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-pattern-rainbow flex flex-col">
      {/* Top Ticker Bar */}
      <div className="w-full border-b-[3px] border-retro-ink bg-retro-ink px-6 py-2 flex items-center justify-between z-10 relative">
        <span className="font-mono text-[10px] text-retro-mint font-black uppercase tracking-[0.3em]">
          SYSTEM STATUS // <span className="text-white">ONLINE</span>
        </span>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 font-mono text-[10px] font-black text-[#ff4081] uppercase tracking-widest bg-white px-2 py-0.5 border-2 border-[#ff4081]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full bg-[#ff4081] opacity-75" />
              <span className="relative inline-flex h-2 w-2 bg-[#ff4081]" />
            </span>
            LIVE
          </span>
          <span className="font-mono text-[10px] font-black text-white hidden sm:block uppercase bg-retro-blue px-2 py-0.5 border-2 border-white rotate-2 shadow-[2px_2px_0_rgba(255,255,255,1)]">
            {rooms.length} ROOMS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <header className="w-full px-6 py-5 flex items-center justify-between border-b-[4px] border-retro-ink bg-[#b2ff59] relative z-0 shadow-[0_6px_0px_rgba(15,23,42,1)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-retro-ink bg-[#ff4081] flex items-center justify-center text-white font-black text-2xl shadow-[4px_4px_0px_rgba(15,23,42,1)] rotate-[-3deg] hover:rotate-0 transition-transform">
            Λ
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="uppercase tracking-tighter text-retro-ink text-2xl hidden sm:block bg-white px-2 py-0.5 border-[3px] border-retro-ink shadow-[3px_3px_0px_rgba(15,23,42,1)] rotate-[1deg]">
              <span className="font-heading">Clash</span><span className="font-heading-outline text-[#ff4081]">Code</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {activeRoomId && (
            <button onClick={() => router.push(`/room/${activeRoomId}/waiting`)} className="flex items-center gap-2 px-4 py-2 border-[3px] border-retro-ink bg-retro-mint font-black text-retro-ink uppercase shadow-[3px_3px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_rgba(15,23,42,1)] transition-all rotate-[-1deg]">
              <Zap size={16} strokeWidth={3} /> RETURN TO ARENA
            </button>
          )}
          <button onClick={() => { setLoading(true); fetchRooms(); }} className="flex items-center justify-center w-11 h-11 border-[3px] border-retro-ink bg-white shadow-[4px_4px_0px_rgba(15,23,42,1)] transition-all hover:bg-[#00e5ff] hover:text-retro-ink active:translate-x-1 active:translate-y-1 active:shadow-none rotate-2">
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} strokeWidth={4} />
          </button>
          {mounted && <UserProfileDropdown editable={!activeRoomId} />}
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-6 pt-12 pb-24 flex flex-col items-center">

        <RoomHeader
          title="DSA Multiplayer"
          description={
            <>
              Coding is hard, but it <span className="text-retro-orange">shouldn't be</span>. We're taught to follow the rules and use the latest tools. But coding is a <span className="text-[#ff4081]">playground</span>, and playgrounds are for kids. Jump into the <span className="text-retro-blue">arena</span>.
            </>
          }
        />



        {/* Filter pills */}
        <nav className="flex flex-wrap justify-center gap-4 mb-12">
          {[
            { id: 'all', icon: LayoutGrid, label: 'All Rooms', color: 'bg-retro-blue text-white' },
            { id: 'public', icon: Globe, label: 'Public', color: 'bg-retro-mint text-white' },
            { id: 'private', icon: Lock, label: 'Private', color: 'bg-retro-yellow text-retro-ink' },
          ].map(({ id, icon: Icon, label, color }) => (
            <button
              key={id}
              onClick={() => setFilterMode(id)}
              className={cn(
                'flex items-center gap-3 px-6 py-3 font-black uppercase text-xs shadow-retro transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm',
                filterMode === id
                  ? 'border-2 border-retro-ink bg-retro-ink text-white'
                  : 'border-2 border-retro-ink bg-white text-retro-ink hover:bg-retro-paper'
              )}
            >
              <div className={`w-6 h-6 flex items-center justify-center border-2 border-retro-ink shadow-retro-sm ${color}`}>
                <Icon className="w-3.5 h-3.5" strokeWidth={3} />
              </div>
              {label}
            </button>
          ))}
        </nav>

        {/* Arena Pulse */}
        <div className="w-full mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full bg-retro-mint opacity-75" />
              <span className="relative inline-flex h-3 w-3 bg-retro-mint" />
            </span>
            <h2 className="text-2xl uppercase tracking-tight text-retro-ink flex flex-wrap gap-2">
              <span className="font-heading">Arena</span>
              <span className="font-heading text-retro-mint">Pulse</span>
            </h2>
          </div>
          <p className="font-mono text-sm font-bold text-retro-muted ml-6 uppercase">// Real-time statistics</p>
        </div>

        <StatsOverview stats={stats} />

        {/* Find Your Battle */}
        <div className="w-full mb-6 mt-6">
          <h2 className="text-2xl uppercase tracking-tight text-retro-ink flex flex-wrap gap-2">
            <span className="font-heading">Find</span>
            <span className="font-heading text-retro-orange">Your</span>
            <span className="font-heading">Battle</span>
          </h2>
          <p className="font-mono text-sm font-bold text-retro-muted mt-2 uppercase">// Join or create a room</p>
        </div>

        {/* Search + Actions */}
        <div className="w-full mb-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-retro-muted" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="SEARCH ROOMS..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border-2 border-retro-ink bg-white pl-12 pr-4 py-4 text-retro-ink font-black uppercase placeholder:text-retro-muted focus:outline-none focus:border-retro-orange transition-colors shadow-retro-sm"
            />
          </div>

          <div className="flex gap-4 w-full sm:w-auto">
            <button
              onClick={() => { setLoading(true); fetchRooms(); }}
              className="border-2 border-retro-ink bg-white p-4 font-black text-retro-ink shadow-retro transition-all hover:bg-retro-paper active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm"
              title="Refresh"
            >
              <div className="w-6 h-6 flex items-center justify-center border-2 border-retro-ink bg-retro-mint text-white shadow-retro-sm">
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} strokeWidth={3} />
              </div>
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              disabled={!!activeRoomId}
              className="border-2 border-retro-ink bg-white px-6 py-4 font-black uppercase text-retro-ink shadow-retro transition-all hover:bg-retro-paper active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm disabled:opacity-50 flex items-center gap-3 flex-1 sm:flex-none justify-center"
            >
              <div className="w-6 h-6 flex items-center justify-center border-2 border-retro-ink bg-retro-blue text-white shadow-retro-sm">
                <Terminal className="w-3.5 h-3.5" strokeWidth={3} />
              </div>
              Join Code
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!!activeRoomId}
              className="border-2 border-retro-ink bg-retro-orange px-6 py-4 font-black uppercase text-white shadow-retro transition-all hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm disabled:opacity-50 flex items-center gap-3 flex-1 sm:flex-none justify-center"
            >
              <div className="w-6 h-6 flex items-center justify-center border-2 border-retro-ink bg-white text-retro-orange shadow-retro-sm">
                <Plus className="w-4 h-4" strokeWidth={3} />
              </div>
              Create Room
            </button>
          </div>
        </div>

        {/* Room Grid */}
        <div className="w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-retro-ink bg-white shadow-retro gap-4">
              <div className="w-12 h-12 border-4 border-retro-ink border-t-retro-orange rounded-full animate-spin" />
              <span className="font-mono text-sm font-black text-retro-ink uppercase tracking-widest">Loading Rooms...</span>
            </div>
          ) : (
            <RoomGrid
              rooms={filteredRooms}
              activeRoomId={activeRoomId}
              joiningRoomId={joiningRoomId}
              onJoin={room => {
                if (activeRoomId === (room._id || room.id)) {
                  router.push(`/room/${activeRoomId}/waiting`);
                } else if (!room.code) {
                  setShowJoinModal(true);
                } else {
                  handleJoinRoom(room);
                }
              }}
            />
          )}
        </div>
      </main>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Room" maxWidth="max-w-xl">
        <RoomForm onSubmit={handleCreateRoom} isLoading={creatingRoom} />
      </Modal>

      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join via Room Code" maxWidth="max-w-md">
        <RoomJoin onJoin={handleJoinRoom} isLoading={joiningRoom} />
      </Modal>
    </div>
  );
}
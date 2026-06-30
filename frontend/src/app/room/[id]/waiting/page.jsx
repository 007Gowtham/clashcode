'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/lib/axios';
import { setRoom, setTeams, setMyTeam, setMyRole, upsertTeam, removeTeam } from '@/store/slices/roomSlice';
import { setEndTime, setMyQuestions, setLeaderboard } from '@/store/slices/contestSlice';
import { updateUser } from '@/store/slices/authSlice';
import { cn } from '@/lib/utils';
import {
 Users, Zap, Trophy, Clock, CheckCircle2, Shield,
 Plus, Terminal, LogOut, X, Layout, Activity,
 Maximize2, ArrowRight, Search
} from 'lucide-react';
import Button from '@/components/common/Button';
import { PageTransition } from '@/components/common/PageTransition';
import { InteractiveGridPattern } from '@/components/ui/interactive-grid-pattern';
import WorldMapBackground from '@/components/room/waiting/WorldMapBackground';
import StatsOverview from '@/components/room/StatsOverview';
import TeamGrid from '@/components/room/waiting/TeamGrid';
import CreateTeamModal from '@/components/room/modals/CreateTeamModal';
import JoinTeamModal from '@/components/room/modals/JoinTeamModal';
import JoinViaCodeModal from '@/components/room/modals/JoinViaCodeModal';
import { useWebSocket } from '@/lib/hooks/useWebSocket';

export default function WaitingPage() {
 const { id } = useParams();
 const router = useRouter();
 const dispatch = useDispatch();
 const user = useSelector(s => s.auth.user);
 const { room, teams, myTeam } = useSelector(s => s.room);

 const [error, setError] = useState('');
 const [searchTerm, setSearchTerm] = useState('');
 const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
 const [isJoinViaCodeModalOpen, setIsJoinViaCodeModalOpen] = useState(false);
 const [isJoinTeamModalOpen, setIsJoinTeamModalOpen] = useState(false);
 const [selectedTeam, setSelectedTeam] = useState(null);
 const [loading, setLoading] = useState(true);
 const [creatingTeam, setCreatingTeam] = useState(false);
 const [starting, setStarting] = useState(false);
 const [joining, setJoining] = useState(false);

  // Subscribe to real-time room events (start/join/leave/ready toggle)
  useWebSocket(
    id ? `/topic/room/${id}/events` : null,
    (event) => {
      if (event && event.type === 'ROOM_STARTED') {
        if (event.endTime) {
          dispatch(setEndTime(event.endTime));
        }
        router.push(`/room/${id}/battle`);
      } else {
        fetchRoom();
      }
    }
  );

  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!id || id === 'undefined') {
      router.push('/rooms');
      return;
    }
    fetchRoom();
    // Refresh user profile picture state from backend
    api.get('/auth/me')
      .then(res => {
        const profile = res.data?.data;
        if (profile) dispatch(updateUser(profile));
      })
      .catch(() => {});
    
    // Auto-poll room status every 5 seconds to simulate real-time matchmaking updates
    const interval = setInterval(() => {
      fetchRoom();
    }, 5000);
    return () => clearInterval(interval);
  }, [id, userId, dispatch, router]);

 const fetchRoom = async () => {
 try {
 const { data: roomResponse } = await api.get(`/rooms/${id}`);
 const roomData = roomResponse?.data;
 if (!roomData) throw new Error("No room details returned");

 dispatch(setRoom(roomData));

 if (roomData.status === 'IN_PROGRESS') {
 if (roomData.endTime) {
 dispatch(setEndTime(roomData.endTime));
 }
 router.push(`/room/${id}/battle`);
 return;
 } else if (roomData.status === 'ENDED') {
 router.push(`/room/${id}/results`);
 return;
 }

 const { data: teamsResponse } = await api.get(`/teams/room/${id}`);
 const teamsData = teamsResponse?.data || [];
 dispatch(setTeams(teamsData));

 const userIdStr = (user?._id || user?.id)?.toString();

 // Check if user is still a member of the room (e.g. if they left or were kicked/disbanded)
 const stillInRoom = roomData.members?.some(m => m.id?.toString() === userIdStr || m._id?.toString() === userIdStr);
 if (!stillInRoom && roomData.adminId?.toString() !== userIdStr) {
 router.push('/rooms');
 return;
 }

 const mine = teamsData.find(t => t.members.some(m => (m.userId?._id || m.userId)?.toString() === userIdStr));

 if (mine) {
 dispatch(setMyTeam(mine));
 const isLeader = (mine.leaderId?._id || mine.leaderId)?.toString() === userIdStr;
 dispatch(setMyRole(isLeader ? 'leader' : 'member'));
 } else {
 dispatch(setMyTeam(null));
 if (roomData.adminId?.toString() === userIdStr) {
 dispatch(setMyRole('admin'));
 } else {
 dispatch(setMyRole('member'));
 }
 }

 if (roomData.adminId?.toString() === userIdStr) {
 dispatch(setMyRole('admin'));
 }
 } catch (err) {
 console.error('Fetch error:', err);
 router.push('/rooms');
 } finally {
 setLoading(false);
 }
 };

 const handleCreateTeam = async (data) => {
 setError('');
 if (creatingTeam) return;
 setCreatingTeam(true);
 try {
 const name = typeof data === 'string' ? data : (data.name || data.teamName);
 const { data: res } = await api.post('/teams', { name, roomId: id });
 const teamObj = res?.data;
 dispatch(upsertTeam(teamObj));
 dispatch(setMyTeam(teamObj));
 dispatch(setMyRole('leader'));
 setIsCreateTeamModalOpen(false);
 fetchRoom();
 } catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create team'); }
 finally { setCreatingTeam(false); }
 };

 const handleJoinViaCode = async (data) => {
 setError('');
 if (joining) return;
 setJoining(true);
 try {
 const code = typeof data === 'string' ? data : (data.code);
 const { data: res } = await api.post('/teams/join', { code: code.toUpperCase() });
 const teamObj = res?.data;
 dispatch(upsertTeam(teamObj));
 dispatch(setMyTeam(teamObj));
 dispatch(setMyRole('member'));
 setIsJoinViaCodeModalOpen(false);
 fetchRoom();
 } catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'Failed to join team'); }
 finally { setJoining(false); }
 };

 const handleJoinTeam = (team) => {
 setSelectedTeam(team);
 setIsJoinTeamModalOpen(true);
 };

 const handleJoinTeamSubmit = async (teamId, code) => {
 setError('');
 if (joining) return;
 setJoining(true);
 try {
 const payload = code ? { code: code.toUpperCase() } : { teamId };
 const { data } = await api.post('/teams/join', payload);
 const teamObj = data?.data;
 dispatch(upsertTeam(teamObj));
 dispatch(setMyTeam(teamObj));
 dispatch(setMyRole('member'));
 setIsJoinTeamModalOpen(false);
 setSelectedTeam(null);
 fetchRoom();
 } catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'Failed to join team'); }
 finally { setJoining(false); }
 };

 const toggleReady = async () => {
 if (!myTeam) return;
 try {
 const teamId = myTeam.id || myTeam._id;
 const { data } = await api.patch(`/teams/${teamId}/ready`);
 const teamObj = data?.data;
 dispatch(setMyTeam(teamObj));
 fetchRoom(); // Refresh all teams
 } catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update status'); }
 };

 const kickMember = async userId => {
 if (!myTeam) return;
 try {
 const teamId = myTeam.id || myTeam._id;
 const { data } = await api.delete(`/teams/${teamId}/members/${userId}`);
 const teamObj = data?.data;
 dispatch(setMyTeam(teamObj));
 fetchRoom();
 } catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'Failed to kick member'); }
 };

 const leaveTeam = async () => {
 if (!myTeam) return;
 try {
 const teamId = myTeam.id || myTeam._id;
 await api.post(`/teams/${teamId}/leave`);
 dispatch(setMyTeam(null));
 fetchRoom();
 } catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'Failed to leave team'); }
 };

 const leaveRoom = async () => {
 try {
 await api.post('/rooms/leave');
 router.push('/rooms');
 } catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'Failed to leave room'); }
 };

 const startContest = async () => {
 if (starting) return;
 setStarting(true);
 try {
 await api.post(`/rooms/${id}/start`);
 fetchRoom();
 } catch (err) { setError(err.response?.data?.message || err.response?.data?.error || 'Failed to start contest'); }
 finally { setStarting(false); }
 };

 const userIdStr = (user?._id || user?.id)?.toString();
 const isAdmin = room?.adminId?.toString() === userIdStr;
 const isLeader = (myTeam?.leaderId?._id || myTeam?.leaderId)?.toString() === userIdStr;
 const myMember = myTeam?.members?.find(m => (m.userId?._id || m.userId)?.toString() === userIdStr);
 const allReady = teams.length > 0 && teams.every(t => t.isReady);

 const totalParticipants = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
 const totalReady = teams.reduce((sum, team) => sum + (team.members?.filter(m => m.isReady)?.length || 0), 0);
 const activeTeams = teams.filter(team => team.members?.length > 0).length;

 const stats = [
 { label: 'Active Teams', value: activeTeams, icon: Users },
 { label: 'Total Players', value: totalParticipants, icon: Trophy },
 { label: 'Ready Teams', value: teams.filter(t => t.isReady).length, icon: CheckCircle2, highlighted: true },
 { label: 'Waiting', value: Math.max(0, totalParticipants - totalReady), icon: Clock },
 ];

 if (loading) return null;

 return (
  <div className="bg-[#f5f7f9] dark:bg-[#111111] text-slate-900 dark:text-[#eff1f6] min-h-screen flex flex-col relative antialiased overflow-hidden transition-colors duration-300" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>

 <header className="relative z-50 w-full px-8 py-5 flex items-center justify-between">
  
  {/* Left: Logo + Room Info */}
  <div className="flex items-center gap-3">
  <div className="w-9 h-9 bg-slate-900 dark:bg-[#262626] border border-transparent dark:border-[#333333] rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg dark:shadow-none select-none">Λ</div>
  <div className="flex flex-col gap-0.5">
  <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight leading-none">{room?.name || 'Loading...'}</span>
  {isAdmin && (
  <span className="text-[11px] font-medium text-slate-400 dark:text-[#8c8c8c] leading-none  ">
  {room?.code}
  </span>
  )}
  </div>
  </div>

 {/* Right: Actions */}
 <div className="flex items-center gap-2">

  <button
  onClick={() => {
  setLoading(true);
  fetchRoom();
  }}
  className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#262626] hover:bg-slate-50 dark:hover:bg-[#333333] text-slate-700 dark:text-white font-medium transition-all active:scale-95"
  title="Refresh Lobby"
  >
  <Activity className={cn("w-4 h-4 text-slate-500 dark:text-[#8c8c8c]", loading && "animate-spin")} />
  </button>

  {isAdmin && (
  <button
  onClick={startContest}
  disabled={starting || !allReady}
  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-[#ffa116] text-white dark:text-black text-sm font-semibold hover:bg-slate-800 dark:hover:bg-[#e08e12] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
  >
  <Zap size={14} fill={allReady ? "currentColor" : "none"} />
  {starting ? 'Starting...' : 'Start Battle'}
  </button>
  )}

  <button
  onClick={leaveRoom}
  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-[#3a1d1d] text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-sm font-semibold hover:bg-red-100 dark:hover:bg-[#4a2424] transition-all active:scale-95"
  >
  <LogOut size={14} />
  {isAdmin ? 'Terminate' : 'Leave'}
  </button>

  </div>
 </header>
   <main className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-10 pb-32 flex flex-col">
   <PageTransition>
   {error && <div className="mb-8 bg-red-50 dark:bg-[#3a1d1d] border border-red-100 dark:border-red-900/40 text-red-500 dark:text-red-400 rounded-2xl px-6 py-4 text-xs font-semibold shadow-sm">{error}</div>}
  
    {/* Contest Warmup Banner Card */}
    <div className="w-full max-w-6xl mx-auto mb-10 bg-white dark:bg-[#1e1e1e] border border-[#e5e8eb] dark:border-[#2d2d2d] rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-colors duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6 pb-6 border-b border-slate-100 dark:border-[#2d2d2d]">
        <div className="space-y-1">
          <div className="text-[10px] font-bold tracking-[0.2em] text-[#ffa116] uppercase font-mono">LOBBY // PREPARATION</div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">CLASH CODE</h1>
        </div>
        <div className="flex items-center gap-2 bg-[#f5f7f9] dark:bg-[#262626] px-4 py-2 rounded-xl border border-slate-200/60 dark:border-[#333333] text-xs font-mono font-medium text-slate-600 dark:text-[#eff1f6]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SYNCED BRACKET</span>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
        Welcome to the battle lobby. Before the contest begins, verify that all teammates are in the room and have toggled their status to <span className="font-semibold text-[#ffa116]">Ready</span>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-[#8c8c8c] dark:text-slate-400">
        <div className="flex items-center gap-3 bg-[#fafafa] dark:bg-[#262626] p-4 rounded-xl border border-slate-100 dark:border-[#2d2d2d]">
          <Zap className="w-4 h-4 text-[#ffa116] shrink-0" />
          <span>Redirections to the battle arena happen instantly when the host starts.</span>
        </div>
        <div className="flex items-center gap-3 bg-[#fafafa] dark:bg-[#262626] p-4 rounded-xl border border-slate-100 dark:border-[#2d2d2d]">
          <Users className="w-4 h-4 text-[#ffa116] shrink-0" />
          <span>Ensure your selected language and key configurations are ready.</span>
        </div>
      </div>
    </div>

   <div className="w-full flex items-center justify-center flex-col">
   <div className="w-full space-y-12">
  {/* Status Section */}
  <div className="w-full max-w-6xl mx-auto mb-8">
  <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-3 mb-2 tracking-tight ">
  <span className="relative flex h-3 w-3">
  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
  </span>
  Battle Lobby Status
  </h2>
  <p className="text-slate-500 dark:text-slate-400 text-sm ml-6 ">Real-time statistics from the waiting room</p>
  </div>
 
  <div className="mb-6">
  <StatsOverview stats={stats} />
  </div>
 
  {/* Team Actions Section */}
  <div className="w-full max-w-6xl mx-auto mb-8 mt-12 bg-white dark:bg-[#1e1e1e] rounded-[2.5rem] p-8 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] dark:shadow-none border border-slate-100 dark:border-[#2d2d2d] transition-colors duration-300">
  <div className="mb-6">
  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">
  Assemble Your Squad
  </h2>
  <p className="text-slate-500 dark:text-slate-400">
  Create your own team or join forces with existing warriors
  </p>
  </div>
 
  <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
  {/* Search */}
  <div className="relative group/search w-full sm:flex-1">
  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/search:text-slate-700 dark:group-focus-within/search:text-white transition-colors" />
  <input
  type="text"
  placeholder="Search teams..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#333333] rounded-xl text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#8c8c8c] text-sm focus:outline-none focus:border-slate-300 dark:focus:border-[#ffa116] focus:ring-1 focus:ring-slate-200 dark:focus:ring-[#ffa116] transition-all "
  />
  </div>
 
  {/* Action Buttons */}
  <div className="flex gap-2 w-full sm:w-auto shrink-0">
  <button
  onClick={() => setIsJoinViaCodeModalOpen(true)}
  disabled={!!myTeam}
  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#262626] hover:bg-slate-50 dark:hover:bg-[#333333] text-slate-700 dark:text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed "
  >
  <Terminal className="w-4 h-4 text-slate-400" />
  <span>Join via Code</span>
  </button>
  <button
  onClick={() => setIsCreateTeamModalOpen(true)}
  disabled={!!myTeam}
  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-[#ffa116] text-white dark:text-black text-sm font-medium hover:bg-slate-800 dark:hover:bg-[#e08e12] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] "
  >
  <Plus className="w-4 h-4" />
  <span>Create Team</span>
  </button>
  </div>
  </div>
  </div>

 {/* Squad Rosters via TeamGrid */}
 <TeamGrid teams={teams.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.code?.toLowerCase().includes(searchTerm.toLowerCase())).map(team => ({
 ...team,
 id: team._id,
 maxSize: team.maxSize || room?.maxTeamSize || room?.settings?.maxTeamSize || room?.questionsPerUser || 4,
 members: team.members?.map(m => {
 const uid = m.userId?._id || m.userId;
 return {
 id: uid,
 name: uid?.toString() === userIdStr ? 'You' : (m.username || m.userId?.username || 'Unknown'),
 isLeader: (team.leaderId?._id || team.leaderId)?.toString() === uid?.toString(),
 isReady: m.isReady,
 roleTheme: 'strategist',
 badges: []
 };
 }) || []
 }))} onJoinTeam={handleJoinTeam} onLeaveTeam={leaveTeam} onReady={toggleReady} onKickMember={kickMember} myTeamId={myTeam?._id} />
 </div>
 </div>
 </PageTransition>
 </main>

 <CreateTeamModal
 isOpen={isCreateTeamModalOpen}
 onClose={() => setIsCreateTeamModalOpen(false)}
 onCreate={handleCreateTeam}
 isLoading={creatingTeam}
 />

 <JoinViaCodeModal
 isOpen={isJoinViaCodeModalOpen}
 onClose={() => setIsJoinViaCodeModalOpen(false)}
 onJoin={handleJoinViaCode}
 isLoading={joining}
 />

 <JoinTeamModal
 isOpen={isJoinTeamModalOpen}
 onClose={() => {
 setIsJoinTeamModalOpen(false);
 setSelectedTeam(null);
 }}
 selectedTeam={selectedTeam}
 onJoin={handleJoinTeamSubmit}
 isLoading={joining}
 />
 </div>
 );
}

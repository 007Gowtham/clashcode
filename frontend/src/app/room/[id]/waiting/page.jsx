'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import api from '@/lib/axios';
import { setRoom, setTeams, setMyTeam, setMyRole, upsertTeam, removeTeam } from '@/store/slices/roomSlice';
import { setEndTime, setMyQuestions, setLeaderboard } from '@/store/slices/contestSlice';
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
  const socketRef = useRef(null);

  useEffect(() => {
    if (!id || id === 'undefined') {
      router.push('/rooms');
      return;
    }
    fetchRoom();
    const socketUrl = window.location.protocol + '//' + window.location.hostname + ':5000';
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.emit('room:join', { roomId: id });
    socket.emit('user:join', { userId: user?._id || user?.id });

    socket.on('room:team_added', team => dispatch(upsertTeam(team)));
    socket.on('room:team_updated', team => dispatch(upsertTeam(team)));
    socket.on('room:started', ({ endTime }) => {
      dispatch(setEndTime(endTime));
      router.push(`/room/${id}/battle`);
    });
    socket.on('contest:questions', qs => dispatch(setMyQuestions(qs)));
    socket.on('room:team_deleted', teamId => dispatch(removeTeam(teamId)));
    socket.on('room:ended', ({ leaderboard: lb }) => {
      dispatch(setLeaderboard(lb));
      router.push(`/room/${id}/results`);
    });
    socket.on('room:kicked', () => router.push('/rooms'));

    return () => socket.disconnect();
  }, [id, user, dispatch, router]);

  const fetchRoom = async () => {
    try {
      const { data: roomData } = await api.get(`/rooms/${id}`);
      dispatch(setRoom(roomData));
      const { data: teamsData } = await api.get(`/teams/room/${id}`);
      dispatch(setTeams(teamsData));

      const userIdStr = (user?._id || user?.id)?.toString();
      const mine = teamsData.find(t => t.members.some(m => (m.userId?._id || m.userId)?.toString() === userIdStr));

      if (mine) {
        dispatch(setMyTeam(mine));
        const isLeader = (mine.leaderId?._id || mine.leaderId)?.toString() === userIdStr;
        dispatch(setMyRole(isLeader ? 'leader' : 'member'));
      } else {
        // Always clear stale myTeam from Redux if not found in live team data
        dispatch(setMyTeam(null));
      }

      if (roomData.adminId?.toString() === userIdStr) {
        dispatch(setMyRole('admin'));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      router.push('/rooms');
    }
    setLoading(false);
  };

  const handleCreateTeam = async (data) => {
    setError('');
    if (creatingTeam) return;
    setCreatingTeam(true);
    try {
      const name = typeof data === 'string' ? data : (data.name || data.teamName);
      const { data: res } = await api.post('/teams', { name, roomId: id });
      dispatch(upsertTeam(res));
      dispatch(setMyTeam(res));
      dispatch(setMyRole('leader'));
      setIsCreateTeamModalOpen(false);
    } catch (err) { setError(err.response?.data?.error || 'Failed to create team'); }
    finally { setCreatingTeam(false); }
  };

  const handleJoinViaCode = async (data) => {
    setError('');
    if (joining) return;
    setJoining(true);
    try {
      const code = typeof data === 'string' ? data : (data.code);
      const { data: res } = await api.post('/teams/join', { code: code.toUpperCase() });
      dispatch(upsertTeam(res));
      dispatch(setMyTeam(res));
      dispatch(setMyRole('member'));
      setIsJoinViaCodeModalOpen(false);
    } catch (err) { setError(err.response?.data?.error || 'Failed to join team'); }
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
      dispatch(upsertTeam(data));
      dispatch(setMyTeam(data));
      dispatch(setMyRole('member'));
      setIsJoinTeamModalOpen(false);
      setSelectedTeam(null);
    } catch (err) { setError(err.response?.data?.error || 'Failed to join team'); }
    finally { setJoining(false); }
  };

  const toggleReady = async () => {
    if (!myTeam) return;
    try {
      const { data } = await api.patch(`/teams/${myTeam._id}/ready`);
      dispatch(setMyTeam(data));
      fetchRoom(); // Refresh all teams
    } catch (err) { setError(err.response?.data?.error || 'Failed to update status'); }
  };

  const kickMember = async userId => {
    if (!myTeam) return;
    try {
      const { data } = await api.delete(`/teams/${myTeam._id}/members/${userId}`);
      dispatch(setMyTeam(data));
      fetchRoom();
    } catch (err) { setError(err.response?.data?.error || 'Failed to kick member'); }
  };

  const leaveTeam = async () => {
    if (!myTeam) return;
    try {
      await api.post(`/teams/${myTeam._id}/leave`);
      dispatch(setMyTeam(null));
      fetchRoom();
    } catch (err) { setError(err.response?.data?.error || 'Failed to leave team'); }
  };

  const leaveRoom = async () => {
    try {
      await api.post('/rooms/leave');
      router.push('/rooms');
    } catch (err) { setError(err.response?.data?.error || 'Failed to leave room'); }
  };

  const startContest = async () => {
    if (starting) return;
    setStarting(true);
    try {
      await api.post(`/rooms/${id}/start`);
    } catch (err) { setError(err.response?.data?.error || 'Failed to start contest'); }
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
    <div className="bg-white text-slate-900 min-h-screen flex flex-col relative antialiased font-sans overflow-hidden">

      <WorldMapBackground />


<header className="relative z-50 w-full px-8 py-5 flex items-center justify-between">
  
  {/* Left: Logo + Room Info */}
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-slate-900/10 select-none">Λ</div>
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-bold text-slate-900 tracking-tight leading-none">{room?.name || 'Loading...'}</span>
      {isAdmin && (
        <span className="text-[11px] font-medium text-slate-400 leading-none tracking-widest uppercase">
          {room?.code}
        </span>
      )}
    </div>
  </div>

  {/* Right: Actions */}
  <div className="flex items-center gap-2">


    {isAdmin && (
      <button
        onClick={startContest}
        disabled={starting || !allReady}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Zap size={14} fill={allReady ? "currentColor" : "none"} />
        {starting ? 'Starting...' : 'Start Battle'}
      </button>
    )}

    <button
      onClick={leaveRoom}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 transition-all active:scale-95"
    >
      <LogOut size={14} />
      {isAdmin ? 'Terminate' : 'Leave'}
    </button>

  </div>
</header>
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col" style={{ marginTop: '580px' }}>
        <PageTransition>
          {error && <div className="mb-8 bg-red-50 border border-red-100 text-red-500 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest shadow-sm">{error}</div>}

          <div className="w-full flex items-center justify-center flex-col">
            <div className="w-full space-y-12">
              {/* Status Section */}
              <div className="w-full max-w-6xl mx-auto mb-8">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3 mb-2 font-[family-name:var(--font-mono)] tracking-tight uppercase">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  Battle Lobby Status
                </h2>
                <p className="text-slate-500 text-sm ml-6 font-[family-name:var(--font-inter)]">Real-time statistics from the waiting room</p>
              </div>

              <div className="mb-6">
                <StatsOverview stats={stats} />
              </div>

              {/* Team Actions Section */}
              <div className="w-full max-w-6xl mx-auto mb-8 mt-12 bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] border border-slate-100">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 font-[family-name:var(--font-mono)] tracking-tight">
                    Assemble Your Squad
                  </h2>
                  <p className="text-slate-500 font-[family-name:var(--font-inter)]">
                    Create your own team or join forces with existing warriors
                  </p>
                </div>

                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Search */}
                  <div className="relative group/search w-full sm:flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/search:text-slate-700 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search teams..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 text-sm focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200 transition-all font-[family-name:var(--font-inter)]"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => setIsJoinViaCodeModalOpen(true)}
                      disabled={!!myTeam}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed font-[family-name:var(--font-inter)]"
                    >
                      <Terminal className="w-4 h-4 text-slate-400" />
                      <span>Join via Code</span>
                    </button>
                    <button
                      onClick={() => setIsCreateTeamModalOpen(true)}
                      disabled={!!myTeam}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] font-[family-name:var(--font-inter)]"
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
              }))} onJoinTeam={handleJoinTeam} onLeaveTeam={leaveTeam} onReady={toggleReady} myTeamId={myTeam?._id} />
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

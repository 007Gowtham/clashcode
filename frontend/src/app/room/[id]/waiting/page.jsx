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
import RoomHeader from '@/components/room/RoomHeader';
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
      .catch(() => { });

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
      // If roomData.members is undefined (like in mock API), we skip this strict check so it doesn't instantly kick them out.
      const stillInRoom = roomData.members
        ? roomData.members.some(m => m.id?.toString() === userIdStr || m._id?.toString() === userIdStr)
        : true;

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
    <div className="min-h-screen bg-[#FEFBEA] relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0"></div>

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
            {totalParticipants} PLAYERS
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
            <span className="uppercase tracking-tighter text-retro-ink text-2xl hidden sm:flex gap-2 bg-white px-2 py-0.5 border-[3px] border-retro-ink shadow-[3px_3px_0px_rgba(15,23,42,1)] rotate-[1deg]">
              {(room?.name || 'Loading...').split(' ').map((word, i) => (
                <span key={i} className={i % 2 === 1 ? 'font-heading-outline text-[#ff4081]' : 'font-heading'}>
                  {word}
                </span>
              ))}
            </span>
            {isAdmin && (
              <span className="font-mono text-[10px] text-white bg-retro-ink px-2 py-0.5 uppercase tracking-widest border-[2px] border-white shadow-[2px_2px_0px_rgba(15,23,42,1)] rotate-[-1deg]">
                ROOM: {room?.code}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Actions */}
          <button onClick={() => { setLoading(true); fetchRoom(); }} className="flex items-center justify-center w-11 h-11 border-[3px] border-retro-ink bg-white shadow-[4px_4px_0px_rgba(15,23,42,1)] transition-all hover:bg-[#00e5ff] hover:text-retro-ink active:translate-x-1 active:translate-y-1 active:shadow-none rotate-2">
            <Activity className={cn("w-5 h-5", loading && "animate-spin")} strokeWidth={4} />
          </button>

          <button onClick={() => { startContest(); router.push(`/room/${id}/battle`); }} disabled={starting} className="border-[3px] border-retro-ink bg-retro-orange px-5 py-2 font-black uppercase text-white shadow-[4px_4px_0px_rgba(15,23,42,1)] transition-all hover:bg-white hover:text-retro-orange active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:grayscale flex items-center gap-2 text-sm rotate-[-1deg]">
            <Zap size={16} fill={allReady ? "currentColor" : "none"} strokeWidth={3} />
            {starting ? 'STARTING...' : 'START BATTLE (TEST)'}
          </button>

          <button onClick={leaveRoom} className="border-[3px] border-retro-ink bg-red-500 px-5 py-2 font-black uppercase text-white shadow-[4px_4px_0px_rgba(15,23,42,1)] transition-all hover:bg-retro-ink active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center gap-2 text-sm rotate-[1deg]">
            <LogOut size={16} strokeWidth={3} />
            <span className="hidden sm:inline">{isAdmin ? 'TERMINATE' : 'LEAVE'}</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-6 pt-12 pb-24 flex flex-col items-center">
        <PageTransition>
          {error && (
            <div className="mb-8 flex items-center gap-3 border-2 border-retro-ink bg-retro-orange text-white p-3 shadow-retro-sm">
              <p className="text-xs font-mono font-black uppercase tracking-wider">{error}</p>
            </div>
          )}

          <RoomHeader
            title="Battle Lobby"
            description={
              <>
                I'm here to show you how to play, to <span className="text-[#00e5ff]">recapture the joy of creating</span>. Wait for your team to get ready. The contest will redirect <span className="text-retro-orange">automatically</span> when the host starts the battle.
              </>
            }
          />

          <div className="w-full flex items-center justify-center flex-col">
            <div className="w-full space-y-12">

              {/* Status Section */}
              <div className="w-full mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full bg-retro-mint opacity-75" />
                    <span className="relative inline-flex h-3 w-3 bg-retro-mint" />
                  </span>
                  <h2 className="text-2xl uppercase tracking-tight text-retro-ink flex gap-2">
                    <span className="font-heading">Lobby</span>
                    <span className="font-heading text-retro-yellow">Status</span>
                  </h2>
                </div>
                <p className="font-mono text-sm font-bold text-retro-muted ml-6 uppercase">// Real-time statistics</p>
              </div>

              <div className="mb-12">
                <StatsOverview stats={stats} />
              </div>

              {/* Team Actions Section */}
              <div className="w-full mb-6">
                <h2 className="text-2xl uppercase tracking-tight text-retro-ink flex flex-wrap gap-2">
                  <span className="font-heading">Assemble</span>
                  <span className="font-heading text-retro-orange">Your</span>
                  <span className="font-heading">Squad</span>
                </h2>
                <p className="font-mono text-sm font-bold text-retro-muted mt-2 uppercase">// Create or join a team</p>
              </div>

              <div className="w-full mb-8 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-retro-muted" strokeWidth={2.5} />
                  <input
                    type="text"
                    placeholder="SEARCH TEAMS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border-2 border-retro-ink bg-white pl-12 pr-4 py-4 text-retro-ink font-black uppercase placeholder:text-retro-muted focus:outline-none focus:border-retro-orange transition-colors shadow-retro-sm"
                  />
                </div>

                <div className="flex gap-4 w-full sm:w-auto">
                  <button
                    onClick={() => setIsJoinViaCodeModalOpen(true)}
                    disabled={!!myTeam}
                    className="border-2 border-retro-ink bg-white px-6 py-4 font-black uppercase text-retro-ink shadow-retro transition-all hover:bg-retro-paper active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm disabled:opacity-50 flex items-center gap-3 flex-1 sm:flex-none justify-center"
                  >
                    <div className="w-6 h-6 flex items-center justify-center border-2 border-retro-ink bg-retro-blue text-white shadow-retro-sm">
                      <Terminal className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                    Join via Code
                  </button>
                  <button
                    onClick={() => setIsCreateTeamModalOpen(true)}
                    disabled={!!myTeam}
                    className="border-2 border-retro-ink bg-retro-orange px-6 py-4 font-black uppercase text-white shadow-retro transition-all hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm disabled:opacity-50 flex items-center gap-3 flex-1 sm:flex-none justify-center"
                  >
                    <div className="w-6 h-6 flex items-center justify-center border-2 border-retro-ink bg-white text-retro-orange shadow-retro-sm">
                      <Plus className="w-4 h-4" strokeWidth={3} />
                    </div>
                    Create Team
                  </button>
                </div>
              </div>

              {/* Squad Rosters via TeamGrid */}
              <TeamGrid
                teams={teams.filter(t =>
                  (t.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                  (t.code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                ).map(team => ({
                  ...team,
                  id: team._id,
                  maxSize: team.maxSize || room?.maxTeamSize || room?.settings?.maxTeamSize || room?.questionsPerUser || 4,
                  members: team.members?.map(m => {
                    const uid = m.userId?._id || m.userId;
                    return {
                      id: uid,
                      name: uid?.toString() === userIdStr ? 'You' : (m.username || m.userId?.username || 'Unknown'),
                      isLeader: m.isLeader || (team.leaderId?._id || team.leaderId)?.toString() === uid?.toString(),
                      isReady: m.isReady,
                      roleTheme: 'strategist',
                      badges: []
                    };
                  }) || []
                }))}
                currentUserId={user?._id || user?.id}
                myTeamId={myTeam?._id}
                onJoinTeam={handleJoinTeam}
                onLeaveTeam={leaveTeam}
                onReady={toggleReady}
                onKickMember={kickMember}
              />
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

'use client';

import RoomHeader from '@/components/room/RoomHeader';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TeamHoverCard from '@/components/room/leaderboard/TeamHoverCard';
import RankMovementIndicator from '@/components/room/leaderboard/RankMovementIndicator';
import EfficiencyBadge from '@/components/room/leaderboard/EfficiencyBadge';
import { ArrowLeft, CheckCircle2, Medal, Trophy, Users, Zap, XCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/lib/axios';
import { setLeaderboard, clearContest } from '@/store/slices/contestSlice';
import { clearRoom, setRoom } from '@/store/slices/roomSlice';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const roomId = params.id;

  const user = useSelector(s => s.auth.user);
  const room = useSelector(s => s.room.room);
  const actualLeaderboard = useSelector(s => s.contest.leaderboard) || [];
  const dummyLeaderboard = [
    {
      id: "t1", name: "Byte Me", score: 450, problemsSolved: 3, efficiency: 95, efficiencyLevel: "Optimal", rankChange: "up",
      members: [
        { id: "u1", name: "Alice", role: "Leader", score: 150 },
        { id: "u2", name: "Bob", role: "Member", score: 100 },
        { id: "u8", name: "Eve", role: "Member", score: 120 },
        { id: "u9", name: "Mallory", role: "Member", score: 80 }
      ]
    },
    {
      id: "t2", name: "Syntax Errors", score: 380, problemsSolved: 2, efficiency: 88, efficiencyLevel: "Good", rankChange: "same",
      members: [
        { id: "u3", name: "Charlie", role: "Leader", score: 180 },
        { id: "u10", name: "Dave", role: "Member", score: 100 },
        { id: "u11", name: "Peggy", role: "Member", score: 100 }
      ]
    },
    {
      id: "t3", name: "Null Pointers", score: 320, problemsSolved: 2, efficiency: 80, efficiencyLevel: "Average", rankChange: "down",
      members: [
        { id: "u4", name: "Victor", role: "Leader", score: 120 },
        { id: "u5", name: "Trent", role: "Member", score: 100 },
        { id: "u12", name: "Walter", role: "Member", score: 100 }
      ]
    },
    {
      id: "t4", name: "Code Blooded", score: 210, problemsSolved: 1, efficiency: 75, efficiencyLevel: "Average", rankChange: "up",
      members: [
        { id: "u6", name: "Frank", role: "Leader", score: 100 },
        { id: "u13", name: "Grace", role: "Member", score: 60 },
        { id: "u14", name: "Heidi", role: "Member", score: 50 }
      ]
    },
    {
      id: "t5", name: "404 Brain Not Found", score: 90, problemsSolved: 0, efficiency: 50, efficiencyLevel: "Poor", rankChange: "down",
      members: [
        { id: "u7", name: "Ivan", role: "Leader", score: 40 },
        { id: "u15", name: "Judy", role: "Member", score: 30 },
        { id: "u16", name: "Karl", role: "Member", score: 20 }
      ]
    }
  ];
  const leaderboard = actualLeaderboard.length > 0 ? actualLeaderboard : dummyLeaderboard;

  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [hoverTeam, setHoverTeam] = useState(null);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [hoverAnchorEl, setHoverAnchorEl] = useState(null);
  const hideHoverTimerRef = useRef(null);
  const unmountHoverTimerRef = useRef(null);

  const fetchRoom = async () => {
    try {
      const { data } = await api.get(`/rooms/${roomId}`);
      dispatch(setRoom(data.data));
    } catch (e) {
      console.error('Failed to fetch room:', e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.get(`/rooms/${roomId}/leaderboard`);
      dispatch(setLeaderboard(data.data || []));
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [roomId]);

  const showHover = (team, el) => {
    clearTimeout(hideHoverTimerRef.current);
    clearTimeout(unmountHoverTimerRef.current);
    setHoverTeam(team);
    setHoverAnchorEl(el);
    setHoverOpen(true);
  };

  const scheduleHideHover = () => {
    clearTimeout(hideHoverTimerRef.current);
    hideHoverTimerRef.current = setTimeout(() => {
      setHoverOpen(false);
      unmountHoverTimerRef.current = setTimeout(() => setHoverTeam(null), 300);
    }, 150);
  };

  const clearHideTimer = () => clearTimeout(hideHoverTimerRef.current);

  const topTeams = leaderboard.slice(0, 3);
  const remainingTeams = leaderboard.slice(3);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
        <div className="w-16 h-16 border-[4px] border-retro-ink bg-retro-yellow animate-spin shadow-[4px_4px_0px_rgba(15,23,42,1)] flex items-center justify-center">
          <Trophy className="w-8 h-8 stroke-[3]" />
        </div>
        <p className="mt-6 text-xl font-black uppercase tracking-widest text-retro-ink">Compiling Results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-10 pb-24 flex flex-col items-center">
        {/* Top Action Buttons */}
        <div className="fixed left-6 top-6 flex items-center gap-3 z-50">
          {room?.status !== 'ENDED' && (
            <button
              onClick={() => router.push(`/room/${roomId}/battle`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[3px] border-retro-ink text-retro-ink text-sm font-black uppercase tracking-wider shadow-[4px_4px_0_rgba(15,23,42,1)] hover:-translate-y-1 hover:bg-[#b2ff59] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all rotate-[-1deg]"
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
              <span>Back to Battle</span>
            </button>
          )}

          {room?.adminId === user?._id && room?.status !== 'ENDED' && (
            <button
              onClick={async () => {
                try { await api.post(`/rooms/${roomId}/end`); fetchLeaderboard(); fetchRoom(); } catch (e) { console.error(e); }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff4081] border-[3px] border-retro-ink text-white text-sm font-black uppercase tracking-wider shadow-[4px_4px_0_rgba(15,23,42,1)] hover:-translate-y-1 hover:bg-[#e03872] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all rotate-[1deg]"
            >
              End Contest
            </button>
          )}
        </div>

        <div className="fixed right-6 top-6 z-50">
          <button
            onClick={() => {
              dispatch(clearRoom());
              dispatch(clearContest());
              router.push('/rooms');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-retro-orange border-[3px] border-retro-ink text-white text-sm font-black uppercase tracking-wider shadow-[4px_4px_0_rgba(15,23,42,1)] hover:-translate-y-1 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all rotate-[1deg]"
          >
            Leave Room
          </button>
        </div>

        {/* Page Title & Motivation - No RoomHeader */}
        <div className="w-full max-w-6xl mx-auto mb-16 mt-16 text-center sm:text-left relative flex flex-col items-center">

          <div className="flex flex-col items-center w-full max-w-4xl">

            <h1 className="text-6xl md:text-8xl font-heading uppercase text-retro-ink text-center leading-none mb-8 drop-shadow-[4px_4px_0_rgba(15,23,42,1)]">
              HALL OF <br /><span className="text-[#00e5ff] bg-retro-ink px-4 py-2 inline-block rotate-[-2deg] mt-2 text-white">FAMERS</span>
            </h1>

            <div className="w-full max-w-4xl text-center relative mt-6">
              <p className="font-['Bobby-Jones-Soft'] text-5xl md:text-6xl leading-tight drop-shadow-[3px_3px_0_rgba(15,23,42,1)]">
                <span className="text-[#ff4081]">The battle</span> <span className="text-retro-ink">rages on,</span> <br />
                <span className="text-[#00e5ff]">only the most</span> <span className="text-retro-orange">optimized code</span> <br />
                <span className="text-retro-ink">survives</span> <span className="text-[#b2ff59]">the execution.</span> <br />
                <span className="text-[#ff4081]">Climb</span> <span className="text-retro-ink">the rankings,</span> <span className="text-[#00e5ff]">and forge</span> <br />
                <span className="text-retro-ink">your</span> <span className="text-retro-orange">legendary legacy!</span>
              </p>
            </div>

          </div>
        </div>

        {/* Podium Overview */}
        {topTeams.length > 0 && (
          <div className="w-full max-w-5xl mx-auto mb-20 grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-12">

            {/* Rank 2 (Left) */}
            <div className="bg-[#b2ff59] border-[4px] border-retro-ink p-8 flex flex-col items-center text-center order-2 md:order-1 shadow-[8px_8px_0_rgba(15,23,42,1)] hover:-translate-y-2 hover:translate-x-[-2px] transition-transform rotate-[-2deg]">
              <div className="w-20 h-20 mb-6 bg-white border-[3px] border-retro-ink flex items-center justify-center shadow-[4px_4px_0_rgba(15,23,42,1)] rotate-[3deg]">
                <Medal className="w-10 h-10 stroke-[3] text-retro-ink" />
              </div>
              <h3 className="text-4xl font-black text-retro-ink mb-1 tracking-tight">
                {topTeams[1]?.score || 0} <span className="text-lg font-bold">PTS</span>
              </h3>
              <p className="font-mono font-bold uppercase tracking-widest text-retro-ink mb-3 bg-white px-2 border-2 border-retro-ink rotate-[-1deg]">2nd Place</p>
              <h4 className="text-2xl font-heading uppercase text-retro-ink">{topTeams[1]?.name || '-'}</h4>
            </div>

            {/* Rank 1 (Center) */}
            <div className="bg-retro-blue border-[4px] border-retro-ink p-10 flex flex-col items-center text-center order-1 md:order-2 relative z-10 transform md:-translate-y-12 min-h-[350px] justify-center shadow-[12px_12px_0_rgba(15,23,42,1)] hover:-translate-y-14 transition-transform">
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#ff4081] border-[3px] border-retro-ink rounded-full flex items-center justify-center animate-bounce shadow-[4px_4px_0_rgba(15,23,42,1)] z-20">
                <span className="font-black text-white text-2xl">#1</span>
              </div>
              <div className="w-28 h-28 mb-8 bg-retro-yellow border-[4px] border-retro-ink flex items-center justify-center shadow-[6px_6px_0_rgba(15,23,42,1)] rotate-[-4deg]">
                <Trophy className="w-14 h-14 stroke-[3] text-retro-ink" />
              </div>
              <h3 className="text-6xl font-black text-white mb-2 tracking-tight drop-shadow-[3px_3px_0_rgba(15,23,42,1)]">
                {topTeams[0]?.score || 0} <span className="text-2xl font-bold">PTS</span>
              </h3>
              <p className="font-mono font-black uppercase tracking-widest text-retro-ink mb-4 bg-white px-3 py-1 border-[3px] border-retro-ink rotate-[2deg] shadow-[3px_3px_0_rgba(15,23,42,1)]">Winner</p>
              <h4 className="text-4xl font-heading uppercase text-white drop-shadow-[2px_2px_0_rgba(15,23,42,1)]">{topTeams[0]?.name || '-'}</h4>
            </div>

            {/* Rank 3 (Right) */}
            <div className="bg-retro-orange border-[4px] border-retro-ink p-8 flex flex-col items-center text-center order-3 shadow-[8px_8px_0_rgba(15,23,42,1)] hover:-translate-y-2 hover:translate-x-[2px] transition-transform rotate-[2deg]">
              <div className="w-20 h-20 mb-6 bg-white border-[3px] border-retro-ink flex items-center justify-center shadow-[4px_4px_0_rgba(15,23,42,1)] rotate-[-3deg]">
                <Medal className="w-10 h-10 stroke-[3] text-retro-ink" />
              </div>
              <h3 className="text-4xl font-black text-white mb-1 tracking-tight drop-shadow-[2px_2px_0_rgba(15,23,42,1)]">
                {topTeams[2]?.score || 0} <span className="text-lg font-bold">PTS</span>
              </h3>
              <p className="font-mono font-bold uppercase tracking-widest text-retro-ink mb-3 bg-white px-2 border-2 border-retro-ink rotate-[1deg]">3rd Place</p>
              <h4 className="text-2xl font-heading uppercase text-white">{topTeams[2]?.name || '-'}</h4>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table (All Teams) */}
        <div className="w-full max-w-6xl mx-auto">
          <div className="bg-white border-[4px] border-retro-ink shadow-[12px_12px_0_rgba(15,23,42,1)]">
            {/* Table Header */}
            <div className="px-8 py-6 border-b-[4px] border-retro-ink flex flex-col sm:flex-row justify-between items-center bg-retro-yellow">
              <h2 className="text-3xl font-heading uppercase text-retro-ink flex items-center gap-3">
                <Trophy className="w-8 h-8 stroke-[3]" />
                Full Rankings
              </h2>
              <button
                onClick={fetchLeaderboard}
                className="mt-4 sm:mt-0 font-mono text-sm font-black text-white bg-retro-ink px-4 py-2 border-[3px] border-white shadow-[4px_4px_0_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(255,255,255,1)] transition-all uppercase tracking-widest rotate-[-1deg]"
              >
                ↻ Live Updates
              </button>
            </div>

            {remainingTeams.length > 0 ? (
              <div className="overflow-x-auto custom-scrollbar">
                <Table className="w-full min-w-[800px]">
                  <TableHeader>
                    <TableRow className="border-b-[4px] border-retro-ink bg-slate-100 hover:bg-slate-100">
                      <TableHead className="w-[100px] font-black text-retro-ink text-base uppercase py-4 px-6 tracking-widest border-r-[4px] border-retro-ink">Rank</TableHead>
                      <TableHead className="w-[35%] font-black text-retro-ink text-base uppercase py-4 px-6 tracking-widest border-r-[4px] border-retro-ink">Team Name</TableHead>
                      <TableHead className="w-[15%] font-black text-retro-ink text-base uppercase py-4 px-6 tracking-widest border-r-[4px] border-retro-ink">Members</TableHead>
                      <TableHead className="w-[20%] font-black text-retro-ink text-base uppercase py-4 px-6 tracking-widest border-r-[4px] border-retro-ink">Solved</TableHead>
                      <TableHead className="w-[15%] text-right font-black text-retro-ink text-base uppercase py-4 px-6 tracking-widest">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {remainingTeams.map((team, index) => {
                      const actualRank = index + 4; // Start from rank 4
                      const rowColors = ['bg-[#b2ff59]/20', 'bg-[#00e5ff]/20', 'bg-retro-yellow/30', 'bg-[#ff4081]/10'];
                      return (
                        <TableRow
                          key={team.id}
                          className={cn("cursor-pointer transition-colors duration-200 border-b-[3px] border-retro-ink border-dashed hover:brightness-95", rowColors[index % rowColors.length])}
                          onClick={() => setSelectedTeam(team)}
                        >
                          <TableCell className="py-5 px-6 border-r-[4px] border-retro-ink">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-12 h-12 border-[3px] border-retro-ink bg-retro-orange text-white font-black text-2xl rotate-[2deg] shadow-[3px_3px_0_rgba(15,23,42,1)]">
                                {actualRank}
                              </span>
                              <RankMovementIndicator rankChange={team.rankChange} />
                            </div>
                          </TableCell>
                          <TableCell className="py-5 px-6 border-r-[4px] border-retro-ink">
                            <span className="text-retro-ink text-xl font-heading uppercase tracking-widest">{team.name}</span>
                          </TableCell>
                          <TableCell className="py-5 px-6 border-r-[4px] border-retro-ink">
                            <span className="inline-flex items-center gap-2 font-mono font-black text-white text-xl bg-retro-blue px-3 py-1 border-[3px] border-retro-ink shadow-[3px_3px_0_rgba(15,23,42,1)] rotate-[-2deg]">
                              <Users className="w-5 h-5 stroke-[3]" />
                              {team.members.length}
                            </span>
                          </TableCell>
                          <TableCell className="py-5 px-6 border-r-[4px] border-retro-ink">
                            <span className="inline-flex items-center gap-2 font-mono font-black text-white text-xl bg-[#ff4081] px-3 py-1 border-[3px] border-retro-ink shadow-[3px_3px_0_rgba(15,23,42,1)] rotate-[1deg]">
                              <CheckCircle2 className="w-5 h-5 stroke-[3]" />
                              {team.problemsSolved}
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-5 px-6">
                            <div className="flex items-center justify-end gap-3">
                              <EfficiencyBadge
                                efficiency={team.efficiency}
                                efficiencyLevel={team.efficiencyLevel}
                              />
                              <span className="font-black text-2xl text-retro-ink bg-retro-yellow px-3 py-1 border-[3px] border-retro-ink shadow-[3px_3px_0_rgba(15,23,42,1)] rotate-[1deg]">
                                {team.score} <span className="text-sm">PTS</span>
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <XCircle className="w-16 h-16 stroke-[2] text-retro-ink mb-6 rotate-[-10deg]" />
                <p className="text-2xl font-black uppercase tracking-widest text-retro-ink bg-[#b2ff59] px-4 py-2 border-[3px] border-retro-ink shadow-[4px_4px_0_rgba(15,23,42,1)] rotate-[2deg]">
                  {topTeams.length === 0 ? "No teams have started yet" : "No additional teams"}
                </p>
              </div>
            )}
          </div>
        </div>


        {/* Team Members Slide-out Sheet */}
        <Sheet open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
          <SheetContent className="w-full sm:max-w-4xl overflow-y-auto bg-[#FEFBEA] border-l-[6px] border-retro-ink text-retro-ink p-8 sm:p-14">
            <SheetHeader className="mb-8">
              <SheetTitle className="text-4xl font-heading uppercase tracking-widest text-retro-ink border-b-[4px] border-retro-ink pb-4">
                {selectedTeam?.name}
              </SheetTitle>
              <SheetDescription className="font-mono font-bold text-retro-ink mt-4 bg-retro-yellow inline-block px-3 py-1 border-[2px] border-retro-ink rotate-[-1deg] w-fit shadow-[2px_2px_0_rgba(15,23,42,1)]">
                Performance Metrics & Roster
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-10">
              {/* Team Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#b2ff59] border-[4px] border-retro-ink p-8 flex flex-col items-center text-center shadow-[6px_6px_0_rgba(15,23,42,1)] rotate-[-2deg] hover:rotate-0 transition-transform">
                  <p className="text-base font-black uppercase tracking-widest mb-4 border-b-2 border-retro-ink pb-2 w-full">Members</p>
                  <p className="text-6xl font-black">{selectedTeam?.members?.length || 1}</p>
                </div>
                <div className="bg-[#00e5ff] border-[4px] border-retro-ink p-8 flex flex-col items-center text-center shadow-[6px_6px_0_rgba(15,23,42,1)] rotate-[1deg] hover:rotate-0 transition-transform">
                  <p className="text-base font-black uppercase tracking-widest mb-4 border-b-2 border-retro-ink pb-2 w-full">Solved</p>
                  <p className="text-6xl font-black">{selectedTeam?.problemsSolved || 0}</p>
                </div>
                <div className="bg-[#ff4081] text-white border-[4px] border-retro-ink p-8 flex flex-col items-center text-center shadow-[6px_6px_0_rgba(15,23,42,1)] rotate-[-1deg] hover:rotate-0 transition-transform">
                  <p className="text-base font-black uppercase tracking-widest mb-4 border-b-2 border-white pb-2 w-full">Score</p>
                  <p className="text-6xl font-black">{selectedTeam?.score || 0}</p>
                </div>
              </div>

              {/* Members Table */}
              <div>
                <h3 className="text-2xl font-black uppercase tracking-widest text-retro-ink mb-6 flex items-center gap-3 bg-retro-orange text-white w-fit px-4 py-2 border-[3px] border-retro-ink shadow-[4px_4px_0_rgba(15,23,42,1)] rotate-[1deg]">
                  <Users className="w-6 h-6 stroke-[3]" />
                  Team Roster
                </h3>
                <div className="border-[4px] border-retro-ink shadow-[6px_6px_0_rgba(15,23,42,1)] bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100 border-b-[4px] border-retro-ink">
                        <TableHead className="font-black text-retro-ink text-sm uppercase tracking-widest py-4 border-r-[4px] border-retro-ink">Name</TableHead>
                        <TableHead className="font-black text-retro-ink text-sm uppercase tracking-widest py-4 border-r-[4px] border-retro-ink">Role</TableHead>
                        <TableHead className="text-right font-black text-retro-ink text-sm uppercase tracking-widest py-4">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTeam?.members?.map((member, idx) => {
                        const mColors = ['bg-[#b2ff59]/20', 'bg-[#00e5ff]/20', 'bg-retro-yellow/30', 'bg-[#ff4081]/10'];
                        return (
                          <TableRow key={member.id} className={cn("border-b-[3px] border-retro-ink border-dashed hover:brightness-95", mColors[idx % mColors.length])}>
                            <TableCell className="font-bold text-retro-ink text-xl uppercase tracking-wide py-6 px-4 border-r-[4px] border-retro-ink">{member.name}</TableCell>
                            <TableCell className="py-6 px-4 border-r-[4px] border-retro-ink">
                              <span className={cn(
                                "font-mono text-sm font-black uppercase tracking-widest px-3 py-1 border-[3px] border-retro-ink shadow-[2px_2px_0_rgba(15,23,42,1)] rotate-[-1deg] inline-block",
                                member.role === 'Leader' ? "bg-retro-blue text-white" : "bg-white text-retro-ink"
                              )}>
                                {member.role}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-black text-retro-ink text-2xl py-6 px-4">{member.score || 0}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}

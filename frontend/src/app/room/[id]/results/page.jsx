'use client';

import RoomHeader from '@/components/room/RoomHeader';
import { InteractiveGridPattern } from '@/components/ui/interactive-grid-pattern';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TypographyH1, TypographyH2, TypographyH3 } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
// import Modal from '@/components/common/Modal'; // Use basic boolean for mobile if needed, or simply let Sheet open.
import TeamHoverCard from '@/components/room/leaderboard/TeamHoverCard';
import TeamHoverCardContent from '@/components/room/leaderboard/TeamHoverCardContent';
import RankMovementIndicator from '@/components/room/leaderboard/RankMovementIndicator';
import EfficiencyBadge from '@/components/room/leaderboard/EfficiencyBadge';
import { ArrowLeft, CheckCircle2, Medal, Trophy, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/lib/axios';
import { setLeaderboard, clearContest } from '@/store/slices/contestSlice';
import { clearRoom, setRoom } from '@/store/slices/roomSlice';

export default function LeaderboardPage() {
 const params = useParams();
 const router = useRouter();
 const dispatch = useDispatch();
 const roomId = params.id;

 const user = useSelector(s => s.auth.user);
 const room = useSelector(s => s.room.room);
 const leaderboard = useSelector(s => s.contest.leaderboard) || [];

 const [loading, setLoading] = useState(true);
 const [selectedTeam, setSelectedTeam] = useState(null);

 // Desktop hover card (no-flicker) + mobile modal fallback
 const [hoverTeam, setHoverTeam] = useState(null);
 const [hoverOpen, setHoverOpen] = useState(false);
 const [hoverAnchorEl, setHoverAnchorEl] = useState(null);
 const hideHoverTimerRef = useRef(null);
 const unmountHoverTimerRef = useRef(null);
 const [hoverCapable, setHoverCapable] = useState(false);
 // const [mobileTeam, setMobileTeam] = useState(null);

 useEffect(() => {
 const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
 const update = () => setHoverCapable(!!mq.matches);
 update();
 mq.addEventListener?.("change", update);
 return () => mq.removeEventListener?.("change", update);
 }, []);

 useEffect(() => {
 fetchLeaderboard();
 fetchRoom();
 }, [roomId]);

 const fetchRoom = async () => {
 try {
 const { data } = await api.get(`/rooms/${roomId}`);
 dispatch(setRoom(data?.data));
 } catch { }
 };

 const fetchLeaderboard = async () => {
 try {
 setLoading(true);
 const { data } = await api.get(`/rooms/${roomId}/leaderboard`);
 dispatch(setLeaderboard(data?.data || []));
 } catch {
 } finally {
 setLoading(false);
 }
 };

 const clearHideTimer = () => {
 if (hideHoverTimerRef.current) clearTimeout(hideHoverTimerRef.current);
 hideHoverTimerRef.current = null;
 };

 const showHover = (team, anchorEl) => {
 if (!hoverCapable) return;
 clearHideTimer();
 if (unmountHoverTimerRef.current) clearTimeout(unmountHoverTimerRef.current);
 unmountHoverTimerRef.current = null;
 setHoverTeam(team);
 setHoverAnchorEl(anchorEl);
 requestAnimationFrame(() => setHoverOpen(true));
 };

 const scheduleHideHover = () => {
 if (!hoverCapable) return;
 clearHideTimer();
 hideHoverTimerRef.current = setTimeout(() => {
 setHoverOpen(false);
 unmountHoverTimerRef.current = setTimeout(() => {
 setHoverTeam(null);
 setHoverAnchorEl(null);
 }, 200);
 }, 90);
 };

 // Prepare real data mappings
 const formattedTeams = leaderboard.map((t, idx) => ({
 id: t.teamId || `t-${idx}`,
 name: t.teamName || `Team ${idx + 1}`,
 score: t.score || 0,
 problemsSolved: t.acceptedCount || 0,
 rankChange: t.rankChange || 0, // Not provided directly, default to 0
 efficiency: t.efficiency || "O(n)",
 members: t.members || Array.from({ length: t.memberCount || 1 }).map((_, i) => ({
 id: `m-${i}`,
 name: `Member ${i + 1}`,
 role: i === 0 ? 'Leader' : 'Member',
 score: 0
 }))
 }));

 const topTeams = formattedTeams.slice(0, 3);
 const remainingTeams = formattedTeams.slice(3);

  if (loading && leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f7f9] dark:bg-[#111111] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f7f9] dark:bg-[#111111] text-slate-900 dark:text-[#eff1f6] min-h-screen flex flex-col relative antialiased overflow-hidden transition-colors duration-300" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>

      {/* Background Grid */}
      <InteractiveGridPattern
        chessBoard={true}
        className={cn(
          "absolute inset-0 top-0 h-[600px] z-0 opacity-100 dark:opacity-20",
          "[mask-image:linear-gradient(to_bottom,black_30%,transparent_100%),linear-gradient(to_right,transparent_0%,black_20%,black_80%,transparent_100%)]",
          "[-webkit-mask-image:linear-gradient(to_bottom,black_30%,transparent_100%),linear-gradient(to_right,transparent_0%,black_20%,black_80%,transparent_100%)]",
          "[mask-composite:intersect]",
          "[-webkit-mask-composite:source-in]"
        )}
        width={50}
        height={50}
        squares={[80, 80]}
        squaresClassName="hover:fill-emerald-400/40 transition-all duration-500"
      />

      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-10 pb-24 flex flex-col items-center">

        {/* Top Action Buttons - fixed top-left / top-right */}
        <div className="fixed left-6 top-6 flex items-center gap-3 z-50">
          {room?.status !== 'ENDED' && (
            <button
              onClick={() => router.push(`/room/${roomId}/battle`)}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-[#eff1f6] hover:text-slate-900 dark:hover:text-white bg-white/90 dark:bg-[#1a1a1a]/95 px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#2d2d2d] shadow-sm backdrop-blur transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Battle</span>
            </button>
          )}

          {room?.adminId === user?._id && room?.status !== 'ENDED' && (
            <button
              onClick={async () => {
                try { await api.post(`/rooms/${roomId}/end`); fetchLeaderboard(); fetchRoom(); } catch (e) { console.error(e); }
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-full border border-rose-600 shadow-sm"
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
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-[#eff1f6] hover:text-slate-900 dark:hover:text-white bg-white/90 dark:bg-[#1a1a1a]/95 px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#2d2d2d] shadow-sm backdrop-blur"
          >
            Leave Room
          </button>
        </div>

        {/* Header */}
        <RoomHeader
          title={room?.name || "Syncorithm"}
          description="The hall of fame for code-golfing legends."
          titleClassName=""
        />

  {/* Page Title & Motivation */}
  <div className="w-full max-w-6xl mx-auto mb-12 text-center sm:text-left relative">
  <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/5 dark:bg-emerald-500/2 blur-[80px] rounded-full pointer-events-none"></div>

  <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/60 dark:border-[#2d2d2d] mb-4 transition-all hover:bg-slate-100 dark:hover:bg-[#262626] hover:border-slate-300 dark:hover:border-[#333333] group cursor-default">
  <span className="relative flex h-2 w-2">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
  </span>
  <span className="text-xs font-bold tracking-[0.15em] text-slate-500 dark:text-[#8c8c8c] uppercase group-hover:text-slate-700 dark:group-hover:text-white">DSA Multiplayer Arena</span>
  </div>

  <TypographyH1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
  Where Coders Rise <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-[#ffa116] dark:to-[#ffa116]">and Legends Stay.</span>
  </TypographyH1>

  <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
  Compete in real-time battles, crush complexity, and rise to the top.
  <span className="block sm:inline text-slate-900 dark:text-white font-semibold mt-1 sm:mt-0"> Only the most optimized code wins.</span>
  </p>
  </div>

  {/* Podium Overview (Separate Cards) */}
  {topTeams.length > 0 && (
  <div className="w-full max-w-5xl mx-auto mb-16 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
  {/* Rank 2 (Left) */}
  <div className="group bg-white dark:bg-[#1e1e1e] rounded-[2rem] border border-slate-200/60 dark:border-[#2d2d2d] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.05)] dark:shadow-none p-8 flex flex-col items-center text-center order-2 md:order-1 transition-all duration-300 hover:-translate-y-3 hover:-rotate-2">
  <div className="w-20 h-20 mb-6 bg-slate-50 dark:bg-[#262626] rounded-[1.25rem] shadow-sm border border-slate-100 dark:border-[#333333] flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/40 group-hover:border-emerald-200 dark:group-hover:border-emerald-800">
  <Medal strokeWidth={1.5} className="w-9 h-9 text-slate-400 dark:text-slate-300 transition-colors duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
  </div>
  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight transition-colors duration-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
  {topTeams[1]?.score || 0} <span className="text-lg text-slate-400 font-normal group-hover:text-emerald-700 dark:group-hover:text-emerald-400">pts</span>
  </h3>
  <p className="text-slate-500 dark:text-slate-400 font-semibold mb-3 transition-colors duration-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">2nd Place</p>
  <TypographyH3 className="text-lg text-slate-700 dark:text-slate-300 truncate w-full border-none pb-0 transition-colors duration-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
  {topTeams[1]?.name || '-'}
  </TypographyH3>
  </div>

  {/* Rank 1 (Center - Elevated) */}
  <div className="group bg-white dark:bg-[#1e1e1e] rounded-[2rem] border border-emerald-100 dark:border-emerald-500/40 shadow-[0_20px_40px_-12px_rgba(16,185,129,0.15)] dark:shadow-none p-8 flex flex-col items-center text-center order-1 md:order-2 relative z-10 transform md:-translate-y-8 min-h-[320px] justify-center transition-all duration-300 hover:-translate-y-4 hover:-rotate-2">
  <div className="w-24 h-24 mb-6 bg-slate-50 dark:bg-[#262626] rounded-[1.5rem] border border-slate-100 dark:border-[#333333] shadow-[0_8px_20px_-4px_rgba(15,23,42,0.25)] dark:shadow-none flex items-center justify-center transition-all duration-300 group-hover:-rotate-6 group-hover:scale-105 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/40 group-hover:border-emerald-200 dark:group-hover:border-emerald-800 group-hover:shadow-[0_12px_30px_-10px_rgba(16,185,129,0.4)] dark:group-hover:shadow-none">
  <Trophy strokeWidth={1.5} className="w-10 h-10 text-amber-400 transition-colors duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
  </div>

  <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight transition-colors duration-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
  {topTeams[0]?.score || 0} <span className="text-xl text-slate-400 font-normal group-hover:text-emerald-700 dark:group-hover:text-emerald-400">pts</span>
  </h3>
  <p className="text-emerald-600 dark:text-emerald-400 font-bold mb-4 uppercase tracking-wider text-sm transition-colors duration-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Winner</p>
  <TypographyH2 className="text-2xl text-slate-900 dark:text-white truncate w-full border-none pb-0 tracking-tight transition-colors duration-300 group-hover:text-emerald-900 dark:group-hover:text-white">
  {topTeams[0]?.name || '-'}
  </TypographyH2>
  </div>

  {/* Rank 3 (Right) */}
  <div className="group bg-white dark:bg-[#1e1e1e] rounded-[2rem] border border-slate-200/60 dark:border-[#2d2d2d] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.05)] dark:shadow-none p-8 flex flex-col items-center text-center order-3 transition-all duration-300 hover:-translate-y-3 hover:-rotate-2">
  <div className="w-20 h-20 mb-6 bg-slate-50 dark:bg-[#262626] rounded-[1.25rem] shadow-sm border border-slate-100 dark:border-[#333333] flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/40 group-hover:border-emerald-200 dark:group-hover:border-emerald-800">
  <Medal strokeWidth={1.5} className="w-9 h-9 text-amber-700 dark:text-amber-500 transition-colors duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
  </div>
  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight transition-colors duration-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
  {topTeams[2]?.score || 0} <span className="text-lg text-slate-400 font-normal group-hover:text-emerald-700 dark:group-hover:text-emerald-400">pts</span>
  </h3>
  <p className="text-slate-500 dark:text-slate-400 font-semibold mb-3 transition-colors duration-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">3rd Place</p>
  <TypographyH3 className="text-lg text-slate-700 dark:text-slate-300 truncate w-full border-none pb-0 transition-colors duration-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
  {topTeams[2]?.name || '-'}
  </TypographyH3>
  </div>
  </div>
  )}

 {/* Full Leaderboard Table (All Teams) */}
 <div className="w-full max-w-6xl mx-auto">
  <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200/60 dark:border-[#2d2d2d] rounded-2xl overflow-hidden shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] dark:shadow-none transition-colors duration-300">
  {/* Table Header */}
  <div className="px-8 py-6 border-b border-slate-200/60 dark:border-[#2d2d2d] flex justify-between items-center bg-gradient-to-r from-slate-50 to-white dark:from-[#1a1a1a] dark:to-[#1e1e1e]">
  <TypographyH3 className="text-slate-900 dark:text-white border-none pb-0 flex items-center gap-2 tracking-tight">
  <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
  Full Rankings
  </TypographyH3>
  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg uppercase tracking-wide cursor-pointer" onClick={fetchLeaderboard}>
  ↻ Live Updates
  </span>
  </div>

  {remainingTeams.length > 0 ? (
  <Table className='w-full'>
  <TableHeader>
  <TableRow className="bg-slate-100/50 dark:bg-[#262626] hover:bg-slate-100/50 dark:hover:bg-[#262626] border-b border-slate-200/60 dark:border-[#2d2d2d]">
  <TableHead className="w-[80px] font-medium text-slate-500 dark:text-[#8c8c8c] text-sm py-4 px-6">Rank</TableHead>
  <TableHead className="w-[35%] font-medium text-slate-500 dark:text-[#8c8c8c] text-sm py-4">Team Name</TableHead>
  <TableHead className="w-[15%] font-medium text-slate-500 dark:text-[#8c8c8c] text-sm py-4">Members</TableHead>
  <TableHead className="w-[20%] font-medium text-slate-500 dark:text-[#8c8c8c] text-sm py-4">Problems Solved</TableHead>
  <TableHead className="w-[15%] text-right font-medium text-slate-500 dark:text-[#8c8c8c] text-sm py-4 px-6">Score</TableHead>
  </TableRow>
  </TableHeader>
  <TableBody>
  {remainingTeams.map((team, index) => {
  const actualRank = index + 4; // Start from rank 4
  return (
  <TableRow
  key={team.id}
  className={`
  cursor-pointer transition-all duration-200 border-b border-slate-100/50 dark:border-[#2d2d2d]/30 last:border-0
  ${index % 2 === 0 ? 'bg-white dark:bg-[#1e1e1e] hover:bg-slate-50/50 dark:hover:bg-[#262626]' : 'bg-slate-50/30 dark:bg-[#1a1a1a]/30 hover:bg-slate-100/40 dark:hover:bg-[#262626]'}
  `}
  onMouseEnter={(e) => showHover(team, e.currentTarget)}
  onMouseLeave={scheduleHideHover}
  onClick={() => setSelectedTeam(team)}
  >
  <TableCell className="text-slate-900 dark:text-white text-lg font-bold py-5 px-6">
  <div className="flex items-center gap-2">
  <span>
  <span className="text-slate-500 dark:text-[#8c8c8c]">#</span>
  {actualRank}
  </span>
  <RankMovementIndicator rankChange={team.rankChange} />
  </div>
  </TableCell>
  <TableCell className="text-slate-900 dark:text-white text-lg font-semibold py-5">
  {team.name}
  </TableCell>
  <TableCell className="text-slate-600 dark:text-slate-300 text-base py-5">
  <span className="inline-flex items-center gap-1">
  <Users className="w-4 h-4" />
  {team.members.length}
  </span>
  </TableCell>
  <TableCell className="text-slate-600 dark:text-slate-300 text-base py-5">
  <div className="flex items-center gap-2 px-10">
  <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
  <span className="font-bold text-slate-700 dark:text-slate-300">{team.problemsSolved}</span>
  </div>
  </TableCell>
  <TableCell className="text-right text-slate-900 dark:text-white text-xl font-bold py-5 px-6">
  <div className="flex items-center justify-end gap-2">
  <EfficiencyBadge
  efficiency={team.efficiency}
  efficiencyLevel={team.efficiencyLevel}
  />
  <span>
  {team.score}
  <span className="text-xs text-slate-400 dark:text-[#8c8c8c] font-normal ml-1">pts</span>
  </span>
  </div>
  </TableCell>
  </TableRow>
  );
  })}
  </TableBody>
  </Table>
  ) : (
  <div className="text-center py-10 text-slate-500 dark:text-[#8c8c8c]">
  {topTeams.length === 0 ? "No teams have started yet." : "No additional teams."}
  </div>
  )}
  </div>
  </div>

 {/* Desktop hover card (purely decorative, no layout impact) */}
 <TeamHoverCard
 open={hoverOpen}
 team={hoverTeam}
 anchorEl={hoverAnchorEl}
 onCardMouseEnter={clearHideTimer}
 onCardMouseLeave={scheduleHideHover}
 />

 {/* Team Members Slide-out Sheet */}
 <Sheet open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
 <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-white dark:bg-[#1e1e1e] border-l border-slate-200 dark:border-[#2d2d2d] text-slate-900 dark:text-white">
 <SheetHeader>
 <SheetTitle className="text-2xl font-bold flex items-center gap-2">
 {selectedTeam?.name}
 </SheetTitle>
 <SheetDescription>
 Detailed performance metrics and member stats
 </SheetDescription>
 </SheetHeader>

 <div className="mt-8 space-y-8">
 {/* Team Stats Cards */}
 <div className="grid grid-cols-3 gap-4">
 <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Members</p>
 <p className="text-2xl font-bold text-slate-900 ">{selectedTeam?.members?.length || 1}</p>
 </div>
 <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Solved</p>
 <p className="text-2xl font-bold text-slate-900 ">{selectedTeam?.problemsSolved || 0}</p>
 </div>
 <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Score</p>
 <p className="text-2xl font-bold text-slate-900 ">{selectedTeam?.score || 0}</p>
 </div>
 </div>

 {/* Members Table */}
 <div>
 <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
 <Users className="w-5 h-5 text-slate-500" />
 Team Members
 </h3>
 <div className="border border-slate-200 rounded-xl overflow-hidden">
 <Table>
 <TableHeader>
 <TableRow className="bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-[#2d2d2d]">
 <TableHead className="font-medium text-slate-500 dark:text-[#8c8c8c] text-sm">Name</TableHead>
 <TableHead className="font-medium text-slate-500 dark:text-[#8c8c8c] text-sm">Role</TableHead>
 <TableHead className="text-right font-medium text-slate-500 dark:text-[#8c8c8c] text-sm">Score</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {selectedTeam?.members?.map((member) => (
 <TableRow key={member.id} className="border-b border-slate-100 dark:border-[#2d2d2d]/30 last:border-0 hover:bg-slate-50/50 dark:hover:bg-[#262626]">
 <TableCell className="font-medium text-slate-900 dark:text-white text-base">{member.name}</TableCell>
 <TableCell>
 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.role === 'Leader'
 ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
 : 'bg-slate-100 dark:bg-[#2c2c2c] text-slate-700 dark:text-slate-400'
 }`}>
 {member.role}
 </span>
 </TableCell>
 <TableCell className="text-right font-medium text-slate-900 dark:text-white text-base">{member.score || 0}</TableCell>
 </TableRow>
 ))}
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

'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { roomsApi, problemsApi, submissionsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  createStompClient,
  subscribeToRoomUpdates,
  subscribeToLeaderboard,
  subscribeToUserNotifications,
} from '@/lib/stomp';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import CodeEditor from '@/components/CodeEditor';
import ProblemStatement from '@/components/ProblemStatement';
import TestCaseConsole from '@/components/TestCaseConsole';
import useResizableWorkspace from '@/hooks/useResizableWorkspace';

const WRAPPER_DELIMITER_RE = /(?:\/\/|#)\s*──\s*I\/O wrapper\s*—\s*do not edit below\s*──+/;

function splitTemplate(fullCode) {
  if (!fullCode) return { userCode: '', hiddenWrapper: '' };
  const match = fullCode.match(WRAPPER_DELIMITER_RE);
  if (!match) return { userCode: fullCode, hiddenWrapper: '' };
  const delimIdx = fullCode.indexOf(match[0]);
  const lineStart = fullCode.lastIndexOf('\n', delimIdx - 1) + 1;
  const userCode = fullCode.substring(0, lineStart).trimEnd();
  const hiddenWrapper = fullCode.substring(lineStart);
  return { userCode, hiddenWrapper };
}

const DEFAULT_USER_TEMPLATES = {
  JAVA: `import java.util.*;
import java.io.*;

class Solution {
    // Write your solution here
}`,

  PYTHON: `class Solution:
    def solve(self, A):
        # Write your solution here
        pass`,

  CPP: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    // Write your solution here
};`,

  JAVASCRIPT: `class Solution {
    solve(A) {
        // Write your solution here
    }
}`,
};

function RoomDetailsContent({ params }) {
  const resolvedParams = React.use(params);
  const roomId = resolvedParams.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Derived contest states
  const roomStatus = snapshot?.room?.status;
  const isContestActive = roomStatus === 'IN_PROGRESS' || roomStatus === 'STARTED';
  const isContestEnded = roomStatus === 'ENDED';

  // Lobby team state
  const [newTeamName, setNewTeamName] = useState('');
  const [teamError, setTeamError] = useState('');
  const [copiedTeamCode, setCopiedTeamCode] = useState(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [selectedTeamRowId, setSelectedTeamRowId] = useState(null);

  // Team code join modal state
  const [modalTargetTeam, setModalTargetTeam] = useState(null);
  const [modalTeamCode, setModalTeamCode] = useState('');
  const [modalTeamError, setModalTeamError] = useState('');

  // Admin Problem selection state
  const [availableProblems, setAvailableProblems] = useState([]);
  const [selectedProblemIds, setSelectedProblemIds] = useState([]);
  const [contestProblems, setContestProblems] = useState([]);
  const [showProblemSelector, setShowProblemSelector] = useState(false);

  // Contest Arena Tabs: 'problem' | 'leaderboard' | 'submissions'
  const [activeTab, setActiveTab] = useState('problem');
  const [activeContestProblemIndex, setActiveContestProblemIndex] = useState(0);
  const [leaderboardScores, setLeaderboardScores] = useState([]);
  const [roomSubmissions, setRoomSubmissions] = useState([]);

  // Code editor state
  const [language, setLanguage] = useState('PYTHON');
  const [userCode, setUserCode] = useState('');
  const [codeCache, setCodeCache] = useState({});
  const [executing, setExecuting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Resizable Workspace State
  const {
    containerRef: workspaceRef,
    leftWidth,
    bottomHeight,
    startHorizontalDrag,
    startVerticalDrag,
  } = useResizableWorkspace({
    defaultLeftPercent: 45,
    minLeftPercent: 20,
    maxLeftPercent: 80,
    defaultBottomHeight: 250,
    minBottomHeight: 100,
    maxBottomHeight: 550,
  });

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState('--:--');

  const stompClientRef = useRef(null);
  const activeContestProblem = contestProblems[activeContestProblemIndex] || null;

  // Initialize and sync starter code
  useEffect(() => {
    if (activeContestProblem) {
      const cache = {};
      if (activeContestProblem.starterCodes && activeContestProblem.starterCodes.length > 0) {
        activeContestProblem.starterCodes.forEach((sc) => {
          const { userCode: uc, hiddenWrapper: hw } = splitTemplate(sc.templateCode);
          cache[sc.language] = { userCode: uc, hiddenWrapper: hw };
        });
      }
      ['JAVA', 'PYTHON', 'CPP', 'JAVASCRIPT'].forEach((lang) => {
        if (!cache[lang]) {
          cache[lang] = { userCode: DEFAULT_USER_TEMPLATES[lang], hiddenWrapper: '' };
        }
      });
      const defaultLang = activeContestProblem.starterCodes?.[0]?.language || 'PYTHON';
      setLanguage(defaultLang);
      setUserCode(cache[defaultLang]?.userCode || DEFAULT_USER_TEMPLATES[defaultLang]);
      setCodeCache(cache);
    }
  }, [activeContestProblem]);

  const handleLanguageChange = (newLang) => {
    setCodeCache((prev) => ({
      ...prev,
      [language]: { ...prev[language], userCode },
    }));
    setLanguage(newLang);
    setUserCode(codeCache[newLang]?.userCode || DEFAULT_USER_TEMPLATES[newLang]);
  };

  const buildFullCode = () => {
    const wrapper = codeCache[language]?.hiddenWrapper || '';
    if (!wrapper) return userCode;
    return userCode + '\n' + wrapper;
  };

  // Fetch Room Snapshot
  const fetchRoom = useCallback(async () => {
    try {
      const data = await roomsApi.get(roomId);
      setSnapshot(data);
      return data;
    } catch (err) {
      if (err.status === 401) {
        router.push(`/login?redirect=/rooms/${roomId}`);
        return null;
      }
      setError(err.message || 'Failed to load room');
      return null;
    } finally {
      setLoading(false);
    }
  }, [roomId, router]);

  // Fetch Contest Problems
  const fetchContestProblems = useCallback(async (targetId) => {
    try {
      const idToUse = targetId || snapshot?.room?.id || roomId;
      const list = await roomsApi.getContestProblems(idToUse);
      if (Array.isArray(list) && list.length > 0) {
        setContestProblems(list);
      }
      return list;
    } catch (err) {
      console.warn('Contest problems fetch error:', err.message);
      return [];
    }
  }, [roomId, snapshot?.room?.id]);

  // Fetch Room Submissions
  const fetchRoomSubmissions = useCallback(async (targetId) => {
    try {
      const idToUse = targetId || snapshot?.room?.id || roomId;
      const data = await submissionsApi.getRoomSubmissions(idToUse, { size: 50 });
      setRoomSubmissions(data.content || []);
    } catch (err) {
      console.warn('Failed to fetch room submissions:', err);
    }
  }, [roomId, snapshot?.room?.id]);

  // Fetch Room Leaderboard
  const fetchLeaderboard = useCallback(async (targetId) => {
    try {
      const idToUse = targetId || snapshot?.room?.id || roomId;
      const list = await submissionsApi.getRoomLeaderboard(idToUse);
      setLeaderboardScores(list || []);
    } catch (err) {
      console.warn('Failed to fetch room leaderboard:', err);
    }
  }, [roomId, snapshot?.room?.id]);

  // Fetch published problems for Admin selector
  const fetchAvailableProblems = useCallback(async () => {
    try {
      const data = await problemsApi.list({ size: 50 });
      setAvailableProblems(data.content || []);
    } catch (err) {
      console.warn('Failed to fetch published problems:', err);
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    if (!authLoading) {
      fetchRoom().then((data) => {
        if (
          data &&
          (data.room.status === 'IN_PROGRESS' ||
            data.room.status === 'STARTED' ||
            data.room.status === 'ENDED')
        ) {
          const roomUuid = data.room.id;
          fetchContestProblems(roomUuid);
          fetchRoomSubmissions(roomUuid);
          fetchLeaderboard(roomUuid);
        }
      });
      fetchAvailableProblems();
    }
  }, [
    authLoading,
    fetchRoom,
    fetchContestProblems,
    fetchRoomSubmissions,
    fetchLeaderboard,
    fetchAvailableProblems,
  ]);

  // Auto-polling fallback while WAITING
  useEffect(() => {
    if (snapshot?.room?.status === 'WAITING') {
      const interval = setInterval(async () => {
        try {
          const data = await roomsApi.get(roomId);
          if (data && (data.room.status === 'IN_PROGRESS' || data.room.status === 'STARTED')) {
            setSnapshot(data);
            const targetUuid = data.room.id || roomId;
            await Promise.all([
              fetchContestProblems(targetUuid),
              fetchRoomSubmissions(targetUuid),
              fetchLeaderboard(targetUuid),
            ]);
            clearInterval(interval);
          }
        } catch {
          // ignore network poll error
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [roomId, snapshot?.room?.status, fetchContestProblems, fetchRoomSubmissions, fetchLeaderboard]);

  // Live Timer Countdown
  useEffect(() => {
    if (!isContestActive) return;

    const updateTimer = () => {
      const now = Date.now();
      const end = snapshot?.room?.endsAt
        ? new Date(snapshot.room.endsAt).getTime()
        : now + (snapshot?.room?.durationMinutes || 30) * 60000;
      const diffSec = Math.max(0, Math.floor((end - now) / 1000));
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      setTimeLeft(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);

      if (diffSec <= 0) {
        fetchRoom();
        fetchLeaderboard(snapshot?.room?.id || roomId);
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [
    snapshot?.room?.endsAt,
    snapshot?.room?.durationMinutes,
    isContestActive,
    roomId,
    fetchRoom,
    fetchLeaderboard,
  ]);

  // STOMP WebSocket Connection
  useEffect(() => {
    if (!user) return;

    const handleIncomingRoomEvent = (event) => {
      if (!event) return;

      const isStarted =
        event.type === 'ROOM_STARTED' ||
        event.data?.status === 'IN_PROGRESS' ||
        event.status === 'IN_PROGRESS';

      if (isStarted) {
        fetchRoom().then((data) => {
          if (data) {
            const roomUuid = data.room.id || roomId;
            fetchContestProblems(roomUuid);
            fetchRoomSubmissions(roomUuid);
            fetchLeaderboard(roomUuid);
          }
        });
      } else if (event.type === 'ROOM_ENDED' || event.data?.status === 'ENDED') {
        fetchRoom().then((data) => {
          if (data) {
            fetchLeaderboard(data.room.id || roomId);
          }
        });
      } else if (event.type === 'ROOM_CLOSED') {
        alert('This room has been closed by the host.');
        router.push('/dashboard');
      } else if (event.type === 'PLAYER_DISQUALIFIED' && event.targetUserId === user?.id) {
        alert('You were removed because you had no team at contest start.');
        router.push('/dashboard');
      } else if (event.type === 'PLAYER_KICKED' && event.targetUserId === user?.id) {
        alert('You have been kicked from this room.');
        router.push('/dashboard');
      } else {
        fetchRoom();
      }
    };

    const client = createStompClient({
      onConnect: () => {
        subscribeToRoomUpdates(client, roomId, handleIncomingRoomEvent);
        if (snapshot?.room?.id && snapshot.room.id !== roomId) {
          subscribeToRoomUpdates(client, snapshot.room.id, handleIncomingRoomEvent);
        }

        const handleScoreUpdate = () => {
          fetchLeaderboard(snapshot?.room?.id || roomId);
          fetchRoomSubmissions(snapshot?.room?.id || roomId);
        };

        subscribeToLeaderboard(client, roomId, handleScoreUpdate);
        if (snapshot?.room?.id && snapshot.room.id !== roomId) {
          subscribeToLeaderboard(client, snapshot.room.id, handleScoreUpdate);
        }

        subscribeToUserNotifications(client, (notification) => {
          if (!notification) return;
          if (notification.type === 'KICKED' || notification.type === 'PLAYER_KICKED') {
            alert('You have been kicked from this room.');
            router.push('/dashboard');
          } else if (notification.type === 'PLAYER_DISQUALIFIED') {
            alert('You were removed because you had no team at contest start.');
            router.push('/dashboard');
          }
        });
      },
    });

    if (client) {
      client.activate();
      stompClientRef.current = client;
    }

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [user, roomId, snapshot?.room?.id, fetchRoom, fetchContestProblems, fetchRoomSubmissions, fetchLeaderboard, router]);

  // Handlers for room actions
  const handleStartContest = async () => {
    setActionLoading(true);
    setError('');
    try {
      await roomsApi.start(roomId);
      await fetchRoom();
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to start contest';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!confirm('Are you sure you want to leave this room?')) return;
    try {
      await roomsApi.leave(roomId);
      router.push('/dashboard');
    } catch (err) {
      alert(err.message || 'Failed to leave room');
    }
  };

  const handleCloseRoom = async () => {
    if (!confirm('Are you sure you want to close and delete this room? All members will be removed.')) return;
    try {
      await roomsApi.close(roomId);
      router.push('/dashboard');
    } catch (err) {
      alert(err.message || 'Failed to close room');
    }
  };

  const handleKickUser = async (userId) => {
    if (!confirm('Kick this player from the room?')) return;
    try {
      await roomsApi.kick(roomId, userId, 'Removed by room admin');
      fetchRoom();
    } catch (err) {
      alert(err.message || 'Failed to kick player');
    }
  };

  // Team actions
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setActionLoading(true);
    setTeamError('');
    try {
      await roomsApi.createTeam(roomId, { name: newTeamName.trim() });
      setNewTeamName('');
      setShowCreateTeamModal(false);
      fetchRoom();
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to create team';
      setTeamError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitModalJoin = async (e) => {
    e.preventDefault();
    if (!modalTeamCode.trim()) return;
    setActionLoading(true);
    setModalTeamError('');
    try {
      await roomsApi.joinTeam(roomId, { teamCode: modalTeamCode.trim().toUpperCase() });
      setModalTargetTeam(null);
      setModalTeamCode('');
      fetchRoom();
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to join team';
      setModalTeamError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (!confirm('Leave this team?')) return;
    try {
      await roomsApi.leaveTeam(roomId, teamId);
      fetchRoom();
    } catch (err) {
      alert(err.message || 'Failed to leave team');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Delete this team? All members will become unassigned.')) return;
    try {
      await roomsApi.deleteTeam(roomId, teamId);
      fetchRoom();
    } catch (err) {
      alert(err.message || 'Failed to delete team');
    }
  };

  const handleKickTeamMember = async (teamId, memberUserId) => {
    if (!confirm('Kick this member from the team?')) return;
    try {
      await roomsApi.kickTeamMember(roomId, teamId, memberUserId);
      fetchRoom();
    } catch (err) {
      alert(err.message || 'Failed to kick team member');
    }
  };

  // Run or Submit Code
  const handleRunOrSubmit = async (mode) => {
    if (!activeContestProblem || executing) return;
    setExecuting(true);
    setError('');

    try {
      const initial = await submissionsApi.submit({
        problemId: activeContestProblem.problemId,
        roomId: snapshot?.room?.id || roomId,
        language,
        sourceCode: buildFullCode(),
        mode,
      });
      setSubmissionResult(initial);

      // Poll until finished judging
      for (let i = 0; i < 30; i++) {
        await new Promise((res) => setTimeout(res, 1000));
        const res = await submissionsApi.get(initial.id);
        setSubmissionResult(res);
        if (res.status === 'DONE') {
          break;
        }
      }

      // Refresh submissions & leaderboard
      const targetUuid = snapshot?.room?.id || roomId;
      fetchRoomSubmissions(targetUuid);
      fetchLeaderboard(targetUuid);
    } catch (err) {
      setError(err.message || 'Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'room') {
      alert('Room code copied to clipboard!');
    } else {
      setCopiedTeamCode(text);
      setTimeout(() => setCopiedTeamCode(null), 2000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-3">
        <div className="text-[16px] font-semibold text-[var(--ink)]">Loading contest room...</div>
        <div className="text-[12px] opacity-60">Connecting to server session</div>
      </div>
    );
  }

  // Error state
  if (error && !snapshot) {
    const activeCodeMatch = error.match(/active room \(([A-Z0-9_-]+)\)/i);
    const activeCode = activeCodeMatch ? activeCodeMatch[1] : null;

    return (
      <div className="max-w-[600px] mx-auto my-12 p-6 border border-[var(--ink-border)] rounded-md space-y-4 text-center bg-[var(--paper)]">
        <h2 className="text-[20px] font-semibold text-[var(--ink)]">Unable to load room</h2>
        <p className="text-[14px] opacity-80">{error}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          {activeCode && (
            <Link href={`/rooms/${activeCode}`}>
              <Button variant="primary">Go to Active Room ({activeCode}) →</Button>
            </Link>
          )}
          <Link href="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const room = snapshot?.room || {};
  const members = snapshot?.members || [];
  const teams = snapshot?.teams || [];
  const isAdmin = room.adminId === user?.id;
  const isTeamMode = room.mode === 'TEAM';
  const myMember = members.find((m) => m.userId === user?.id);
  const myTeam = isTeamMode ? teams.find((t) => t.id === myMember?.teamId) : null;
  const isInTeam = Boolean(myMember?.teamId);

  // =========================================================================
  // VIEW A: ACTIVE CONTEST ARENA (FULL SCREEN LEETCODE-STYLE CODE EDITOR)
  // =========================================================================
  if (isContestActive) {
    return (
      <div className="h-full w-full overflow-hidden flex flex-col bg-[var(--paper)] text-[var(--ink)]">
        {/* TOP BAR (Fixed 48px height) */}
        <header className="h-12 border-b border-[var(--ink-border)] px-4 flex items-center justify-between shrink-0 bg-[var(--paper)] select-none">
          {/* Left: Back Link + Room Title + Badges */}
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="text-[13px] font-semibold opacity-70 hover:opacity-100 transition-hover"
              title="Dashboard"
            >
              ← ClashCode
            </Link>
            <span className="opacity-30">/</span>
            <span className="font-semibold text-[14px] truncate max-w-[200px]">
              {room.roomName || 'Contest'}
            </span>
            <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 border border-[var(--ink-border)] rounded">
              {activeContestProblem?.difficulty || room.mode}
            </span>
            <span className="text-[12px] opacity-60 hidden sm:inline">
              {members.length} {members.length === 1 ? 'Player' : 'Players'}
            </span>
          </div>

          {/* Center: Live Contest Countdown Timer */}
          <div className="flex items-center space-x-2 text-[14px] font-mono font-semibold">
            <span className="opacity-70">⏱</span>
            <span className="tracking-widest">{timeLeft}</span>
          </div>

          {/* Right: Team Info & Leave Room */}
          <div className="flex items-center space-x-4 text-[13px]">
            {isTeamMode && myTeam && (
              <div className="hidden md:flex items-center space-x-2">
                <span className="opacity-60">Squad:</span>
                <span className="font-semibold">{myTeam.name}</span>
              </div>
            )}
            <button
              onClick={handleLeaveRoom}
              className="text-[12px] underline opacity-60 hover:opacity-100 transition-hover cursor-pointer"
            >
              Leave
            </button>
          </div>
        </header>

        {/* MAIN SPLIT ARENA: Left (Question) + Drag Divider + Right (Editor & Testcases) */}
        <main
          ref={workspaceRef}
          className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative"
        >
          {/* LEFT PANE (Question, Leaderboard, Submissions) with Always-Visible Scrollbar */}
          <section
            style={{ width: `${leftWidth}%` }}
            className="w-full md:w-auto h-full min-h-0 flex flex-col bg-[var(--paper)] overflow-hidden shrink-0"
          >
            {/* Left Sub-Header Tabs */}
            <div className="h-10 border-b border-[var(--ink-border)] px-4 flex items-center justify-between shrink-0 bg-[var(--paper)]">
              <div className="flex items-center space-x-1 text-[13px]">
                <button
                  onClick={() => setActiveTab('problem')}
                  className={`px-3 py-1.5 transition-hover font-medium cursor-pointer ${
                    activeTab === 'problem'
                      ? 'font-semibold text-[var(--ink)] border-b-2 border-[var(--ink)]'
                      : 'text-[var(--ink)] opacity-60 hover:opacity-100'
                  }`}
                >
                  Question
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-3 py-1.5 transition-hover font-medium cursor-pointer ${
                    activeTab === 'leaderboard'
                      ? 'font-semibold text-[var(--ink)] border-b-2 border-[var(--ink)]'
                      : 'text-[var(--ink)] opacity-60 hover:opacity-100'
                  }`}
                >
                  Leaderboard
                </button>
                <button
                  onClick={() => setActiveTab('submissions')}
                  className={`px-3 py-1.5 transition-hover font-medium cursor-pointer ${
                    activeTab === 'submissions'
                      ? 'font-semibold text-[var(--ink)] border-b-2 border-[var(--ink)]'
                      : 'text-[var(--ink)] opacity-60 hover:opacity-100'
                  }`}
                >
                  Submissions
                </button>
              </div>

              {/* Problem Switcher if multiple problems exist */}
              {contestProblems.length > 1 && (
                <div className="flex items-center space-x-1.5 text-[12px]">
                  <button
                    disabled={activeContestProblemIndex === 0}
                    onClick={() => setActiveContestProblemIndex((prev) => Math.max(0, prev - 1))}
                    className="px-2 py-0.5 border border-[var(--ink-border)] rounded disabled:opacity-30 hover:bg-[var(--ink-hover)] cursor-pointer"
                  >
                    ‹
                  </button>
                  <span className="font-mono text-[11px] opacity-80">
                    {activeContestProblemIndex + 1}/{contestProblems.length}
                  </span>
                  <button
                    disabled={activeContestProblemIndex === contestProblems.length - 1}
                    onClick={() =>
                      setActiveContestProblemIndex((prev) =>
                        Math.min(contestProblems.length - 1, prev + 1)
                      )
                    }
                    className="px-2 py-0.5 border border-[var(--ink-border)] rounded disabled:opacity-30 hover:bg-[var(--ink-hover)] cursor-pointer"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* TAB CONTENT WITH INDEPENDENT VERTICAL SCROLLBAR */}
            <div className="flex-1 min-h-0 overflow-y-scroll question-scrollbar">
              {activeTab === 'problem' && (
                <ProblemStatement problem={activeContestProblem} />
              )}

              {activeTab === 'leaderboard' && (
                <div className="p-4 space-y-4">
                  <div className="text-[14px] font-semibold text-[var(--ink)]">
                    Contest Leaderboard
                  </div>
                  <Table>
                    <TableHead>
                      <TableHeaderCell>Rank</TableHeaderCell>
                      <TableHeaderCell>Participant / Squad</TableHeaderCell>
                      <TableHeaderCell align="right">Score</TableHeaderCell>
                      <TableHeaderCell align="right">Status</TableHeaderCell>
                    </TableHead>
                    <TableBody>
                      {leaderboardScores.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center opacity-60">
                            No scores recorded yet. Submit your solution to earn points!
                          </TableCell>
                        </TableRow>
                      ) : (
                        leaderboardScores.map((row, idx) => {
                          const isMe =
                            row.userId === user?.id || (isTeamMode && row.teamId === myTeam?.id);
                          return (
                            <TableRow key={row.userId || row.teamId || idx} selected={isMe}>
                              <TableCell className="font-semibold text-[13px]">
                                #{idx + 1}
                              </TableCell>
                              <TableCell className="font-medium text-[13px]">
                                {row.username || row.teamName || 'Participant'}
                                {isMe && ' (You)'}
                              </TableCell>
                              <TableCell align="right" className="font-semibold text-[13px]">
                                {row.score || 0} pts
                              </TableCell>
                              <TableCell align="right" className="text-[12px] opacity-80">
                                ACTIVE
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="p-4 space-y-4">
                  <div className="text-[14px] font-semibold text-[var(--ink)]">
                    Recent Submissions
                  </div>
                  <Table>
                    <TableHead>
                      <TableHeaderCell>Time</TableHeaderCell>
                      <TableHeaderCell>User</TableHeaderCell>
                      <TableHeaderCell>Verdict</TableHeaderCell>
                      <TableHeaderCell align="right">Score</TableHeaderCell>
                      <TableHeaderCell align="right">Runtime</TableHeaderCell>
                    </TableHead>
                    <TableBody>
                      {roomSubmissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-6 text-center opacity-60">
                            No submissions recorded yet for this contest.
                          </TableCell>
                        </TableRow>
                      ) : (
                        roomSubmissions.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="text-[12px] opacity-70">
                              {sub.createdAt
                                ? new Date(sub.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })
                                : '--:--'}
                            </TableCell>
                            <TableCell className="font-medium text-[13px]">
                              {sub.username || user?.username}
                            </TableCell>
                            <TableCell className="text-[12px] font-semibold">
                              {sub.verdict === 'ACCEPTED' ? 'Passed' : sub.verdict || sub.status}
                            </TableCell>
                            <TableCell align="right" className="font-semibold text-[13px]">
                              {sub.score}
                            </TableCell>
                            <TableCell align="right" className="text-[12px] opacity-70 font-mono">
                              {sub.runtimeMs != null ? `${sub.runtimeMs} ms` : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </section>

          {/* HORIZONTAL DRAG DIVIDER (Resize left/right width) */}
          <div
            onMouseDown={startHorizontalDrag}
            className="hidden md:flex w-1.5 h-full bg-[var(--paper)] border-x border-[var(--ink-border)] hover:bg-[var(--ink-hover)] active:bg-[var(--ink-selected)] cursor-col-resize items-center justify-center shrink-0 group select-none transition-colors"
            title="Drag to resize horizontally"
          >
            <div className="w-0.5 h-8 bg-[var(--ink-border)] group-hover:bg-[var(--ink)] rounded" />
          </div>

          {/* RIGHT PANE (Code Editor + Drag Divider + Testcase Console) */}
          <section
            style={{ width: `calc(${100 - leftWidth}% - 6px)` }}
            className="w-full md:w-auto flex-1 h-full min-h-0 flex flex-col bg-[var(--paper)] overflow-hidden"
          >
            {/* Editor Sub-Header: Teammates / Mode indicator + Language Selector */}
            <div className="h-10 border-b border-[var(--ink-border)] px-4 flex items-center justify-between shrink-0 bg-[var(--paper)]">
              {/* Teammates tabs (team mode) or status (solo mode) */}
              <div className="flex items-center space-x-2 text-[12px] overflow-x-auto">
                {isTeamMode && myTeam?.members ? (
                  myTeam.members.map((m) => (
                    <span
                      key={m.userId}
                      className={`px-2 py-0.5 rounded border ${
                        m.userId === user?.id
                          ? 'border-[var(--ink)] font-semibold bg-[var(--ink-hover)]'
                          : 'border-[var(--ink-border)] opacity-70'
                      }`}
                    >
                      {m.username} {m.userId === user?.id ? '(You)' : ''}
                    </span>
                  ))
                ) : (
                  <span className="opacity-70 text-[12px]">Solo Contest Workspace</span>
                )}
              </div>

              {/* Language Selector */}
              <div className="flex items-center space-x-2">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={executing}
                  className="px-2.5 py-1 text-[12px] font-medium border border-[var(--ink-border)] rounded bg-[var(--paper)] text-[var(--ink)] focus:outline-none cursor-pointer"
                >
                  <option value="PYTHON">Python 3</option>
                  <option value="JAVA">Java 21</option>
                  <option value="CPP">C++ 20</option>
                  <option value="JAVASCRIPT">Node.js</option>
                </select>
              </div>
            </div>

            {/* Code Editor with Line Numbers and Synchronized Scroll */}
            <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
              <CodeEditor
                value={userCode}
                onChange={setUserCode}
                onRun={() => handleRunOrSubmit('RUN')}
                disabled={executing}
              />
              {codeCache[language]?.hiddenWrapper && (
                <div className="px-4 py-1.5 text-[11px] opacity-50 bg-[var(--paper)] border-t border-[var(--ink-border)] shrink-0 font-mono">
                  Standard I/O boilerplate hidden — solution evaluates automatically.
                </div>
              )}
            </div>

            {/* VERTICAL DRAG DIVIDER (Resize top/bottom height) */}
            <div
              onMouseDown={startVerticalDrag}
              className="h-1.5 w-full bg-[var(--paper)] border-y border-[var(--ink-border)] hover:bg-[var(--ink-hover)] active:bg-[var(--ink-selected)] cursor-row-resize flex items-center justify-center shrink-0 group select-none transition-colors"
              title="Drag to resize vertically"
            >
              <div className="h-0.5 w-8 bg-[var(--ink-border)] group-hover:bg-[var(--ink)] rounded" />
            </div>

            {/* LeetCode-style Testcase & Results Drawer with Scrollbar & Dynamic Height */}
            <TestCaseConsole
              sampleCases={activeContestProblem?.sampleTestCases || []}
              submissionResult={submissionResult}
              executing={executing}
              onRun={() => handleRunOrSubmit('RUN')}
              onSubmit={() => handleRunOrSubmit('SUBMIT')}
              disabled={executing || !activeContestProblem}
              height={bottomHeight}
            />
          </section>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: CONTEST FINISHED (FINAL RESULTS SCOREBOARD)
  // =========================================================================
  if (isContestEnded) {
    return (
      <div className="h-full w-full overflow-y-auto">
        <div className="max-w-[1000px] mx-auto py-8 px-4 space-y-6">
        <div className="border border-[var(--ink-border)] rounded-md p-6 bg-[var(--paper)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--ink-border)] pb-4">
            <div>
              <h1 className="text-[28px] font-semibold text-[var(--ink)]">Contest Finished</h1>
              <p className="text-[14px] opacity-70 mt-1">
                The contest duration has ended. Review the finalized results below.
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>

          <Table>
            <TableHead>
              <TableHeaderCell>Rank</TableHeaderCell>
              <TableHeaderCell>Participant / Squad</TableHeaderCell>
              <TableHeaderCell align="right">Problems Solved</TableHeaderCell>
              <TableHeaderCell align="right">Final Score</TableHeaderCell>
              <TableHeaderCell align="right">Status</TableHeaderCell>
            </TableHead>
            <TableBody>
              {leaderboardScores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center opacity-60">
                    No final scores recorded for this contest.
                  </TableCell>
                </TableRow>
              ) : (
                leaderboardScores.map((row, idx) => (
                  <TableRow key={row.userId || row.teamId || idx}>
                    <TableCell className="font-semibold text-[14px]">
                      #{idx + 1}
                    </TableCell>
                    <TableCell className="font-semibold text-[14px]">
                      {row.username || row.teamName || 'Participant'}
                      {row.userId === user?.id && ' (You)'}
                    </TableCell>
                    <TableCell align="right" className="text-[14px]">
                      {row.solvedCount || 0}
                    </TableCell>
                    <TableCell align="right" className="font-semibold text-[14px]">
                      {row.score || 0} pts
                    </TableCell>
                    <TableCell align="right" className="text-[12px] opacity-80">
                      FINISHED
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW C: ROOM LOBBY (WAITING STATUS)
  // =========================================================================
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-[1000px] mx-auto py-8 px-4 space-y-6">
      {/* Lobby Header Card */}
      <div className="border border-[var(--ink-border)] rounded-md p-6 bg-[var(--paper)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--ink-border)] pb-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-[28px] font-semibold text-[var(--ink)]">
                {room.roomName || 'Contest Room'}
              </h1>
              <span className="text-[12px] font-semibold uppercase tracking-wider px-2 py-0.5 border border-[var(--ink-border)] rounded">
                {room.mode}
              </span>
            </div>
            <p className="text-[14px] opacity-70 mt-1">
              Admin: <span className="font-medium text-[var(--ink)]">{room.adminUsername}</span> •{' '}
              {members.length} {isTeamMode ? `/ ${room.maxTeams * 4}` : `/ ${room.maxPlayers}`} Players
            </p>
          </div>

          {/* Room Code Card with Copy Button */}
          {room.roomCode && (
            <div className="flex items-center space-x-2 border border-[var(--ink-border)] rounded px-3 py-1.5 bg-[var(--paper)]">
              <span className="text-[12px] opacity-60 uppercase font-semibold">Room Code:</span>
              <span className="font-mono text-[14px] font-semibold tracking-wider">
                {room.roomCode}
              </span>
              <button
                onClick={() => copyToClipboard(room.roomCode, 'room')}
                className="text-[12px] underline opacity-80 hover:opacity-100 ml-1 cursor-pointer"
              >
                Copy
              </button>
            </div>
          )}
        </div>

        {/* Status Hint */}
        <div className="text-[13px] opacity-75">
          Waiting for the admin to start. Join or create a team now. Players without a team are
          removed when the contest starts.
        </div>

        {error && (
          <div className="p-3 border border-[var(--ink-border)] bg-[var(--ink-hover)] rounded text-[13px]">
            {error}
          </div>
        )}

        {/* Lobby Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-3">
            {isAdmin ? (
              <>
                <Button
                  variant="primary"
                  onClick={handleStartContest}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Starting...' : 'Start Contest'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCloseRoom}
                  disabled={actionLoading}
                >
                  Close Room
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={handleLeaveRoom}>
                Leave Room
              </Button>
            )}
          </div>

          {isAdmin && (
            <Button
              variant="secondary"
              onClick={() => setShowProblemSelector(true)}
            >
              Configure Problems
            </Button>
          )}
        </div>
      </div>

      {/* TEAM MODE: Teams Table & Inline Expanded Details */}
      {isTeamMode ? (
        <div className="border border-[var(--ink-border)] rounded-md p-6 bg-[var(--paper)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold text-[var(--ink)]">Squads</h2>
            {!isInTeam && (
              <Button
                variant="primary"
                onClick={() => {
                  setNewTeamName('');
                  setTeamError('');
                  setShowCreateTeamModal(true);
                }}
              >
                Create Squad
              </Button>
            )}
          </div>

          <Table>
            <TableHead>
              <TableHeaderCell>Squad Name</TableHeaderCell>
              <TableHeaderCell>Leader</TableHeaderCell>
              <TableHeaderCell>Members</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell align="right">Action</TableHeaderCell>
            </TableHead>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center opacity-60">
                    No squads created yet. Click &quot;Create Squad&quot; to form one.
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((t) => {
                  const isMember = t.members?.some((m) => m.userId === user?.id);
                  const isLeader = t.leaderId === user?.id;
                  const isFull = (t.members?.length || 0) >= 4;
                  const isSelected = selectedTeamRowId === t.id;

                  return (
                    <React.Fragment key={t.id}>
                      <TableRow
                        onClick={() => setSelectedTeamRowId(isSelected ? null : t.id)}
                        selected={isSelected}
                      >
                        <TableCell className="font-semibold text-[14px]">
                          {t.name}
                        </TableCell>
                        <TableCell className="text-[13px]">{t.leaderUsername || 'Leader'}</TableCell>
                        <TableCell className="text-[13px]">{t.members?.length || 0}/4</TableCell>
                        <TableCell className="text-[12px] font-semibold">
                          {isFull ? 'Full' : 'Open'}
                        </TableCell>
                        <TableCell align="right">
                          {isMember ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeaveTeam(t.id);
                              }}
                              className="text-[13px] underline opacity-80 hover:opacity-100 cursor-pointer"
                            >
                              Leave
                            </button>
                          ) : !isInTeam && !isFull ? (
                            <Button
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalTargetTeam(t);
                                setModalTeamCode('');
                                setModalTeamError('');
                              }}
                            >
                              Join
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>

                      {/* Expandable details panel below table row */}
                      {isSelected && (
                        <tr className="bg-[var(--ink-hover)] border-b border-[var(--ink-border)]">
                          <td colSpan={5} className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-[13px] font-semibold text-[var(--ink)]">
                                Squad Details: {t.name}
                              </div>
                              {t.teamCode && (
                                <div className="flex items-center space-x-2 text-[12px]">
                                  <span className="opacity-60">Squad Code:</span>
                                  <span className="font-mono font-semibold">{t.teamCode}</span>
                                  <button
                                    onClick={() => copyToClipboard(t.teamCode, 'team')}
                                    className="underline ml-1 cursor-pointer"
                                  >
                                    {copiedTeamCode === t.teamCode ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="space-y-1.5 text-[13px]">
                              {t.members?.map((m) => (
                                <div
                                  key={m.userId}
                                  className="flex items-center justify-between py-1 border-b border-[var(--ink-border)]"
                                >
                                  <div>
                                    <span className="font-medium">{m.username}</span>
                                    {m.userId === t.leaderId && (
                                      <span className="ml-2 text-[11px] font-semibold opacity-70">
                                        (Leader)
                                      </span>
                                    )}
                                  </div>
                                  {(isAdmin || isLeader) && m.userId !== t.leaderId && (
                                    <button
                                      onClick={() => handleKickTeamMember(t.id, m.userId)}
                                      className="text-[12px] underline opacity-70 hover:opacity-100 cursor-pointer"
                                    >
                                      Kick
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>

                            {(isAdmin || isLeader) && (
                              <div className="pt-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => handleDeleteTeam(t.id)}
                                >
                                  Delete Squad
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Teamless players list */}
          <div className="pt-4 border-t border-[var(--ink-border)]">
            <h3 className="text-[14px] font-semibold text-[var(--ink)] mb-2">
              Unassigned Players
            </h3>
            {members.filter((m) => !m.teamId).length === 0 ? (
              <p className="text-[13px] opacity-60">All players are assigned to squads.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members
                  .filter((m) => !m.teamId)
                  .map((m) => (
                    <span
                      key={m.userId}
                      className="px-2.5 py-1 border border-[var(--ink-border)] rounded text-[13px]"
                    >
                      {m.username} {m.userId === user?.id && '(You)'}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SOLO MODE: Participants Table */
        <div className="border border-[var(--ink-border)] rounded-md p-6 bg-[var(--paper)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold text-[var(--ink)]">
              Contest Participants ({members.length}/{room.maxPlayers})
            </h2>
            <span className="text-[12px] opacity-60">Requires 2+ players to start</span>
          </div>

          <Table>
            <TableHead>
              <TableHeaderCell>#</TableHeaderCell>
              <TableHeaderCell>Username</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              {isAdmin && <TableHeaderCell align="right">Action</TableHeaderCell>}
            </TableHead>
            <TableBody>
              {members.map((m, idx) => (
                <TableRow key={m.userId}>
                  <TableCell className="opacity-60">{idx + 1}</TableCell>
                  <TableCell className="font-semibold text-[14px]">
                    {m.username} {m.userId === user?.id && '(You)'}
                  </TableCell>
                  <TableCell className="text-[12px] font-semibold">{m.role}</TableCell>
                  <TableCell className="text-[12px] opacity-80">{m.status}</TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      {m.userId !== user?.id && (
                        <button
                          onClick={() => handleKickUser(m.userId)}
                          className="text-[13px] underline opacity-70 hover:opacity-100 cursor-pointer"
                        >
                          Kick
                        </button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* MODAL: Create Team */}
      <Modal
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        title="Create New Squad"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          {teamError && (
            <div className="p-2.5 border border-[var(--ink-border)] bg-[var(--ink-hover)] rounded text-[13px]">
              {teamError}
            </div>
          )}
          <Input
            label="Squad Name (3-30 Characters)"
            required
            minLength={3}
            maxLength={30}
            placeholder="e.g. Code Warriors"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateTeamModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Squad'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Join Team with Code */}
      <Modal
        isOpen={Boolean(modalTargetTeam)}
        onClose={() => setModalTargetTeam(null)}
        title={`Join Squad: ${modalTargetTeam?.name || ''}`}
      >
        <form onSubmit={handleSubmitModalJoin} className="space-y-4">
          <p className="text-[13px] opacity-70">
            Enter the private 6-character squad code provided by the squad leader.
          </p>

          {modalTeamError && (
            <div className="p-2.5 border border-[var(--ink-border)] bg-[var(--ink-hover)] rounded text-[13px]">
              {modalTeamError}
            </div>
          )}

          <Input
            label="Squad Code (6 Characters)"
            required
            maxLength={6}
            placeholder="e.g. T4KD82"
            value={modalTeamCode}
            onChange={(e) => setModalTeamCode(e.target.value.toUpperCase())}
          />

          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalTargetTeam(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={actionLoading || modalTeamCode.trim().length < 4}
            >
              {actionLoading ? 'Joining...' : 'Confirm Join'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Admin Configure Problems */}
      <Modal
        isOpen={showProblemSelector}
        onClose={() => setShowProblemSelector(false)}
        title="Select Contest Problems"
      >
        <div className="space-y-4">
          <p className="text-[13px] opacity-70">
            Select the problems to include in this contest.
          </p>
          <div className="max-h-60 overflow-y-auto border border-[var(--ink-border)] rounded divide-y divide-[var(--ink-border)]">
            {availableProblems.map((p) => {
              const isSelected = selectedProblemIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className="flex items-center justify-between p-2.5 hover:bg-[var(--ink-hover)] cursor-pointer text-[13px]"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedProblemIds((prev) => prev.filter((id) => id !== p.id));
                        } else {
                          setSelectedProblemIds((prev) => [...prev, p.id]);
                        }
                      }}
                    />
                    <span className="font-medium">{p.title}</span>
                  </div>
                  <span className="text-[12px] opacity-70">{p.difficulty} • {p.points} pts</span>
                </label>
              );
            })}
          </div>
          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowProblemSelector(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={async () => {
                if (selectedProblemIds.length === 0) {
                  alert('Select at least 1 problem');
                  return;
                }
                setActionLoading(true);
                try {
                  await roomsApi.selectProblems(roomId, { problemIds: selectedProblemIds });
                  setShowProblemSelector(false);
                  alert('Problems saved successfully!');
                } catch (err) {
                  alert(err.message || 'Failed to select problems');
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading || selectedProblemIds.length === 0}
            >
              Save Problems
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </div>
  );
}

export default function RoomDetailsPage(props) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[14px] opacity-60">
          Loading contest room...
        </div>
      }
    >
      <RoomDetailsContent {...props} />
    </Suspense>
  );
}

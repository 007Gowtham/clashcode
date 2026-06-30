'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import api from '@/lib/axios';
import { setLeaderboard, setMyQuestions, setEndTime } from '@/store/slices/contestSlice';
import { setRoom, setMyTeam } from '@/store/slices/roomSlice';
import { clearCredentials, updateUser } from '@/store/slices/authSlice';
import { Users, Trophy, Clock } from 'lucide-react';
import {
 ResizableHandle,
 ResizablePanel,
 ResizablePanelGroup,
} from '@/components/ui/resizable';
import ProblemPanel from '@/components/room/code-editor/ProblemPanel';
import CodeEditorPanel from '@/components/room/code-editor/CodeEditorPanel';
import { useSubmissionSocket } from '@/lib/hooks/useSubmissionSocket';
import { useWebSocket } from '@/lib/hooks/useWebSocket';

function Timer({ endTime, onEnd }) {
 const [left, setLeft] = useState('');
 const firedRef = useRef(false);

 useEffect(() => {
 if (!endTime) return;
 firedRef.current = false;
 const tick = () => {
 const diff = new Date(endTime) - Date.now();
 if (diff <= 0) {
 setLeft('00:00');
 if (!firedRef.current) {
 firedRef.current = true;
 if (onEnd) onEnd();
 }
 return;
 }
 const m = String(Math.floor(diff / 60000)).padStart(2, '0');
 const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
 setLeft(`${m}:${s}`);
 };
 tick();
 const id = setInterval(tick, 1000);
 return () => clearInterval(id);
 }, [endTime]);

<<<<<<< HEAD
 const urgent = left && left < '05:00';
 return (
 <span className={`font-mono font-semibold ${urgent ? 'text-red-500' : 'text-slate-700'}`}>
 {left || '--:--'}
 </span>
 );
=======
  const urgent = left && left < '05:00';
  return (
    <span className={`font-mono font-semibold ${urgent ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
      {left || '--:--'}
    </span>
  );
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
}

function TeammateAvatar({ userId, username, size = 'h-5.5 w-5.5' }) {
  const [viewUrl, setViewUrl] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const fetchPic = async () => {
      try {
        const { data } = await api.get(`/api/users/${userId}/profile-picture`);
        if (data?.data?.viewUrl) {
          setViewUrl(data.data.viewUrl);
        }
      } catch {
        // Silently swallow; initial fallbacks are rendered instead
      }
    };
    fetchPic();
  }, [userId]);

  const initials = username?.charAt(0)?.toUpperCase() ?? '?';

  return viewUrl ? (
    <img
      src={viewUrl}
      alt={username}
      className={`${size} rounded-full object-cover ring-2 ring-white dark:ring-[#1e1e1e] shrink-0`}
      title={username}
    />
  ) : (
    <div
      className={`inline-block ${size} rounded-full ring-2 ring-white dark:ring-[#1e1e1e] bg-slate-900 dark:bg-[#262626] flex items-center justify-center text-white dark:text-[#eff1f6] text-[8px] font-bold select-none shrink-0`}
      title={username}
    >
      {initials}
    </div>
  );
}

export default function BattlePage() {
 const { id } = useParams();
 const router = useRouter();
 const dispatch = useDispatch();
 const user = useSelector(s => s.auth.user);
 const { room, myTeam } = useSelector(s => s.room);
 const { myQuestions, leaderboard, endTime } = useSelector(s => s.contest);

<<<<<<< HEAD
 const [mounted, setMounted] = useState(false);
 const [loading, setLoading] = useState(true);
 const [activeQ, setActiveQ] = useState(0);
 const [problemTab, setProblemTab] = useState('problem');
 const [code, setCode] = useState('');
 const [codes, setCodes] = useState({});
 const [lang, setLang] = useState('python');
 const [stdin, setStdin] = useState('');
 const [output, setOutput] = useState('');
 const [verdict, setVerdict] = useState('');
 const [running, setRunning] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [lastAction, setLastAction] = useState('RUN');
 const [accepted, setAccepted] = useState({});
 const [testResults, setTestResults] = useState([]);
 const [submissions, setSubmissions] = useState([]);
 const [submissionsLoading, setSubmissionsLoading] = useState(false);
 const [pendingSubmissionId, setPendingSubmissionId] = useState(null);
 const socketRef = useRef(null);

 // ── Real-time submission verdict via STOMP WebSocket ─────────────────
 const { verdict: wsVerdict, isJudging } = useSubmissionSocket(pendingSubmissionId);
=======
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeQ, setActiveQ] = useState(0);
  const [problemTab, setProblemTab] = useState('problem');
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState({});
  const [lang, setLang] = useState('python');
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [verdict, setVerdict] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastAction, setLastAction] = useState('RUN');
  const [accepted, setAccepted] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [pendingSubmissionId, setPendingSubmissionId] = useState(null);
  const socketRef = useRef(null);

  // ── Real-time submission verdict via STOMP WebSocket ─────────────────
  const { verdict: wsVerdict, isJudging } = useSubmissionSocket(pendingSubmissionId);

  // ── Real-time leaderboard via STOMP WebSocket ─────────────────────────
  // Subscribed for the lifetime of the page — updates arrive automatically
  // whenever a teammate's score changes (no more fetchLeaderboard() polling).
  useWebSocket(
    id ? `/topic/room/${id}/leaderboard` : null,
    (data) => dispatch(setLeaderboard(Array.isArray(data) ? data : []))
  );

  // Apply the STOMP verdict when it arrives
  useEffect(() => {
    if (!wsVerdict || !pendingSubmissionId) return;
    // Safety guard: only apply if the verdict is for THIS submission.
    const verdictId = wsVerdict.submissionId?.toString();
    if (verdictId && verdictId !== pendingSubmissionId.toString()) return;

    const statusStr = wsVerdict.status || 'UNKNOWN';
    setVerdict(statusStr);
    setSubmitting(false);
    setPendingSubmissionId(null); // unsubscribe after receiving verdict
    if (statusStr === 'ACCEPTED') {
      const problemId = myQuestions[activeQ]?.id || myQuestions[activeQ]?._id;
      if (problemId) setAccepted(p => ({ ...p, [problemId]: true }));
    }
    // Refresh submissions list — leaderboard now updates via WebSocket push
    fetchSubmissions();
  }, [wsVerdict, pendingSubmissionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = myQuestions[activeQ];
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7

 // ── Real-time leaderboard via STOMP WebSocket ─────────────────────────
 // Subscribed for the lifetime of the page — updates arrive automatically
 // whenever a teammate's score changes (no more fetchLeaderboard() polling).
 useWebSocket(
  id ? `/topic/room/${id}/leaderboard` : null,
  (data) => dispatch(setLeaderboard(Array.isArray(data) ? data : []))
 );

 // Apply the STOMP verdict when it arrives
 useEffect(() => {
  if (!wsVerdict || !pendingSubmissionId) return;
  // Safety guard: only apply if the verdict is for THIS submission.
  const verdictId = wsVerdict.submissionId?.toString();
  if (verdictId && verdictId !== pendingSubmissionId.toString()) return;

  const statusStr = wsVerdict.status || 'UNKNOWN';
  setVerdict(statusStr);
  setSubmitting(false);
  setPendingSubmissionId(null); // unsubscribe after receiving verdict
  if (statusStr === 'ACCEPTED') {
   const problemId = myQuestions[activeQ]?.id || myQuestions[activeQ]?._id;
   if (problemId) setAccepted(p => ({ ...p, [problemId]: true }));
  }
  // Refresh submissions list — leaderboard now updates via WebSocket push
  fetchSubmissions();
 }, [wsVerdict, pendingSubmissionId]); // eslint-disable-line react-hooks/exhaustive-deps

 const q = myQuestions[activeQ];

<<<<<<< HEAD
 // ── Mount guard (fixes hydration) ─────────────────────
 useEffect(() => {
 setMounted(true);
 }, []);
=======
  // ── Socket + init ─────────────────────────────────────
  useEffect(() => {
    if (!id || id === 'undefined') { router.push('/rooms'); return; }
    const socketUrl = 'http://13.201.230.50:5000';
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.emit('room:join', { roomId: id });
    const userIdVal = user?._id || user?.id;
    socket.emit('user:join', { userId: userIdVal });
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7

 // ── Derived ───────────────────────────────────────────
 const userIdStr = mounted ? (user?._id || user?.id)?.toString() : '';
 const isAdmin = mounted ? room?.adminId?.toString() === userIdStr : false;

 // ── Code sync ─────────────────────────────────────────
 useEffect(() => {
 if (!q) return;
 const savedCode = codes[q._id]?.[lang];
 setCode(savedCode !== undefined ? savedCode : (q.starterCode?.[lang] || ''));
 }, [activeQ, lang, q]);

<<<<<<< HEAD
 const handleCodeChange = (val) => {
 setCode(val);
 if (q) {
 setCodes(prev => ({
 ...prev,
 [q._id]: { ...(prev[q._id] || {}), [lang]: val }
 }));
 }
 };

 // ── Socket + init ─────────────────────────────────────
 useEffect(() => {
 if (!id || id === 'undefined') { router.push('/rooms'); return; }
 const socketUrl = window.location.protocol + '//' + window.location.hostname + ':5000';
 const socket = io(socketUrl);
 socketRef.current = socket;
 socket.emit('room:join', { roomId: id });
 socket.emit('user:join', { userId: user?._id || user?.id });

 socket.on('leaderboard:update', lb => dispatch(setLeaderboard(lb)));
 socket.on('room:ended', ({ leaderboard: lb }) => {
 dispatch(setLeaderboard(lb));
 router.push(`/room/${id}/results`);
 });
 socket.on('room:kicked', () => router.push('/rooms'));
 socket.on('contest:questions', qs => dispatch(setMyQuestions(qs)));
 socket.on('room:started', ({ endTime }) => dispatch(setEndTime(endTime)));

 fetchLeaderboard();
 fetchInitialData();
 fetchSubmissions();

 return () => socket.disconnect();
 }, [id, user]);

 const fetchInitialData = async () => {
 setLoading(true);
 try {
 const { data: qRes } = await api.get(`/rooms/${id}/questions`);
 const qData = qRes?.data;
 const questions = qData?.questions || [];
 dispatch(setMyQuestions(questions));
 if (qData?.endTime) dispatch(setEndTime(qData.endTime));
=======
    return () => socket.disconnect();
  }, [id, user?._id, user?.id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Sync fresh user profile picture state
      api.get('/auth/me')
        .then(res => {
          const profile = res.data?.data;
          if (profile) dispatch(updateUser(profile));
        })
        .catch(() => {});

      const { data: qRes } = await api.get(`/rooms/${id}/questions`);
      const qData = qRes?.data;
      const questions = qData?.questions || [];
      dispatch(setMyQuestions(questions));
      if (qData?.endTime) dispatch(setEndTime(qData.endTime));

      const { data: rRes } = await api.get(`/rooms/${id}`);
      const rData = rRes?.data;
      if (rData) dispatch(setRoom(rData));
    } catch (err) {
      console.error('Failed to restore contest session:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.get(`/rooms/${id}/leaderboard`);
      dispatch(setLeaderboard(data?.data || []));
    } catch { }
  };

  const fetchSubmissions = async () => {
    try {
      setSubmissionsLoading(true);
      const { data } = await api.get(`/submissions/room/${id}`);
      // Filter out PENDING — only show finalized submissions.
      // PENDING state is already shown by the "Evaluating..." spinner.
      // Without this filter, submitting causes a flash of PENDING in the tab
      // which is then replaced by the final verdict after the worker finishes.
      const finalized = (data?.data || [])
        .filter(s => s.status !== 'PENDING')
        .reverse();
      setSubmissions(finalized);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7

 const { data: rRes } = await api.get(`/rooms/${id}`);
 const rData = rRes?.data;
 if (rData) dispatch(setRoom(rData));
 } catch (err) {
 console.error('Failed to restore contest session:', err);
 } finally {
 setLoading(false);
 }
 };

<<<<<<< HEAD
 const fetchLeaderboard = async () => {
 try {
 const { data } = await api.get(`/rooms/${id}/leaderboard`);
 dispatch(setLeaderboard(data?.data || []));
 } catch { }
 };

 const fetchSubmissions = async () => {
 try {
 setSubmissionsLoading(true);
  const { data } = await api.get(`/submissions/room/${id}`);
  // Filter out PENDING — only show finalized submissions.
  // PENDING state is already shown by the "Evaluating..." spinner.
  // Without this filter, submitting causes a flash of PENDING in the tab
  // which is then replaced by the final verdict after the worker finishes.
  const finalized = (data?.data || [])
   .filter(s => s.status !== 'PENDING')
   .reverse();
  setSubmissions(finalized);
 } catch (err) {
 console.error('Failed to fetch submissions:', err);
 } finally {
 setSubmissionsLoading(false);
 }
 };
=======
  // ── Run / Submit ──────────────────────────────────────
  const run = async (codeOverride, stdinOverride) => {
    if (!q) return;
    const codeToRun = codeOverride ?? code;
    setRunning(true); setOutput(''); setVerdict(''); setTestResults([]); setLastAction('RUN');
    try {
      // Run against first sample test case via /submissions/run
      const problemId = q.id || q._id;
      const { data: res } = await api.post('/submissions/run', {
        problemId,
        language: lang,
        code: codeToRun,
      });
      const runData = res?.data;
      if (runData?.testResults && runData.testResults.length > 0) {
        const trResults = runData.testResults.map(r => ({
          pass: r.passed,
          input: r.input,
          actualOutput: r.got,
          expectedOutput: r.expected,
          error: r.error
        }));
        setTestResults(trResults);
        setVerdict(runData.status);
        setOutput(null);
      } else {
        setOutput(runData?.output || runData?.error || '(no output)');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Run failed';
      setOutput(`Error: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  const submit = async (codeOverride) => {
    if (!myQuestions[activeQ]) return;
    const codeToSubmit = codeOverride ?? code;
    const problemId = myQuestions[activeQ].id || myQuestions[activeQ]._id;
    setSubmitting(true); setVerdict(''); setTestResults([]); setOutput(''); setLastAction('SUBMIT');
    setPendingSubmissionId(null); // reset any previous subscription
    try {
      const { data: res } = await api.post('/submissions/submit', {
        problemId,
        roomId: id,
        language: lang,
        code: codeToSubmit,
      });
      const subData = res?.data;
      const submissionId = subData?.id || subData?._id;
      if (submissionId) {
        // Subscribe to real-time verdict via STOMP WebSocket
        setPendingSubmissionId(submissionId);
        // isJudging = true until the WebSocket verdict arrives
      } else {
        // Fallback: backend returned full verdict immediately (e.g. /run)
        const statusVerdict = subData?.status || 'UNKNOWN';
        setVerdict(statusVerdict);
        setSubmitting(false);
        fetchLeaderboard();
        fetchSubmissions();
      }
    } catch (err) {
      setVerdict('ERROR');
      setOutput(err.response?.data?.message || 'Submit failed');
      setSubmitting(false);
      fetchSubmissions();
    }
  };
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7

 // ── Timer end ─────────────────────────────────────────
 const handleTimerEnd = async () => {
 try {
 if (isAdmin) {
 await api.post(`/rooms/${id}/end`);
 dispatch(setLeaderboard([]));
 }
 } catch { }
 finally {
 router.push(`/room/${id}/results`);
 }
 };

<<<<<<< HEAD
 // ── Run / Submit ──────────────────────────────────────
 const run = async (codeOverride, stdinOverride) => {
 if (!q) return;
 const codeToRun = codeOverride ?? code;
 setRunning(true); setOutput(''); setVerdict(''); setTestResults([]); setLastAction('RUN');
 try {
 // Run against first sample test case via /submissions/run
 const problemId = q.id || q._id;
 const { data: res } = await api.post('/submissions/run', {
 problemId,
 language: lang,
 code: codeToRun,
 });
  const runData = res?.data;
  if (runData?.testResults && runData.testResults.length > 0) {
    const trResults = runData.testResults.map(r => ({
      pass: r.passed,
      input: r.input,
      actualOutput: r.got,
      expectedOutput: r.expected,
      error: r.error
    }));
    setTestResults(trResults);
    setVerdict(runData.status);
    setOutput(null);
  } else {
    setOutput(runData?.output || runData?.error || '(no output)');
  }
 } catch (err) {
 const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Run failed';
 setOutput(`Error: ${msg}`);
 } finally {
 setRunning(false);
 }
 };
=======
  if (loading || !q) {
    return (
      <div className="h-screen w-full bg-[#f5f7f9] dark:bg-[#111111] text-slate-900 dark:text-white flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-white rounded-full animate-spin"></div>
          <span className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Initializing Battle Arena...</span>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────
  return (
    <div className="h-screen w-full bg-[#f5f7f9] dark:bg-[#111111] text-slate-900 dark:text-[#eff1f6] overflow-hidden flex flex-col antialiased transition-colors duration-300" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7

 const submit = async (codeOverride) => {
 if (!myQuestions[activeQ]) return;
 const codeToSubmit = codeOverride ?? code;
 const problemId = myQuestions[activeQ].id || myQuestions[activeQ]._id;
 setSubmitting(true); setVerdict(''); setTestResults([]); setLastAction('SUBMIT');
 setPendingSubmissionId(null); // reset any previous subscription
 try {
  const { data: res } = await api.post('/submissions/submit', {
   problemId,
   roomId: id,
   language: lang,
   code: codeToSubmit,
  });
  const subData = res?.data;
  const submissionId = subData?.id || subData?._id;
  if (submissionId) {
   // Subscribe to real-time verdict via STOMP WebSocket
   setPendingSubmissionId(submissionId);
   // isJudging = true until the WebSocket verdict arrives
  } else {
   // Fallback: backend returned full verdict immediately (e.g. /run)
   const statusVerdict = subData?.status || 'UNKNOWN';
   setVerdict(statusVerdict);
   setSubmitting(false);
   fetchLeaderboard();
   fetchSubmissions();
  }
 } catch (err) {
  setVerdict('ERROR');
  setOutput(err.response?.data?.message || 'Submit failed');
  setSubmitting(false);
  fetchSubmissions();
 }
 };

<<<<<<< HEAD
 // ── Hydration guard ───────────────────────────────────
 if (!mounted) return null;

 if (loading || !q) {
 return (
 <div className="h-screen w-full bg-slate-50 flex items-center justify-center ">
 <div className="flex flex-col items-center gap-4">
 <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
 <span className="text-slate-500 font-medium animate-pulse">Initializing Battle Arena...</span>
 </div>
 </div>
 );
 }
=======
        {/* Left: Logo + Room Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 dark:bg-[#262626] border border-transparent dark:border-[#333333] rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md dark:shadow-none shrink-0 select-none">Λ</div>
          <div className="flex flex-col gap-0">
            <span className="text-sm font-medium text-slate-900 dark:text-white leading-none tracking-tight">
              {room?.name || 'Battle Arena'}
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-[#8c8c8c] leading-none mt-0.5">
              {room?.code || ''}
            </span>
          </div>
        </div>

        {/* Center: Team & Score */}
        <div className="flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
          {myTeam && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur-sm border border-slate-200 dark:border-[#2d2d2d] rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{myTeam.name}</span>
                {/* Overlapping teammate avatars */}
                {myTeam.members && myTeam.members.length > 0 && (
                  <div className="flex -space-x-1.5 ml-1.5 overflow-hidden">
                    {myTeam.members.map((member, idx) => {
                      const name = member.username || 'U';
                      return (
                        <TeammateAvatar
                          key={member.id || idx}
                          userId={member.userId}
                          username={name}
                          size="h-5 w-5"
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="w-px h-3.5 bg-slate-200 dark:bg-[#2d2d2d]" />
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                <Trophy className="w-3.5 h-3.5 text-[#ffa116]" />
                {leaderboard?.find(t => t.teamName === myTeam?.name)?.score ?? myTeam?.score ?? 0}
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-0.5">pts</span>
              </div>
            </div>
          )}
        </div>
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7

 // ── Render ────────────────────────────────────────────
 return (
 <div className="h-screen w-full bg-slate-50 text-slate-900 overflow-hidden flex flex-col antialiased">

<<<<<<< HEAD
 <header className="h-[52px] bg-transparent px-4 flex items-center justify-between shrink-0 z-20 select-none">

 {/* Left: Logo + Room Name */}
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-slate-900/10 shrink-0">Λ</div>
 <div className="flex flex-col gap-0">
 <span className="text-sm font-medium text-slate-900 leading-none tracking-tight">
 {room?.name || 'Battle Arena'}
 </span>
 <span className="text-[10px] font-medium text-slate-400 leading-none   mt-0.5">
 {room?.code || ''}
 </span>
 </div>
 </div>

 {/* Center: Team & Score */}
 <div className="flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
 {myTeam && (
 <div className="flex items-center gap-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm">
 <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
 <Users className="w-3.5 h-3.5 text-blue-500" />
 {myTeam.name}
 </div>
 <div className="w-px h-3.5 bg-slate-200" />
 <div className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
 <Trophy className="w-3.5 h-3.5" />
 {leaderboard?.find(t => t.teamName === myTeam?.name)?.score ?? myTeam?.score ?? 0}
 <span className="text-slate-400 font-normal ml-0.5">pts</span>
 </div>
 </div>
 )}
 </div>

 {/* Right: Leaderboard + Timer + User */}
 <div className="flex items-center gap-2">
=======
          {/* Leaderboard button */}
          <button
            onClick={() => router.push(`/room/${id}/results`)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#262626] px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-[#2d2d2d]"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            Leaderboard
          </button>

          {/* Timer */}
          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-[#1e1e1e]/80 border border-slate-200 dark:border-[#2d2d2d] px-3 py-1.5 rounded-lg shadow-sm">
            <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-[#ffa116]" />
            <div className="text-[13px] font-medium text-slate-900 dark:text-white">
              <Timer endTime={endTime} onEnd={handleTimerEnd} />
            </div>
          </div>

          <div className="w-px h-5 bg-slate-200/80 dark:bg-[#2d2d2d] mx-1" />

          {/* User chip */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-white/80 dark:bg-[#1e1e1e]/80 border border-slate-200 dark:border-[#2d2d2d] rounded-full shadow-sm">
            <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-[#262626] border dark:border-[#333333] flex items-center justify-center text-white dark:text-[#eff1f6] text-[9px] font-semibold shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.username || 'User'}</span>
          </div>
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7

 {/* Leaderboard button */}
 <button
 onClick={() => router.push(`/room/${id}/results`)}
 className="flex items-center gap-1.5 text-[11px] font-medium   text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200"
 >
 <Trophy className="w-3.5 h-3.5 text-yellow-500" />
 Leaderboard
 </button>

 {/* Timer */}
 <div className="flex items-center gap-1.5 bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
 <Clock className="w-3.5 h-3.5 text-blue-500" />
 <div className="text-[13px] font-medium">
 <Timer endTime={endTime} onEnd={handleTimerEnd} />
 </div>
 </div>

<<<<<<< HEAD
 <div className="w-px h-5 bg-slate-200/80 mx-1" />

 {/* User chip */}
 <div className="flex items-center gap-2 px-2.5 py-1 bg-white/80 border border-slate-200 rounded-full shadow-sm">
 <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white text-[9px] font-semibold shrink-0">
 {user?.username?.charAt(0).toUpperCase() || 'U'}
 </div>
 <span className="text-xs font-medium text-slate-800">{user?.username || 'User'}</span>
 </div>

 </div>
 </header>
=======
          <ResizablePanel defaultSize={38} minSize={25} className="flex flex-col bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-[#2d2d2d] overflow-hidden">
            <ProblemPanel
              activeTab={problemTab}
              onTabChange={setProblemTab}
              selectedQuestion={myQuestions[activeQ]?.id || myQuestions[activeQ]?._id}
              onQuestionSelect={(qid) => {
                const idx = myQuestions.findIndex(mq => (mq.id || mq._id) === qid);
                if (idx !== -1) {
                  setActiveQ(idx);
                  setOutput('');
                  setVerdict('');
                  setTestResults([]);
                }
              }}
              questions={myQuestions.map((mq) => ({
                id: mq.id || mq._id,
                title: mq.title,
                difficulty: mq.difficulty,
                description: mq.description,
                examples: mq.sampleTestCases?.map(tc => ({
                  input: tc.input,
                  output: tc.expectedOutput,
                })),
                constraints: mq.constraints,
              }))}
              submissions={submissions}
              submissionsLoading={submissionsLoading}
              leaderboard={leaderboard}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="w-1.5 bg-gray-100 dark:bg-[#262626] mx-0.5 hover:bg-emerald-400/30 dark:hover:bg-[#ffa116]/30 transition-colors" />

          <ResizablePanel defaultSize={62} minSize={30} className="flex flex-col bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-[#2d2d2d] overflow-hidden">
            <CodeEditorPanel
              code={code}
              setCode={handleCodeChange}
              language={lang}
              onLanguageChange={setLang}
              onRun={(c) => run(c, '')}
              onSubmit={(c) => submit(c)}
              onResetCode={() => setCode('')}
              isRunning={running}
              isSubmitting={submitting}
              output={output ? { consoleOutput: output } : null}
              testResults={testResults}
              verdict={verdict}
              isSubmitMode={lastAction === 'SUBMIT'}
              initialTestCases={myQuestions[activeQ]?.sampleTestCases?.map(tc => ({ input: tc.input, output: tc.expectedOutput })) || []}
            />
          </ResizablePanel>
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7

 <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
 <ResizablePanelGroup orientation="horizontal" className="flex-1">

 <ResizablePanel defaultSize={38} minSize={25} className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
 <ProblemPanel
 activeTab={problemTab}
 onTabChange={setProblemTab}
 selectedQuestion={myQuestions[activeQ]?.id || myQuestions[activeQ]?._id}
 onQuestionSelect={(qid) => {
 const idx = myQuestions.findIndex(mq => (mq.id || mq._id) === qid);
 if (idx !== -1) {
 setActiveQ(idx);
 setOutput('');
 setVerdict('');
 setTestResults([]);
 }
 }}
 questions={myQuestions.map((mq) => ({
 id: mq.id || mq._id,
 title: mq.title,
 difficulty: mq.difficulty,
 description: mq.description,
 examples: mq.sampleTestCases?.map(tc => ({
 input: tc.input,
 output: tc.expectedOutput,
 })),
 constraints: mq.constraints,
 }))}
 submissions={submissions}
 submissionsLoading={submissionsLoading}
 leaderboard={leaderboard}
 />
 </ResizablePanel>

 <ResizableHandle withHandle className="w-1.5 bg-gray-100 mx-0.5 hover:bg-emerald-400/30 transition-colors" />

 <ResizablePanel defaultSize={62} minSize={30} className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
 <CodeEditorPanel
 code={code}
 setCode={handleCodeChange}
 language={lang}
 onLanguageChange={setLang}
 onRun={(c) => run(c, '')}
 onSubmit={(c) => submit(c)}
 onResetCode={() => setCode('')}
 isRunning={running}
 isSubmitting={submitting}
 output={output ? { consoleOutput: output } : null}
 testResults={testResults}
 verdict={verdict}
 isSubmitMode={lastAction === 'SUBMIT'}
 initialTestCases={myQuestions[activeQ]?.sampleTestCases?.map(tc => ({ input: tc.input, output: tc.expectedOutput })) || []}
 />
 </ResizablePanel>

 </ResizablePanelGroup>
 </main>
 </div>
 );
}
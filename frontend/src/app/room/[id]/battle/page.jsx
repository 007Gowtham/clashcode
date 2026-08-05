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

  const urgent = left && left < '05:00';
  return (
    <span className={`font-mono font-semibold ${urgent ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
      {left || '--:--'}
    </span>
  );
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


  // ── Socket + init ─────────────────────────────────────
  useEffect(() => {
    if (!id || id === 'undefined') { router.push('/rooms'); return; }
    const socketUrl = 'https://clashcode.duckdns.org';
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.emit('room:join', { roomId: id });
    const userIdVal = user?._id || user?.id;
    socket.emit('user:join', { userId: userIdVal });

    fetchInitialData();

    return () => socket.disconnect();
  }, [id, user?._id, user?.id]);

  // ── Derived ───────────────────────────────────────────
  const userIdStr = mounted ? (user?._id || user?.id)?.toString() : '';
  const isAdmin = mounted ? room?.adminId?.toString() === userIdStr : false;

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (q) {
      setCodes(prev => ({
        ...prev,
        [q._id]: {
          ...(prev[q._id] || {}),
          [lang]: newCode
        }
      }));
    }
  };

  // ── Code sync ─────────────────────────────────────────
  useEffect(() => {
    if (!q) return;
    const savedCode = codes[q._id]?.[lang];
    setCode(savedCode !== undefined ? savedCode : (q.starterCode?.[lang] || ''));
  }, [activeQ, lang, q]);

  const fetchInitialData = async () => {
    setLoading(true);
    // SYNC DUMMY DATA DIRECTLY
    setTimeout(() => {
      const questions = [{
        _id: 'dummy1',
        id: 'dummy1',
        title: 'Two Sum',
        difficulty: 'Easy',
        description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
        starterCode: { python: 'def twoSum(nums, target):\n    # Write your code here\n    pass\n', cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};' },
        sampleTestCases: [
          { input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]' },
          { input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]' }
        ],
        timeLimit: 1,
        memoryLimit: 256,
        score: 10
      }];
      dispatch(setMyQuestions(questions));

      const roomData = {
        _id: id,
        name: 'Dummy Test Room',
        status: 'PLAYING',
        adminId: user?._id || user?.id,
        members: []
      };
      dispatch(setRoom(roomData));
      setLoading(false);
    }, 500);
  };

  const fetchLeaderboard = async () => {
    dispatch(setLeaderboard([]));
  };

  const fetchSubmissions = async () => {
    setSubmissions([]);
  };


  // ── Run / Submit ──────────────────────────────────────
  const run = async (codeOverride, stdinOverride) => {
    if (!q) return;
    setProblemTab('result');
    setRunning(true); setOutput(''); setVerdict(''); setTestResults([]); setLastAction('RUN');
    setTimeout(() => {
        setTestResults([
          { pass: true, input: 'nums = [2,7,11,15], target = 9', actualOutput: '[0,1]', expectedOutput: '[0,1]' },
          { pass: false, input: 'nums = [3,2,4], target = 6', actualOutput: '[0,0]', expectedOutput: '[1,2]', error: 'Wrong Answer' }
        ]);
        setVerdict('WRONG_ANSWER');
        setRunning(false);
    }, 1000);
  };

  const submit = async (codeOverride) => {
    if (!myQuestions[activeQ]) return;
    setProblemTab('result');
    setSubmitting(true); setVerdict(''); setTestResults([]); setOutput(''); setLastAction('SUBMIT');
    setTimeout(() => {
        setVerdict('ACCEPTED');
        const problemId = q.id || q._id;
        if (problemId) {
          setAccepted(p => ({ ...p, [problemId]: true }));
        }
        setSubmitting(false);
    }, 1500);
  };

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
    <div className="h-screen w-full bg-[#FDFBF7] text-retro-ink overflow-hidden flex flex-col antialiased">
      
      {/* Top Header */}
      <header className="w-full px-4 py-3 flex items-center justify-between border-b-[4px] border-retro-ink bg-[#b2ff59] relative z-10 shadow-[0_6px_0px_rgba(15,23,42,1)] shrink-0">
        
        {/* Left: Logo + Room Name */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 border-[3px] border-retro-ink bg-[#ff4081] flex items-center justify-center text-white font-black text-xl shadow-[3px_3px_0px_rgba(15,23,42,1)] rotate-[-3deg] hover:rotate-0 transition-transform cursor-pointer"
            onClick={() => router.push('/rooms')}
          >
            Λ
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="uppercase tracking-tighter text-retro-ink text-lg hidden sm:flex gap-1.5 bg-white px-2 py-0.5 border-[3px] border-retro-ink shadow-[2px_2px_0px_rgba(15,23,42,1)] rotate-[1deg]">
              <span className="font-heading">Battle</span><span className="font-heading-outline text-[#ff4081]">Arena</span>
            </span>
          </div>
        </div>

        {/* Center: Team & Score */}
        <div className="flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
          {myTeam && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-white border-[3px] border-retro-ink shadow-[4px_4px_0px_rgba(15,23,42,1)] rotate-[-1deg]">
              <div className="flex items-center gap-2 text-sm font-black uppercase text-retro-ink">
                <Users className="w-4 h-4 text-retro-blue shrink-0" strokeWidth={3} />
                <span>{myTeam.name}</span>
              </div>
              <div className="w-1 h-5 bg-retro-ink" />
              <div className="flex items-center gap-1.5 text-sm font-black text-emerald-500 uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-[#ffa116]" strokeWidth={3} />
                {leaderboard?.find(t => t.teamName === myTeam?.name)?.score ?? myTeam?.score ?? 0}
                <span className="text-retro-ink font-bold">PTS</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Leaderboard button */}
          <button
            onClick={() => router.push(`/room/${id}/results`)}
            className="flex items-center gap-1.5 font-mono text-[11px] font-black uppercase tracking-widest text-white bg-retro-blue px-3 py-2 border-[3px] border-retro-ink shadow-[3px_3px_0px_rgba(15,23,42,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_rgba(15,23,42,1)] transition-all rotate-1"
          >
            <Trophy className="w-4 h-4 text-yellow-300" strokeWidth={3} />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          {/* Timer */}
          <div className="flex items-center gap-2 bg-white border-[3px] border-retro-ink px-3 py-1.5 shadow-[3px_3px_0px_rgba(15,23,42,1)] rotate-[-1deg]">
            <Clock className="w-4 h-4 text-[#ff4081]" strokeWidth={3} />
            <div className="text-sm font-black text-retro-ink">
              <Timer endTime={endTime} onEnd={handleTimerEnd} />
            </div>
          </div>

          {/* User chip */}
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-retro-yellow border-[3px] border-retro-ink shadow-[3px_3px_0px_rgba(15,23,42,1)] rotate-2">
            <div className="w-6 h-6 bg-white border-[2px] border-retro-ink flex items-center justify-center text-retro-ink text-xs font-black shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-xs font-black uppercase text-retro-ink pr-1">{user?.username || 'User'}</span>
          </div>
        </div>
      </header>

      {/* Main content: Resizable Panels */}
      <main className="flex-1 flex flex-col p-4 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          <ResizablePanel defaultSize={38} minSize={25} className="flex flex-col bg-white border-[4px] border-retro-ink shadow-[4px_4px_0px_rgba(15,23,42,1)] overflow-hidden">
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
              isRunning={running}
              isSubmitting={submitting}
              output={output ? { consoleOutput: output } : null}
              testResults={testResults}
              verdict={verdict}
              isSubmitMode={lastAction === 'SUBMIT'}
              initialTestCases={myQuestions[activeQ]?.sampleTestCases?.map(tc => ({ input: tc.input, output: tc.expectedOutput })) || []}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="w-4 bg-[#FDFBF7] mx-2 hover:bg-[#b2ff59]/30 transition-colors flex items-center justify-center cursor-col-resize z-20">
            <div className="w-1.5 h-12 bg-retro-ink rounded-full" />
          </ResizableHandle>

          <ResizablePanel defaultSize={62} minSize={30} className="flex flex-col bg-white border-[4px] border-retro-ink shadow-[4px_4px_0px_rgba(15,23,42,1)] overflow-hidden">
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
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
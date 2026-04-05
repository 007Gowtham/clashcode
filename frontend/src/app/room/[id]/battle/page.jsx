'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import api from '@/lib/axios';
import { setLeaderboard, setMyQuestions, setEndTime } from '@/store/slices/contestSlice';
import { setRoom, setMyTeam } from '@/store/slices/roomSlice';
import { clearCredentials } from '@/store/slices/authSlice';
import { Users, Trophy, Clock } from 'lucide-react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import ProblemPanel from '@/components/room/code-editor/ProblemPanel';
import CodeEditorPanel from '@/components/room/code-editor/CodeEditorPanel';

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
    <span className={`font-mono font-semibold ${urgent ? 'text-red-500' : 'text-slate-700'}`}>
      {left || '--:--'}
    </span>
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
  const [accepted, setAccepted] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const socketRef = useRef(null);

  const q = myQuestions[activeQ];

  // ── Mount guard (fixes hydration) ─────────────────────
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Derived ───────────────────────────────────────────
  const userIdStr = mounted ? (user?._id || user?.id)?.toString() : '';
  const isAdmin = mounted ? room?.adminId?.toString() === userIdStr : false;

  // ── Code sync ─────────────────────────────────────────
  useEffect(() => {
    if (!q) return;
    const savedCode = codes[q._id]?.[lang];
    setCode(savedCode !== undefined ? savedCode : (q.starterCode?.[lang] || ''));
  }, [activeQ, lang, q]);

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
    try {
      const { data: qData } = await api.get(`/rooms/${id}/questions`);
      dispatch(setMyQuestions(qData.questions));
      dispatch(setEndTime(qData.endTime));

      const { data: rData } = await api.get(`/rooms/${id}`);
      dispatch(setRoom(rData));

      const team = rData.teams.find(t =>
        t.members.some(m => (m.userId?._id || m.userId) === user?._id)
      );
      if (team) dispatch(setMyTeam(team));
    } catch (err) {
      console.error('Failed to restore contest session:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.get(`/leaderboard/${id}`);
      dispatch(setLeaderboard(data));
    } catch { }
  };

  const fetchSubmissions = async () => {
    try {
      setSubmissionsLoading(true);
      const { data } = await api.get(`/submissions/room/${id}`);
      const mine = (data || []).filter(s => (s.userId?._id || s.userId) === user?._id);
      setSubmissions(mine.reverse());
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
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

  // ── Run / Submit ──────────────────────────────────────
  const run = async (codeOverride, stdinOverride) => {
    if (!q) return;
    const codeToRun = codeOverride ?? code;
    const stdinToUse = stdinOverride !== undefined ? stdinOverride : stdin;
    setRunning(true); setOutput(''); setVerdict(''); setTestResults([]);
    try {
      if (stdinToUse.trim()) {
        const { data } = await api.post('/run', { code: codeToRun, language: lang, stdin: stdinToUse });
        setOutput(data.output || data.error || '(no output)');
      } else {
        const { data } = await api.post('/test', { questionId: q._id, code: codeToRun, language: lang });
        const results = data.testResults || [];
        setTestResults(results);
        if (results.length === 0 && data.message) setOutput(data.message);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Run failed';
      setOutput(`Error: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  const submit = async (codeOverride) => {
    if (!myTeam || !myQuestions[activeQ]) return;
    const codeToSubmit = codeOverride ?? code;
    setSubmitting(true); setVerdict(''); setTestResults([]);
    try {
      const { data } = await api.post('/submit', {
        roomId: id, teamId: myTeam._id,
        questionId: myQuestions[activeQ]._id,
        code: codeToSubmit, language: lang,
      });
      setVerdict(data.verdict);
      setTestResults(data.testResults || []);
      if (data.verdict === 'ACCEPTED') {
        setAccepted(p => ({ ...p, [myQuestions[activeQ]._id]: true }));
      }
      if (data.verdict === 'ACCEPTED' || data.verdict === 'PARTIALLY_ACCEPTED') {
        fetchLeaderboard();
      }
      setOutput(data.output || '');
      fetchSubmissions();
    } catch (err) {
      setVerdict('ERROR');
      setOutput(err.response?.data?.error || 'Submit failed');
      fetchSubmissions();
    } finally {
      setSubmitting(false);
    }
  };

  // ── Hydration guard ───────────────────────────────────
  if (!mounted) return null;

  // ── Render ────────────────────────────────────────────
  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 overflow-hidden flex flex-col font-[family-name:var(--font-inter)] antialiased">

      <header className="h-[52px] bg-transparent px-4 flex items-center justify-between shrink-0 z-20 select-none">

        {/* Left: Logo + Room Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md shadow-slate-900/10 shrink-0">Λ</div>
          <div className="flex flex-col gap-0">
            <span className="text-sm font-bold text-slate-900 leading-none tracking-tight">
              {room?.name || 'Battle Arena'}
            </span>
            <span className="text-[10px] font-medium text-slate-400 leading-none tracking-widest uppercase mt-0.5">
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
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-emerald-600">
                <Trophy className="w-3.5 h-3.5" />
                {leaderboard?.find(t => t.teamName === myTeam?.name)?.score ?? myTeam?.score ?? 0}
                <span className="text-slate-400 font-normal ml-0.5">pts</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Leaderboard + Timer + User */}
        <div className="flex items-center gap-2">

          {/* Leaderboard button */}
          <button
            onClick={() => router.push(`/room/${id}/results`)}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            Leaderboard
          </button>

          {/* Timer */}
          <div className="flex items-center gap-1.5 bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <div className="text-[13px] font-bold">
              <Timer endTime={endTime} onEnd={handleTimerEnd} />
            </div>
          </div>

          <div className="w-px h-5 bg-slate-200/80 mx-1" />

          {/* User chip */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-white/80 border border-slate-200 rounded-full shadow-sm">
            <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white text-[9px] font-black shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-xs font-bold text-slate-800">{user?.username || 'User'}</span>
          </div>

        </div>
      </header>

      <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="flex-1">

          <ResizablePanel defaultSize={38} minSize={25} className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <ProblemPanel
              activeTab={problemTab}
              onTabChange={setProblemTab}
              selectedQuestion={myQuestions[activeQ]?._id}
              onQuestionSelect={(qid) => {
                const idx = myQuestions.findIndex(mq => mq._id === qid);
                if (idx !== -1) setActiveQ(idx);
              }}
              questions={myQuestions.map((mq) => ({
                id: mq._id,
                title: mq.title,
                difficulty: mq.difficulty,
                description: mq.description,
                examples: mq.examples,
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
            />
          </ResizablePanel>

        </ResizablePanelGroup>
      </main>
    </div>
  );
}
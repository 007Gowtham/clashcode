'use client';

import { ChevronLeft, ChevronRight, FileText, History, CheckCircle2, XCircle, Clock, AlertCircle, Loader2, Trophy, Users } from 'lucide-react';
import { useState } from 'react';

/* ─── Difficulty pill ─── */
function DifficultyBadge({ difficulty }) {
<<<<<<< HEAD
 const cfg = {
 EASY: { label: 'Easy', cls: 'text-blue-600' },
 MEDIUM: { label: 'Medium', cls: 'text-amber-600' },
 HARD: { label: 'Hard', cls: 'text-rose-600' },
 }[difficulty] || { label: difficulty, cls: 'text-slate-600' };
 return <span className={`text-[11px] font-bold uppercase tracking-wider ${cfg.cls}`}>{cfg.label}</span>;
=======
    const cfg = {
        EASY: { label: 'Easy', cls: 'text-blue-600 dark:text-blue-400' },
        MEDIUM: { label: 'Medium', cls: 'text-amber-600 dark:text-[#ffa116]' },
        HARD: { label: 'Hard', cls: 'text-rose-600 dark:text-rose-400' },
    }[difficulty] || { label: difficulty, cls: 'text-slate-600 dark:text-slate-400' };
    return <span className={`text-[11px] font-bold uppercase tracking-wider ${cfg.cls}`}>{cfg.label}</span>;
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
}

/* ─── LeetCode-style example block ─── */
function ExampleBlock({ example, index }) {
<<<<<<< HEAD
 return (
 <div className="mb-6">
 <p className="text-[15px] font-bold text-slate-900 mb-3">Example {index + 1}:</p>
 <div className="border-l-2 border-slate-200 pl-4 font-mono text-[13px] leading-relaxed text-slate-700 space-y-1">
 <div><strong className="font-bold text-slate-900">Input:</strong> {example.input}</div>
 <div><strong className="font-bold text-slate-900">Output:</strong> {example.output}</div>
 {example.explanation && (
 <div><strong className="font-bold text-slate-900">Explanation:</strong> {example.explanation}</div>
 )}
 </div>
 </div>
 );
=======
    return (
        <div className="mb-6">
            <p className="text-[17px] md:text-[19px] font-bold text-slate-900 dark:text-white mb-3">Example {index + 1}:</p>
            <div className="border-l-2 border-slate-200 dark:border-[#2d2d2d] pl-4 font-mono text-[14px] md:text-[16px] leading-relaxed text-slate-700 dark:text-slate-300 space-y-1.5">
                <div><strong className="font-bold text-slate-900 dark:text-white">Input:</strong> {example.input}</div>
                <div><strong className="font-bold text-slate-900 dark:text-white">Output:</strong> {example.output}</div>
                {example.explanation && (
                    <div><strong className="font-bold text-slate-900 dark:text-white">Explanation:</strong> {example.explanation}</div>
                )}
            </div>
        </div>
    );
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
}

/* ─── Verdict badge ─── */
function VerdictBadge({ verdict }) {
<<<<<<< HEAD
 const cfg = {
 ACCEPTED: { label: 'Accepted', icon: CheckCircle2, cls: 'text-blue-600 bg-blue-50 border-blue-200' },
 WRONG_ANSWER: { label: 'Wrong Answer', icon: XCircle, cls: 'text-rose-600 bg-rose-50 border-rose-200' },
 TIME_LIMIT_EXCEEDED: { label: 'Time Limit', icon: Clock, cls: 'text-amber-600 bg-amber-50 border-amber-200' },
 ERROR: { label: 'Runtime Error', icon: AlertCircle, cls: 'text-orange-600 bg-orange-50 border-orange-200' },
 PENDING: { label: 'Pending', icon: Loader2, cls: 'text-slate-600 bg-slate-50 border-slate-200' },
 }[verdict] || { label: verdict, icon: AlertCircle, cls: 'text-gray-600 bg-gray-100 border-gray-200' };

 const Icon = cfg.icon;
 return (
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border ${cfg.cls}`}>
 <Icon className="w-3 h-3" />
 {cfg.label}
 </span>
 );
=======
    const cfg = {
        ACCEPTED: { label: 'Accepted', icon: CheckCircle2, cls: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40' },
        WRONG_ANSWER: { label: 'Wrong Answer', icon: XCircle, cls: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' },
        TIME_LIMIT_EXCEEDED: { label: 'Time Limit', icon: Clock, cls: 'text-amber-600 dark:text-[#ffa116] bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40' },
        ERROR: { label: 'Runtime Error', icon: AlertCircle, cls: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40' },
        PENDING: { label: 'Pending', icon: Loader2, cls: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#262626] border-slate-200 dark:border-[#333333]' },
    }[verdict] || { label: verdict, icon: AlertCircle, cls: 'text-gray-600 bg-gray-100 border-gray-200' };

    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border ${cfg.cls}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
}

/* ─── Single submission row ─── */
function SubmissionRow({ sub }) {
<<<<<<< HEAD
 const date = sub.submittedAt || sub.createdAt ? new Date(sub.submittedAt || sub.createdAt) : null;
 const timeStr = date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
 const dateStr = date ? date.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';

 const passed = sub.passedCount ?? (sub.testResults || []).filter(r => r.passed || r.pass).length;
 const total = sub.totalCount ?? (sub.testResults || []).length;

 return (
 <div className="border border-gray-100 rounded-lg overflow-hidden">
 <div className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-white">
 <div className="flex items-center gap-2 flex-1 min-w-0">
 <VerdictBadge verdict={sub.status || sub.verdict} />
 <span className="text-xs text-gray-500 font-mono uppercase shrink-0">{sub.language}</span>
 {total > 0 && (
 <span className="text-[11px] text-gray-400 shrink-0">{passed}/{total} tests</span>
 )}
 {sub.score > 0 && (
 <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">+{sub.score}</span>
 )}
 </div>
 <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-2">{dateStr} {timeStr}</span>
 </div>
 </div>
 );
=======
    const date = sub.submittedAt || sub.createdAt ? new Date(sub.submittedAt || sub.createdAt) : null;
    const timeStr = date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const dateStr = date ? date.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';

    const passed = sub.passedCount ?? (sub.testResults || []).filter(r => r.passed || r.pass).length;
    const total = sub.totalCount ?? (sub.testResults || []).length;

    return (
        <div className="border border-gray-100 dark:border-[#2d2d2d] rounded-lg overflow-hidden">
            <div className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-white dark:bg-[#1e1e1e]">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <VerdictBadge verdict={sub.status || sub.verdict} />
                    <span className="text-xs text-gray-500 dark:text-slate-400 font-mono uppercase shrink-0">{sub.language}</span>
                    {total > 0 && (
                        <span className="text-[11px] text-gray-400 dark:text-slate-400 shrink-0">{passed}/{total} tests</span>
                    )}
                    {sub.score > 0 && (
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-[#ffa116] bg-blue-50 dark:bg-[#ffa116]/10 px-1.5 py-0.5 rounded shrink-0">+{sub.score}</span>
                    )}
                </div>
                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium shrink-0 ml-2">{dateStr} {timeStr}</span>
            </div>
        </div>
    );
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
}

/* ─── Submissions list ─── */
function SubmissionsTab({ submissions, loading, questionId }) {
<<<<<<< HEAD
 const filtered = (submissions || []).filter(s => {
 const qid = s.problemId || s.questionId;
 return !questionId || String(qid) === String(questionId) || qid?._id === questionId;
 });

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center py-16">
 <Loader2 className="w-8 h-8 text-gray-300 animate-spin mb-3" />
 <p className="text-sm text-gray-500">Loading submissions…</p>
 </div>
 );
 }

 if (filtered.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-16 text-center px-6">
 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
 <History className="w-8 h-8 text-gray-400" />
 </div>
 <h3 className="text-base font-semibold text-gray-900 mb-1">No Submissions Yet</h3>
 <p className="text-sm text-gray-500">Your submissions will appear here after you submit.</p>
 </div>
 );
 }

 return (
 <div className="p-4 space-y-2">
 {filtered.map((sub, i) => (
 <SubmissionRow key={sub._id || i} sub={sub} />
 ))}
 </div>
 );
=======
    const filtered = (submissions || []).filter(s => {
        const qid = s.problemId || s.questionId;
        return !questionId || String(qid) === String(questionId) || qid?._id === questionId;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-gray-300 animate-spin mb-3" />
                <p className="text-sm text-gray-500 dark:text-slate-400">Loading submissions…</p>
            </div>
        );
    }

    if (filtered.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-16 h-16 bg-gray-100 dark:bg-[#262626] rounded-full flex items-center justify-center mb-4 border dark:border-[#333333]">
                    <History className="w-8 h-8 text-gray-400 dark:text-[#8c8c8c]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No Submissions Yet</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">Your submissions will appear here after you submit.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-2">
            {filtered.map((sub, i) => (
                <SubmissionRow key={sub._id || i} sub={sub} />
            ))}
        </div>
    );
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
}

/* ─── Main ProblemPanel ─── */
export default function ProblemPanel({
<<<<<<< HEAD
 activeTab,
 onTabChange,
 selectedQuestion,
 onQuestionSelect,
 questions = [],
 submissions = [],
 submissionsLoading = false,
 leaderboard = [],
 style,
}) {
 const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

 const tabs = [
 { id: 'problem', label: 'Description', icon: FileText, color: 'text-blue-500' },
 { id: 'submissions', label: 'Submissions', icon: History, color: 'text-gray-400' },
 { id: 'leaderboard', label: 'Scoreboard', icon: Trophy, color: 'text-yellow-500' },
 ];

 const currentQuestion =
 questions.find(q => q.id === selectedQuestion) || questions[currentQuestionIndex];

 const handlePrev = () => {
 if (currentQuestionIndex > 0) {
 const idx = currentQuestionIndex - 1;
 setCurrentQuestionIndex(idx);
 onQuestionSelect?.(questions[idx].id);
 }
 };
 const handleNext = () => {
 if (currentQuestionIndex < questions.length - 1) {
 const idx = currentQuestionIndex + 1;
 setCurrentQuestionIndex(idx);
 onQuestionSelect?.(questions[idx].id);
 }
 };

 const formatConstraint = (text) =>
 text.replace(/<=/g, '≤').replace(/>=/g, '≥').replace(/!=/g, '≠').replace(/->/g, '→').replace(/infinity/gi, '∞');

 const currentProblemId = currentQuestion?.id || currentQuestion?._id;
 const currentSubmissionsCount = (submissions || []).filter(s => {
 const qid = s.problemId || s.questionId;
 return !currentProblemId || String(qid) === String(currentProblemId) || qid?._id === currentProblemId;
 }).length;

 return (
 <div className="flex flex-col h-full bg-white overflow-hidden " style={style}>

 {/* ── Tab bar ── */}
 <div className="flex items-center justify-between px-2 pt-2 border-b border-slate-200 bg-slate-50/80 shrink-0">
 <div className="flex gap-1">
 {tabs.map(tab => (
 <button
 key={tab.id}
 onClick={() => onTabChange?.(tab.id)}
 className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
 }`}
 >
 <tab.icon className={`w-4 h-4 stroke-[1.5] ${tab.color}`} />
 <span className="text-[13px] font-semibold">{tab.label}</span>
 {tab.id === 'submissions' && currentSubmissionsCount > 0 && (
 <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-600 rounded-full">
 {currentSubmissionsCount > 99 ? '99+' : currentSubmissionsCount}
 </span>
 )}
 {activeTab === tab.id && (
 <span className="absolute left-2 right-2 -bottom-[1px] h-0.5 rounded-full bg-blue-600" />
 )}
 </button>
 ))}
 </div>

 {/* Question navigator (only if multiple) */}
 {questions.length > 1 && (
 <div className="flex items-center gap-1 pr-1">
 <span className="text-[10px] text-gray-400 font-medium mr-1">
 {currentQuestionIndex + 1}/{questions.length}
 </span>
 <button onClick={handlePrev} disabled={currentQuestionIndex === 0}
 className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors">
 <ChevronLeft className="w-3.5 h-3.5 stroke-[1.5]" />
 </button>
 <button onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1}
 className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors">
 <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
 </button>
 </div>
 )}
 </div>

 {/* ── Scrollable body ── */}
 <div className="flex-1 overflow-y-auto custom-scrollbar">
 {currentQuestion ? (
 <>
 {/* DESCRIPTION */}
 {activeTab === 'problem' && (
 <div className="p-5">
 <h2 className="text-xl font-bold text-gray-900 mb-1">{currentQuestion.title}</h2>
 <div className="flex items-center gap-3 mb-4">
 <DifficultyBadge difficulty={currentQuestion.difficulty} />
 </div>
 <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">
 {currentQuestion.description}
 </p>
 {currentQuestion.examples?.length > 0 && (
 <div className="mb-8">
 {currentQuestion.examples.map((ex, idx) => (
 <ExampleBlock key={idx} example={ex} index={idx} />
 ))}
 </div>
 )}
 {currentQuestion.constraints?.length > 0 && (
 <div className="mt-8 mb-4">
 <p className="text-[15px] font-bold text-slate-900 mb-4">Constraints:</p>
 <ul className="space-y-3 list-none pl-1">
 {currentQuestion.constraints.map((c, idx) => (
 <li key={idx} className="flex items-center gap-3">
 <span className="text-slate-800 text-[10px] shrink-0">●</span>
 <code className="font-mono text-[13px] bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-slate-600">
 {formatConstraint(c)}
 </code>
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>
 )}

 {/* SUBMISSIONS */}
 {activeTab === 'submissions' && (
 <SubmissionsTab
 submissions={submissions}
 loading={submissionsLoading}
 questionId={selectedQuestion}
 />
 )}

 {/* LEADERBOARD / SCOREBOARD */}
 {activeTab === 'leaderboard' && (
 <div className="p-4 space-y-3">
 {leaderboard.map((team, idx) => (
 <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-colors">
 <div className="flex items-center gap-3">
 <div className="flex items-center justify-center w-7 h-7 rounded-sm bg-slate-900 text-white font-semibold text-xs shrink-0">
 {team.rank || (idx + 1)}
 </div>
 <div className="flex flex-col">
 <span className="font-medium text-slate-900 text-[13px]">{team.teamName}</span>
 <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
 <Users className="w-3 h-3" />
 {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-semibold text-[13px]">
 <Trophy className="w-3.5 h-3.5" />
 {team.score} pts
 </div>
 </div>
 ))}
 {leaderboard.length === 0 && (
 <div className="flex flex-col items-center justify-center py-16 text-center px-6">
 <Trophy className="w-8 h-8 text-gray-300 mb-3" />
 <p className="text-sm text-gray-500 font-medium">Scoreboard is empty</p>
 </div>
 )}
 </div>
 )}
 </>
 ) : (
 <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
 <FileText className="w-8 h-8 text-gray-300 mb-3" />
 <p className="text-sm text-gray-500">No question loaded</p>
 </div>
 )}
 </div>
 </div>
 );
=======
    activeTab,
    onTabChange,
    selectedQuestion,
    onQuestionSelect,
    questions = [],
    submissions = [],
    submissionsLoading = false,
    leaderboard = [],
    style,
}) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const tabs = [
        { id: 'problem', label: 'Description', icon: FileText, color: 'text-blue-500 dark:text-blue-400' },
        { id: 'submissions', label: 'Submissions', icon: History, color: 'text-gray-400 dark:text-[#8c8c8c]' },
        { id: 'leaderboard', label: 'Scoreboard', icon: Trophy, color: 'text-yellow-500' },
    ];

    const currentQuestion =
        questions.find(q => q.id === selectedQuestion) || questions[currentQuestionIndex];

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            const idx = currentQuestionIndex - 1;
            setCurrentQuestionIndex(idx);
            onQuestionSelect?.(questions[idx].id);
        }
    };
    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            const idx = currentQuestionIndex + 1;
            setCurrentQuestionIndex(idx);
            onQuestionSelect?.(questions[idx].id);
        }
    };

    const formatConstraint = (text) =>
        text.replace(/<=/g, '≤').replace(/>=/g, '≥').replace(/!=/g, '≠').replace(/->/g, '→').replace(/infinity/gi, '∞');

    const currentProblemId = currentQuestion?.id || currentQuestion?._id;
    const currentSubmissionsCount = (submissions || []).filter(s => {
        const qid = s.problemId || s.questionId;
        return !currentProblemId || String(qid) === String(currentProblemId) || qid?._id === currentProblemId;
    }).length;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] text-[#262626] dark:text-[#eff1f6] overflow-hidden" style={style}>

            {/* ── Tab bar ── */}
            <div className="flex items-center justify-between px-2 pt-2 border-b border-slate-200 dark:border-[#2d2d2d] bg-slate-50/80 dark:bg-[#1a1a1a]/80 shrink-0">
                <div className="flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id)}
                            className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 stroke-[1.5] ${tab.color}`} />
                            <span className="text-[13px] font-semibold">{tab.label}</span>
                            {tab.id === 'submissions' && currentSubmissionsCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full">
                                    {currentSubmissionsCount > 99 ? '99+' : currentSubmissionsCount}
                                </span>
                            )}
                            {activeTab === tab.id && (
                                <span className="absolute left-2 right-2 -bottom-[1px] h-0.5 rounded-full bg-blue-600 dark:bg-[#ffa116]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Question navigator (only if multiple) */}
                {questions.length > 1 && (
                    <div className="flex items-center gap-1 pr-1">
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium mr-1">
                            {currentQuestionIndex + 1}/{questions.length}
                        </span>
                        <button onClick={handlePrev} disabled={currentQuestionIndex === 0}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#262626] text-gray-400 dark:text-[#8c8c8c] disabled:opacity-30 transition-colors">
                            <ChevronLeft className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>
                        <button onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#262626] text-gray-400 dark:text-[#8c8c8c] disabled:opacity-30 transition-colors">
                            <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {currentQuestion ? (
                    <>
                        {/* DESCRIPTION */}
                        {activeTab === 'problem' && (
                            <div className="p-5">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">{currentQuestion.title}</h2>
                                <div className="flex items-center gap-3 mb-5">
                                    <DifficultyBadge difficulty={currentQuestion.difficulty} />
                                </div>
                                <p className="text-base md:text-lg text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap mb-8">
                                    {currentQuestion.description}
                                </p>
                                {(() => {
                                    const examples = currentQuestion.sampleTestCases
                                        ? currentQuestion.sampleTestCases.map(tc => ({
                                            input: tc.input,
                                            output: tc.expectedOutput ?? tc.output,
                                            explanation: tc.explanation
                                        }))
                                        : (currentQuestion.examples || []);
                                    if (examples.length === 0) return null;
                                    return (
                                        <div className="mb-8">
                                            {examples.map((ex, idx) => (
                                                <ExampleBlock key={idx} example={ex} index={idx} />
                                            ))}
                                        </div>
                                    );
                                })()}
                                {currentQuestion.constraints?.length > 0 && (
                                    <div className="mt-8 mb-4">
                                        <p className="text-[17px] md:text-[19px] font-bold text-slate-900 dark:text-white mb-4">Constraints:</p>
                                        <ul className="space-y-3.5 list-none pl-1">
                                            {currentQuestion.constraints.map((c, idx) => (
                                                <li key={idx} className="flex items-center gap-3">
                                                    <span className="text-slate-800 dark:text-[#ffa116] text-[10px] shrink-0">●</span>
                                                    <code className="font-mono text-[14px] md:text-[16px] bg-slate-50 dark:bg-[#262626] border border-slate-100 dark:border-[#333333] rounded px-2.5 py-1 text-slate-600 dark:text-slate-300">
                                                        {formatConstraint(c)}
                                                    </code>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SUBMISSIONS */}
                        {activeTab === 'submissions' && (
                            <SubmissionsTab
                                submissions={submissions}
                                loading={submissionsLoading}
                                questionId={selectedQuestion}
                            />
                        )}

                        {/* LEADERBOARD / SCOREBOARD */}
                        {activeTab === 'leaderboard' && (
                            <div className="p-4 space-y-3">
                                {leaderboard.map((team, idx) => (
                                    <div key={idx} className="flex flex-col p-3 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2d2d2d] rounded-lg shadow-sm hover:border-slate-300 dark:hover:border-[#333333] transition-all duration-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-7 h-7 rounded-sm bg-slate-900 dark:bg-[#262626] border dark:border-[#333333] text-white dark:text-[#eff1f6] font-semibold text-xs shrink-0">
                                                    {team.rank || (idx + 1)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900 dark:text-white text-[13px]">{team.teamName}</span>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                                                        <Users className="w-3 h-3 text-[#ffa116]" />
                                                        {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-800 font-bold text-[12px] shrink-0">
                                                <Trophy className="w-3.5 h-3.5 text-[#ffa116]" />
                                                {team.score} pts
                                            </div>
                                        </div>

                                        {/* Player-wise score dropdown list */}
                                        {team.members && team.members.length > 0 && (
                                            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[#2d2d2d] space-y-1.5">
                                                {team.members.map((member, mIdx) => (
                                                    <div key={mIdx} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
                                                        <span className="truncate max-w-[150px] font-medium">{member.username || member.name}</span>
                                                        <span className="font-bold text-slate-900 dark:text-white shrink-0">{member.score ?? 0} pts</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {leaderboard.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                        <Trophy className="w-8 h-8 text-gray-300 dark:text-[#8c8c8c] mb-3" />
                                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Scoreboard is empty</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                        <FileText className="w-8 h-8 text-gray-300 dark:text-[#8c8c8c] mb-3" />
                        <p className="text-sm text-gray-500 dark:text-slate-400">No question loaded</p>
                    </div>
                )}
            </div>
        </div>
    );
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
}

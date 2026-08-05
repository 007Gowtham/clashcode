'use client';

import { ChevronLeft, ChevronRight, FileText, History, CheckCircle2, XCircle, Clock, AlertCircle, Loader2, Trophy, Users, Terminal, Check, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/* ─── Difficulty pill ─── */
function DifficultyBadge({ difficulty }) {
    const cfg = {
        EASY: { label: 'Easy', cls: 'text-blue-600 bg-blue-100 border-blue-600' },
        MEDIUM: { label: 'Medium', cls: 'text-amber-600 bg-amber-100 border-amber-600' },
        HARD: { label: 'Hard', cls: 'text-rose-600 bg-rose-100 border-rose-600' },
    }[difficulty] || { label: difficulty, cls: 'text-slate-600 bg-slate-100 border-slate-600' };
    return <span className={cn(`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 border-[2px] shadow-[2px_2px_0px_rgba(15,23,42,1)] rotate-[-1deg]`, cfg.cls)}>{cfg.label}</span>;
}

/* ─── Markdown-ish Formatter ─── */
function formatTextWithCode(text) {
    if (!text) return null;
    const parts = text.split('`');
    return parts.map((part, index) => {
        if (index % 2 === 1) {
            return <code key={index} className="font-mono font-bold text-retro-ink bg-retro-yellow px-1 border-[2px] border-retro-ink shadow-[2px_2px_0_rgba(15,23,42,1)] rotate-[-1deg] inline-block mx-1 text-sm tracking-normal">{part}</code>;
        }
        return <span key={index}>{part}</span>;
    });
}

/* ─── LeetCode-style example block ─── */
function ExampleBlock({ example, index }) {
    return (
        <div className="mb-6">
            <p className="text-[17px] md:text-[19px] font-black text-retro-ink uppercase mb-3 bg-[#b2ff59] inline-block px-2 border-[2px] border-retro-ink shadow-[2px_2px_0_rgba(15,23,42,1)] rotate-[1deg]">Example {index + 1}:</p>
            <div className="border-[3px] border-retro-ink bg-white shadow-[4px_4px_0_rgba(15,23,42,1)] p-4 font-sans font-bold text-[14px] md:text-[16px] leading-relaxed text-retro-ink space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <span className="font-mono text-[11px] text-white bg-retro-ink px-2 py-0.5 uppercase tracking-widest border-[2px] border-white shadow-[2px_2px_0px_rgba(15,23,42,1)] rotate-[-1deg] shrink-0 mt-0.5 inline-block w-fit">Input</span>
                    <span className="mt-0.5">{formatTextWithCode(example.input)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <span className="font-mono text-[11px] text-white bg-retro-ink px-2 py-0.5 uppercase tracking-widest border-[2px] border-white shadow-[2px_2px_0px_rgba(15,23,42,1)] rotate-[-1deg] shrink-0 mt-0.5 inline-block w-fit">Output</span>
                    <span className="mt-0.5">{formatTextWithCode(example.output)}</span>
                </div>
                {example.explanation && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <span className="font-mono text-[11px] text-white bg-retro-ink px-2 py-0.5 uppercase tracking-widest border-[2px] border-white shadow-[2px_2px_0px_rgba(15,23,42,1)] rotate-[-1deg] shrink-0 mt-0.5 inline-block w-fit">Explanation</span>
                        <span className="mt-0.5">{formatTextWithCode(example.explanation)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Verdict badge ─── */
function VerdictBadge({ verdict }) {
    const cfg = {
        ACCEPTED: { label: 'Accepted', icon: CheckCircle2, cls: 'text-white bg-green-500 border-retro-ink' },
        WRONG_ANSWER: { label: 'Wrong Answer', icon: XCircle, cls: 'text-white bg-red-500 border-retro-ink' },
        TIME_LIMIT_EXCEEDED: { label: 'Time Limit', icon: Clock, cls: 'text-retro-ink bg-[#ffa116] border-retro-ink' },
        ERROR: { label: 'Runtime Error', icon: AlertCircle, cls: 'text-white bg-orange-600 border-retro-ink' },
        PENDING: { label: 'Pending', icon: Loader2, cls: 'text-retro-ink bg-slate-200 border-retro-ink' },
    }[verdict] || { label: verdict, icon: AlertCircle, cls: 'text-gray-600 bg-gray-100 border-gray-200' };

    const Icon = cfg.icon;
    return (
        <span className={cn(`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-black uppercase rounded-none border-[2px] shadow-[2px_2px_0px_rgba(15,23,42,1)] rotate-[-1deg]`, cfg.cls)}>
            <Icon className="w-3 h-3 stroke-[3]" />
            {cfg.label}
        </span>
    );
}

/* ─── Single submission row ─── */
function SubmissionRow({ sub }) {
    const date = sub.submittedAt || sub.createdAt ? new Date(sub.submittedAt || sub.createdAt) : null;
    const timeStr = date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const dateStr = date ? date.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';

    const passed = sub.passedCount ?? (sub.testResults || []).filter(r => r.passed || r.pass).length;
    const total = sub.totalCount ?? (sub.testResults || []).length;

    return (
        <div className="border-[3px] border-retro-ink bg-white shadow-[4px_4px_0_rgba(15,23,42,1)] overflow-hidden mb-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            <div className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-white">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <VerdictBadge verdict={sub.status || sub.verdict} />
                    <span className="text-xs text-retro-ink font-black font-mono uppercase shrink-0 bg-retro-yellow px-1 border-2 border-retro-ink rotate-[1deg]">{sub.language}</span>
                    {total > 0 && (
                        <span className="text-[11px] font-black text-white bg-retro-blue px-1 border-2 border-retro-ink rotate-[-1deg] shrink-0">{passed}/{total} tests</span>
                    )}
                    {sub.score > 0 && (
                        <span className="text-[11px] font-black text-retro-ink bg-[#b2ff59] px-1 border-2 border-retro-ink shrink-0 rotate-[2deg]">+{sub.score}</span>
                    )}
                </div>
                <span className="text-[10px] text-gray-500 font-black uppercase shrink-0 ml-2">{dateStr} {timeStr}</span>
            </div>
        </div>
    );
}

/* ─── Submissions list ─── */
function SubmissionsTab({ submissions, loading, questionId }) {
    const filtered = (submissions || []).filter(s => {
        const qid = s.problemId || s.questionId;
        return !questionId || String(qid) === String(questionId) || qid?._id === questionId;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 text-retro-ink animate-spin mb-4" />
                <p className="text-sm font-black uppercase text-retro-ink">Loading submissions…</p>
            </div>
        );
    }

    if (filtered.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-16 h-16 bg-[#ff4081] border-[3px] border-retro-ink shadow-[4px_4px_0_rgba(15,23,42,1)] rotate-[-3deg] flex items-center justify-center mb-6">
                    <History className="w-8 h-8 text-white stroke-[3]" />
                </div>
                <h3 className="text-lg font-black uppercase text-retro-ink mb-2 bg-retro-yellow px-2 border-[2px] border-retro-ink rotate-[1deg]">No Submissions Yet</h3>
                <p className="text-sm font-bold text-gray-600">Your submissions will appear here after you submit.</p>
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
}

/* ─── Test Results Tab ─── */
function ResultsTab({ isRunning, isSubmitting, output, testResults, verdict, isSubmitMode, initialTestCases }) {
    const [activeCase, setActiveCase] = useState(0);

    let cases = [];
    if (testResults && testResults.length > 0) {
        cases = testResults
            .filter(r => !r.isHidden)
            .map((r, i) => ({
                label: `Case ${i + 1}`,
                pass: r.pass ?? (r.status === 'PASSED'),
                input: r.input,
                actualOutput: r.actualOutput,
                expectedOutput: r.expectedOutput,
                error: r.error,
                isInitial: false,
            }));
    } else if (!isSubmitMode && !verdict && !output?.consoleOutput && !isRunning && !isSubmitting && initialTestCases && initialTestCases.length > 0) {
        cases = initialTestCases.map((tc, i) => ({
            label: `Case ${i + 1}`,
            pass: null,
            input: tc.input,
            expectedOutput: tc.output,
            isInitial: true,
        }));
    }

    const current = cases[activeCase];

    if (isRunning || isSubmitting) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center h-full">
                <Loader2 className="w-12 h-12 animate-spin text-retro-ink mb-6" />
                <p className="text-xl font-black uppercase text-retro-ink bg-retro-yellow px-4 py-1 border-[3px] border-retro-ink shadow-[4px_4px_0_rgba(15,23,42,1)] rotate-[-2deg]">
                    {isSubmitting ? 'Evaluating Submission...' : 'Running Code...'}
                </p>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Status Banner */}
            {!isRunning && !isSubmitting && testResults?.length > 0 && (
                <div className={`mb-6 border-[4px] border-retro-ink p-4 flex items-center justify-between shadow-[4px_4px_0_rgba(15,23,42,1)] ${testResults.every(r => r.pass) ? 'bg-[#b2ff59] rotate-[1deg]' : 'bg-[#ff4081] text-white rotate-[-1deg]'}`}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{testResults.every(r => r.pass) ? '🔥' : '💀'}</span>
                        <span className="font-black text-xl uppercase tracking-wider">{testResults.every(r => r.pass) ? (verdict || 'Accepted') : (verdict || 'Wrong Answer')}</span>
                    </div>
                    <span className="text-sm font-black uppercase px-3 py-1 bg-retro-ink text-white border-[2px] border-white rotate-[2deg]">{testResults.filter(r => r.pass).length} / {testResults.length} passed</span>
                </div>
            )}
            {!isRunning && !isSubmitting && !testResults?.length && verdict && (
                <div className={`mb-6 border-[4px] border-retro-ink p-4 flex items-center gap-3 shadow-[4px_4px_0_rgba(15,23,42,1)] ${verdict === 'ACCEPTED' ? 'bg-[#b2ff59] rotate-[1deg]' : 'bg-[#ff4081] text-white rotate-[-1deg]'}`}>
                    <span className="text-2xl">{verdict === 'ACCEPTED' ? '🔥' : '💀'}</span>
                    <span className="font-black text-xl uppercase tracking-wider">{verdict}</span>
                </div>
            )}

            {!isSubmitMode && cases.length > 0 ? (
                <>
                    {/* Case tabs */}
                    <div className="flex items-center gap-3 flex-wrap mb-6 relative z-10">
                        {cases.map((c, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveCase(i)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 border-[3px] border-retro-ink text-[14px] font-black uppercase transition-all shadow-[3px_3px_0_rgba(15,23,42,1)]',
                                    activeCase === i
                                        ? 'bg-retro-ink text-white translate-x-[3px] translate-y-[3px] shadow-none'
                                        : 'bg-white text-retro-ink hover:bg-retro-yellow hover:-translate-y-1'
                                )}
                            >
                                {c.pass != null && (
                                    <div className={cn('rounded-none border-[2px] border-retro-ink w-4 h-4 flex items-center justify-center shrink-0', c.pass ? 'bg-[#b2ff59]' : 'bg-[#ff4081]')}>
                                        {c.pass ? <Check className="w-3 h-3 text-retro-ink stroke-[4]" /> : <X className="w-3 h-3 text-white stroke-[4]" />}
                                    </div>
                                )}
                                {c.label}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-6 relative z-10">
                        {current?.input != null && (
                            <div className="bg-white border-[4px] border-retro-ink p-4 shadow-[4px_4px_0_rgba(15,23,42,1)] rotate-[-1deg]">
                                <div className="text-[13px] text-retro-ink font-black uppercase tracking-wider mb-2 bg-retro-yellow inline-block px-2 border-[2px] border-retro-ink">Input</div>
                                <div className="bg-white border-[3px] border-retro-ink p-3 font-mono font-bold text-[15px] text-retro-ink whitespace-pre-wrap">{current.input}</div>
                            </div>
                        )}
                        {current?.actualOutput != null && (
                            <div className={cn('border-[4px] border-retro-ink p-4 shadow-[4px_4px_0_rgba(15,23,42,1)] rotate-[1deg]', current.pass ? 'bg-white' : 'bg-[#ff4081]')}>
                                <div className="text-[13px] text-retro-ink font-black uppercase tracking-wider mb-2 bg-retro-yellow inline-block px-2 border-[2px] border-retro-ink">Output</div>
                                <div className={cn('border-[3px] border-retro-ink p-3 font-mono font-bold text-[15px] whitespace-pre-wrap', current.pass ? 'bg-white text-retro-ink' : 'bg-white text-retro-ink')}>
                                    {current.actualOutput || '(no output)'}
                                </div>
                            </div>
                        )}
                        {current?.error != null && (
                            <div className="bg-white border-[4px] border-retro-ink p-4 shadow-[4px_4px_0_rgba(15,23,42,1)] rotate-[-1deg]">
                                <div className="text-[13px] text-white font-black uppercase tracking-wider mb-2 bg-[#ff4081] inline-block px-2 border-[2px] border-retro-ink">Runtime Error</div>
                                <div className="bg-white border-[3px] border-retro-ink p-3 font-mono font-bold text-[13px] text-red-600 whitespace-pre-wrap">{current.error}</div>
                            </div>
                        )}
                    </div>
                </>
            ) : (output?.consoleOutput || (typeof output === 'string' && output)) ? (
                <div className="bg-white border-[4px] border-retro-ink p-4 shadow-[4px_4px_0_rgba(15,23,42,1)] rotate-[1deg] relative z-10">
                    <div className="text-[13px] text-retro-ink font-black uppercase tracking-wider mb-2 bg-retro-yellow inline-block px-2 border-[2px] border-retro-ink">Console Output</div>
                    <div className="bg-white border-[3px] border-retro-ink p-3 font-mono font-bold text-[15px] text-retro-ink whitespace-pre-wrap">{output.consoleOutput || output}</div>
                </div>
            ) : !isRunning && !isSubmitting && !testResults?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center relative z-10">
                    <Terminal className="w-12 h-12 text-retro-ink stroke-[2] mb-4 rotate-[15deg]" />
                    <p className="text-lg font-black uppercase text-retro-ink bg-[#b2ff59] px-3 border-[2px] border-retro-ink shadow-[2px_2px_0_rgba(15,23,42,1)] rotate-[-2deg] mb-2">Run your code to see results</p>
                    <p className="text-sm font-bold text-gray-600">Click Run to test your solution</p>
                </div>
            ) : null}
        </div>
    );
}

/* ─── Main ProblemPanel ─── */
export default function ProblemPanel({
    activeTab,
    onTabChange,
    selectedQuestion,
    onQuestionSelect,
    questions = [],
    submissions = [],
    submissionsLoading = false,
    leaderboard = [],
    isRunning,
    isSubmitting,
    output,
    testResults,
    verdict,
    isSubmitMode,
    initialTestCases,
    style,
}) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const tabs = [
        { id: 'problem', label: 'Description', icon: FileText },
        { id: 'submissions', label: 'Submissions', icon: History },
        { id: 'leaderboard', label: 'Scoreboard', icon: Trophy },
        { id: 'result', label: 'Test Results', icon: Terminal },
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
        <div className="flex flex-col h-full bg-white text-retro-ink overflow-hidden relative" style={style}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            {/* ── Tab bar ── */}
            <div className="flex items-center justify-between px-2 pt-2 border-b-[4px] border-retro-ink bg-[#ff9100] shrink-0 z-10 relative">
                <div className="flex gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id)}
                            className={cn(
                                'relative flex items-center gap-2 px-4 py-2 text-[13px] font-black uppercase tracking-wider transition-all border-t-[3px] border-x-[3px] border-retro-ink',
                                activeTab === tab.id
                                    ? 'bg-white text-retro-ink translate-y-[3px] pb-3 shadow-[0_-3px_0_rgba(15,23,42,1)_inset]'
                                    : 'bg-[#e03872] text-white hover:bg-white hover:text-retro-ink'
                            )}
                        >
                            <tab.icon className="w-4 h-4 stroke-[3]" />
                            <span>{tab.label}</span>
                            {tab.id === 'submissions' && currentSubmissionsCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black bg-retro-ink text-white">
                                    {currentSubmissionsCount > 99 ? '99+' : currentSubmissionsCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Question navigator (only if multiple) */}
                {questions.length > 1 && (
                    <div className="flex items-center gap-2 pr-2 pb-2">
                        <span className="text-[12px] font-black text-white bg-retro-ink px-2 py-0.5 shadow-[2px_2px_0_rgba(255,255,255,1)] rotate-[-2deg]">
                            {currentQuestionIndex + 1}/{questions.length}
                        </span>
                        <button onClick={handlePrev} disabled={currentQuestionIndex === 0}
                            className="p-1 border-[2px] border-retro-ink bg-white shadow-[2px_2px_0_rgba(15,23,42,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-50 disabled:grayscale transition-all hover:bg-retro-yellow">
                            <ChevronLeft className="w-4 h-4 stroke-[3]" />
                        </button>
                        <button onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1}
                            className="p-1 border-[2px] border-retro-ink bg-white shadow-[2px_2px_0_rgba(15,23,42,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-50 disabled:grayscale transition-all hover:bg-retro-yellow">
                            <ChevronRight className="w-4 h-4 stroke-[3]" />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Scrollable body ── */}
            <div className={cn(
                "flex-1 overflow-y-auto custom-scrollbar relative z-10 transition-colors duration-300",
                activeTab === 'problem' ? 'bg-[#FDFBF7]' : activeTab === 'submissions' ? 'bg-[#eff6ff]' : activeTab === 'leaderboard' ? 'bg-[#fff5f5]' : 'bg-[#f0fdf4]'
            )}>
                {currentQuestion ? (
                    <>
                        {/* DESCRIPTION */}
                        {activeTab === 'problem' && (
                            <div className="p-6">
                                <h2 className="text-3xl md:text-4xl font-heading uppercase text-retro-ink mb-4">{currentQuestion.title}</h2>
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b-[3px] border-retro-ink border-dashed">
                                    <DifficultyBadge difficulty={currentQuestion.difficulty} />
                                </div>
                                <p className="text-base md:text-lg text-retro-ink font-sans font-medium leading-relaxed whitespace-pre-wrap mb-8">
                                    {formatTextWithCode(currentQuestion.description)}
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
                                    <div className="mt-8 mb-4 bg-retro-yellow border-[4px] border-retro-ink p-5 shadow-[6px_6px_0_rgba(15,23,42,1)] rotate-[-1deg]">
                                        <p className="text-[19px] font-black uppercase text-retro-ink mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 stroke-[3]" /> Constraints</p>
                                        <ul className="space-y-3.5 list-none pl-1">
                                            {currentQuestion.constraints.map((c, idx) => (
                                                <li key={idx} className="flex items-center gap-3">
                                                    <span className="text-retro-ink text-[12px] shrink-0">●</span>
                                                    <code className="font-mono font-black text-[14px] md:text-[16px] bg-white border-[2px] border-retro-ink shadow-[2px_2px_0_rgba(15,23,42,1)] px-2.5 py-1 text-retro-ink">
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
                            <div className="p-4">
                                <div className="mb-6 bg-[#ff4081] text-white border-[4px] border-retro-ink p-3 shadow-[4px_4px_0_rgba(15,23,42,1)] rotate-[-1deg]">
                                    <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3"><History className="w-7 h-7 stroke-[3]" /> Submissions History</h2>
                                </div>
                                <SubmissionsTab
                                    submissions={submissions}
                                    loading={submissionsLoading}
                                    questionId={selectedQuestion}
                                />
                            </div>
                        )}

                        {/* LEADERBOARD / SCOREBOARD */}
                        {activeTab === 'leaderboard' && (
                            <div className="p-4 space-y-4">
                                <div className="mb-6 bg-retro-blue text-white border-[4px] border-retro-ink p-3 shadow-[4px_4px_0_rgba(15,23,42,1)] rotate-[1deg]">
                                    <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3"><Trophy className="w-7 h-7 stroke-[3]" /> Live Scoreboard</h2>
                                </div>
                                {leaderboard.map((team, idx) => (
                                    <div key={idx} className="flex flex-col p-4 bg-white border-[4px] border-retro-ink shadow-[6px_6px_0_rgba(15,23,42,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center w-10 h-10 border-[3px] border-retro-ink bg-retro-blue text-white font-black text-lg rotate-[-3deg] shadow-[2px_2px_0_rgba(15,23,42,1)] shrink-0">
                                                    {team.rank || (idx + 1)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black uppercase tracking-tight text-retro-ink text-lg">{team.teamName}</span>
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                        <Users className="w-3 h-3 text-retro-ink stroke-[3]" />
                                                        {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b2ff59] border-[3px] border-retro-ink text-retro-ink font-black text-[14px] shadow-[3px_3px_0_rgba(15,23,42,1)] rotate-[2deg] shrink-0">
                                                <Trophy className="w-4 h-4 text-retro-ink stroke-[3]" />
                                                {team.score} pts
                                            </div>
                                        </div>

                                        {/* Player-wise score dropdown list */}
                                        {team.members && team.members.length > 0 && (
                                            <div className="mt-4 pt-3 border-t-[3px] border-retro-ink border-dashed space-y-2">
                                                {team.members.map((member, mIdx) => (
                                                    <div key={mIdx} className="flex items-center justify-between text-sm text-retro-ink px-1">
                                                        <span className="truncate max-w-[150px] font-bold uppercase">{member.username || member.name}</span>
                                                        <span className="font-black text-retro-ink shrink-0 bg-retro-yellow px-1 border-2 border-retro-ink rotate-[-1deg]">{member.score ?? 0} pts</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {leaderboard.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                        <Trophy className="w-12 h-12 text-retro-ink stroke-[2] mb-4 rotate-[15deg]" />
                                        <p className="text-lg font-black uppercase text-retro-ink bg-[#b2ff59] px-3 border-[2px] border-retro-ink shadow-[2px_2px_0_rgba(15,23,42,1)] rotate-[-1deg]">Scoreboard is empty</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TEST RESULTS */}
                        {activeTab === 'result' && (
                            <ResultsTab
                                isRunning={isRunning}
                                isSubmitting={isSubmitting}
                                output={output}
                                testResults={testResults}
                                verdict={verdict}
                                isSubmitMode={isSubmitMode}
                                initialTestCases={currentQuestion.sampleTestCases || currentQuestion.examples || initialTestCases}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                        <FileText className="w-12 h-12 text-retro-ink stroke-[2] mb-4 rotate-[-15deg]" />
                        <p className="text-lg font-black uppercase text-retro-ink bg-retro-yellow px-3 border-[2px] border-retro-ink shadow-[2px_2px_0_rgba(15,23,42,1)] rotate-[1deg]">No question loaded</p>
                    </div>
                )}
            </div>
        </div>
    );
}

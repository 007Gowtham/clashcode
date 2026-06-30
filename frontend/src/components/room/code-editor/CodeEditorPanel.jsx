'use client';

import {
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Loader2,
  Lock,
  Play,
  RotateCcw,
  Scan,
  Square,
  Terminal,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
  { value: 'python', label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

/* ─── Editor Header (Code tab + collapse toggle) ─── */
function EditorHeader({ collapsed, onToggleCollapse }) {
  return (
    <div className="flex items-center justify-between px-2 pt-2 border-b border-slate-200 dark:border-[#2d2d2d] bg-slate-50/80 dark:bg-[#1a1a1a]/80 shrink-0">
      <div className="flex gap-1">
        <button className="relative flex items-center gap-2 px-3 py-2 text-gray-900 dark:text-white">
          <Code2 className="w-4 h-4 stroke-[1.5] text-green-600 dark:text-green-400" />
          <span className="text-[13px] font-semibold">Code</span>
          {!collapsed && <span className="absolute left-2 right-2 -bottom-[1px] h-0.5 rounded-full bg-gray-900 dark:bg-white" />}
        </button>
      </div>
      <button
        onClick={onToggleCollapse}
        className="p-1.5 mr-1 text-gray-400 dark:text-[#8c8c8c] hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors"
        title={collapsed ? 'Expand Editor' : 'Collapse Editor'}
      >
        {collapsed
          ? <ChevronDown className="w-4 h-4 stroke-[1.5]" />
          : <ChevronUp className="w-4 h-4 stroke-[1.5]" />}
      </button>
    </div>
  );
}

/* ─── Editor Toolbar ─── */
function EditorToolbar({ language, onLanguageChange, onReset }) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];

  return (
    <div className="flex items-center justify-between p-2 px-3 border-b border-gray-100 dark:border-[#2d2d2d] bg-white dark:bg-[#1e1e1e] shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setOpen(p => !p)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#262626] px-2 py-1 rounded transition-colors"
          >
            {current.label}
            <ChevronDown className="w-3 h-3 stroke-[1.5]" />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-lg z-50 overflow-hidden">
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  onClick={() => { onLanguageChange(l.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors ${l.value === language ? 'text-blue-600 dark:text-[#ffa116] bg-blue-50/50 dark:bg-[#ffa116]/10' : 'text-gray-700 dark:text-slate-300'
                    }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${l.value === language ? 'bg-blue-500 dark:bg-[#ffa116]' : 'bg-transparent'}`} />
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-[#8c8c8c]">
          <Lock className="w-3 h-3 stroke-[1.5]" />
          <span>Auto</span>
        </div>
      </div>
      <button onClick={onReset} title="Reset" className="text-gray-400 dark:text-[#8c8c8c] hover:text-gray-600 dark:hover:text-[#ffa116] transition-colors">
        <RotateCcw className="w-4 h-4 stroke-[1.5]" />
      </button>
    </div>
  );
}

/* ─── Editor Footer ─── */
function EditorFooter({ language }) {
  return (
    <div className="flex items-center justify-between px-4 py-1 bg-white dark:bg-[#1e1e1e] border-t border-gray-100 dark:border-[#2d2d2d] text-[10px] text-gray-400 dark:text-[#8c8c8c] tracking-wide shrink-0">
      <span>Auto-saved</span>
      <span className="uppercase font-medium">{language}</span>
    </div>
  );
}

/* ─── Results Header (Testcase / Test Result tabs + collapse toggle) ─── */
function ResultsHeader({ activeView, onViewChange, collapsed, onToggleCollapse }) {
  const tabs = [
    { id: 'result', label: 'Test Result', icon: Terminal, color: 'text-green-600 dark:text-green-400' },
  ];
  return (
    <div className={cn(
      'flex items-center justify-between px-4 shrink-0',
      collapsed 
        ? 'py-2 border-t border-slate-200 dark:border-[#2d2d2d] bg-white dark:bg-[#1e1e1e]' 
        : 'pt-2 border-b border-slate-200 dark:border-[#2d2d2d] bg-slate-50/80 dark:bg-[#1a1a1a]/80'
    )}>
      <div className="flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3 text-sm font-semibold transition-all relative',
              collapsed ? 'py-1.5' : 'py-2',
              activeView === tab.id && !collapsed
                ? 'text-gray-900 dark:text-white border-b-2 border-gray-500 dark:border-[#ffa116]'
                : 'text-gray-500 dark:text-slate-400 border-b-2 border-transparent hover:text-gray-700 dark:hover:text-slate-200'
            )}
          >
            <tab.icon className={cn('w-4 h-4 stroke-[1.5]', tab.color)} />
            <span className="text-[13px] font-semibold">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {!collapsed && (
          <button className="p-1.5 text-gray-400 dark:text-[#8c8c8c] hover:text-gray-700 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors" title="Full Screen">
            <Scan className="w-4 h-4 stroke-[1.5]" />
          </button>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-gray-400 dark:text-[#8c8c8c] hover:text-gray-700 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors"
          title={collapsed ? 'Expand Results' : 'Collapse Results'}
        >
          {collapsed
            ? <ChevronUp className="w-4 h-4 stroke-[1.5]" />
            : <ChevronDown className="w-4 h-4 stroke-[1.5]" />}
        </button>
      </div>
    </div>
  );
}

/* ─── Results Content ─── */
function ResultsContent({ isRunning, isSubmitting, output, testResults, verdict, isSubmitMode, initialTestCases }) {
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
      <div className="flex-1 flex flex-col items-center justify-center p-10 h-full">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{isSubmitting ? 'Evaluating Submission...' : 'Running Code...'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
      {/* Status Banner */}
      {!isRunning && !isSubmitting && testResults?.length > 0 && (
        <div className={`mb-4 rounded-xl border px-4 py-3 flex items-center justify-between ${testResults.every(r => r.pass) ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400'}`}>
          <div className="flex items-center gap-2">
            <span>{testResults.every(r => r.pass) ? '✅' : '❌'}</span>
            <span className="font-semibold text-sm">{testResults.every(r => r.pass) ? (verdict || 'Accepted') : (verdict || 'Wrong Answer')}</span>
          </div>
          <span className="text-xs font-medium opacity-80">{testResults.filter(r => r.pass).length} / {testResults.length} passed</span>
        </div>
      )}
      {!isRunning && !isSubmitting && !testResults?.length && verdict && (
        <div className={`mb-4 rounded-xl border px-4 py-3 flex items-center gap-2 ${verdict === 'ACCEPTED' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400'}`}>
          <span>{verdict === 'ACCEPTED' ? '✅' : '❌'}</span>
          <span className="font-semibold text-sm">{verdict}</span>
        </div>
      )}

      {!isSubmitMode && cases.length > 0 ? (
        <>
          {/* Case tabs */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {cases.map((c, i) => (
              <button
                key={i}
                onClick={() => setActiveCase(i)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap',
                  activeCase === i ? 'bg-gray-100 dark:bg-[#262626] text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-[#262626]'
                )}
              >
                {c.pass != null && (
                  <div className={cn('rounded-[3px] w-3.5 h-3.5 flex items-center justify-center shrink-0', c.pass ? 'bg-green-500' : 'bg-red-500')}>
                    {c.pass ? <Check className="w-2.5 h-2.5 text-white stroke-[3]" /> : <X className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </div>
                )}
                {c.label}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {current?.input != null && (
              <div>
                <div className="text-xs text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Input</div>
                <div className="bg-gray-100/60 dark:bg-[#262626] border dark:border-[#333333] rounded-lg p-3 font-mono text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{current.input}</div>
              </div>
            )}
            {current?.actualOutput != null && (
              <div>
                <div className="text-xs text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Output</div>
                <div className={cn('rounded-lg p-3 font-mono text-sm whitespace-pre-wrap', current.pass ? 'bg-gray-100/60 dark:bg-[#262626] text-gray-900 dark:text-white border dark:border-[#333333]' : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400')}>
                  {current.actualOutput || '(no output)'}
                </div>
              </div>
            )}
            {current?.error != null && (
              <div>
                <div className="text-xs text-red-500 font-semibold uppercase tracking-wider mb-1.5">Runtime Error</div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg p-3 font-mono text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap">{current.error}</div>
              </div>
            )}
          </div>
        </>
      ) : (output?.consoleOutput || (typeof output === 'string' && output)) ? (
        <div>
          <div className="text-xs text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Console Output</div>
          <div className="bg-gray-100/60 dark:bg-[#262626] border dark:border-[#333333] rounded-lg p-3 font-mono text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{output.consoleOutput || output}</div>
        </div>
      ) : !isRunning && !isSubmitting && !testResults?.length ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Terminal className="w-8 h-8 text-gray-300 dark:text-[#333333] mb-3" />
          <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Run your code to see results</p>
          <p className="text-xs text-gray-400 dark:text-[#8c8c8c] mt-1">Click Run to test your solution</p>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Run / Submit Bar ─── */
function RunBar({ onRun, onSubmit, isRunning, isSubmitting }) {
  const loading = isRunning || isSubmitting;
  return (
    <div className="flex items-center justify-end gap-3 px-4 py-2.5 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-[#2d2d2d] shrink-0">
      <button
        onClick={onRun}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-[#262626] border border-emerald-200 dark:border-emerald-800/40 text-gray-700 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning
          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          : <Play className="w-3.5 h-3.5 fill-gray-400 text-gray-400 dark:text-[#8c8c8c]" />}
        {isRunning ? 'Running...' : 'Run'}
      </button>
      <button
        onClick={onSubmit}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-1.5 bg-slate-900 dark:bg-[#ffa116] text-white dark:text-black rounded-xl text-xs font-bold hover:bg-black dark:hover:bg-[#e08e12] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px"
      >
        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
}

/* ─── Drag Divider ─── */
function DragDivider({ onDrag }) {
  const dragging = useRef(false);

  const onMouseDown = useCallback((e) => {
    dragging.current = true;
    e.preventDefault();

    const onMouseMove = (ev) => {
      if (dragging.current) onDrag(ev.clientY);
    };
    const onMouseUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [onDrag]);

  return (
    <div
      onMouseDown={onMouseDown}
      className="h-1.5 bg-gray-100 dark:bg-[#262626] hover:bg-emerald-400/30 dark:hover:bg-[#ffa116]/30 cursor-row-resize shrink-0 transition-colors select-none"
    />
  );
}

/* ─── Main CodeEditorPanel ─── */
export default function CodeEditorPanel({
  code,
  setCode,
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  onResetCode,
  isRunning,
  isSubmitting,
  output,
  testResults,
  verdict,
  isSubmitMode,
  initialTestCases,
  style,
}) {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('result');
  // editorHeightPct: percentage of the body area taken by Monaco editor
  const [editorPct, setEditorPct] = useState(65);
  const [monacoTheme, setMonacoTheme] = useState('vs');

  // Sync Monaco editor theme with preferences
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setMonacoTheme(isDark ? 'vs-dark' : 'vs');
  }, []);

  // Auto-expand results when we get run/submit data
  useEffect(() => {
    if (isRunning || isSubmitting || (testResults && testResults.length > 0) || verdict) {
      setResultsCollapsed(false);
    }
  }, [isRunning, isSubmitting, testResults, verdict]);

  const handleRun = () => {
    const currentCode = editorRef.current?.getValue() || code;
    if (onRun) onRun(currentCode, '');
  };

  const handleSubmit = () => {
    const currentCode = editorRef.current?.getValue() || code;
    if (onSubmit) onSubmit(currentCode);
  };

  const handleDrag = useCallback((clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((clientY - rect.top) / rect.height) * 100;
    setEditorPct(Math.min(85, Math.max(15, pct)));
  }, []);

  // Determine flex sizing
  const editorStyle = editorCollapsed
    ? { height: 0, overflow: 'hidden' }
    : resultsCollapsed
      ? { flex: 1, overflow: 'hidden' }
      : { height: `${editorPct}%`, flexShrink: 0 };

  const resultsStyle = resultsCollapsed
    ? {} // header-only; auto height
    : editorCollapsed
      ? { flex: 1, overflow: 'hidden' }
      : { flex: 1, minHeight: 0, overflow: 'hidden' };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-[#1e1e1e]" style={style}>

      {/* ── Editor Header (always visible) ── */}
      <EditorHeader
        collapsed={editorCollapsed}
        onToggleCollapse={() => setEditorCollapsed(p => !p)}
      />

      {/* ── Editor Toolbar (hide when collapsed) ── */}
      {!editorCollapsed && (
        <EditorToolbar
          language={language}
          onLanguageChange={onLanguageChange}
          onReset={() => { if (onResetCode) onResetCode(); }}
        />
      )}

      {/* ── Body: editor + divider + results ── */}
      <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden min-h-0">

        {/* Monaco Editor area */}
        <div className="flex flex-col overflow-hidden" style={editorStyle}>
          <div className="flex-1 relative overflow-hidden">
            <MonacoEditor
              height="100%"
              language={language || 'python'}
              value={code || ''}
              onChange={(val) => { if (setCode && val !== undefined) setCode(val); }}
              onMount={(editor) => { editorRef.current = editor; }}
              theme={monacoTheme}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                padding: { top: 12, bottom: 12 },
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                suggest: { enabled: true },
                quickSuggestions: true,
              }}
            />
          </div>
          <EditorFooter language={language} />
        </div>

        {/* Drag divider — only when both visible */}
        {!editorCollapsed && !resultsCollapsed && (
          <DragDivider onDrag={handleDrag} />
        )}

        {/* Results Panel */}
        <div className="flex flex-col overflow-hidden" style={resultsStyle}>
          <ResultsHeader
            activeView={activeView}
            onViewChange={setActiveView}
            collapsed={resultsCollapsed}
            onToggleCollapse={() => setResultsCollapsed(p => !p)}
          />
          {!resultsCollapsed && (
            <ResultsContent
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              output={output}
              testResults={testResults}
              verdict={verdict}
              isSubmitMode={isSubmitMode}
              initialTestCases={initialTestCases}
            />
          )}
        </div>
      </div>

      {/* ── Run / Submit bar (always visible) ── */}
      <RunBar
        onRun={handleRun}
        onSubmit={handleSubmit}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

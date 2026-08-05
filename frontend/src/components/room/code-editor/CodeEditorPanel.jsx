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
    <div className="flex items-center justify-between px-2 pt-2 border-b-[4px] border-retro-ink bg-[#00e5ff] shrink-0 z-10 relative">
      <div className="flex gap-2">
        <button className="relative flex items-center gap-2 px-4 py-2 text-[13px] font-black uppercase tracking-wider transition-all border-t-[3px] border-x-[3px] border-retro-ink bg-white text-retro-ink translate-y-[3px] pb-3 shadow-[0_-3px_0_rgba(15,23,42,1)_inset]">
          <Code2 className="w-4 h-4 stroke-[3]" />
          <span>Code</span>
        </button>
      </div>
    
    </div>
  );
}

/* ─── Editor Toolbar ─── */
function EditorToolbar({ language, onLanguageChange, onReset }) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];

  return (
    <div className="flex items-center justify-between p-3 border-b-[3px] border-retro-ink border-dashed bg-[#fff8e1] shrink-0 z-20 relative">
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setOpen(p => !p)}
            className="flex items-center gap-2 text-sm font-black uppercase text-retro-ink bg-retro-yellow border-[3px] border-retro-ink px-3 py-1.5 shadow-[3px_3px_0_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all rotate-[-1deg] hover:rotate-[0deg]"
          >
            {current.label}
            <ChevronDown className="w-4 h-4 stroke-[3]" />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-2 w-40 bg-white border-[3px] border-retro-ink shadow-[4px_4px_0_rgba(15,23,42,1)] z-50 flex flex-col">
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  onClick={() => { onLanguageChange(l.value); setOpen(false); }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-[13px] font-black uppercase flex items-center gap-3 border-b-[2px] border-retro-ink last:border-b-0 hover:bg-[#b2ff59] transition-colors',
                    l.value === language ? 'bg-retro-ink text-white hover:bg-retro-ink' : 'text-retro-ink'
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-white bg-gray-400 px-2 py-1 border-[2px] border-retro-ink rotate-[1deg]">
          <Lock className="w-3.5 h-3.5 stroke-[3]" />
          <span>Auto</span>
        </div>
      </div>
      <button onClick={onReset} title="Reset Code" className="p-2 bg-[#ff4081] text-white border-[3px] border-retro-ink shadow-[3px_3px_0_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:rotate-[-5deg] transition-all">
        <RotateCcw className="w-4 h-4 stroke-[3]" />
      </button>
    </div>
  );
}

/* ─── Editor Footer ─── */
function EditorFooter({ language }) {
  return (
    <div className="flex items-center justify-between px-4 py-0.5 bg-retro-ink text-[10px] font-black text-white uppercase tracking-wider shrink-0">
      <span>Auto-saved</span>
      <span className="bg-white text-retro-ink px-1.5 py-0 border-[2px] border-retro-ink">{language}</span>
    </div>
  );
}



/* ─── Run / Submit Bar ─── */
function RunBar({ onRun, onSubmit, isRunning, isSubmitting }) {
  const loading = isRunning || isSubmitting;
  return (
    <div className="flex items-center bg-[#FEFBEA] justify-end gap-4 px-4 py-3 shrink-0 relative z-20">
      <button
        onClick={onRun}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-1.5 bg-white border-[3px] border-retro-ink text-retro-ink text-[14px] font-black uppercase tracking-wider shadow-[4px_4px_0_rgba(15,23,42,1)] hover:bg-[#b2ff59] hover:-translate-y-1 active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:grayscale"
      >
        {isRunning
          ? <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
          : <Play className="w-4 h-4 fill-retro-ink text-retro-ink stroke-[3]" />}
        {isRunning ? 'Running' : 'Run'}
      </button>
      <button
        onClick={onSubmit}
        disabled={loading}
        className="flex items-center gap-2 px-8 py-1.5 bg-[#ff4081] border-[3px] border-retro-ink text-white text-[15px] font-black uppercase tracking-wider shadow-[4px_4px_0_rgba(15,23,42,1)] hover:bg-[#e03872] hover:-translate-y-1 active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:grayscale rotate-[-1deg]"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />}
        {isSubmitting ? 'Submitting' : 'Submit'}
      </button>
    </div>
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
  style,
}) {
  const editorRef = useRef(null);
  const [editorCollapsed, setEditorCollapsed] = useState(false);

  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('neo-brutalism', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#FEFBEA',
      }
    });
  };

  // Determine flex sizing
  const editorStyle = editorCollapsed
    ? { height: 0, overflow: 'hidden' }
    : { flex: 1, overflow: 'hidden' };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white relative" style={style}>
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

      {/* ── Body: editor ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-white relative z-0">

        {/* Monaco Editor area */}
        <div className="flex flex-col overflow-hidden relative" style={editorStyle}>
          <div className="flex-1 relative overflow-hidden bg-white">
            <MonacoEditor
              height="100%"
              language={language || 'python'}
              value={code || ''}
              onChange={(val) => { if (setCode && val !== undefined) setCode(val); }}
              onMount={(editor) => { editorRef.current = editor; }}
              beforeMount={handleEditorWillMount}
              theme="neo-brutalism"
              options={{
                minimap: { enabled: false },
                fontSize: 16,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                fontFamily: "'JetBrains Mono', 'Space Mono', 'Fira Code', monospace",
                fontWeight: "600",
                fontLigatures: true,
                padding: { top: 16, bottom: 16 },
                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                suggest: { enabled: true },
                quickSuggestions: true,
                renderLineHighlight: 'all',
                cursorBlinking: 'solid',
                cursorWidth: 3,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Run / Submit bar (always visible) ── */}
      <RunBar
        onRun={() => {
          const currentCode = editorRef.current?.getValue() || code;
          if (onRun) onRun(currentCode, '');
        }}
        onSubmit={() => {
          const currentCode = editorRef.current?.getValue() || code;
          if (onSubmit) onSubmit(currentCode);
        }}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
      />

      {/* ── Editor Footer ── */}
      <EditorFooter language={language} />
    </div>
  );
}

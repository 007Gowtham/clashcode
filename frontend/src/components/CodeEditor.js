'use client';

import React, { useRef } from 'react';

const CODE_FONT_FAMILY =
  "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, Menlo, Monaco, monospace";

export default function CodeEditor({
  value = '',
  onChange,
  onRun,
  disabled = false,
  className = '',
}) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);

  const lines = (value || '').split('\n');
  const lineCount = Math.max(lines.length, 1);

  // Sync scroll between textarea and line numbers gutter
  const handleScroll = (e) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Ctrl+Enter or Cmd+Enter to Run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onRun) onRun();
      return;
    }

    // Tab key handling (4 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      if (e.shiftKey) {
        // Shift+Tab: Unindent current line
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const line = val.substring(lineStart, start);
        if (line.startsWith('    ')) {
          const newVal = val.substring(0, lineStart) + val.substring(lineStart + 4);
          onChange(newVal);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - 4);
          }, 0);
        } else if (line.startsWith('  ')) {
          const newVal = val.substring(0, lineStart) + val.substring(lineStart + 2);
          onChange(newVal);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - 2);
          }, 0);
        }
      } else {
        // Tab: Insert 4 spaces
        const newVal = val.substring(0, start) + '    ' + val.substring(end);
        onChange(newVal);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
      }
      return;
    }

    // Auto-indent on Enter
    if (e.key === 'Enter') {
      const start = textarea.selectionStart;
      const val = textarea.value;
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(lineStart, start);
      const match = currentLine.match(/^(\s+)/);
      const indent = match ? match[1] : '';

      // Check if previous non-whitespace character opens a block
      const prevChar = val.substring(0, start).trim().slice(-1);
      const extraIndent = prevChar === '{' || prevChar === ':' ? '    ' : '';

      e.preventDefault();
      const newVal = val.substring(0, start) + '\n' + indent + extraIndent + val.substring(start);
      onChange(newVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd =
          start + 1 + indent.length + extraIndent.length;
      }, 0);
      return;
    }

    // Auto-close brackets & quotes
    const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
    if (pairs[e.key]) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start === end) {
        const val = textarea.value;
        const closeChar = pairs[e.key];
        e.preventDefault();
        const newVal = val.substring(0, start) + e.key + closeChar + val.substring(end);
        onChange(newVal);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
        return;
      }
    }

    // Skip closing bracket if typed immediately before it
    const closingChars = [')', ']', '}', '"', "'"];
    if (closingChars.includes(e.key)) {
      const start = textarea.selectionStart;
      const val = textarea.value;
      if (val[start] === e.key) {
        e.preventDefault();
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        return;
      }
    }
  };

  return (
    <div
      className={`relative flex-1 min-h-0 flex w-full h-full bg-[var(--paper)] overflow-hidden ${className}`}
    >
      {/* Line Numbers Gutter */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="w-12 py-3 pr-3 text-right bg-[var(--paper)] border-r border-[var(--ink-border)] text-[var(--ink)] opacity-35 select-none overflow-hidden font-mono text-[13px] leading-[1.6]"
        style={{ fontFamily: CODE_FONT_FAMILY }}
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Code Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        disabled={disabled}
        spellCheck="false"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className="flex-1 h-full w-full py-3 px-3 bg-transparent text-[var(--ink)] font-mono text-[13px] leading-[1.6] outline-none resize-none overflow-auto whitespace-pre border-0 focus:ring-0 custom-scrollbar"
        style={{
          tabSize: 4,
          fontFamily: CODE_FONT_FAMILY,
        }}
      />
    </div>
  );
}

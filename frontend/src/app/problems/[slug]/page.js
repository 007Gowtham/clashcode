'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { problemsApi, submissionsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
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

function ProblemSolvingContent({ params }) {
  const resolvedParams = React.use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [language, setLanguage] = useState('PYTHON');
  const [userCode, setUserCode] = useState('');
  const [codeCache, setCodeCache] = useState({});

  const [executing, setExecuting] = useState(false);
  const [submission, setSubmission] = useState(null);

  // Two-dimensional Resizable Workspace
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

  const getHiddenWrapper = useCallback(() => {
    return codeCache[language]?.hiddenWrapper || '';
  }, [codeCache, language]);

  const buildFullCode = useCallback(() => {
    const wrapper = getHiddenWrapper();
    if (!wrapper) return userCode;
    return userCode + '\n' + wrapper;
  }, [userCode, getHiddenWrapper]);

  const fetchProblem = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await problemsApi.getBySlug(slug);
      setProblem(data);

      const cache = {};
      if (data.starterCodes && data.starterCodes.length > 0) {
        data.starterCodes.forEach((sc) => {
          const { userCode: uc, hiddenWrapper: hw } = splitTemplate(sc.templateCode);
          cache[sc.language] = { userCode: uc, hiddenWrapper: hw };
        });
      }
      ['JAVA', 'PYTHON', 'CPP', 'JAVASCRIPT'].forEach((lang) => {
        if (!cache[lang]) {
          cache[lang] = { userCode: DEFAULT_USER_TEMPLATES[lang], hiddenWrapper: '' };
        }
      });
      setCodeCache(cache);

      const defaultLang = data.starterCodes?.[0]?.language || 'PYTHON';
      setLanguage(defaultLang);
      setUserCode(cache[defaultLang]?.userCode || DEFAULT_USER_TEMPLATES[defaultLang]);
    } catch (err) {
      setError(err.message || 'Problem not found');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  const handleLanguageChange = (newLang) => {
    setCodeCache((prev) => ({
      ...prev,
      [language]: { ...prev[language], userCode },
    }));
    setLanguage(newLang);
    setUserCode(codeCache[newLang]?.userCode || DEFAULT_USER_TEMPLATES[newLang]);
  };

  const pollSubmission = useCallback(async (subId) => {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const updated = await submissionsApi.get(subId);
        setSubmission(updated);
        if (updated.status === 'DONE') {
          break;
        }
      } catch (err) {
        console.warn('Poll error:', err);
      }
    }
    setExecuting(false);
  }, []);

  const handleRunCode = async () => {
    if (!problem || executing) return;
    setExecuting(true);
    setError('');
    try {
      const initial = await submissionsApi.submit({
        problemId: problem.id,
        language,
        sourceCode: buildFullCode(),
        mode: 'RUN',
      });
      setSubmission(initial);
      pollSubmission(initial.id);
    } catch (err) {
      setError(err.message || 'Run request failed');
      setExecuting(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!problem || executing) return;
    setExecuting(true);
    setError('');
    try {
      const initial = await submissionsApi.submit({
        problemId: problem.id,
        language,
        sourceCode: buildFullCode(),
        mode: 'SUBMIT',
      });
      setSubmission(initial);
      pollSubmission(initial.id);
    } catch (err) {
      setError(err.message || 'Submission request failed');
      setExecuting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-[14px] text-center opacity-60">Loading problem...</div>;
  }

  if (error && !problem) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 border border-[var(--ink)] rounded-[6px] text-center">
        <p className="text-[14px] mb-4 font-semibold">{error}</p>
        <Link href="/problems" className="text-[12px] underline">
          ← Back to Problems
        </Link>
      </div>
    );
  }

  const hasWrapper = Boolean(codeCache[language]?.hiddenWrapper);

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-[var(--paper)] text-[var(--ink)]">
      {/* Top Header Bar */}
      <div className="border-b border-[var(--ink-border)] px-4 h-12 flex items-center justify-between bg-[var(--paper)] shrink-0 select-none">
        <div className="flex items-center space-x-3 text-[14px]">
          <Link href="/problems" className="opacity-60 hover:opacity-100 transition-hover">
            ← Problems
          </Link>
          <span className="opacity-30">/</span>
          <span className="font-semibold">{problem.title}</span>
          <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 border border-[var(--ink-border)] rounded">
            {problem.difficulty}
          </span>
          <span className="opacity-60 text-[12px]">{problem.points} pts</span>
        </div>

        {/* Language Selector */}
        <div className="flex items-center space-x-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={executing}
            className="px-2.5 py-1 text-[12px] border border-[var(--ink-border)] rounded-[6px] bg-[var(--paper)] text-[var(--ink)] focus:outline-none cursor-pointer"
          >
            <option value="PYTHON">Python 3</option>
            <option value="JAVA">Java 21</option>
            <option value="CPP">C++ 20</option>
            <option value="JAVASCRIPT">Node.js</option>
          </select>
        </div>
      </div>

      {/* Main Split Workspace: Left (Question) + Drag Divider + Right (Editor & Testcases) */}
      <div
        ref={workspaceRef}
        className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative"
      >
        {/* Left Panel: Problem Statement with Always-Visible Scrollbar */}
        <div
          style={{ width: `${leftWidth}%` }}
          className="w-full md:w-auto h-full min-h-0 flex flex-col bg-[var(--paper)] overflow-y-scroll question-scrollbar shrink-0"
        >
          <ProblemStatement problem={problem} />
        </div>

        {/* HORIZONTAL DRAG DIVIDER (Resize left/right width) */}
        <div
          onMouseDown={startHorizontalDrag}
          className="hidden md:flex w-1.5 h-full bg-[var(--paper)] border-x border-[var(--ink-border)] hover:bg-[var(--ink-hover)] active:bg-[var(--ink-selected)] cursor-col-resize items-center justify-center shrink-0 group select-none transition-colors"
          title="Drag to resize horizontally"
        >
          <div className="w-0.5 h-8 bg-[var(--ink-border)] group-hover:bg-[var(--ink)] rounded" />
        </div>

        {/* Right Panel: Code Editor + Vertical Divider + LeetCode-style TestCase Console */}
        <div
          style={{ width: `calc(${100 - leftWidth}% - 6px)` }}
          className="w-full md:w-auto flex-1 h-full min-h-0 flex flex-col bg-[var(--paper)] overflow-hidden"
        >
          {/* Editor Header Note */}
          <div className="px-4 py-2 flex items-center justify-between text-[12px] border-b border-[var(--ink-border)] bg-[var(--paper)] shrink-0">
            <span className="font-semibold">Solution ({language})</span>
            <span className="opacity-50">Ctrl+Enter to Run</span>
          </div>

          {/* Code Editor with internal scrollbar */}
          <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
            <CodeEditor
              value={userCode}
              onChange={setUserCode}
              onRun={handleRunCode}
              disabled={executing}
            />
            {hasWrapper && (
              <div className="px-4 py-1.5 border-t border-[var(--ink-border)] text-[11px] opacity-50 bg-[var(--paper)] font-mono shrink-0">
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

          {/* Testcase & Execution Results Console with Dynamic Resized Height */}
          <TestCaseConsole
            sampleCases={problem.sampleTestCases || []}
            submissionResult={submission}
            executing={executing}
            onRun={handleRunCode}
            onSubmit={handleSubmitCode}
            disabled={executing || !problem}
            height={bottomHeight}
          />
        </div>
      </div>
    </div>
  );
}

export default function ProblemSolvingPage(props) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[14px]">Loading problem...</div>}>
      <ProblemSolvingContent {...props} />
    </Suspense>
  );
}

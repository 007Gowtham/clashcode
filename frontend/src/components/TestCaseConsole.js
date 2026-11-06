'use client';

import React, { useState } from 'react';

/**
 * LeetCode-style Testcase & Execution Results bottom drawer.
 */
export default function TestCaseConsole({
  sampleCases = [],
  submissionResult = null,
  executing = false,
  onRun,
  onSubmit,
  disabled = false,
  height,
}) {
  const [activeTab, setActiveTab] = useState('testcase'); // 'testcase' | 'result'
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);

  // When submissionResult arrives, switch to result tab automatically
  React.useEffect(() => {
    if (submissionResult || executing) {
      setActiveTab('result');
    }
  }, [submissionResult, executing]);

  const sampleResults = submissionResult?.sampleResults || [];
  const hasSampleResults = sampleResults.length > 0;
  const isAccepted = submissionResult?.verdict === 'ACCEPTED';

  return (
    <div
      style={height ? { height: `${height}px` } : undefined}
      className={`border-t border-[var(--ink-border)] bg-[var(--paper)] flex flex-col shrink-0 overflow-hidden select-text ${
        height ? '' : 'h-64'
      }`}
    >
      {/* Console Tab Header & Run / Submit Controls */}
      <div className="h-10 border-b border-[var(--ink-border)] px-4 flex items-center justify-between bg-[var(--paper)] shrink-0">
        <div className="flex items-center space-x-2 text-[13px]">
          <button
            onClick={() => setActiveTab('testcase')}
            className={`px-3 py-1.5 transition-hover font-medium cursor-pointer ${
              activeTab === 'testcase'
                ? 'font-semibold text-[var(--ink)] border-b-2 border-[var(--ink)]'
                : 'text-[var(--ink)] opacity-60 hover:opacity-100'
            }`}
          >
            Testcase
          </button>
          <button
            onClick={() => setActiveTab('result')}
            className={`px-3 py-1.5 transition-hover font-medium flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'result'
                ? 'font-semibold text-[var(--ink)] border-b-2 border-[var(--ink)]'
                : 'text-[var(--ink)] opacity-60 hover:opacity-100'
            }`}
          >
            <span>Test Result</span>
            {submissionResult && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded font-semibold border ${
                  isAccepted
                    ? 'border-[var(--ink)] text-[var(--ink)] bg-[var(--ink-hover)]'
                    : 'border-[var(--ink)] text-[var(--ink)] opacity-70'
                }`}
              >
                {isAccepted ? 'Passed' : 'Failed'}
              </span>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onRun}
            disabled={disabled || executing}
            className="px-3 py-1 text-[13px] font-semibold border border-[var(--ink-border)] text-[var(--ink)] hover:bg-[var(--ink-hover)] rounded transition-hover disabled:opacity-40 cursor-pointer"
          >
            {executing ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={onSubmit}
            disabled={disabled || executing}
            className="px-4 py-1 text-[13px] font-semibold bg-[var(--ink)] text-[var(--paper)] hover:opacity-90 rounded transition-hover disabled:opacity-40 cursor-pointer"
          >
            {executing ? 'Judging...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Console Tab Content with independent scrollbar */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 text-[13px] custom-scrollbar">
        {/* TAB 1: TESTCASE */}
        {activeTab === 'testcase' && (
          <div className="space-y-3">
            {sampleCases.length === 0 ? (
              <div className="text-[13px] opacity-60 py-4">
                No sample test cases provided for this problem.
              </div>
            ) : (
              <>
                {/* Case Selector Pills */}
                <div className="flex items-center space-x-2">
                  {sampleCases.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCaseIndex(idx)}
                      className={`px-2.5 py-1 text-[12px] rounded transition-hover cursor-pointer ${
                        selectedCaseIndex === idx
                          ? 'bg-[var(--ink-selected)] font-semibold text-[var(--ink)]'
                          : 'bg-[var(--ink-hover)] text-[var(--ink)] opacity-70 hover:opacity-100'
                      }`}
                    >
                      Case {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Case Input & Expected Output */}
                {sampleCases[selectedCaseIndex] && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60 mb-1">
                        Input
                      </div>
                      <pre className="p-2.5 bg-[var(--ink-hover)] border border-[var(--ink-border)] rounded font-mono text-[12px] text-[var(--ink)] overflow-auto max-h-24 custom-scrollbar whitespace-pre">
                        {sampleCases[selectedCaseIndex].input}
                      </pre>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60 mb-1">
                        Expected Output
                      </div>
                      <pre className="p-2.5 bg-[var(--ink-hover)] border border-[var(--ink-border)] rounded font-mono text-[12px] text-[var(--ink)] overflow-auto max-h-20 custom-scrollbar whitespace-pre">
                        {sampleCases[selectedCaseIndex].expectedOutput}
                      </pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: TEST RESULT */}
        {activeTab === 'result' && (
          <div>
            {executing ? (
              <div className="py-6 text-center space-y-2">
                <div className="text-[14px] font-semibold text-[var(--ink)]">
                  Running your solution...
                </div>
                <div className="text-[12px] opacity-60">
                  Executing against sample test cases in the sandbox.
                </div>
              </div>
            ) : !submissionResult ? (
              <div className="py-8 text-center text-[13px] opacity-60">
                Run your code against sample test cases to view results here.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Verdict Summary Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink-border)] pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[16px] font-semibold text-[var(--ink)]">
                      {submissionResult.verdict === 'ACCEPTED'
                        ? 'Passed'
                        : submissionResult.verdict || submissionResult.status}
                    </span>
                    <span className="text-[12px] opacity-60">•</span>
                    <span className="text-[12px] opacity-80">
                      Runtime: {submissionResult.runtimeMs != null ? `${submissionResult.runtimeMs} ms` : '-'}
                    </span>
                    {submissionResult.memoryKb != null && (
                      <>
                        <span className="text-[12px] opacity-60">•</span>
                        <span className="text-[12px] opacity-80">
                          Memory: {(submissionResult.memoryKb / 1024).toFixed(1)} MB
                        </span>
                      </>
                    )}
                  </div>

                  {submissionResult.score != null && (
                    <div className="text-[13px] font-semibold text-[var(--ink)]">
                      Score: {submissionResult.score} pts
                    </div>
                  )}
                </div>

                {/* Compiler / Error Output if present */}
                {submissionResult.compilerOutput && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
                      Compiler Output / Errors
                    </div>
                    <pre className="p-3 bg-[var(--ink-hover)] border border-[var(--ink-border)] rounded font-mono text-[12px] text-[var(--ink)] overflow-auto max-h-32 custom-scrollbar whitespace-pre">
                      {submissionResult.compilerOutput}
                    </pre>
                  </div>
                )}

                {/* Sample Case Breakdown (if RUN mode) */}
                {hasSampleResults && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      {sampleResults.map((res, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedCaseIndex(idx)}
                          className={`px-2.5 py-1 text-[12px] rounded transition-hover cursor-pointer flex items-center space-x-1 ${
                            selectedCaseIndex === idx
                              ? 'bg-[var(--ink-selected)] font-semibold text-[var(--ink)]'
                              : 'bg-[var(--ink-hover)] text-[var(--ink)] opacity-70 hover:opacity-100'
                          }`}
                        >
                          <span>Case {idx + 1}</span>
                          <span className="text-[10px] opacity-80">
                            ({res.passed ? 'Passed' : 'Failed'})
                          </span>
                        </button>
                      ))}
                    </div>

                    {sampleResults[selectedCaseIndex] && (
                      <div className="space-y-2.5 pt-1">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60 mb-1">
                            Input
                          </div>
                          <pre className="p-2 bg-[var(--ink-hover)] border border-[var(--ink-border)] rounded font-mono text-[12px] overflow-auto max-h-24 custom-scrollbar whitespace-pre">
                            {sampleResults[selectedCaseIndex].input}
                          </pre>
                        </div>

                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60 mb-1">
                            Your Output
                          </div>
                          <pre className="p-2 bg-[var(--ink-hover)] border border-[var(--ink-border)] rounded font-mono text-[12px] overflow-auto max-h-24 custom-scrollbar whitespace-pre">
                            {sampleResults[selectedCaseIndex].actualOutput || '(no output)'}
                          </pre>
                        </div>

                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60 mb-1">
                            Expected Output
                          </div>
                          <pre className="p-2 bg-[var(--ink-hover)] border border-[var(--ink-border)] rounded font-mono text-[12px] overflow-auto max-h-24 custom-scrollbar whitespace-pre">
                            {sampleResults[selectedCaseIndex].expectedOutput}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

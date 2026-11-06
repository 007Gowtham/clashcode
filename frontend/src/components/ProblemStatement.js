'use client';

import React, { useMemo } from 'react';

/**
 * Renders inline markdown tokens: `code` and **bold**.
 */
function renderInlineTokens(str) {
  if (!str) return null;
  const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="font-mono text-[12px] px-1.5 py-0.5 bg-[var(--ink-hover)] border border-[var(--ink-border)] rounded text-[var(--ink)] mx-0.5 whitespace-pre-wrap"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-[var(--ink)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/**
 * Parses raw problem statement markdown into structured semantic blocks:
 * paragraphs, headings, LeetCode-style example cards, constraints, lists, code fences.
 */
function parseProblemMarkdown(markdown, problemTitle = '') {
  if (!markdown) return [];

  // Normalize newlines
  let text = markdown.replace(/\r\n/g, '\n').trim();

  // Strip leading redundant title heading if present (e.g. "### Two Sum")
  if (text.startsWith('#')) {
    const firstLineEnd = text.indexOf('\n');
    const firstLine = (firstLineEnd === -1 ? text : text.substring(0, firstLineEnd)).trim();
    const headingClean = firstLine.replace(/^#+\s*/, '').trim().toLowerCase();
    const titleClean = (problemTitle || '').trim().toLowerCase();
    if (!titleClean || headingClean === titleClean || headingClean.includes(titleClean)) {
      text = firstLineEnd === -1 ? '' : text.substring(firstLineEnd + 1).trim();
    }
  }

  const lines = text.split('\n');
  const blocks = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Standalone Code Fence (```lang ... ```)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++; // skip closing fence
      }
      blocks.push({
        type: 'code',
        language: lang,
        content: codeLines.join('\n'),
      });
      continue;
    }

    // Helper to test if a line marks an Example header
    const isExampleHeader = (str) => {
      return (
        /^#{1,6}\s*Example\s*\d+/i.test(str) ||
        /^\*\*Example\s*\d+[:.]?.*\*\*$/i.test(str) ||
        /^Example\s*\d+:/i.test(str)
      );
    };

    // Helper to test if a line marks Constraints header
    const isConstraintsHeader = (str) => {
      return /^#{1,6}\s*Constraints:?/i.test(str) || /^\*\*Constraints:?\*\*$/i.test(str);
    };

    // 2. Heading or Example / Constraints Detection
    if (trimmed.startsWith('#') || isExampleHeader(trimmed) || isConstraintsHeader(trimmed)) {
      // Check Example
      if (isExampleHeader(trimmed)) {
        const cleanTitle = trimmed
          .replace(/^#+\s*/, '')
          .replace(/^\*\*/, '')
          .replace(/\*\*$/, '')
          .replace(/:$/, '')
          .trim();

        i++;
        const exampleLines = [];
        let insideFence = false;

        while (i < lines.length) {
          const peek = lines[i].trim();
          if (peek.startsWith('```')) {
            insideFence = !insideFence;
            i++;
            continue;
          }
          if (!insideFence) {
            if (
              peek.startsWith('#') ||
              isExampleHeader(peek) ||
              isConstraintsHeader(peek)
            ) {
              break;
            }
          }
          exampleLines.push(lines[i]);
          i++;
        }

        // Parse structured fields inside the example
        let inputStr = '';
        let outputStr = '';
        let explanationStr = '';
        const rawLines = [];

        let currentField = null;

        for (const eline of exampleLines) {
          const t = eline.trim();
          if (!t) continue;

          if (/^(\*\*)?Input:?(\*\*)?/i.test(t)) {
            currentField = 'input';
            inputStr = t.replace(/^(\*\*)?Input:?(\*\*)?\s*/i, '');
          } else if (/^(\*\*)?Output:?(\*\*)?/i.test(t)) {
            currentField = 'output';
            outputStr = t.replace(/^(\*\*)?Output:?(\*\*)?\s*/i, '');
          } else if (/^(\*\*)?Explanation:?(\*\*)?/i.test(t)) {
            currentField = 'explanation';
            explanationStr = t.replace(/^(\*\*)?Explanation:?(\*\*)?\s*/i, '');
          } else {
            // Continuation line for previous field if applicable
            if (currentField === 'explanation') {
              explanationStr += ' ' + t;
            } else if (currentField === 'input' && !outputStr) {
              inputStr += ' ' + t;
            } else if (currentField === 'output' && !explanationStr) {
              outputStr += ' ' + t;
            } else {
              rawLines.push(t);
            }
          }
        }

        blocks.push({
          type: 'example',
          title: cleanTitle || 'Example',
          input: inputStr,
          output: outputStr,
          explanation: explanationStr,
          rawLines,
        });
        continue;
      }

      // Check Constraints
      if (isConstraintsHeader(trimmed)) {
        i++;
        const constraintItems = [];
        while (i < lines.length) {
          const peek = lines[i].trim();
          if (!peek) {
            i++;
            continue;
          }
          if (peek.startsWith('#') || isExampleHeader(peek)) break;
          if (peek.startsWith('* ') || peek.startsWith('- ')) {
            constraintItems.push(peek.replace(/^[-*]\s*/, ''));
            i++;
          } else {
            constraintItems.push(peek);
            i++;
          }
        }
        blocks.push({
          type: 'constraints',
          items: constraintItems,
        });
        continue;
      }

      // Other Standard Heading
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        blocks.push({
          type: 'heading',
          level: headingMatch[1].length,
          text: headingMatch[2].trim(),
        });
        i++;
        continue;
      }
    }

    // 3. Unordered list (- item or * item)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems = [];
      while (i < lines.length) {
        const peek = lines[i].trim();
        if (!peek) {
          if (
            i + 1 < lines.length &&
            (lines[i + 1].trim().startsWith('- ') || lines[i + 1].trim().startsWith('* '))
          ) {
            i++;
            continue;
          }
          break;
        }
        if (peek.startsWith('- ') || peek.startsWith('* ')) {
          listItems.push(peek.replace(/^[-*]\s*/, ''));
          i++;
        } else {
          break;
        }
      }
      blocks.push({
        type: 'unordered-list',
        items: listItems,
      });
      continue;
    }

    // 4. Ordered list (1. item, 2. item)
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems = [];
      while (i < lines.length) {
        const peek = lines[i].trim();
        if (!peek) {
          if (i + 1 < lines.length && /^\d+\.\s+/.test(lines[i + 1].trim())) {
            i++;
            continue;
          }
          break;
        }
        if (/^\d+\.\s+/.test(peek)) {
          listItems.push(peek.replace(/^\d+\.\s*/, ''));
          i++;
        } else {
          break;
        }
      }
      blocks.push({
        type: 'ordered-list',
        items: listItems,
      });
      continue;
    }

    // 5. Paragraph
    const paraLines = [];
    while (i < lines.length) {
      const peek = lines[i].trim();
      if (!peek) break;
      if (
        peek.startsWith('#') ||
        peek.startsWith('```') ||
        peek.startsWith('- ') ||
        peek.startsWith('* ') ||
        /^\d+\.\s+/.test(peek) ||
        isExampleHeader(peek) ||
        isConstraintsHeader(peek)
      ) {
        break;
      }
      paraLines.push(peek);
      i++;
    }
    blocks.push({
      type: 'paragraph',
      text: paraLines.join(' '),
    });
  }

  return blocks;
}

export default function ProblemStatement({ problem }) {
  if (!problem) {
    return (
      <div className="p-8 text-center text-[14px] opacity-60">
        Loading problem details...
      </div>
    );
  }

  const {
    title = '',
    difficulty = 'MEDIUM',
    points = 100,
    timeLimitMs = 2000,
    memoryLimitMb = 256,
    statementMarkdown = '',
    sampleTestCases = [],
  } = problem;

  const blocks = useMemo(() => {
    return parseProblemMarkdown(statementMarkdown, title);
  }, [statementMarkdown, title]);

  const hasExampleBlocks = blocks.some((b) => b.type === 'example');

  return (
    <div className="p-6 space-y-6 select-text text-[var(--ink)]">
      {/* Title & Metadata Header */}
      <div className="border-b border-[var(--ink-border)] pb-4 space-y-3">
        <h1 className="text-[22px] font-semibold text-[var(--ink)] tracking-tight">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
          <span className="px-2.5 py-0.5 rounded border border-[var(--ink-border)] font-semibold uppercase tracking-wider text-[var(--ink)] bg-[var(--ink-hover)]">
            {difficulty}
          </span>
          <span className="opacity-40">•</span>
          <span className="opacity-80 font-medium">{points} pts</span>
          <span className="opacity-40">•</span>
          <span className="opacity-80 font-medium">Time Limit: {(timeLimitMs / 1000).toFixed(1)}s</span>
          <span className="opacity-40">•</span>
          <span className="opacity-80 font-medium">Memory: {memoryLimitMb}MB</span>
        </div>
      </div>

      {/* Structured Problem Content */}
      <div className="space-y-4">
        {blocks.map((block, idx) => {
          switch (block.type) {
            case 'paragraph':
              return (
                <p key={idx} className="text-[14px] leading-relaxed text-[var(--ink)]">
                  {renderInlineTokens(block.text)}
                </p>
              );

            case 'example':
              return (
                <div key={idx} className="space-y-2 pt-1">
                  <div className="text-[14px] font-semibold text-[var(--ink)]">
                    {block.title}:
                  </div>
                  <div className="border border-[var(--ink-border)] bg-[var(--paper)] rounded-lg p-4 space-y-2.5 text-[13px] leading-relaxed shadow-xs">
                    {block.input && (
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="font-semibold text-[var(--ink)] shrink-0">
                          Input:
                        </span>
                        <code className="font-mono text-[13px] text-[var(--ink)] break-all bg-[var(--ink-hover)] px-2 py-0.5 rounded border border-[var(--ink-border)]">
                          {block.input}
                        </code>
                      </div>
                    )}
                    {block.output && (
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="font-semibold text-[var(--ink)] shrink-0">
                          Output:
                        </span>
                        <code className="font-mono text-[13px] text-[var(--ink)] break-all bg-[var(--ink-hover)] px-2 py-0.5 rounded border border-[var(--ink-border)]">
                          {block.output}
                        </code>
                      </div>
                    )}
                    {block.explanation && (
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 pt-0.5">
                        <span className="font-semibold text-[var(--ink)] shrink-0">
                          Explanation:
                        </span>
                        <span className="text-[var(--ink)] opacity-90 leading-relaxed">
                          {renderInlineTokens(block.explanation)}
                        </span>
                      </div>
                    )}
                    {block.rawLines && block.rawLines.length > 0 && (
                      <div className="space-y-1 font-mono text-[12px] opacity-90 whitespace-pre-wrap">
                        {block.rawLines.map((l, li) => (
                          <div key={li}>{renderInlineTokens(l)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );

            case 'constraints':
              return (
                <div key={idx} className="space-y-2 pt-2">
                  <h3 className="text-[14px] font-semibold text-[var(--ink)]">
                    Constraints:
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-[13px] leading-relaxed text-[var(--ink)]">
                    {block.items.map((item, cIdx) => (
                      <li key={cIdx} className="leading-relaxed">
                        {renderInlineTokens(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              );

            case 'heading': {
              const Tag = block.level <= 2 ? 'h2' : block.level === 3 ? 'h3' : 'h4';
              const headingClasses =
                block.level <= 2
                  ? 'text-[18px] font-semibold mt-6 mb-2'
                  : block.level === 3
                  ? 'text-[16px] font-semibold mt-5 mb-2'
                  : 'text-[14px] font-semibold mt-4 mb-2';
              return (
                <Tag key={idx} className={`${headingClasses} text-[var(--ink)]`}>
                  {block.text}
                </Tag>
              );
            }

            case 'unordered-list':
              return (
                <ul
                  key={idx}
                  className="list-disc pl-5 space-y-1.5 text-[14px] leading-relaxed text-[var(--ink)]"
                >
                  {block.items.map((item, lIdx) => (
                    <li key={lIdx}>{renderInlineTokens(item)}</li>
                  ))}
                </ul>
              );

            case 'ordered-list':
              return (
                <ol
                  key={idx}
                  className="list-decimal pl-5 space-y-1.5 text-[14px] leading-relaxed text-[var(--ink)]"
                >
                  {block.items.map((item, lIdx) => (
                    <li key={lIdx}>{renderInlineTokens(item)}</li>
                  ))}
                </ol>
              );

            case 'code':
              return (
                <pre
                  key={idx}
                  className="p-3 bg-[var(--ink-hover)] border border-[var(--ink-border)] rounded-md font-mono text-[12px] text-[var(--ink)] overflow-x-auto custom-scrollbar whitespace-pre"
                >
                  {block.content}
                </pre>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Fallback Sample Cases if problem statement has no embedded Example cards */}
      {!hasExampleBlocks && sampleTestCases && sampleTestCases.length > 0 && (
        <div className="space-y-4 pt-2">
          <h3 className="text-[14px] font-semibold text-[var(--ink)]">
            Examples:
          </h3>
          <div className="space-y-4">
            {sampleTestCases.map((stc, sIdx) => (
              <div key={stc.id || sIdx} className="space-y-2">
                <div className="text-[13px] font-semibold text-[var(--ink)]">
                  Example {sIdx + 1}:
                </div>
                <div className="border border-[var(--ink-border)] rounded-lg p-4 bg-[var(--paper)] space-y-2.5">
                  <div>
                    <div className="text-[12px] font-semibold text-[var(--ink)] opacity-70 uppercase tracking-wide mb-1">
                      Input:
                    </div>
                    <pre className="p-2.5 bg-[var(--ink-hover)] border border-[var(--ink-border)] rounded text-[13px] font-mono text-[var(--ink)] overflow-x-auto custom-scrollbar whitespace-pre">
                      {stc.input}
                    </pre>
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-[var(--ink)] opacity-70 uppercase tracking-wide mb-1">
                      Output:
                    </div>
                    <pre className="p-2.5 bg-[var(--ink-hover)] border border-[var(--ink-border)] rounded text-[13px] font-mono text-[var(--ink)] overflow-x-auto custom-scrollbar whitespace-pre">
                      {stc.expectedOutput}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom padding to prevent content hugging the bottom */}
      <div className="h-6" />
    </div>
  );
}

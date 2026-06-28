/**
 * useSubmissionSocket.js  — feature hook
 *
 * Subscribes to the real-time verdict for a single submission.
 * Built on top of useWebSocket so all STOMP lifecycle logic stays there.
 *
 * Usage:
 *   const { verdict, isJudging, error } = useSubmissionSocket(submissionId);
 *
 * Flow:
 *   1. Component mounts with a submissionId (returned immediately after POST /submit)
 *   2. Hook connects to /topic/submission/{submissionId} via STOMP
 *   3. Backend pushes the verdict when judging is complete
 *   4. Hook returns the verdict and sets isJudging = false
 *   5. Component unmounts → hook disconnects automatically
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

/**
 * @param {string|null} submissionId  UUID of the submission to watch
 * @returns {{ verdict: object|null, isJudging: boolean, isConnected: boolean, error: string|null }}
 */
export function useSubmissionSocket(submissionId) {
  const [verdict, setVerdict] = useState(null);
  const [isJudging, setIsJudging] = useState(false);
  const [error, setError] = useState(null);

  // ── KEY FIX: reset all state whenever the submissionId changes ──────────
  // Without this, the previous submission's verdict stays in state and fires
  // immediately for the next submission before the worker even responds.
  useEffect(() => {
    setVerdict(null);
    setError(null);
    setIsJudging(!!submissionId);
  }, [submissionId]);

  const topic = submissionId ? `/topic/submission/${submissionId}` : null;

  const handleMessage = useCallback((msg) => {
    setVerdict(msg);
    setIsJudging(false);
    setError(null);
  }, []);

  const { isConnected } = useWebSocket(topic, handleMessage);

  return { verdict, isJudging, isConnected, error };
}

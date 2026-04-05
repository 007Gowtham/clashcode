'use client';

import { useEffect, useState } from 'react';

function formatTime(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const m = String(Math.floor(clamped / 60)).padStart(2, '0');
  const s = String(clamped % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function CountdownTimer({ initialSeconds = 300 }) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (initialSeconds <= 0) return;
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining]);

  const isDone = remaining <= 0;

  return (
    <div className="animate-in fade-in-0 duration-300">
      <div className="rounded-xl border border-emerald-100 bg-white/90 shadow-[0_8px_24px_rgba(16,185,129,0.18)] px-4 py-2 flex flex-col items-end gap-1 min-w-[170px]">
        <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          Match starts in
        </span>
        <span
          className={`font-mono text-lg font-bold tabular-nums transition-colors duration-200 ${
            isDone ? 'text-rose-600' : 'text-emerald-600'
          }`}
        >
          {isDone ? 'Match Starting...' : formatTime(remaining)}
        </span>
      </div>
    </div>
  );
}


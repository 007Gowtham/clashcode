'use client';

import { useEffect } from 'react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 40% ink overlay */}
      <div
        className="fixed inset-0 bg-[var(--ink)] opacity-40 transition-hover"
        onClick={onClose}
      />

      {/* Centered Modal content with 1px border */}
      <div
        className={`relative w-full ${maxWidth} bg-[var(--paper)] border border-[var(--ink)] rounded-[6px] p-6 z-10 transition-hover`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--ink-border)] mb-4">
          <h2 className="text-[20px] font-semibold text-[var(--ink)] leading-normal">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-[14px] text-[var(--ink)] opacity-60 hover:opacity-100 transition-hover px-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default Modal;


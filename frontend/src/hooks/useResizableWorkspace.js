'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook to manage two-dimensional resizing in LeetCode-style workspace:
 * 1. Horizontal resizing between Left Pane (Question) and Right Pane (Editor).
 * 2. Vertical resizing between Code Editor and Bottom Drawer (Testcases/Results).
 */
export function useResizableWorkspace({
  defaultLeftPercent = 45,
  minLeftPercent = 20,
  maxLeftPercent = 80,
  defaultBottomHeight = 240,
  minBottomHeight = 100,
  maxBottomHeight = 550,
} = {}) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftPercent);
  const [bottomHeight, setBottomHeight] = useState(defaultBottomHeight);
  const containerRef = useRef(null);

  const isDraggingHRef = useRef(false);
  const isDraggingVRef = useRef(false);

  const startHorizontalDrag = useCallback((e) => {
    e.preventDefault();
    isDraggingHRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const startVerticalDrag = useCallback((e) => {
    e.preventDefault();
    isDraggingVRef.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      if (isDraggingHRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const newPercent = (offsetX / rect.width) * 100;
        if (newPercent >= minLeftPercent && newPercent <= maxLeftPercent) {
          setLeftWidth(newPercent);
        }
      }

      if (isDraggingVRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newHeight = rect.bottom - e.clientY;
        if (newHeight >= minBottomHeight && newHeight <= maxBottomHeight) {
          setBottomHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      if (isDraggingHRef.current || isDraggingVRef.current) {
        isDraggingHRef.current = false;
        isDraggingVRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minLeftPercent, maxLeftPercent, minBottomHeight, maxBottomHeight]);

  return {
    containerRef,
    leftWidth,
    bottomHeight,
    startHorizontalDrag,
    startVerticalDrag,
  };
}

export default useResizableWorkspace;


'use client';

import { useEffect, useRef } from 'react';
import Toolbar from './Toolbar';
import { useWhiteboard } from './useWhiteboard';

export default function CanvasBoard({ isArchitect = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Initialize hook
  const { fabricCanvasRef } = useWhiteboard(canvasRef);
  
  // Robust Resize handling for panels
  useEffect(() => {
    if (!containerRef.current || !fabricCanvasRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (fabricCanvasRef.current) {
          const { width, height } = entry.contentRect;
          fabricCanvasRef.current.setDimensions({ width, height });
          fabricCanvasRef.current.requestRenderAll();
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, [fabricCanvasRef]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-50 overflow-hidden">
      {isArchitect===true ? <Toolbar />:null}
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

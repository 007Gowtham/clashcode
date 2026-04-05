'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  ArrowRight,
  Circle,
  Gauge,
  Grid3X3,
  Highlighter,
  MousePointer2,
  Pen,
  Square,
  StickyNote,
  Trash2,
  Triangle,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useWhiteboardContext } from './WhiteboardContext';

const tools = [
  // Basic Navigation
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'pen', icon: Pen, label: 'Pen' },
  { id: 'connector', icon: ArrowRight, label: 'Arrow/Connector' },
  
  // DSA Specific Structure Tools (The "Architect" Pack)
  { id: 'array', icon: Grid3X3, label: 'Array/Grid' },
  { id: 'circle', icon: Circle, label: 'Node (Tree)' },
  { id: 'rectangle', icon: Square, label: 'Container (Stack/Queue)' },
  { id: 'triangle', icon: Triangle, label: 'Triangle / Flow' },
  
  // Analysis Tools (The "Optimizer" Pack)
  { id: 'complexity', icon: Gauge, label: 'Big O Tag' },
  { id: 'bottleneck', icon: AlertTriangle, label: 'Flag Bottleneck' },
  
  // Annotations
  { id: 'marker', icon: Highlighter, label: 'Highlight' },
  { id: 'note', icon: StickyNote, label: 'Logic Note' },
  
  // Board Management
  { id: 'delete', icon: X, label: 'Delete Selected (Multi-select supported)' },
  { id: 'clear', icon: Trash2, label: 'Reset Board' },
];

export default function Toolbar() {
  const { isArchitect, activeTool, setActiveTool, options, setOptions } = useWhiteboardContext();
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleToolClick = (toolId) => {
    if (toolId === 'clear') {
      setIsAlertOpen(true);
    } else {
      setActiveTool(toolId);
    }
  };

  const confirmClear = () => {
    setActiveTool('clear');
    setIsAlertOpen(false);
  };

  // ONLY Visible to Architect
  if (!isArchitect) return null;

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-gray-200">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => handleToolClick(tool.id)}
          className={`p-2  disabled:opacity-50 rounded-lg transition-all ${
            activeTool === tool.id
              ? 'bg-blue-50 text-blue-600 shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
          title={tool.label}
        >
          <tool.icon className="w-5 h-5" />
        </button>
      ))}
      
      <div className="w-full h-px bg-gray-200 my-1" />
      
      {/* Simple Color Picker */}
      <div className="p-2">
        <input
          type="color"
          value={options.stroke}
          onChange={(e) => setOptions(prev => ({ ...prev, stroke: e.target.value }))}
          className="w-full h-8 cursor-pointer rounded overflow-hidden"
          title="Stroke Color"
        />
        </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This section will permanently delete all drawings on the whiteboard. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear} className="bg-red-600 hover:bg-red-700 text-white border-none">
              Yes, reset board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { Canvas, Circle, Group, IText, Path, PencilBrush, Rect, Triangle } from 'fabric';
import { useEffect, useRef } from 'react';
import { useWhiteboardContext } from './WhiteboardContext';

export const useWhiteboard = (canvasRef) => {
  const { socket, roomId, isArchitect, activeTool, setActiveTool, options } = useWhiteboardContext();
  const fabricCanvasRef = useRef(null);
  const isReady = useRef(false);

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current || isReady.current) return;

    // Dispose existing if any (safety)
    // const existingCanvas = canvasRef.current._fabric;
    
    const canvas = new Canvas(canvasRef.current, {
      isDrawingMode: false, // Default to false, handled in tool effect
      selection: isArchitect,
      backgroundColor: '#ffffff'
    });

    fabricCanvasRef.current = canvas;
    isReady.current = true;

    return () => {
      canvas.dispose();
      isReady.current = false;
    };
  }, []);

  // Sync State & Tools
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    canvas.isDrawingMode = activeTool === 'pen';
    canvas.selection = activeTool === 'select' || activeTool === 'delete';
    
    // Premium Selection UI
    canvas.selectionColor = 'rgba(79, 70, 229, 0.1)';
    canvas.selectionBorderColor = '#4f46e5';
    canvas.selectionLineWidth = 1;

    // Only Architect can interact
    canvas.forEachObject((obj) => {
      obj.selectable = isArchitect && (activeTool === 'select' || activeTool === 'delete');
      obj.evented = isArchitect;
    });
    
    // Lock canvas for non-architects
    canvas.skipTargetFind = !isArchitect;

    if (activeTool === 'clear') {
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
        
        // Emit the empty state immediately
        if (socket && roomId) {
             socket.emit('wb-draw', { roomId, data: canvas.toJSON() });
        }

        // Reset tool to select to avoid accidental clears
        setActiveTool('select');
        return;
    }

    if (activeTool === 'delete') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
            activeObjects.forEach((obj) => {
                canvas.remove(obj);
            });
            canvas.discardActiveObject();
            canvas.renderAll();
            
            // Emit the change
            if (socket && roomId) {
                 socket.emit('wb-draw', { roomId, data: canvas.toJSON() });
            }
        }
        // Reset tool back to select
        setActiveTool('select');
        return;
    }

    if (activeTool === 'pen' || activeTool === 'marker') {
        canvas.isDrawingMode = true;
        canvas.defaultCursor = 'crosshair';
        const brush = new PencilBrush(canvas);
        if (activeTool === 'pen') {
            brush.color = options.stroke;
            brush.width = parseInt(options.strokeWidth, 10) || 2;
        } else {
            brush.color = 'rgba(255, 255, 0, 0.4)'; // Highlighter Yellow
            brush.width = 15;
        }
        canvas.freeDrawingBrush = brush;
    } else if (['rectangle', 'circle', 'array', 'connector', 'complexity', 'bottleneck', 'note', 'triangle'].includes(activeTool)) {
        canvas.isDrawingMode = false;
        canvas.defaultCursor = 'crosshair';
    } else {
        // Disable free drawing for other tools
        canvas.isDrawingMode = false;
        canvas.defaultCursor = 'default';
    }

    // Add Shapes Logic
    if (activeTool === 'circle' && isArchitect) {
        // This is tricky as 'circle' usually means 'click-drag to add' or 'click to add'.
        // For simplicity, let's add a circle in center if selected, then switch back to select? 
        // Or better: Mouse down handler.
        // For now, let's just let Pen work, and shapes need mouse handlers.
    }

    canvas.requestRenderAll();
  }, [activeTool, options, isArchitect]);

  // Handle Shapes & Advanced Tools (Click and Drag)
  const drawingObject = useRef(null);
  const startPoint = useRef({ x: 0, y: 0 });

  // Add Shape to Center (Instant Add on tool click)
  const addShapeToCenter = (type) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isArchitect) return;

    // Fabric 7 uses getCenterPoint
    const center = canvas.getCenterPoint ? canvas.getCenterPoint() : canvas.getCenter();
    const x = center.x ?? center.left;
    const y = center.y ?? center.top;
    let obj;

    if (type === 'rectangle') {
        const rect = new Rect({
            width: 140,
            height: 100,
            fill: 'transparent',
            stroke: options.stroke || '#000000',
            strokeWidth: 2,
            strokeDashArray: [10, 5], // Dashed for container feel
            rx: 5,
            ry: 5
        });
        const label = new IText('Stack/Queue', {
            fontSize: 10,
            top: -55,
            fill: '#64748b',
            originX: 'center'
        });
        obj = new Group([rect, label], {
            left: x,
            top: y,
            originX: 'center',
            originY: 'center',
            subTargetCheck: true,
            data: { type: 'container' }
        });
    } else if (type === 'circle') {
        const circle = new Circle({
            radius: 35,
            fill: '#ffffff',
            stroke: options.stroke || '#000000',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center'
        });
        const text = new IText('Node', {
            fontSize: 16,
            fill: '#0f172a',
            originX: 'center',
            originY: 'center'
        });
        obj = new Group([circle, text], {
            left: x,
            top: y,
            originX: 'center',
            originY: 'center',
            subTargetCheck: true,
            data: { type: 'node' }
        });
    }
 else if (type === 'boundary') {
        const rect = new Rect({
            width: 300,
            height: 200,
            fill: 'transparent',
            stroke: '#ef4444', 
            strokeWidth: 2,
            strokeDashArray: [10, 5],
            rx: 10,
            ry: 10,
            originX: 'center',
            originY: 'center'
        });
        const label = new IText('O(N) Zone', {
            top: -85,
            fontSize: 14,
            fill: '#ef4444',
            fontStyle: 'italic',
            originX: 'center',
            originY: 'center'
        });
        obj = new Group([rect, label], {
            left: x,
            top: y,
            originX: 'center',
            originY: 'center',
            data: { type: 'boundary' }
        });
    } else if (type === 'connector') {
        const x2 = x + 100;
        const y2 = y;
        const angle = Math.atan2(0, 100);
        const headLength = 12;
        const x3 = x2 - headLength * Math.cos(angle - Math.PI / 6);
        const y3 = y2 - headLength * Math.sin(angle - Math.PI / 6);
        const x4 = x2 - headLength * Math.cos(angle + Math.PI / 6);
        const y4 = y2 - headLength * Math.sin(angle + Math.PI / 6);

        obj = new Path(`M ${x} ${y} L ${x2} ${y2} M ${x2} ${y2} L ${x3} ${y3} M ${x2} ${y2} L ${x4} ${y4}`, {
            stroke: options.stroke || '#000000',
            strokeWidth: 2,
            fill: 'transparent',
            selectable: true,
            data: { type: 'connector' }
        });
    }
 else if (type === 'array') {
        const elements = [];
        for(let i=0; i<5; i++) {
            const rect = new Rect({
                left: 0,
                top: 0,
                width: 40,
                height: 40,
                fill: 'transparent',
                stroke: options.stroke || '#000000',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center'
            });
            const text = new IText(String(i), {
                fontSize: 14,
                fill: '#0f172a',
                originX: 'center',
                originY: 'center'
            });
            elements.push(new Group([rect, text], {
                left: i * 40,
                top: 0,
                originX: 'center',
                originY: 'center',
                subTargetCheck: true,
                data: { type: 'arrayElement', index: i }
            }));
        }
        obj = new Group(elements, {
            left: x,
            top: y,
            originX: 'center',
            originY: 'center',
            subTargetCheck: true,
            data: { type: 'array' }
        });
    } else if (type === 'complexity') {
        const badge = new Rect({
            width: 80,
            height: 30,
            fill: '#f8fafc',
            stroke: '#6366f1',
            strokeWidth: 2,
            rx: 15,
            ry: 15,
            originX: 'center',
            originY: 'center'
        });
        const text = new IText('O(N)', {
            fontSize: 16,
            fill: '#6366f1',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center'
        });
        obj = new Group([badge, text], {
            left: x,
            top: y,
            originX: 'center',
            originY: 'center',
            subTargetCheck: true,
            data: { type: 'complexity' }
        });
    } else if (type === 'bottleneck') {
        const tri = new Triangle({
            width: 35,
            height: 35,
            fill: '#ef4444',
            originX: 'center',
            originY: 'center'
        });
        const text = new IText('!', {
            fontSize: 20,
            fill: '#ffffff',
            fontWeight: 'bold',
            top: 2,
            originX: 'center',
            originY: 'center'
        });
        obj = new Group([tri, text], {
            left: x,
            top: y,
            originX: 'center',
            originY: 'center',
            data: { type: 'bottleneck' }
        });
        
        // Pulse Animation (Optimized)
        const animate = () => {
          if (!obj.canvas) return;
          obj.animate({ scaleX: 1.15, scaleY: 1.15 }, {
            duration: 1000,
            onChange: canvas.requestRenderAll.bind(canvas),
            onComplete: () => {
              if (!obj.canvas) return;
              obj.animate({ scaleX: 1, scaleY: 1 }, {
                 duration: 1000,
                 onChange: canvas.requestRenderAll.bind(canvas),
                 onComplete: animate
              });
            }
          });
        };
        setTimeout(animate, 100);
    }
 else if (type === 'note') {
        const paper = new Rect({
            width: 150,
            height: 150,
            fill: '#fef9c3',
            stroke: '#facc15',
            strokeWidth: 1,
            shadow: 'rgba(0,0,0,0.1) 2px 2px 5px',
            originX: 'center',
            originY: 'center'
        });
        const text = new IText('Logic Note...', {
            fontSize: 14,
            fill: '#854d0e',
            width: 130,
            originX: 'center',
            originY: 'center'
        });
        obj = new Group([paper, text], {
            left: x,
            top: y,
            originX: 'center',
            originY: 'center',
            data: { type: 'note' }
        });
    } else if (type === 'triangle') {
        obj = new Triangle({
            left: x,
            top: y,
            width: 80,
            height: 80,
            fill: 'transparent',
            stroke: options.stroke || '#000000',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center'
        });
    }

    if (obj) {
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();
        // Switch back to select so user can move it immediately
        setActiveTool('select');
        
        // Emit change
        if (socket && roomId) {
            socket.emit('wb-draw', { roomId, data: canvas.toJSON() });
        }
    }
  };

  // Watch for tool changes to trigger instant add
  const lastTool = useRef(activeTool);
  useEffect(() => {
    if (activeTool !== lastTool.current) {
        if (['rectangle', 'circle', 'array', 'connector', 'complexity', 'bottleneck', 'note', 'triangle'].includes(activeTool)) {
            addShapeToCenter(activeTool); 
        }
        lastTool.current = activeTool;
    }
  }, [activeTool, addShapeToCenter]);

  useEffect(() => {
      if(!fabricCanvasRef.current || !isArchitect) return;
      const canvas = fabricCanvasRef.current;
      
      const handleMouseDown = (opt) => {
          if (['rectangle', 'circle', 'connector', 'triangle'].includes(activeTool)) {
              // Fabric 7.x uses getScenePoint, fallback to scenePoint property
              const pointer = canvas.getScenePoint?.(opt.e) || opt.scenePoint || { x: 0, y: 0 };
              startPoint.current = { x: pointer.x, y: pointer.y };
              
              if (activeTool === 'rectangle') {
                  drawingObject.current = new Rect({
                      left: pointer.x,
                      top: pointer.y,
                      width: 0,
                      height: 0,
                      fill: 'transparent',
                      stroke: options.stroke || '#000000',
                      strokeWidth: 2,
                      selectable: true
                  });
              } else if (activeTool === 'circle') {
                  drawingObject.current = new Circle({
                      left: pointer.x,
                      top: pointer.y,
                      radius: 0,
                      fill: 'transparent',
                      stroke: options.stroke || '#000000',
                      strokeWidth: 2,
                      selectable: true
                  });
              } else if (activeTool === 'connector') {
                  const x = pointer.x;
                  const y = pointer.y;
                  drawingObject.current = new Path(`M ${x} ${y} L ${x} ${y}`, {
                      stroke: options.stroke || '#000000',
                      strokeWidth: 2,
                      fill: 'transparent',
                      selectable: true,
                      data: { 
                          type: 'connector',
                          from: canvas.findTarget(opt.e) 
                      }
                  });
              } else if (activeTool === 'triangle') {
                  drawingObject.current = new Triangle({
                      left: pointer.x,
                      top: pointer.y,
                      width: 0,
                      height: 0,
                      fill: 'transparent',
                      stroke: options.stroke || '#000000',
                      strokeWidth: 2,
                      selectable: true
                  });
              }
              
              if (drawingObject.current) {
                  canvas.add(drawingObject.current);
                  canvas.setActiveObject(drawingObject.current);
              }
          } else if (activeTool === 'boundary') {
              // Boundary remains a click-to-place tool for precision
              const pointer = canvas.getScenePoint?.(opt.e) || opt.scenePoint || { x: 0, y: 0 };
              const x = pointer.x;
              const y = pointer.y;
              
              const rect = new Rect({
                  width: 300,
                  height: 200,
                  fill: 'transparent',
                  stroke: '#ef4444', 
                  strokeWidth: 2,
                  strokeDashArray: [10, 5],
                  rx: 10,
                  ry: 10,
                  originX: 'center', 
                  originY: 'center'
              });
              const label = new IText('O(N) Zone', {
                  top: -85,
                  fontSize: 14,
                  fill: '#ef4444',
                  fontStyle: 'italic',
                  originX: 'center',
                  originY: 'center'
              });
              
              const group = new Group([rect, label], {
                  left: x,
                  top: y,
                  originX: 'center',
                  originY: 'center',
                  selectable: true
              });

              canvas.add(group);
              canvas.setActiveObject(group);
              canvas.renderAll();
              setActiveTool('select');
          }
      };

      const handleMouseMove = (opt) => {
          if (!drawingObject.current) return;
          const canvas = fabricCanvasRef.current;
          const pointer = canvas.getScenePoint?.(opt.e) || opt.scenePoint || { x: 0, y: 0 };
          
          if (activeTool === 'rectangle') {
              const width = Math.abs(startPoint.current.x - pointer.x);
              const height = Math.abs(startPoint.current.y - pointer.y);
              drawingObject.current.set({
                  width: width,
                  height: height,
                  left: Math.min(pointer.x, startPoint.current.x),
                  top: Math.min(pointer.y, startPoint.current.y)
              });
          } else if (activeTool === 'circle') {
              const width = Math.abs(startPoint.current.x - pointer.x);
              const height = Math.abs(startPoint.current.y - pointer.y);
              const radius = Math.max(width, height) / 2;
              drawingObject.current.set({
                  radius: radius,
                  left: Math.min(pointer.x, startPoint.current.x),
                  top: Math.min(pointer.y, startPoint.current.y)
              });
          } else if (activeTool === 'connector') {
              const x1 = startPoint.current.x;
              const y1 = startPoint.current.y;
              const x2 = pointer.x;
              const y2 = pointer.y;
              
              const dx = x2 - x1;
              const dy = y2 - y1;
              const angle = Math.atan2(dy, dx);
              const headLength = 12;
              
              const x3 = x2 - headLength * Math.cos(angle - Math.PI / 6);
              const y3 = y2 - headLength * Math.sin(angle - Math.PI / 6);
              const x4 = x2 - headLength * Math.cos(angle + Math.PI / 6);
              const y4 = y2 - headLength * Math.sin(angle + Math.PI / 6);
              
              drawingObject.current.set({
                  path: [
                      ['M', x1, y1],
                      ['L', x2, y2],
                      ['M', x2, y2],
                      ['L', x3, y3],
                      ['M', x2, y2],
                      ['L', x4, y4]
                  ]
              });
          } else if (activeTool === 'triangle') {
              const width = Math.abs(startPoint.current.x - pointer.x);
              const height = Math.abs(startPoint.current.y - pointer.y);
              drawingObject.current.set({
                  width: width,
                  height: height,
                  left: Math.min(pointer.x, startPoint.current.x),
                  top: Math.min(pointer.y, startPoint.current.y)
              });
          }
          
          canvas.renderAll();
      };

       const handleMouseUp = (opt) => {
          if (drawingObject.current) {
              // If it's too small, maybe it was just a click?
              if (drawingObject.current.width < 5 && drawingObject.current.height < 5 && activeTool === 'rectangle') {
                  drawingObject.current.set({ width: 100, height: 100 });
              }
              if (activeTool === 'circle' && drawingObject.current.radius < 5) {
                  drawingObject.current.set({ radius: 50 });
              }
              if (activeTool === 'triangle' && drawingObject.current.width < 5) {
                  drawingObject.current.set({ width: 80, height: 80 });
              }
              
              if (activeTool === 'connector' && opt.e) {
                  drawingObject.current.set({
                      data: { 
                          ...drawingObject.current.data,
                          to: canvas.findTarget(opt.e)
                      }
                  });
              }
              
              canvas.renderAll();
              drawingObject.current = null;
              setActiveTool('select');
              
              // Emit final state
              if (socket && roomId) {
                  socket.emit('wb-draw', { roomId, data: canvas.toJSON() });
              }
          }
      };
      
      const handleDblClick = (opt) => {
          const target = opt.target;
          if (target && target.type === 'group') {
              // Find first IText to edit
              const itext = target.getObjects().find(o => o.type === 'i-text' || o.type === 'textbox');
              if (itext) {
                  // This is a bit complex in fabric for nested items
                  // Usually we enter group, select child.
                  // For simplicity, let's just make the text editable if we target it directly via subTargetCheck
                  if (opt.subTargets && opt.subTargets[0] && (opt.subTargets[0].type === 'i-text')) {
                      opt.subTargets[0].enterEditing();
                      canvas.setActiveObject(opt.subTargets[0]);
                  }
              }
          } else if (target && target.type === 'i-text') {
              target.enterEditing();
          }
      };

      const getArrowPath = (x1, y1, x2, y2) => {
          const dx = x2 - x1;
          const dy = y2 - y1;
          const angle = Math.atan2(dy, dx);
          const headLength = 12;
          const x3 = x2 - headLength * Math.cos(angle - Math.PI / 6);
          const y3 = y2 - headLength * Math.sin(angle - Math.PI / 6);
          const x4 = x2 - headLength * Math.cos(angle + Math.PI / 6);
          const y4 = y2 - headLength * Math.sin(angle + Math.PI / 6);
          
          return [
              ['M', x1, y1],
              ['L', x2, y2],
              ['M', x2, y2],
              ['L', x3, y3],
              ['M', x2, y2],
              ['L', x4, y4]
          ];
      };

      const handleObjectMoving = (opt) => {
          const movedObj = opt.target;
          if (!movedObj.data) return;
          
          canvas.forEachObject((obj) => {
              if (obj.data?.type === 'connector') {
                  const from = obj.data.from;
                  const to = obj.data.to;
                  
                  if (from === movedObj || to === movedObj) {
                      const p1 = from ? { x: from.left, y: from.top } : { x: obj.path[0][1], y: obj.path[0][2] };
                      const p2 = to ? { x: to.left, y: to.top } : { x: obj.path[1][1], y: obj.path[1][2] };
                      
                      obj.set({ path: getArrowPath(p1.x, p1.y, p2.x, p2.y) });
                  }
              }
          });
          canvas.renderAll();
      };
      
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);
      canvas.on('mousedblclick', handleDblClick);
      canvas.on('object:moving', handleObjectMoving);
      
      return () => {
          canvas.off('mouse:down', handleMouseDown);
          canvas.off('mouse:move', handleMouseMove);
          canvas.off('mouse:up', handleMouseUp);
          canvas.off('mousedblclick', handleDblClick);
          canvas.off('object:moving', handleObjectMoving);
      };
  }, [activeTool, isArchitect, options, setActiveTool, socket, roomId]);



  // Socket Integration
  // Socket Integration with Debouncing
  const emitTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket || !roomId || !fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    const emitState = () => {
        if (!isArchitect) return;
        
        // Clear previous timeout to debounce
        if (emitTimeoutRef.current) clearTimeout(emitTimeoutRef.current);
        
        emitTimeoutRef.current = setTimeout(() => {
            const json = canvas.toJSON();
            socket.emit('wb-draw', { roomId, data: json });
            console.log('📡 [Whiteboard] State Synced');
        }, 150); // 150ms debounce
    };

    if (isArchitect) {
        canvas.on('object:added', emitState);
        canvas.on('object:modified', emitState);
        canvas.on('object:removed', emitState);
        canvas.on('path:created', emitState);
    } 

    const handleRemoteDraw = (payload) => {
        if (isArchitect) return;
        if (!payload || !payload.data) return;

        // Optimized load
        canvas.loadFromJSON(payload.data).then(() => {
            canvas.requestRenderAll();
            canvas.skipTargetFind = true;
            canvas.forEachObject(o => { 
                o.selectable = false; 
                o.evented = false; 
            });
        });
    };

    socket.on('wb-draw', handleRemoteDraw);

    return () => {
        if (emitTimeoutRef.current) clearTimeout(emitTimeoutRef.current);
        canvas.off('object:added', emitState);
        canvas.off('object:modified', emitState);
        canvas.off('object:removed', emitState);
        canvas.off('path:created', emitState);
        socket.off('wb-draw', handleRemoteDraw);
    };
  }, [socket, roomId, isArchitect]);

  return { fabricCanvasRef };
};

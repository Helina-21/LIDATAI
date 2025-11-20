
import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Eraser, Pen, RotateCcw, Trash2, Square, Circle, ArrowRight, Minus, Grid, Undo, Redo } from 'lucide-react';

interface SketchCanvasProps {
  onExport: (blob: Blob) => void;
  onClose: () => void;
  initialImage?: string | null;
}

type Tool = 'pen' | 'eraser' | 'rect' | 'circle' | 'line' | 'arrow';

export const SketchCanvas: React.FC<SketchCanvasProps> = ({ onExport, onClose, initialImage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#06b6d4'); // Cyan default
  const [lineWidth, setLineWidth] = useState(2);
  const [showGrid, setShowGrid] = useState(true);

  // History State
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  // Drawing State
  const startPos = useRef<{x: number, y: number} | null>(null);
  const snapshot = useRef<ImageData | null>(null);

  // Init Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Fill black background initially
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, rect.width, rect.height);

      if (initialImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = initialImage;
        img.onload = () => {
           // Draw image centered/fitted
           const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
           const x = (canvas.width / dpr - img.width * scale) / 2; // Adjust for dpr in drawing logic? No, we scaled ctx
           // Actually drawing logic on scaled context needs logical coords.
           // Let's simplify: drawImage uses destination units.
           const logicalWidth = rect.width;
           const logicalHeight = rect.height;
           
           // Calculate aspect ratio fit
           const scaleFit = Math.min(logicalWidth / img.width, logicalHeight / img.height);
           const drawW = img.width * scaleFit;
           const drawH = img.height * scaleFit;
           const drawX = (logicalWidth - drawW) / 2;
           const drawY = (logicalHeight - drawH) / 2;

           ctx.drawImage(img, drawX, drawY, drawW, drawH);
           saveHistory(ctx, canvas);
        };
      } else {
        saveHistory(ctx, canvas);
      }
    }

    const handleResize = () => {
        // Handle resize
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initialImage]);

  const saveHistory = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // We need to get the raw pixel data relative to the scaled size
    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      restoreHistory(newStep);
      setHistoryStep(newStep);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      restoreHistory(newStep);
      setHistoryStep(newStep);
    }
  };

  const restoreHistory = (stepIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = history[stepIndex];
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
    }
  };

  const getCoords = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const coords = getCoords(e, canvas);
    startPos.current = coords;

    // Save current state for shape preview
    // We have to grab the scaled full res data
    snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const curr = getCoords(e, canvas);

    ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
    ctx.strokeStyle = tool === 'eraser' ? '#000000' : color;
    ctx.fillStyle = color;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    } else {
      // Restore snapshot to avoid trails
      if (snapshot.current) {
        ctx.putImageData(snapshot.current, 0, 0);
      }
      
      ctx.beginPath();
      
      if (tool === 'rect') {
        const w = curr.x - startPos.current.x;
        const h = curr.y - startPos.current.y;
        ctx.strokeRect(startPos.current.x, startPos.current.y, w, h);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(curr.x - startPos.current.x, 2) + Math.pow(curr.y - startPos.current.y, 2));
        ctx.arc(startPos.current.x, startPos.current.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.moveTo(startPos.current.x, startPos.current.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      } else if (tool === 'arrow') {
        // Draw Line
        const fromx = startPos.current.x;
        const fromy = startPos.current.y;
        const tox = curr.x;
        const toy = curr.y;
        const headlen = 15; // length of head in pixels
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);

        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();
        
        // Draw Head
        ctx.beginPath();
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
       const ctx = canvas.getContext('2d');
       if (ctx) saveHistory(ctx, canvas);
    }
    
    snapshot.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // clear with black
    
    // If we want to keep the image on clear, we'd re-draw it here. 
    // But typically 'Trash' means clear all. 
    // For annotation, maybe we want to just clear lines?
    // Let's fully clear for now to act as a reset.
    
    saveHistory(ctx, canvas);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onExport(blob);
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
       <div className="w-full max-w-5xl h-[85vh] bg-zinc-950 border border-zinc-800 relative flex flex-col shadow-2xl rounded-sm overflow-hidden">
          
          {/* Top Bar */}
          <div className="h-12 border-b border-zinc-800 flex justify-between items-center px-4 bg-black">
             <div className="flex items-center gap-3">
               <Pen className="text-cyan-500" size={16} />
               <span className="text-xs font-mono font-bold uppercase text-zinc-300 tracking-widest">
                  {initialImage ? 'LIDATAI Annotation // Image Mode' : 'LIDATAI Sketchpad // CAD Mode'}
               </span>
             </div>
             
             <div className="flex items-center gap-2">
               <button 
                  onClick={() => setShowGrid(!showGrid)} 
                  className={`p-2 rounded-sm ${showGrid ? 'text-cyan-400 bg-cyan-900/20' : 'text-zinc-500'}`} 
                  title="Toggle Grid"
               >
                 <Grid size={16} />
               </button>
               <div className="h-4 w-px bg-zinc-800 mx-2"></div>
               <button onClick={handleUndo} disabled={historyStep <= 0} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"><Undo size={16}/></button>
               <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"><Redo size={16}/></button>
               <div className="h-4 w-px bg-zinc-800 mx-2"></div>
               <button onClick={onClose} className="p-2 text-zinc-500 hover:text-red-400 transition-colors"><X size={18}/></button>
             </div>
          </div>
          
          <div className="flex flex-1 min-h-0">
            {/* Left Toolbar */}
            <div className="w-14 border-r border-zinc-800 bg-black flex flex-col items-center py-4 gap-4 overflow-y-auto">
               
               {/* Tools */}
               <div className="flex flex-col gap-2 w-full px-2">
                 {[
                    { id: 'pen', icon: Pen, label: 'Freehand' },
                    { id: 'eraser', icon: Eraser, label: 'Eraser' },
                 ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTool(t.id as Tool)}
                      className={`p-2 rounded-sm transition-all flex justify-center ${tool === t.id ? 'bg-zinc-800 text-cyan-400 border-l-2 border-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                      title={t.label}
                    >
                       <t.icon size={18} />
                    </button>
                 ))}
               </div>

               <div className="w-8 h-px bg-zinc-800"></div>

               {/* Shapes (Elements) */}
               <div className="flex flex-col gap-2 w-full px-2">
                  <span className="text-[8px] font-mono uppercase text-zinc-600 text-center mb-1">Elements</span>
                  {[
                    { id: 'rect', icon: Square, label: 'Rectangle' },
                    { id: 'circle', icon: Circle, label: 'Circle' },
                    { id: 'line', icon: Minus, label: 'Line' },
                    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTool(t.id as Tool)}
                      className={`p-2 rounded-sm transition-all flex justify-center ${tool === t.id ? 'bg-zinc-800 text-white border-l-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                      title={t.label}
                    >
                       <t.icon size={18} />
                    </button>
                  ))}
               </div>

               <div className="w-8 h-px bg-zinc-800"></div>

               {/* Colors */}
               <div className="flex flex-col gap-3 items-center">
                  {[ '#06b6d4', '#f43f5e', '#10b981', '#f59e0b', '#ffffff' ].map(c => (
                    <button 
                      key={c}
                      onClick={() => { setColor(c); if(tool==='eraser') setTool('pen'); }}
                      className={`w-4 h-4 rounded-full transition-all ${color === c && tool !== 'eraser' ? 'ring-2 ring-offset-2 ring-offset-black ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
               </div>
               
               <div className="mt-auto pt-4">
                  <button onClick={clearCanvas} className="p-2 text-zinc-600 hover:text-red-500" title="Clear Canvas"><Trash2 size={18} /></button>
               </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-zinc-950 cursor-crosshair touch-none overflow-hidden">
               <canvas
                  ref={canvasRef}
                  className="w-full h-full block"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
               />
               {/* Grid overlay */}
               {showGrid && (
                 <div className="absolute inset-0 pointer-events-none opacity-10" 
                    style={{ backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
                 </div>
               )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="h-14 border-t border-zinc-800 bg-black flex justify-between items-center px-6">
             <div className="text-[10px] font-mono text-zinc-500">
                MODE: {tool.toUpperCase()} | LAYER: 01 {initialImage ? '[IMG_LOCKED]' : ''}
             </div>
             <div className="flex gap-4">
               <button onClick={onClose} className="px-6 py-2 text-xs font-mono uppercase text-zinc-500 hover:text-white transition-colors">Discard</button>
               <button 
                 onClick={handleExport}
                 className="px-8 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2 transition-colors border border-transparent"
               >
                 <Check size={14} /> Attach to Neural Link
               </button>
             </div>
          </div>
       </div>
    </div>
  );
};

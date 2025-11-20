
import React, { useState, useEffect } from 'react';
import { FusionArtifact } from '../types';
import { Code, Eye, Play, Layers, Download, Cpu, Zap, LayoutTemplate, Palette } from 'lucide-react';
import { ChartRenderer } from './ChartRenderer';

interface FusionCanvasProps {
  artifact: FusionArtifact | null;
  isProcessing: boolean;
}

export const FusionCanvas: React.FC<FusionCanvasProps> = ({ artifact, isProcessing }) => {
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'CODE' | 'ANALYSIS'>('CODE');
  const [showHologram, setShowHologram] = useState(true);

  useEffect(() => {
    if (artifact) {
      setCode(artifact.pythonCode);
    }
  }, [artifact]);

  const getLayoutClass = (layout: string) => {
    switch(layout) {
      case 'left': return 'items-center justify-start pl-12';
      case 'right': return 'items-center justify-end pr-12';
      case 'bottom': return 'items-end justify-center pb-12';
      default: return 'items-center justify-center'; // center
    }
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col overflow-hidden relative font-sans">
      
      {/* Loading State (Cinematic) */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="relative w-48 h-48 mb-12">
             <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin shadow-[0_0_30px_#06b6d4]"></div>
             <div className="absolute inset-2 border-r-2 border-fuchsia-500 rounded-full animate-spin-slow shadow-[0_0_30px_#d946ef]"></div>
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-32 h-32 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center animate-pulse">
                 <Cpu className="text-white drop-shadow-[0_0_10px_white]" size={48} />
               </div>
             </div>
          </div>
          <h2 className="text-3xl font-black tracking-[0.5em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-500 uppercase animate-pulse">
            FUSION PROTOCOL
          </h2>
          <div className="mt-8 font-mono text-xs text-zinc-500 flex flex-col items-center gap-2">
            <span className="text-cyan-500 flex items-center gap-2"><Zap size={10}/> SYNTHESIZING VISUAL REALITY (IMAGEN 4.0)</span>
            <span className="text-fuchsia-500 flex items-center gap-2"><Eye size={10}/> EXTRACTING SPATIAL COORDINATES</span>
            <span className="text-emerald-500 flex items-center gap-2"><Code size={10}/> GENERATING HOLOGRAPHIC DATA LAYER</span>
          </div>
        </div>
      )}

      {!artifact && !isProcessing && (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 font-mono gap-4">
           <Zap size={48} className="opacity-20" />
           <p className="tracking-widest uppercase text-xs">Awaiting Fusion Trigger</p>
           <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-sm text-[10px]">
             TYPE "ACTIVATE LIDATAI" IN COMMAND BAR
           </div>
        </div>
      )}

      {artifact && (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          
          {/* Left: Visual Core (The Art) */}
          <div className="flex-1 bg-zinc-950 relative overflow-hidden border-r border-zinc-800 flex items-center justify-center group">
            
            {/* The Generated Image */}
            <div className="relative w-full h-full">
              <img 
                 src={artifact.baseImage} 
                 alt="Generated Base" 
                 className="w-full h-full object-cover transition-transform duration-[10s] ease-linear transform hover:scale-105" 
              />
              
              {/* Holographic Data Overlay */}
              {showHologram && (
                <div className={`absolute inset-0 flex ${getLayoutClass(artifact.analysis.layout)} p-8 transition-all duration-1000`}>
                  <div 
                    className="w-full max-w-2xl h-[400px] relative z-10 backdrop-blur-sm animate-fade-in"
                    style={{ mixBlendMode: 'screen' }}
                  >
                     {/* The Chart Rendered Transparently */}
                     <div className="w-full h-full p-6 border-l-2 border-white/20 bg-gradient-to-r from-black/40 to-transparent shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        <h3 
                          className="text-2xl font-bold uppercase tracking-widest mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
                          style={{ color: artifact.analysis.palette[0] }}
                        >
                           {artifact.chartConfig.title}
                        </h3>
                        <div className="w-full h-[300px]">
                           <ChartRenderer config={artifact.chartConfig} />
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* Vignette & Grain */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]"></div>
              <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
            </div>
            
            {/* Meta Tags */}
            <div className="absolute top-6 left-6 flex flex-col gap-2">
               <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 flex items-center gap-3 text-[10px] font-mono text-white rounded-sm">
                  <Eye size={12} className="text-cyan-400" /> 
                  <span>VISUAL_CTX: {artifact.analysis.description.substring(0, 30)}...</span>
               </div>
               <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 flex items-center gap-3 text-[10px] font-mono text-white rounded-sm">
                  <Palette size={12} className="text-fuchsia-400" /> 
                  <div className="flex gap-1">
                     {artifact.analysis.palette.map(c => (
                        <div key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }}></div>
                     ))}
                  </div>
                  <span>PALETTE_LOCKED</span>
               </div>
               <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 flex items-center gap-3 text-[10px] font-mono text-white rounded-sm">
                  <LayoutTemplate size={12} className="text-emerald-400" /> 
                  <span>OPTIMAL_LAYOUT: {artifact.analysis.layout.toUpperCase()}</span>
               </div>
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 onClick={() => setShowHologram(!showHologram)}
                 className="px-4 py-2 bg-black/80 backdrop-blur border border-white/20 text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
               >
                 {showHologram ? 'Hide Hologram' : 'Show Hologram'}
               </button>
            </div>
          </div>

          {/* Right: Logic Core (Code) */}
          <div className="w-full lg:w-1/3 bg-[#0d0d0d] flex flex-col border-l border-zinc-800">
            <div className="h-14 bg-black border-b border-zinc-800 flex items-center px-6 justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-500">
                 <Code size={14} /> Generative Kernel
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-mono text-zinc-500">LIVE_EXECUTION</span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative font-mono text-xs leading-relaxed">
               <textarea 
                 readOnly
                 value={code}
                 className="w-full h-full bg-transparent text-zinc-300 p-6 outline-none resize-none"
               />
               {/* Scanline */}
               <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[100px] animate-scan opacity-20"></div>
            </div>

            <div className="p-6 bg-black border-t border-zinc-800">
               <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-2 tracking-widest">System Prompt Analysis</h4>
               <div className="text-zinc-400 text-xs italic border-l-2 border-zinc-700 pl-3">
                  "{artifact.prompt}"
               </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

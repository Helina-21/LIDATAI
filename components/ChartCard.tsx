
import React, { useState } from 'react';
import { Download, Sparkles, X, Check, Loader2, TrendingUp, Zap, Settings, LayoutTemplate, Search, PieChart, BarChart3, Activity, Radar, Palette, MousePointerClick } from 'lucide-react';
import { ChartConfig, ChartType, DataPoint } from '../types';
import { ChartRenderer, NEON_COLORS } from './ChartRenderer';
import { GlassCard } from './GlassCard';
import { generateSingleChart, expandChartData, getChartInsight } from '../services/geminiService';

interface ChartCardProps {
  config: ChartConfig;
  className?: string;
  onRegenerate?: (newConfig: ChartConfig) => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({ config, className = '', onRegenerate }) => {
  // AI States
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [isGettingInsight, setIsGettingInsight] = useState(false);

  // UI States
  const [showSettings, setShowSettings] = useState(false);
  
  // Interactive States (Local Overrides)
  const [localType, setLocalType] = useState<ChartType>(config.type);
  const [localColor, setLocalColor] = useState<string>(config.color || NEON_COLORS[0]);
  const [localLegendPos, setLocalLegendPos] = useState(config.legendPosition || 'bottom');
  const [localZoom, setLocalZoom] = useState(config.enableZoom || false);
  
  // Data Selection
  const [selectedData, setSelectedData] = useState<DataPoint | null>(null);

  // --- Helpers ---

  const cycleLegend = () => {
    const positions: ('bottom' | 'top' | 'right' | 'none')[] = ['bottom', 'right', 'top', 'none'];
    const nextIdx = (positions.indexOf(localLegendPos) + 1) % positions.length;
    setLocalLegendPos(positions[nextIdx]);
  };

  // --- Actions ---

  const handleExportCSV = () => {
    if (!config.data || config.data.length === 0) return;
    const headers = ['Name', 'Value', 'Value2', 'Category'];
    const rows = config.data.map(item => [
      `"${item.name}"`,
      item.value,
      item.value2 || '',
      item.category ? `"${item.category}"` : ''
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.title.replace(/\s+/g, '_').toLowerCase()}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExpandData = async () => {
    if (!onRegenerate) return;
    setIsExpanding(true);
    try {
      const newData = await expandChartData(config.data, config.title);
      onRegenerate({ ...config, data: newData });
    } catch (err) {
      alert("Data expansion protocols failed.");
    } finally {
      setIsExpanding(false);
    }
  };

  const handleQuickInsight = async () => {
    if (insight) {
      setInsight(null);
      return;
    }
    setIsGettingInsight(true);
    try {
      const result = await getChartInsight(config);
      setInsight(result);
    } finally {
      setIsGettingInsight(false);
    }
  };

  const handleRegenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsLoading(true);
    try {
      const newConfig = await generateSingleChart(prompt, config);
      if (onRegenerate) {
        onRegenerate(newConfig);
        // Reset local overrides on new generation
        setLocalType(newConfig.type);
        setLocalColor(newConfig.color || NEON_COLORS[0]);
        setIsRegenerating(false);
        setPrompt('');
      }
    } catch (err) {
      alert("Visualization protocol failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataClick = (data: DataPoint) => {
    setSelectedData(data);
  };

  // Combine props with local overrides
  const renderConfig = { 
    ...config, 
    legendPosition: localLegendPos, 
    enableZoom: localZoom
  };

  return (
    <GlassCard className={`p-0 flex flex-col relative group ${className}`}>
      
      {/* Header Area */}
      <div className="p-6 pb-2 relative z-10">
        <div className="flex justify-between items-start">
          <div className="pr-32">
             <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 break-words">
               {config.title}
             </h3>
             <p className="text-xs text-zinc-500 font-mono mt-1">{config.description}</p>
          </div>
          
          {/* Main Toolbar */}
          <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-800 rounded-sm p-1 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute right-6 top-6">
             <button 
               onClick={() => setShowSettings(!showSettings)}
               className={`p-1.5 rounded-sm transition-colors ${showSettings ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
               title="Customize Visualization"
             >
               <Settings size={14} />
             </button>
             <div className="w-px h-3 bg-zinc-700 mx-1"></div>
             
             <button onClick={handleQuickInsight} disabled={isGettingInsight} className={`p-1.5 rounded-sm transition-colors ${insight ? 'text-yellow-400' : 'text-zinc-400 hover:text-white'}`}>
               {isGettingInsight ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14}/>}
             </button>
             <button onClick={handleExpandData} disabled={isExpanding} className="p-1.5 rounded-sm text-zinc-400 hover:text-purple-400 transition-colors">
               {isExpanding ? <Loader2 size={14} className="animate-spin"/> : <TrendingUp size={14}/>}
             </button>
             <button onClick={() => setIsRegenerating(!isRegenerating)} className="p-1.5 rounded-sm text-zinc-400 hover:text-cyan-400 transition-colors">
               <Sparkles size={14}/>
             </button>
             <button onClick={handleExportCSV} className="p-1.5 rounded-sm text-zinc-400 hover:text-emerald-400 transition-colors">
               <Download size={14}/>
             </button>
          </div>
        </div>

        {/* Customization Drawer */}
        {showSettings && (
          <div className="mt-4 p-3 bg-black/40 border border-white/5 rounded-sm animate-fade-in grid grid-cols-2 gap-4">
            {/* Chart Types */}
            <div className="space-y-2">
               <label className="text-[10px] font-mono uppercase text-zinc-500 block">Visualization Model</label>
               <div className="flex gap-1">
                  {[
                    { type: ChartType.AREA, icon: Activity },
                    { type: ChartType.BAR, icon: BarChart3 },
                    { type: ChartType.PIE, icon: PieChart },
                    { type: ChartType.RADAR, icon: Radar }
                  ].map(item => (
                    <button
                      key={item.type}
                      onClick={() => setLocalType(item.type)}
                      className={`p-2 rounded-sm border ${localType === item.type ? 'bg-white/10 border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                    >
                      <item.icon size={14} />
                    </button>
                  ))}
               </div>
            </div>

            {/* Controls & Colors */}
            <div className="space-y-2">
               <label className="text-[10px] font-mono uppercase text-zinc-500 block">Appearance & Data</label>
               <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={cycleLegend} className="text-[10px] px-2 py-1 border border-zinc-700 rounded-sm hover:bg-white/5 flex items-center gap-1 text-zinc-300">
                    <LayoutTemplate size={10}/> Legend: {localLegendPos}
                  </button>
                  <button onClick={() => setLocalZoom(!localZoom)} className={`text-[10px] px-2 py-1 border border-zinc-700 rounded-sm flex items-center gap-1 ${localZoom ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/50' : 'text-zinc-300 hover:bg-white/5'}`}>
                    <Search size={10}/> Zoom
                  </button>
                  <div className="w-px h-4 bg-zinc-800 mx-1"></div>
                  {NEON_COLORS.slice(0,4).map(c => (
                    <button 
                      key={c} 
                      onClick={() => setLocalColor(c)}
                      className={`w-4 h-4 rounded-full border ${localColor === c ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                      style={{ backgroundColor: c }} 
                    />
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* Insight Banner */}
        {insight && (
          <div className="mt-4 p-3 bg-yellow-500/5 border-l-2 border-yellow-500 flex justify-between items-start animate-fade-in">
             <p className="text-xs font-mono text-yellow-100 leading-relaxed pr-4">{insight}</p>
             <button onClick={() => setInsight(null)} className="text-yellow-500 hover:text-white"><X size={12}/></button>
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="flex-1 min-h-0 relative w-full p-2 pt-0">
        <ChartRenderer 
           config={renderConfig}
           activeType={localType}
           activeColor={localColor}
           onDataClick={handleDataClick}
           isLoading={isLoading || isExpanding} 
        />
        
        {/* Drill Down Modal (Overlay) */}
        {selectedData && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950/95 border border-zinc-600 p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl z-20 max-w-xs w-full animate-fade-in">
              <div className="flex justify-between items-start mb-4 border-b border-zinc-800 pb-2">
                 <div>
                   <span className="text-[10px] text-zinc-500 uppercase font-mono block">Data Node</span>
                   <span className="text-lg font-bold text-white tracking-wider">{selectedData.name}</span>
                 </div>
                 <button onClick={() => setSelectedData(null)} className="text-zinc-500 hover:text-white">
                   <X size={16} />
                 </button>
              </div>
              <div className="space-y-3 font-mono text-sm">
                 <div className="flex justify-between">
                    <span className="text-zinc-400">Value:</span>
                    <span className="text-cyan-400 font-bold">{selectedData.value.toLocaleString()}</span>
                 </div>
                 {selectedData.value2 && (
                   <div className="flex justify-between">
                      <span className="text-zinc-400">Secondary:</span>
                      <span className="text-fuchsia-400 font-bold">{selectedData.value2.toLocaleString()}</span>
                   </div>
                 )}
                 {selectedData.category && (
                   <div className="flex justify-between">
                      <span className="text-zinc-400">Category:</span>
                      <span className="text-white">{selectedData.category}</span>
                   </div>
                 )}
              </div>
              <button 
                 onClick={() => {
                   setPrompt(`Analyze specifically why ${selectedData.name} has value ${selectedData.value}`);
                   setSelectedData(null);
                   setIsRegenerating(true);
                 }}
                 className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-white/10 text-xs py-2 uppercase tracking-widest text-zinc-300 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles size={12} /> Analyze Node
              </button>
           </div>
        )}
      </div>

      {/* Regeneration Input Overlay */}
      {isRegenerating && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-8 animate-fade-in">
          <div className="w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} /> Modification Protocol
              </h4>
              <button onClick={() => setIsRegenerating(false)} className="text-zinc-500 hover:text-white"><X size={16}/></button>
            </div>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe visual or data modifications..."
              className="w-full h-32 bg-zinc-900 border border-zinc-700 p-4 text-white font-mono text-sm focus:border-cyan-500 outline-none resize-none mb-4"
              autoFocus
            />
            <button 
              onClick={handleRegenerateSubmit}
              disabled={isLoading || !prompt.trim()}
              className="w-full bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
               {isLoading ? <Loader2 className="animate-spin" size={14}/> : <Check size={14}/>}
               Execute Changes
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

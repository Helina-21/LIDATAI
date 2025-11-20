
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { GlassCard } from './components/GlassCard';
import { ChartCard } from './components/ChartCard';
import { ChatInterface } from './components/ChatInterface';
import { ImageEditor } from './components/ImageEditor';
import { ConsoleInterface } from './components/ConsoleInterface';
import { DataConnectors } from './components/DataConnectors';
import { LidataLogo } from './components/LidataLogo';
import { DeveloperConsole } from './components/DeveloperConsole';
import { FusionCanvas } from './components/FusionCanvas';
import { CommandNexus } from './components/CommandNexus';
import { generateDashboard, generateDashboardFromData, runFusionProtocol, runPredictiveSimulation } from './services/geminiService';
import { DashboardData, GenerationState, ChartType, ViewMode, ChartConfig, FusionArtifact, CommandAction } from './types';
import { Zap, Command, ArrowUpRight, ArrowDownRight, Loader2, Cpu, Upload, Download, FileJson, Search, Moon, Sun, Palette, PlayCircle } from 'lucide-react';

// Initial Mock Data 
const INITIAL_DATA: DashboardData = {
  title: "NEURAL SYNC STABILITY",
  summary: "LIDATAI Core infrastructure operating at peak resonance. Visual cortex integration nominal.",
  generatedAt: "SYSTEM_INIT",
  kpis: [
    { label: "SYNAPSE FIRING", value: "94.2%", trend: 12.5, trendLabel: "OPTIMAL" },
    { label: "DATA FLUX", value: "842 TB/s", trend: 8.2, trendLabel: "PEAK" },
    { label: "LATENCY", value: "0.4 ms", trend: -12.8, trendLabel: "IMPROVED" },
    { label: "ENTROPY", value: "0.001%", trend: 0, trendLabel: "STABLE" },
  ],
  charts: [
    {
      id: "c1",
      title: "CORTEX ACTIVITY SPECTRUM",
      type: ChartType.AREA,
      description: "Real-time neural load distribution",
      color: "#22d3ee",
      data: [
        { name: "00:00", value: 2400 }, { name: "04:00", value: 1398 },
        { name: "08:00", value: 9800 }, { name: "12:00", value: 3908 },
        { name: "16:00", value: 4800 }, { name: "20:00", value: 3800 },
        { name: "23:59", value: 4300 }
      ]
    },
    {
      id: "c2",
      title: "RESOURCE ALLOCATION",
      type: ChartType.RADAR,
      description: "Subsystem power draw",
      color: "#e879f9",
      data: [
        { name: "VISUAL", value: 120 }, { name: "AUDIO", value: 98 },
        { name: "LOGIC", value: 86 }, { name: "MEMORY", value: 99 },
        { name: "NETWORK", value: 85 }, { name: "IO", value: 65 }
      ]
    },
    {
      id: "c3",
      title: "EVENT INGESTION",
      type: ChartType.BAR,
      description: "Protocol handler throughput",
      color: "#34d399",
      data: [
        { name: "ALPHA", value: 4000 }, { name: "BETA", value: 3000 },
        { name: "GAMMA", value: 2000 }, { name: "DELTA", value: 2780 },
        { name: "EPSILON", value: 1890 }, { name: "ZETA", value: 2390 },
        { name: "ETA", value: 3490 }
      ]
    },
     {
      id: "c4",
      title: "HEAT DISSIPATION",
      type: ChartType.COMPOSED,
      description: "Thermal regulation efficiency",
      color: "#f87171",
      data: [
        { name: "CORE-1", value: 590, value2: 800 }, { name: "CORE-2", value: 868, value2: 967 },
        { name: "CORE-3", value: 1397, value2: 1098 }, { name: "CORE-4", value: 1480, value2: 1200 },
        { name: "CORE-5", value: 1520, value2: 1108 }, { name: "CORE-6", value: 1400, value2: 680 }
      ]
    }
  ]
};

type ThemeAccent = 'cyan' | 'rose' | 'amber' | 'emerald' | 'violet';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [prompt, setPrompt] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData>(INITIAL_DATA);
  const [genState, setGenState] = useState<GenerationState>({ isGenerating: false, stage: 'IDLE', progress: 0 });
  const [isThinking, setIsThinking] = useState(false);
  const [showDataHub, setShowDataHub] = useState(false);
  const [fusionArtifact, setFusionArtifact] = useState<FusionArtifact | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Capabilities State
  const [showCommandNexus, setShowCommandNexus] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [accent, setAccent] = useState<ThemeAccent>('cyan');
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    root.setAttribute('data-accent', accent);
  }, [isDarkMode, accent]);

  // Command Nexus Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandNexus(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Command Actions Handler
  const handleCommandAction = (action: CommandAction) => {
     switch(action.id) {
        case 'nav-dash': setCurrentView(ViewMode.DASHBOARD); break;
        case 'nav-chat': setCurrentView(ViewMode.CHAT); break;
        case 'nav-img': setCurrentView(ViewMode.IMAGE_LAB); break;
        case 'nav-term': setCurrentView(ViewMode.CONSOLE); break;
        case 'theme-dark': setIsDarkMode(!isDarkMode); break;
        case 'sys-fusion': setPrompt("ACTIVATE LIDATAI"); handleGenerate(); break;
        case 'sys-sim': setSimulationMode(true); break;
     }
  };

  // Filter Logic
  const filteredCharts = useMemo(() => {
    if (!searchTerm.trim()) return dashboardData.charts;
    return dashboardData.charts.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dashboardData.charts, searchTerm]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    // FUSION PROTOCOL TRIGGER
    if (prompt.toUpperCase() === "ACTIVATE LIDATAI" || prompt.toUpperCase().startsWith("ACTIVATE LIDATAI")) {
       setCurrentView(ViewMode.FUSION);
       setGenState({ isGenerating: true, stage: 'FUSION_PROTOCOL', progress: 0 });
       
       // Extract prompt remainder or use default
       const fusionPrompt = prompt.length > 16 ? prompt.substring(16) : "Futuristic Data Center Interface HUD";
       
       try {
          const artifact = await runFusionProtocol(fusionPrompt);
          setFusionArtifact(artifact);
       } catch(e) {
          alert("Fusion Protocol Failed: " + e);
       } finally {
          setGenState({ isGenerating: false, stage: 'IDLE', progress: 0 });
       }
       return;
    }

    // Predictive Simulation Trigger
    if (simulationMode && currentView === ViewMode.DASHBOARD) {
       setGenState({ isGenerating: true, stage: 'SIMULATING', progress: 10 });
       try {
          const newData = await runPredictiveSimulation(dashboardData, prompt);
          setDashboardData({
            ...newData,
            title: `SIMULATION: ${prompt.toUpperCase()}`
          });
       } catch(e) {
          alert("Simulation Failed");
       } finally {
          setGenState({ isGenerating: false, stage: 'IDLE', progress: 0 });
          setSimulationMode(false);
          setPrompt("");
       }
       return;
    }

    // Standard Dashboard Generation
    if (currentView !== ViewMode.DASHBOARD) {
      setCurrentView(ViewMode.DASHBOARD);
    }
    
    setGenState({ isGenerating: true, stage: 'ANALYZING', progress: 5 });
    setIsThinking(true);

    try {
      const timer = setInterval(() => {
        setGenState(p => ({ ...p, progress: Math.min(p.progress + 5, 90) }));
      }, 500);

      const data = await generateDashboard(prompt);
      clearInterval(timer);
      
      setGenState(p => ({ ...p, stage: 'RENDERING', progress: 100 }));
      setDashboardData(data);
      
    } catch (error) {
      console.error(error);
      alert("Thinking Model Overloaded. Please refine prompt.");
    } finally {
      // Small delay to show 100%
      setTimeout(() => {
        setGenState({ isGenerating: false, stage: 'IDLE', progress: 0 });
        setIsThinking(false);
      }, 800);
    }
  };

  const handleChartUpdate = (index: number, newConfig: ChartConfig) => {
    const newCharts = [...dashboardData.charts];
    newCharts[index] = newConfig;
    setDashboardData({ ...dashboardData, charts: newCharts });
  };

  // --- Import / Export Logic ---

  const handleExportDashboard = () => {
    const blob = new Blob([JSON.stringify(dashboardData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LIDATAI_DASHBOARD_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setIsThinking(true);
      try {
        // Try parsing as JSON first (Native Export)
        try {
          const jsonData = JSON.parse(text);
          if (jsonData.charts && jsonData.kpis) {
            setDashboardData(jsonData);
            setIsThinking(false);
            return;
          }
        } catch(e) { /* Not JSON, proceed to AI CSV parsing */ }

        // Use AI to parse CSV/Raw text
        const data = await generateDashboardFromData(text);
        setDashboardData(data);
      } catch (err) {
        console.error(err);
        alert("Import failed. Data format unrecognizable.");
      } finally {
        setIsThinking(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-[100dvh] w-full bg-background text-primary-foreground font-sans overflow-hidden transition-colors duration-300">
      
      <CommandNexus isOpen={showCommandNexus} onClose={() => setShowCommandNexus(false)} onAction={handleCommandAction} viewMode={currentView} />

      {/* Data Hub Modal */}
      {showDataHub && <DataConnectors onClose={() => setShowDataHub(false)} />}

      {/* Full Screen Loading Overlay */}
      {isThinking && genState.stage !== 'IDLE' && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
           <div className="w-full max-w-md relative">
             <div className="flex justify-between items-end mb-2 text-primary font-mono text-xs">
                <span className="animate-pulse uppercase">System {genState.stage}</span>
                <span>{Math.round(genState.progress)}%</span>
             </div>
             <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
               <div 
                  className="h-full bg-primary shadow-[0_0_15px_var(--primary)] transition-all duration-300 ease-out" 
                  style={{ width: `${genState.progress}%` }}
               ></div>
             </div>
             
             <div className="mt-8 grid grid-cols-2 gap-4">
               <div className="flex items-center gap-3 text-zinc-400 text-xs font-mono">
                 <Cpu size={16} className="text-primary animate-spin-slow" />
                 <span>Constructing Data Nodes...</span>
               </div>
               <div className="flex items-center gap-3 text-zinc-400 text-xs font-mono">
                 <Zap size={16} className="text-primary animate-pulse" />
                 <span>Optimizing Visual Cortex...</span>
               </div>
             </div>
           </div>
        </div>
      )}

      <Sidebar 
         currentView={currentView} 
         onViewChange={setCurrentView} 
         onOpenDataHub={() => setShowDataHub(true)} 
      />
      
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-background transition-colors duration-300">
        {/* Grid Background - GLOBAL - Z-INDEX 0 */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-20" 
             style={{ 
               backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`, 
               backgroundSize: '50px 50px' 
             }}>
        </div>

        {/* Top Header - Z-INDEX 20 */}
        <header className="relative z-20 p-6 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-6">
            <div className="h-12 w-48 text-primary">
               <LidataLogo variant="full" />
            </div>
            <div className="h-8 w-px bg-zinc-800 hidden md:block"></div>
            <p className="text-zinc-500 text-xs font-mono tracking-[0.2em] uppercase hidden md:block pt-1">
              {currentView === ViewMode.DASHBOARD ? 'Analytics Core' : 
               currentView === ViewMode.CHAT ? 'Neural Interface' : 
               currentView === ViewMode.IMAGE_LAB ? 'Visual Synthesis' : 
               currentView === ViewMode.DEVELOPER ? 'LIDATAI Kernel [DEV]' : 
               currentView === ViewMode.FUSION ? 'FUSION PROTOCOL ACTIVE' : 'System'}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
             
             {/* Global Search (Dashboard & General Trigger) */}
             <div className="relative hidden md:block w-64 group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <form onSubmit={(e) => {
                  // Prevent submit if just filtering in dashboard view
                  if (currentView === ViewMode.DASHBOARD) {
                    e.preventDefault();
                  } else {
                    handleGenerate(e);
                  }
                }}>
                  <input 
                    type="text" 
                    value={currentView === ViewMode.DASHBOARD ? searchTerm : prompt} 
                    onChange={(e) => currentView === ViewMode.DASHBOARD ? setSearchTerm(e.target.value) : setPrompt(e.target.value)}
                    placeholder={currentView === ViewMode.DASHBOARD ? "Search Dashboard..." : "Execute System Command..."}
                    className="w-full bg-surface border border-border rounded-full py-2 pl-9 pr-4 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-zinc-600"
                  />
                </form>
             </div>

             {/* Theme Controls */}
             <div className="relative">
                <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors">
                  <Palette size={16} />
                </button>
                
                {showThemeMenu && (
                  <div className="absolute right-0 top-full mt-4 p-4 bg-surface border border-border shadow-xl rounded-lg min-w-[200px] animate-fade-in z-50">
                     <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                        <span className="text-xs font-bold uppercase text-zinc-500">Mode</span>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1 rounded-md hover:bg-zinc-800/10 text-zinc-500 hover:text-primary transition-colors">
                           {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                        </button>
                     </div>
                     <div className="space-y-2">
                        <span className="text-xs font-bold uppercase text-zinc-500">Neural Accent</span>
                        <div className="grid grid-cols-5 gap-2">
                           {(['cyan', 'rose', 'amber', 'emerald', 'violet'] as ThemeAccent[]).map(c => (
                             <button 
                               key={c}
                               onClick={() => setAccent(c)}
                               className={`w-6 h-6 rounded-full border-2 transition-all ${accent === c ? 'border-primary scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                               style={{ backgroundColor: c === 'cyan' ? '#06b6d4' : c === 'rose' ? '#f43f5e' : c === 'amber' ? '#f59e0b' : c === 'emerald' ? '#10b981' : '#8b5cf6' }}
                             />
                           ))}
                        </div>
                     </div>
                     <div className="mt-2 pt-2 border-t border-border text-[10px] text-zinc-500 text-center cursor-pointer hover:text-primary" onClick={() => setShowThemeMenu(false)}>
                        CLOSE MENU
                     </div>
                  </div>
                )}
             </div>

             {/* Import/Export Controls */}
             {currentView === ViewMode.DASHBOARD && (
               <div className="hidden md:flex items-center gap-2 mr-4 border-l border-border pl-4">
                  <input type="file" ref={fileInputRef} onChange={handleImportFile} className="hidden" accept=".csv,.json,.txt" />
                  <button onClick={() => setShowDataHub(true)} className="px-4 py-1 text-xs font-bold bg-primary/10 border border-primary/50 text-primary rounded-sm hover:bg-primary/20 transition-colors mr-2">
                     DATA HUB
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-400 hover:text-primary transition-colors" title="Quick Import">
                    <Upload size={16} />
                  </button>
                  <button onClick={handleExportDashboard} className="p-2 text-zinc-400 hover:text-primary transition-colors" title="Export State">
                    <FileJson size={16} />
                  </button>
               </div>
             )}

             <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-zinc-500">
                <span>CPU: 12%</span>
                <span>MEM: 45%</span>
                <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full shadow-[0_0_10px_#22c55e]"></div>
             </div>
          </div>
        </header>

        {/* Content Area - Z-INDEX 10 */}
        <div className="flex-1 overflow-hidden relative z-10 flex flex-col min-h-0">
          
          {/* DASHBOARD VIEW */}
          {currentView === ViewMode.DASHBOARD && (
            <div className={`h-full flex flex-col animate-fade-in transition-colors duration-500 ${simulationMode ? 'bg-amber-900/10' : ''}`}>
              {/* Dashboard Controls */}
              <div className="p-6 border-b border-border bg-surface/20 shrink-0 transition-colors">
                 <div className="flex justify-between items-center mb-2">
                    {simulationMode ? (
                      <div className="text-amber-500 font-bold text-xs uppercase animate-pulse flex items-center gap-2">
                         <Cpu size={14} /> Predictive Simulation Active
                      </div>
                    ) : <div></div>}
                    <button 
                      onClick={() => setSimulationMode(!simulationMode)}
                      className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border transition-all ${simulationMode ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'border-zinc-700 text-zinc-500 hover:text-white'}`}
                    >
                      {simulationMode ? 'Exit Simulation' : 'Enter Simulation Mode'}
                    </button>
                 </div>
                 <form onSubmit={handleGenerate} className="relative max-w-3xl">
                    <div className={`flex items-center border-b pb-2 transition-colors ${simulationMode ? 'border-amber-500' : 'border-zinc-600 focus-within:border-primary'}`}>
                      <Command size={18} className={`${simulationMode ? 'text-amber-500' : 'text-zinc-500'} mr-3`} />
                      <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={simulationMode ? "Enter scenario (e.g. 'Global Cyber Attack impacts Latency')" : "Initialize simulation parameters (e.g. 'Global Internet Traffic 2040')"}
                        className={`bg-transparent w-full outline-none font-mono text-sm placeholder-zinc-600 ${simulationMode ? 'text-amber-500' : 'text-primary'}`}
                        disabled={isThinking}
                      />
                      <button type="submit" disabled={isThinking} className={`text-xs uppercase font-bold hover:opacity-80 transition-colors ${simulationMode ? 'text-amber-500' : 'text-primary'}`}>
                        {isThinking ? <Loader2 className="animate-spin" size={16}/> : (simulationMode ? 'RUN_SIMULATION' : 'RUN_PROTOCOL')}
                      </button>
                    </div>
                 </form>
              </div>

              {/* Dashboard Content */}
              <div className="flex-1 overflow-y-auto p-6 pb-32 scroll-smooth">
                <h2 className={`text-xl font-light mb-2 uppercase tracking-widest transition-colors ${simulationMode ? 'text-amber-500' : 'text-primary'}`}>{dashboardData.title}</h2>
                <p className="text-sm text-zinc-500 mb-8 font-mono max-w-4xl border-l-2 border-border pl-4 transition-colors">{dashboardData.summary}</p>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  {dashboardData.kpis.map((kpi, idx) => (
                    <GlassCard key={idx} className="p-6 group hover:border-primary/40 transition-all duration-500">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{kpi.label}</span>
                        <Zap size={12} className="text-zinc-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className={`text-3xl font-light mb-2 font-mono drop-shadow-[0_0_5px_var(--primary-glow)] ${simulationMode ? 'text-amber-500' : 'text-primary'}`}>{kpi.value}</div>
                      <div className={`flex items-center gap-2 text-xs font-mono ${kpi.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {kpi.trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        <span>{Math.abs(kpi.trend)}%</span>
                        <span className="text-zinc-500 ml-2">/ {kpi.trendLabel}</span>
                      </div>
                    </GlassCard>
                  ))}
                </div>

                {/* Charts Grid */}
                {filteredCharts.length > 0 ? (
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-min">
                      {filteredCharts.map((chart, idx) => {
                        // Dynamic Layout Logic based on array position or type
                        let colSpan = "lg:col-span-6";
                        if (idx === 0) colSpan = "lg:col-span-8";
                        if (idx === 1 || idx === 2) colSpan = "lg:col-span-4";
                        if (chart.type === ChartType.AREA && idx > 2) colSpan = "lg:col-span-12";

                        return (
                          <div key={chart.id} className={`${colSpan} h-[350px] lg:h-[400px]`}>
                            <ChartCard 
                              config={chart} 
                              className="h-full"
                              onRegenerate={(cfg) => handleChartUpdate(idx, cfg)} 
                            />
                          </div>
                        );
                      })}
                   </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-border rounded-lg">
                    <Search size={32} className="mb-2 opacity-50" />
                    <p className="text-xs font-mono uppercase tracking-widest">No Visualizations Found</p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* CHAT VIEW */}
          {currentView === ViewMode.CHAT && (
            <div className="h-full animate-fade-in bg-transparent relative">
              <ChatInterface currentDashboardData={dashboardData} />
            </div>
          )}

          {/* IMAGE LAB VIEW */}
          {currentView === ViewMode.IMAGE_LAB && (
            <div className="h-full animate-fade-in bg-transparent">
              <ImageEditor />
            </div>
          )}

          {/* CONSOLE VIEW */}
          {currentView === ViewMode.CONSOLE && (
            <div className="h-full animate-fade-in bg-transparent">
               <ConsoleInterface />
            </div>
          )}

          {/* DEVELOPER VIEW */}
          {currentView === ViewMode.DEVELOPER && (
             <div className="h-full animate-fade-in bg-transparent">
                <DeveloperConsole />
             </div>
          )}

          {/* FUSION VIEW (ACTIVATE LIDATAI) */}
          {currentView === ViewMode.FUSION && (
            <div className="h-full animate-fade-in bg-transparent">
               <FusionCanvas artifact={fusionArtifact} isProcessing={genState.isGenerating} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;

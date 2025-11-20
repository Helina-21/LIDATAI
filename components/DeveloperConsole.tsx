
import React, { useState, useEffect, useRef } from 'react';
import { Server, Activity, Terminal, Database, Cpu, Wifi, X, Play, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { MCPServer, MCPTool, SystemLog } from '../types';
import { GlassCard } from './GlassCard';

const MOCK_TOOLS: MCPTool[] = [
  { name: 'google_search', description: 'Search the web for current information', parameters: { query: 'string' } },
  { name: 'fs_read_file', description: 'Read file from local virtual filesystem', parameters: { path: 'string' } },
  { name: 'python_repl', description: 'Execute python code in sandboxed environment', parameters: { code: 'string' } },
  { name: 'imagen_generate', description: 'Generate images using Imagen 4.0', parameters: { prompt: 'string', aspect_ratio: 'string' } },
];

const MOCK_LOGS: SystemLog[] = [
  { id: '1', timestamp: new Date().toISOString(), level: 'INFO', message: 'LIDATAI Kernel initialized successfully.' },
  { id: '2', timestamp: new Date().toISOString(), level: 'INFO', message: 'Neural Cortex link established (Latency: 4ms).' },
  { id: '3', timestamp: new Date().toISOString(), level: 'WARN', message: 'Memory usage spike detected in Visual Cortex.' },
];

export const DeveloperConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MCP' | 'LOGS' | 'PROMPTS'>('OVERVIEW');
  const [servers, setServers] = useState<MCPServer[]>([
    { id: 'srv-1', name: 'Local Filesystem', url: 'ws://localhost:8080/mcp', status: 'CONNECTED' },
    { id: 'srv-2', name: 'Brave Search', url: 'ws://mcp.brave.com/v1', status: 'DISCONNECTED' }
  ]);
  const [logs, setLogs] = useState<SystemLog[]>(MOCK_LOGS);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Simulate live logs
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newLog: SystemLog = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: Math.random() > 0.9 ? 'ERROR' : Math.random() > 0.8 ? 'WARN' : 'INFO',
          message: `System tick event: ${Math.floor(Math.random() * 1000)} ops/sec processed.`
        };
        setLogs(prev => [...prev.slice(-50), newLog]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const toggleServer = (id: string) => {
    setServers(prev => prev.map(s => 
      s.id === id ? { ...s, status: s.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' } : s
    ));
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-300 font-mono text-xs">
      
      {/* Header */}
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-black">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-red-500" size={18} />
          <span className="font-bold uppercase tracking-widest text-zinc-100">Developer Kernel Mode</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-500">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span>SYSTEM_ONLINE</span>
           </div>
           <span>v.0.9.4-alpha</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex min-h-0">
        
        {/* Sidebar Nav */}
        <div className="w-48 border-r border-zinc-800 bg-black/50 flex flex-col pt-4">
           {[
             { id: 'OVERVIEW', icon: Activity, label: 'System Status' },
             { id: 'MCP', icon: Server, label: 'MCP Servers' },
             { id: 'LOGS', icon: Terminal, label: 'Live Telemetry' },
             { id: 'PROMPTS', icon: Database, label: 'Prompt Inspector' },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-3 px-6 py-3 transition-colors ${activeTab === tab.id ? 'bg-zinc-900 text-white border-r-2 border-cyan-500' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               <tab.icon size={16} />
               <span className="uppercase tracking-wider">{tab.label}</span>
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-zinc-950 relative flex flex-col">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'OVERVIEW' && (
            <div className="p-8 grid grid-cols-2 gap-6 overflow-y-auto">
               <GlassCard className="p-6 border-zinc-800">
                  <h3 className="text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Cpu size={16}/> Neural Load</h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-light text-white">12%</span>
                    <span className="text-emerald-500 mb-1">▼ 2.4%</span>
                  </div>
                  <div className="h-32 flex items-end gap-1">
                    {[40, 65, 30, 80, 55, 20, 45, 70, 35, 60, 25, 50].map((h, i) => (
                      <div key={i} className="flex-1 bg-cyan-900/30 border-t border-cyan-500/50" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
               </GlassCard>

               <GlassCard className="p-6 border-zinc-800">
                  <h3 className="text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Wifi size={16}/> API Latency</h3>
                   <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-light text-white">24ms</span>
                    <span className="text-zinc-600 mb-1">avg</span>
                  </div>
                  <div className="space-y-2 mt-4">
                     <div className="flex justify-between border-b border-zinc-800 pb-1">
                       <span>Gemini 3 Pro</span>
                       <span className="text-emerald-500">Healthy</span>
                     </div>
                     <div className="flex justify-between border-b border-zinc-800 pb-1">
                       <span>Imagen 4.0</span>
                       <span className="text-emerald-500">Healthy</span>
                     </div>
                     <div className="flex justify-between border-b border-zinc-800 pb-1">
                       <span>Vector DB</span>
                       <span className="text-amber-500">Syncing...</span>
                     </div>
                  </div>
               </GlassCard>

               <div className="col-span-2 bg-zinc-900 border border-zinc-800 p-4 font-mono text-zinc-400">
                 <h4 className="uppercase text-xs font-bold mb-2 text-white">Active Session Context</h4>
                 <p className="break-all opacity-70">
                   SESSION_ID: 8f92-x920-1110<br/>
                   USER_ROLE: ADMIN<br/>
                   PERMISSIONS: [READ, WRITE, EXECUTE, FUSION_PROTOCOL]<br/>
                   LAST_CHECKPOINT: 2024-05-20T14:30:00Z
                 </p>
               </div>
            </div>
          )}

          {/* MCP TAB */}
          {activeTab === 'MCP' && (
            <div className="p-8 h-full flex flex-col overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-lg font-bold text-white uppercase tracking-widest">Model Context Protocol</h2>
                   <p className="text-zinc-500">Manage external tool servers</p>
                 </div>
                 <button className="px-4 py-2 bg-white text-black hover:bg-zinc-200 flex items-center gap-2 text-xs uppercase font-bold">
                   <Plus size={14} /> Add Server
                 </button>
               </div>

               <div className="space-y-4">
                  {servers.map(server => (
                    <div key={server.id} className="p-4 bg-zinc-900 border border-zinc-800 flex items-center justify-between group hover:border-cyan-500/50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-sm ${server.status === 'CONNECTED' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-red-900/20 text-red-500'}`}>
                             <Server size={20} />
                          </div>
                          <div>
                             <h4 className="text-white font-bold">{server.name}</h4>
                             <code className="text-zinc-600">{server.url}</code>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className={`px-2 py-1 text-[10px] uppercase font-bold border ${server.status === 'CONNECTED' ? 'border-emerald-900 text-emerald-500' : 'border-zinc-700 text-zinc-500'}`}>
                             {server.status}
                          </div>
                          <button onClick={() => toggleServer(server.id)} className="p-2 text-zinc-500 hover:text-white">
                            {server.status === 'CONNECTED' ? <X size={16} /> : <Play size={16} />}
                          </button>
                       </div>
                    </div>
                  ))}
               </div>

               <h3 className="mt-8 mb-4 text-zinc-500 uppercase tracking-widest font-bold">Exposed Tools</h3>
               <div className="grid grid-cols-2 gap-4 pb-20">
                  {MOCK_TOOLS.map((tool, i) => (
                    <div key={i} className="p-4 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                       <div className="flex items-start justify-between mb-2">
                          <span className="text-cyan-400 font-bold">{tool.name}</span>
                          <span className="text-[10px] text-zinc-600 border border-zinc-800 px-1">FUNCTION</span>
                       </div>
                       <p className="text-zinc-400 mb-2">{tool.description}</p>
                       <div className="text-[10px] font-mono text-zinc-500 bg-black p-2 rounded-sm">
                          Params: {JSON.stringify(tool.parameters)}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'LOGS' && (
            <div className="flex flex-col h-full bg-black p-4 font-mono">
               <div className="flex-1 overflow-y-auto space-y-1">
                  {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 hover:bg-zinc-900/50 p-0.5">
                       <span className="text-zinc-600 shrink-0">{log.timestamp.split('T')[1].slice(0,8)}</span>
                       <span className={`w-12 shrink-0 font-bold ${log.level === 'INFO' ? 'text-cyan-600' : log.level === 'WARN' ? 'text-amber-500' : 'text-red-500'}`}>
                         [{log.level}]
                       </span>
                       <span className="text-zinc-300">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
               </div>
               <div className="mt-2 pt-2 border-t border-zinc-800 flex justify-between">
                  <span className="text-emerald-500">● LIVE STREAMING</span>
                  <button onClick={() => setLogs([])} className="text-zinc-500 hover:text-white flex items-center gap-1">
                    <Trash2 size={12}/> CLEAR
                  </button>
               </div>
            </div>
          )}

          {/* PROMPTS TAB */}
          {activeTab === 'PROMPTS' && (
            <div className="p-8 h-full flex flex-col overflow-y-auto">
               <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4">System Instruction Inspector</h2>
               <div className="flex-1 bg-zinc-900 border border-zinc-800 p-4 font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed">
{`You are Lina, the advanced AI intelligence of LIDATAI.
You are capable of generating visualized reports directly in this feed.

If the user asks for data, analysis, or a chart:
1. Briefly explain the data context.
2. Generate a JSON configuration for the chart wrapped in these STRICT delimiters:
    :::CHART_START
    { ... json content ... }
    :::CHART_END

Rules:
- Use "gemini-3-pro-preview" for complex reasoning.
- Use "gemini-2.5-flash" for low latency tasks.
- Maintain the "Cyberpunk/High-Tech" persona.
- Maximize Thinking Budget (32k) for deep analysis.
`}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

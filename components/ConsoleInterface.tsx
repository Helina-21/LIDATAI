
import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Trash2, Save, Code } from 'lucide-react';
import { executeCode } from '../services/geminiService';
import { ConsoleEntry, ChartConfig } from '../types';
import { ChartRenderer } from './ChartRenderer';

export const ConsoleInterface: React.FC = () => {
  const [history, setHistory] = useState<ConsoleEntry[]>([
    { id: 'init', type: 'system', content: 'LIDATAI KERNEL v0.9.2 INITIALIZED. WAITING FOR INPUT...', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleExecute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const cmd = input;
    setInput('');
    setHistory(prev => [...prev, { id: Date.now().toString(), type: 'input', content: cmd, timestamp: new Date() }]);
    setIsExecuting(true);

    try {
      // Create a context string from previous inputs to maintain "session" memory
      const sessionContext = history
        .filter(h => h.type === 'input')
        .map(h => h.content)
        .slice(-5) // Keep last 5 commands context
        .join('\n');

      const output = await executeCode(cmd, sessionContext);
      setHistory(prev => [...prev, { id: (Date.now() + 1).toString(), type: 'output', content: output, timestamp: new Date() }]);
    } catch (err) {
      setHistory(prev => [...prev, { id: (Date.now() + 1).toString(), type: 'error', content: 'EXECUTION_FAILURE: SEGMENTATION_FAULT (SIMULATED)', timestamp: new Date() }]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Parser to detect embedded charts in console output
  const renderContent = (content: string) => {
    if (content.includes(':::CHART_START')) {
      const parts = [];
      const regex = /:::CHART_START([\s\S]*?):::CHART_END/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
           parts.push(<span key={`text-${lastIndex}`} className="whitespace-pre-wrap">{content.substring(lastIndex, match.index)}</span>);
        }
        try {
          const chartConfig = JSON.parse(match[1]) as ChartConfig;
          parts.push(
            <div key={`chart-${match.index}`} className="w-full h-64 my-4 bg-zinc-900 border border-zinc-700 p-2">
              <ChartRenderer config={chartConfig} />
            </div>
          );
        } catch (e) {
          parts.push(<span key={`err-${match.index}`} className="text-red-500">[MALFORMED PLOT DATA]</span>);
        }
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < content.length) {
         parts.push(<span key={`text-end`} className="whitespace-pre-wrap">{content.substring(lastIndex)}</span>);
      }
      return <div>{parts}</div>;
    }
    return <span className="whitespace-pre-wrap">{content}</span>;
  };

  return (
    <div className="h-full flex flex-col bg-black text-zinc-300 font-mono text-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
         <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500">
            <Terminal size={14} />
            <span>Python Simulation Kernel</span>
         </div>
         <div className="flex gap-2">
           <button onClick={() => setHistory([])} className="p-1 hover:text-white" title="Clear"><Trash2 size={14}/></button>
         </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.map((entry) => (
          <div key={entry.id} className={`flex flex-col gap-1 ${entry.type === 'error' ? 'text-red-400' : ''}`}>
            <div className="flex gap-2 text-xs opacity-50 select-none">
              <span>{entry.timestamp.toLocaleTimeString()}</span>
              <span>{entry.type === 'input' ? '>>>' : entry.type === 'system' ? '[SYS]' : ''}</span>
            </div>
            <div className={`${entry.type === 'input' ? 'text-white font-bold' : 'text-zinc-400 pl-4 border-l border-zinc-800'}`}>
              {renderContent(entry.content)}
            </div>
          </div>
        ))}
        {isExecuting && (
          <div className="flex items-center gap-2 text-cyan-500 animate-pulse">
             <Code size={14} /> Executing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800">
        <form onSubmit={handleExecute} className="relative">
          <div className="absolute left-3 top-3 text-cyan-500 select-none">❯</div>
          <textarea 
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleExecute();
               }
             }}
             placeholder="Enter code to execute..."
             className="w-full bg-black border border-zinc-700 p-3 pl-8 text-white outline-none focus:border-cyan-500 transition-colors resize-none h-20"
             autoFocus
          />
          <button 
            type="submit" 
            disabled={isExecuting || !input.trim()}
            className="absolute right-3 bottom-3 p-2 bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/50 rounded-sm disabled:opacity-0 transition-all"
          >
            <Play size={14} fill="currentColor" />
          </button>
        </form>
      </div>
    </div>
  );
};

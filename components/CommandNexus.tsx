
import React, { useState, useEffect, useRef } from 'react';
import { CommandAction, ViewMode } from '../types';
import { Search, ArrowRight, Terminal, LayoutDashboard, MessageSquare, Image, Zap, Layers, Cpu, Palette } from 'lucide-react';

interface CommandNexusProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: CommandAction) => void;
  viewMode: ViewMode;
}

export const CommandNexus: React.FC<CommandNexusProps> = ({ isOpen, onClose, onAction, viewMode }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions: CommandAction[] = [
    { id: 'nav-dash', label: 'Go to Dashboard', icon: LayoutDashboard, group: 'Navigation', action: () => {} },
    { id: 'nav-chat', label: 'Open Neural Chat', icon: MessageSquare, group: 'Navigation', action: () => {} },
    { id: 'nav-img', label: 'Visual Synthesis Lab', icon: Image, group: 'Navigation', action: () => {} },
    { id: 'nav-term', label: 'Python Kernel Console', icon: Terminal, group: 'Navigation', action: () => {} },
    { id: 'sys-fusion', label: 'Activate Fusion Protocol', icon: Layers, group: 'System', action: () => {} },
    { id: 'sys-sim', label: 'Run Predictive Simulation', icon: Cpu, group: 'System', action: () => {} },
    { id: 'theme-dark', label: 'Toggle Void Mode', icon: Palette, group: 'Theme', action: () => {} },
  ];

  const filteredActions = actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    setSelectedIndex(0);
    setQuery('');
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredActions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          onAction(filteredActions[selectedIndex]);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onAction, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-fade-in">
       <div className="w-full max-w-2xl bg-zinc-950 border border-primary/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden flex flex-col">
          <div className="flex items-center p-4 border-b border-zinc-800">
             <Search className="text-zinc-500 mr-3" size={20} />
             <input 
               ref={inputRef}
               type="text" 
               value={query}
               onChange={e => setQuery(e.target.value)}
               placeholder="Type a command or search..." 
               className="bg-transparent w-full text-lg font-light text-white outline-none placeholder-zinc-600"
             />
             <div className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-2 py-1 rounded-sm">ESC</div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto py-2">
             {filteredActions.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 font-mono text-sm">No commands found.</div>
             ) : (
                <div className="flex flex-col">
                   {filteredActions.map((action, idx) => (
                      <button
                        key={action.id}
                        onClick={() => { onAction(action); onClose(); }}
                        className={`
                           px-4 py-3 flex items-center justify-between transition-colors
                           ${idx === selectedIndex ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-zinc-900 border-l-2 border-transparent'}
                        `}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                         <div className="flex items-center gap-3">
                            <action.icon size={18} className={idx === selectedIndex ? 'text-primary' : 'text-zinc-500'} />
                            <span className={`text-sm ${idx === selectedIndex ? 'text-white font-bold' : 'text-zinc-400'}`}>{action.label}</span>
                         </div>
                         {idx === selectedIndex && <ArrowRight size={14} className="text-primary animate-pulse" />}
                      </button>
                   ))}
                </div>
             )}
          </div>
          
          <div className="bg-black border-t border-zinc-800 p-2 flex justify-between px-4">
             <div className="text-[10px] text-zinc-600 font-mono">LIDATAI COMMAND NEXUS</div>
             <div className="text-[10px] text-zinc-600 font-mono flex gap-3">
                <span>↑↓ NAVIGATE</span>
                <span>↵ EXECUTE</span>
             </div>
          </div>
       </div>
    </div>
  );
};

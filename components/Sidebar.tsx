import React from 'react';
import { MessageSquare, Image, LayoutDashboard, Terminal, Database } from 'lucide-react';
import { ViewMode } from '../types';
import { LidataLogo } from './LidataLogo';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenDataHub?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onOpenDataHub }) => {
  return (
    <div className="hidden md:flex flex-col w-24 h-screen bg-black border-r border-zinc-800 items-center py-8 z-50">
      <div className="mb-16 w-12 h-12 text-white hover:text-primary transition-colors duration-500">
        <LidataLogo variant="icon" />
      </div>
      
      <nav className="flex flex-col gap-12 w-full items-center">
        <NavItem 
          icon={<LayoutDashboard size={28} strokeWidth={1.5} />} 
          active={currentView === ViewMode.DASHBOARD}
          onClick={() => onViewChange(ViewMode.DASHBOARD)}
          label="DASH"
        />
        <NavItem 
          icon={<MessageSquare size={28} strokeWidth={1.5} />} 
          active={currentView === ViewMode.CHAT}
          onClick={() => onViewChange(ViewMode.CHAT)}
          label="CHAT"
        />
        <NavItem 
          icon={<Image size={28} strokeWidth={1.5} />} 
          active={currentView === ViewMode.IMAGE_LAB}
          onClick={() => onViewChange(ViewMode.IMAGE_LAB)}
          label="VISUAL"
        />
        <NavItem 
          icon={<Terminal size={28} strokeWidth={1.5} />} 
          active={currentView === ViewMode.CONSOLE}
          onClick={() => onViewChange(ViewMode.CONSOLE)}
          label="TERM"
        />
        <div className="w-8 h-px bg-zinc-800"></div>
        <NavItem 
          icon={<Database size={28} strokeWidth={1.5} />} 
          active={false}
          onClick={() => onOpenDataHub?.()}
          label="DATA"
        />
      </nav>

      <div className="mt-auto font-mono text-[10px] text-zinc-600 -rotate-90 whitespace-nowrap mb-8 tracking-widest">
        SYS.LIDATAI.0.9.3
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; active?: boolean; onClick: () => void; label: string }> = ({ icon, active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`
      group flex flex-col items-center gap-2 transition-all duration-300
      ${active 
        ? 'text-white scale-110' 
        : 'text-zinc-600 hover:text-zinc-300'}
    `}
  >
    <div className={`p-3 rounded-none ${active ? 'bg-white/10 border border-white/20' : ''}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-mono tracking-widest ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
      {label}
    </span>
  </button>
);
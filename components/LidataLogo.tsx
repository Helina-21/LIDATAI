
import React from 'react';

interface LidataLogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

export const LidataLogo: React.FC<LidataLogoProps> = ({ variant = 'full', className = '' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Logo Icon - Geometric Neural Core */}
      <div className="relative w-10 h-10 shrink-0 group">
        {/* Glow Effect Behind */}
        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500 animate-pulse-fast"></div>
        
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10 drop-shadow-2xl">
          <defs>
             <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#06b6d4" />   {/* Cyan */}
               <stop offset="100%" stopColor="#d946ef" /> {/* Fuchsia */}
             </linearGradient>
             <filter id="glow-soft">
               <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
               <feMerge>
                   <feMergeNode in="coloredBlur"/>
                   <feMergeNode in="SourceGraphic"/>
               </feMerge>
             </filter>
          </defs>
          
          {/* Hexagon Frame */}
          <path 
            d="M32 4 L58 19 V45 L32 60 L6 45 V19 Z" 
            stroke="url(#logo-grad)" 
            strokeWidth="2" 
            fill="rgba(6,182,212,0.05)" 
            strokeLinejoin="round"
            className="transition-all duration-300 group-hover:stroke-white"
          />
          
          {/* Internal Neural Connections */}
          <g filter="url(#glow-soft)">
            {/* Central Hub */}
            <circle cx="32" cy="32" r="4" fill="white" className="animate-pulse" />
            
            {/* Satellite Nodes */}
            <circle cx="32" cy="14" r="2.5" fill="#06b6d4" />
            <circle cx="48" cy="40" r="2.5" fill="#d946ef" />
            <circle cx="16" cy="40" r="2.5" fill="#d946ef" />
            
            {/* Connecting Lines */}
            <path d="M32 32 L32 14" stroke="white" strokeWidth="1.5" opacity="0.6" />
            <path d="M32 32 L48 40" stroke="white" strokeWidth="1.5" opacity="0.6" />
            <path d="M32 32 L16 40" stroke="white" strokeWidth="1.5" opacity="0.6" />
            
            {/* Data Particles */}
            <circle cx="32" cy="22" r="1" fill="white">
               <animate attributeName="cy" values="32;14" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="40" cy="36" r="1" fill="white">
               <animate attributeName="cx" values="32;48" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
               <animate attributeName="cy" values="32;40" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>
      </div>

      {/* Text Mark */}
      {variant === 'full' && (
        <div className="flex flex-col justify-center animate-fade-in">
           {/* Reduced font weight from font-black to font-bold for a sleeker look */}
           <h1 className="text-2xl font-bold tracking-tight leading-none text-white drop-shadow-md font-sans">
             LIDATA<span className="text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-fuchsia-500">I</span>
           </h1>
           <div className="flex items-center gap-2 mt-0.5">
              <div className="h-0.5 w-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full"></div>
              <span className="text-[9px] font-mono tracking-[0.35em] text-zinc-400 uppercase">Neural Sync</span>
           </div>
        </div>
      )}
    </div>
  );
};


import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', glow = false }) => {
  return (
    <div 
      className={`
        relative rounded-none 
        bg-surface/60 
        border border-border
        backdrop-blur-xl 
        transition-colors duration-300
        ${className}
      `}
    >
      {/* Subtle grid noise */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
      
      {/* Corner accents for that "Tech" look */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/30"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/30"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/30"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/30"></div>
    </div>
  );
};

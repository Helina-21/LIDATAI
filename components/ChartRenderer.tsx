
import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, Brush, ReferenceLine, LabelList
} from 'recharts';
import { ChartConfig, ChartType } from '../types';
import { Loader2 } from 'lucide-react';

interface ChartRendererProps {
  config: ChartConfig;
  onDataClick?: (data: any) => void;
  isLoading?: boolean;
  activeColor?: string;    // Allow override
  activeType?: ChartType;  // Allow override
}

// Neon Cyberpunk Palette - High Intensity
export const NEON_COLORS = [
  '#06b6d4', // Cyan
  '#d946ef', // Fuchsia
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
];

const CustomTooltip = ({ active, payload, label, totalValue }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/85 border border-white/20 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-md rounded-sm z-50 min-w-[220px]">
        <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
           <p className="text-white font-mono text-xs uppercase tracking-widest font-bold drop-shadow-sm">{label}</p>
           <div className="flex gap-1">
             <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
             <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-pulse delay-75"></div>
           </div>
        </div>
        {payload.map((entry: any, index: number) => {
          const percent = totalValue ? ((entry.value / totalValue) * 100).toFixed(1) : null;
          return (
            <div key={index} className="flex flex-col mb-2 last:mb-0">
               <div className="flex items-center justify-between gap-4 text-xs font-mono">
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }}></div>
                      <span className="text-zinc-300 uppercase tracking-wider font-semibold">{entry.name}:</span>
                  </div>
                  <span className="text-primary font-bold tracking-wider tabular-nums text-sm drop-shadow-sm">{Number(entry.value).toLocaleString()}</span>
               </div>
               {percent && (
                 <div className="flex justify-end mt-1">
                   <span className="text-[10px] text-zinc-400 font-mono font-bold">{percent}% OF TOTAL</span>
                 </div>
               )}
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export const ChartRenderer: React.FC<ChartRendererProps> = ({ config, onDataClick, isLoading = false, activeColor, activeType }) => {
  // Use overrides if provided, else fallback to config
  const type = activeType || config.type;
  const data = config.data || [];
  const legendPosition = config.legendPosition || 'bottom';
  const enableZoom = config.enableZoom || false;
  // If no explicit color override is provided, use the CSS Variable via a hack or default
  const primaryColor = activeColor || config.color || NEON_COLORS[0];
  const showLabels = config.showDataLabels;
  const isTransparent = config.transparent;

  // Calculate total for pie percentages
  const totalValue = useMemo(() => data.reduce((acc, cur) => acc + (Number(cur.value) || 0), 0), [data]);

  // --- Common Defs for "Amazing" Visuals ---
  const renderDefs = () => (
    <defs>
      {/* Glow Filter */}
      <filter id="neon-glow" height="300%" width="300%" x="-75%" y="-75%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      
      {/* Area Gradient */}
      <linearGradient id={`gradient-area-${config.id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={primaryColor} stopOpacity={0.6} />
        <stop offset="60%" stopColor={primaryColor} stopOpacity={0.1} />
        <stop offset="100%" stopColor={primaryColor} stopOpacity={0.0} />
      </linearGradient>

      {/* Bar Gradient (Vertical Shine) */}
      <linearGradient id={`gradient-bar-${config.id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={primaryColor} stopOpacity={1} />
        <stop offset="100%" stopColor={primaryColor} stopOpacity={0.6} />
      </linearGradient>
      
      {/* Pattern for Background */}
      <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeWidth="1"/>
      </pattern>
    </defs>
  );

  // --- Legend Config Helper ---
  const getLegendProps = () => {
    switch (legendPosition) {
      case 'top': return { verticalAlign: 'top' as const, height: 36 };
      case 'bottom': return { verticalAlign: 'bottom' as const, height: 36 };
      case 'right': return { layout: 'vertical' as const, verticalAlign: 'middle' as const, align: 'right' as const, width: 120 };
      default: return null;
    }
  };
  const legendProps = getLegendProps();

  // --- Loading Overlay ---
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-background/20 backdrop-blur-sm transition-colors">
         {/* Scanning Line Animation */}
         <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent animate-scan"></div>
         
         <div className="z-10 flex flex-col items-center gap-4 p-6 border border-primary/30 bg-surface/80 shadow-[0_0_30px_var(--primary-glow)]">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="font-mono text-xs tracking-widest text-primary animate-pulse">REGENERATING VISUALIZATION...</span>
         </div>
      </div>
    );
  }

  // --- Render Logic ---
  const renderChart = () => {
    const commonProps = {
       data: data,
       onClick: onDataClick ? (e: any) => e && e.activePayload && onDataClick(e.activePayload[0].payload) : undefined,
       margin: { top: 20, right: 30, left: 0, bottom: 40 } 
    };

    const brush = enableZoom ? (
      <Brush 
        dataKey="name" 
        height={24} 
        stroke="#52525b" 
        fill="var(--surface)" 
        tickFormatter={() => ''}
        travellerWidth={10}
        traveller={(props: any) => {
           const { x, y, width, height } = props;
           return (
             <path d={`M${x},${y} L${x+width},${y} L${x+width},${y+height} L${x},${y+height} Z`} fill="var(--border)" stroke={primaryColor} strokeWidth={1} />
           );
        }}
      /> 
    ) : null;

    const grid = !isTransparent ? (
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
    ) : null;

    const axisProps = {
      stroke: isTransparent ? "rgba(255,255,255,0.4)" : "#71717a", 
      tick: { fontSize: 10, fontFamily: 'monospace', fill: isTransparent ? '#fff' : '#a1a1aa' },
      tickLine: false,
      axisLine: !isTransparent,
      dy: 10
    };

    switch (type) {
      case ChartType.AREA:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...commonProps}>
              {renderDefs()}
              {!isTransparent && <rect x="0" y="0" width="100%" height="100%" fill="url(#grid-pattern)" opacity={0.5} />}
              {grid}
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<CustomTooltip totalValue={totalValue} />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              {legendPosition !== 'none' && <Legend {...legendProps} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', paddingTop: '10px', color: isTransparent ? 'white' : 'var(--text-muted)' }} iconType="circle" />}
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={primaryColor} 
                strokeWidth={3}
                fill={`url(#gradient-area-${config.id})`}
                filter="url(#neon-glow)"
                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--surface)', stroke: primaryColor }}
                animationDuration={1500}
              >
                 {showLabels && <LabelList dataKey="value" position="top" style={{ fill: isTransparent ? '#fff' : 'var(--text-main)', fontSize: 10, fontFamily: 'monospace' }} />}
              </Area>
              {brush}
            </AreaChart>
          </ResponsiveContainer>
        );

      case ChartType.BAR:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...commonProps} barSize={enableZoom ? undefined : 40}>
              {renderDefs()}
              {!isTransparent && <rect x="0" y="0" width="100%" height="100%" fill="url(#grid-pattern)" opacity={0.5} />}
              {grid}
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<CustomTooltip totalValue={totalValue} />} cursor={{ fill: 'var(--border)', opacity: 0.3 }} />
              {legendPosition !== 'none' && <Legend {...legendProps} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', paddingTop: '10px', color: isTransparent ? 'white' : 'var(--text-muted)' }} iconType="rect" />}
              <Bar dataKey="value" radius={[2, 2, 0, 0]} animationDuration={1500}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={data.length > 12 ? primaryColor : `url(#gradient-bar-${config.id})`}
                    strokeWidth={0}
                    filter="url(#neon-glow)"
                    className="hover:brightness-125 transition-all cursor-pointer"
                  />
                ))}
                {showLabels && <LabelList dataKey="value" position="top" style={{ fill: isTransparent ? '#fff' : 'var(--text-main)', fontSize: 10, fontFamily: 'monospace' }} />}
              </Bar>
              {brush}
            </BarChart>
          </ResponsiveContainer>
        );

      case ChartType.PIE:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart onClick={onDataClick ? (e: any) => e && onDataClick(e) : undefined}>
              {renderDefs()}
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                stroke={isTransparent ? 'none' : 'var(--surface)'}
                strokeWidth={2}
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={NEON_COLORS[index % NEON_COLORS.length]} 
                    filter="url(#neon-glow)"
                    className="hover:opacity-100 opacity-80 transition-opacity cursor-pointer outline-none"
                    stroke={index === 0 ? (isTransparent ? 'rgba(255,255,255,0.5)' : 'var(--surface)') : 'none'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip totalValue={totalValue} />} />
              {legendPosition !== 'none' && <Legend {...legendProps} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: isTransparent ? 'white' : 'var(--text-muted)' }} iconType="circle" />}
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill={isTransparent ? 'white' : 'var(--text-main)'} className="font-mono text-xl font-bold tracking-widest pointer-events-none opacity-50">
                DATA
              </text>
            </PieChart>
          </ResponsiveContainer>
        );

      case ChartType.RADAR:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              {renderDefs()}
              <PolarGrid stroke={isTransparent ? 'rgba(255,255,255,0.2)' : "var(--border)"} />
              <PolarAngleAxis dataKey="name" tick={{ fill: isTransparent ? '#fff' : '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
              <Radar
                name={config.title}
                dataKey="value"
                stroke={primaryColor}
                strokeWidth={3}
                fill={primaryColor}
                fillOpacity={0.4}
                filter="url(#neon-glow)"
                animationDuration={1500}
              />
              <Tooltip content={<CustomTooltip totalValue={totalValue} />} />
              {legendPosition !== 'none' && <Legend {...legendProps} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: isTransparent ? 'white' : 'var(--text-muted)' }} />}
            </RadarChart>
          </ResponsiveContainer>
        );
        
      case ChartType.COMPOSED:
        return (
           <ResponsiveContainer width="100%" height="100%">
            <ComposedChart {...commonProps}>
              {renderDefs()}
              {!isTransparent && <rect x="0" y="0" width="100%" height="100%" fill="url(#grid-pattern)" opacity={0.5} />}
              {grid}
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<CustomTooltip totalValue={totalValue} />} />
              {legendPosition !== 'none' && <Legend {...legendProps} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', paddingTop: '10px', color: isTransparent ? 'white' : 'var(--text-muted)' }} iconType="circle" />}
              
              <Area 
                type="monotone" 
                dataKey="value2" 
                fill="var(--border)" 
                fillOpacity={0.1}
                stroke="none" 
              />
              <Bar dataKey="value" barSize={20} fillOpacity={0.8} radius={[2, 2, 0, 0]}>
                 {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={data.length > 12 ? primaryColor : NEON_COLORS[index % NEON_COLORS.length]} filter="url(#neon-glow)" className="cursor-pointer" />
                 ))}
              </Bar>
              <Line 
                type="monotone" 
                dataKey="value2" 
                stroke={isTransparent ? 'white' : "var(--text-main)"} 
                strokeWidth={2} 
                dot={{r: 4, fill: 'var(--surface)', stroke: 'var(--text-main)', strokeWidth: 2}} 
                filter="url(#neon-glow)"
                animationDuration={2000}
              />
              {brush}
            </ComposedChart>
           </ResponsiveContainer>
        );

      default:
        return <div className="flex items-center justify-center h-full text-zinc-600 font-mono text-xs uppercase tracking-widest">PROTOCOL NOT SUPPORTED</div>;
    }
  };

  return (
    <div className="w-full h-full animate-fade-in relative">
       {renderChart()}
    </div>
  );
};

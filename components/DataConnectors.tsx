
import React, { useState } from 'react';
import { X, Upload, Cloud, Database, Copy, RefreshCw, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { DataSource } from '../types';

interface DataConnectorsProps {
  onClose: () => void;
}

const MOCK_CONNECTORS: DataSource[] = [
  { id: '1', type: 'DRIVE', name: 'Google Drive', status: 'DISCONNECTED' },
  { id: '2', type: 'DROPBOX', name: 'Dropbox', status: 'CONNECTED', lastSync: '2 mins ago' },
  { id: '3', type: 'NOTION', name: 'Notion Workspace', status: 'DISCONNECTED' },
  { id: '4', type: 'ZAPIER', name: 'Zapier Webhook', status: 'SYNCING' },
];

export const DataConnectors: React.FC<DataConnectorsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'CONNECT'>('UPLOAD');
  const [connectors, setConnectors] = useState(MOCK_CONNECTORS);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    alert(`Received ${e.dataTransfer.files.length} files for ingestion.`);
  };

  const toggleConnector = (id: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: c.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' };
      }
      return c;
    }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <GlassCard className="w-full max-w-4xl h-[600px] flex flex-col overflow-hidden shadow-2xl border-primary/20">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-black/40">
          <div className="flex items-center gap-3">
            <Database className="text-primary" size={20} />
            <div>
              <h2 className="text-lg font-bold text-white tracking-widest uppercase">LIDATAI Data Hub</h2>
              <p className="text-xs text-zinc-500 font-mono">Manage ingestion streams and cloud links</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/50">
          <button 
            onClick={() => setActiveTab('UPLOAD')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'UPLOAD' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Local Ingestion
          </button>
          <button 
            onClick={() => setActiveTab('CONNECT')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'CONNECT' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Cloud Connectors
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-950">
          
          {activeTab === 'UPLOAD' && (
            <div className="h-full flex flex-col gap-8">
               <div 
                 onDragEnter={handleDrag}
                 onDragLeave={handleDrag}
                 onDragOver={handleDrag}
                 onDrop={handleDrop}
                 className={`
                   flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 transition-all
                   ${dragActive ? 'border-primary bg-primary/10' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'}
                 `}
               >
                  <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
                    <Upload size={32} className="text-zinc-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-zinc-300 font-bold text-sm mb-1">Drag & Drop Files</h3>
                    <p className="text-zinc-500 text-xs font-mono">Supports CSV, JSON, PDF, PNG, MP4</p>
                  </div>
                  <button className="px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                    Browse System
                  </button>
               </div>

               <div className="grid grid-cols-3 gap-4">
                 {[
                   { icon: FileText, label: 'Docs', color: 'text-blue-400' },
                   { icon: ImageIcon, label: 'Media', color: 'text-purple-400' },
                   { icon: Video, label: 'Streams', color: 'text-rose-400' }
                 ].map((Type, i) => (
                   <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-sm flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                      <Type.icon size={18} className={Type.color} />
                      <span className="text-zinc-400 text-xs font-mono uppercase">{Type.label}</span>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'CONNECT' && (
            <div className="space-y-4">
               {connectors.map((connector) => (
                 <div key={connector.id} className="p-4 bg-zinc-900 border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-full ${connector.status === 'CONNECTED' ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
                          <Cloud size={20} />
                       </div>
                       <div>
                          <h3 className="text-white font-bold text-sm">{connector.name}</h3>
                          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                             <span className={`w-2 h-2 rounded-full ${connector.status === 'CONNECTED' ? 'bg-emerald-500' : connector.status === 'SYNCING' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-700'}`}></span>
                             {connector.status} {connector.lastSync && `• ${connector.lastSync}`}
                          </div>
                       </div>
                    </div>
                    
                    {connector.type === 'ZAPIER' ? (
                      <div className="flex items-center gap-2">
                         <code className="px-3 py-1 bg-black border border-zinc-800 text-[10px] text-zinc-400 font-mono rounded-sm">
                            https://hooks.lidatai.io/v1/wh_9283
                         </code>
                         <button className="p-2 text-zinc-500 hover:text-white"><Copy size={14}/></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => toggleConnector(connector.id)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-all ${connector.status === 'CONNECTED' ? 'border-red-900 text-red-500 hover:bg-red-900/20' : 'border-white text-white hover:bg-white hover:text-black'}`}
                      >
                        {connector.status === 'CONNECTED' ? 'Disconnect' : 'Connect'}
                      </button>
                    )}
                 </div>
               ))}

               <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-sm">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="text-primary mt-1" size={16} />
                    <div>
                      <h4 className="text-primary font-bold text-xs uppercase tracking-widest mb-1">Auto-Sync Enabled</h4>
                      <p className="text-zinc-400 text-xs leading-relaxed">
                        LIDATAI is actively polling connected sources every 300s. 
                        New data vectors will be automatically embedded into the Neural Context.
                      </p>
                    </div>
                  </div>
               </div>
            </div>
          )}

        </div>
      </GlassCard>
    </div>
  );
};

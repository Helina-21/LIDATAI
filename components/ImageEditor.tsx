
import React, { useState, useRef } from 'react';
import { editImage, generateHighQualityImage, generateImagePro } from '../services/geminiService';
import { Upload, Sparkles, Image as ImageIcon, Download, Layers, Wand2, Ratio, Zap } from 'lucide-react';
import { AspectRatio } from '../types';

type EditorMode = 'GENERATE' | 'EDIT_FLASH' | 'EDIT_PRO';

export const ImageEditor: React.FC = () => {
  const [mode, setMode] = useState<EditorMode>('GENERATE');
  
  // Edit Mode State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Shared State
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResultImage(null);
        // If uploaded in Generate mode, switch to Pro Edit automatically
        if (mode === 'GENERATE') setMode('EDIT_PRO');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExecute = async () => {
    if (!prompt) return;
    setIsProcessing(true);
    setResultImage(null);

    try {
      if (mode === 'EDIT_FLASH' && selectedImage) {
        // Use Nano Banana (Flash Image)
        const result = await editImage(selectedImage, prompt);
        setResultImage(result);
      } else if (mode === 'EDIT_PRO') {
        // Use Nano Banana Pro (Gemini 3 Pro Image)
        // Supports both generation (without image) and edit (with image)
        const result = await generateImagePro(prompt, aspectRatio, selectedImage || undefined);
        setResultImage(result);
      } else if (mode === 'GENERATE') {
        // Use Imagen 4.0
        const result = await generateHighQualityImage(prompt, aspectRatio);
        setResultImage(result);
      }
    } catch (error) {
      console.error(error);
      alert("Visual synthesis failed. Check API connection or try a different prompt.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full p-6 flex flex-col items-center overflow-y-auto bg-zinc-950">
      <h2 className="text-xl font-bold uppercase tracking-widest mb-8 text-white border-b border-white pb-2 w-full max-w-4xl text-center flex justify-between items-center">
        <span>Visual Synthesis Lab</span>
        <span className="text-[10px] text-zinc-500 font-mono">LIDATAI OPTICS V2</span>
      </h2>

      {/* Mode Switcher */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => { setMode('GENERATE'); setResultImage(null); setSelectedImage(null); }}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border flex items-center gap-2 transition-all ${mode === 'GENERATE' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'border-zinc-800 text-zinc-500 hover:border-white'}`}
        >
          <Wand2 size={14} /> Imagen 4.0 (Gen)
        </button>
        
        <button 
          onClick={() => { setMode('EDIT_FLASH'); setResultImage(null); }}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border flex items-center gap-2 transition-all ${mode === 'EDIT_FLASH' ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400' : 'border-zinc-800 text-zinc-500 hover:border-white'}`}
        >
          <Zap size={14} /> Nano Banana (Flash)
        </button>
        
        <button 
          onClick={() => { setMode('EDIT_PRO'); setResultImage(null); }}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border flex items-center gap-2 transition-all ${mode === 'EDIT_PRO' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-2 ring-emerald-900/50' : 'border-zinc-800 text-zinc-500 hover:border-white'}`}
        >
          <Layers size={14} /> Nano Banana Pro
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl flex-1 min-h-0">
        
        {/* Input Section */}
        <div className="flex flex-col gap-4">
           
           {/* Upload Area - Valid for EDIT_FLASH and EDIT_PRO */}
           {mode !== 'GENERATE' && (
             <div 
               onClick={() => fileInputRef.current?.click()}
               className={`
                  flex-1 border border-dashed rounded-sm 
                  flex flex-col items-center justify-center gap-4
                  cursor-pointer hover:bg-zinc-900 transition-colors
                  min-h-[400px] bg-black relative overflow-hidden group
                  ${mode === 'EDIT_PRO' ? 'border-emerald-500/30' : 'border-zinc-700'}
               `}
             >
               {selectedImage ? (
                 <div className="relative w-full h-full">
                    <img src={selectedImage} alt="Source" className="absolute inset-0 w-full h-full object-contain p-4" />
                    <div className="absolute top-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 border border-zinc-700">SOURCE LOCKED</div>
                 </div>
               ) : (
                 <>
                   <Upload size={40} className={`${mode === 'EDIT_PRO' ? 'text-emerald-500' : 'text-zinc-500'} group-hover:scale-110 transition-transform`} />
                   <span className="font-mono text-zinc-500 text-xs">
                      {mode === 'EDIT_PRO' ? 'UPLOAD SOURCE (OPTIONAL FOR PRO)' : 'UPLOAD SOURCE (REQUIRED)'}
                   </span>
                 </>
               )}
               <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
             </div>
           )}

           {/* Generation Only View */}
           {mode === 'GENERATE' && (
             <div className="flex-1 border border-zinc-800 bg-black p-8 flex flex-col gap-6 min-h-[400px]">
                <h3 className="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-2">Generation Parameters</h3>
                
                <div className="space-y-4">
                   <div>
                     <label className="text-zinc-500 text-[10px] font-mono uppercase flex items-center gap-2 mb-2"><Ratio size={12}/> Aspect Ratio</label>
                     <div className="grid grid-cols-3 gap-2">
                        {['1:1', '16:9', '9:16', '3:4', '4:3'].map((ar) => (
                          <button 
                            key={ar}
                            onClick={() => setAspectRatio(ar as AspectRatio)}
                            className={`p-2 text-[10px] border font-mono transition-all ${aspectRatio === ar ? 'bg-cyan-900/30 border-cyan-500 text-white' : 'border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}
                          >
                            {ar}
                          </button>
                        ))}
                     </div>
                   </div>
                </div>

                <div className="mt-auto p-4 bg-zinc-900 border border-zinc-800">
                  <p className="text-zinc-500 text-[10px] font-mono leading-relaxed">
                    Using <strong className="text-white">Imagen 4.0</strong> model. High fidelity rendering enabled.
                  </p>
                </div>
             </div>
           )}

           {/* Prompt Bar */}
           <div className="flex gap-2">
             <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'GENERATE' ? "Describe the image to imagine..." : "Directives (e.g. 'Make it cyberpunk')"}
                className="flex-1 bg-black border border-zinc-800 p-4 font-mono text-sm focus:border-white outline-none text-white placeholder-zinc-700"
             />
             <button 
                onClick={handleExecute}
                disabled={(!selectedImage && mode === 'EDIT_FLASH') || !prompt || isProcessing}
                className={`
                  px-6 font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-black transition-all
                  ${mode === 'GENERATE' ? 'bg-cyan-400' : mode === 'EDIT_FLASH' ? 'bg-fuchsia-400' : 'bg-emerald-400'}
                `}
             >
               {isProcessing ? 'Processing...' : 'Execute'}
             </button>
           </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 border border-zinc-800 bg-black min-h-[400px] flex flex-col items-center justify-center relative group">
           {resultImage ? (
             <>
               <img src={resultImage} alt="Result" className="absolute inset-0 w-full h-full object-contain p-4 animate-fade-in" />
               <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <a href={resultImage} download={`lena-${mode.toLowerCase()}.png`} className="bg-black border border-white text-white p-2 hover:bg-white hover:text-black transition-colors">
                    <Download size={20} />
                  </a>
               </div>
             </>
           ) : (
             <div className="text-center p-8">
               <ImageIcon size={40} className="text-zinc-800 mx-auto mb-4" />
               <p className="font-mono text-zinc-800 text-xs">OUTPUT BUFFER EMPTY</p>
             </div>
           )}
           {isProcessing && (
             <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                <Sparkles className={`animate-spin ${mode === 'GENERATE' ? 'text-cyan-500' : mode === 'EDIT_FLASH' ? 'text-fuchsia-500' : 'text-emerald-500'}`} size={32} />
                <span className="font-mono text-xs tracking-widest animate-pulse text-zinc-400">
                  {mode === 'GENERATE' ? 'IMAGEN 4.0 RENDERING...' : mode === 'EDIT_FLASH' ? 'FLASH PIXEL MANIPULATION...' : 'NANO BANANA PRO SYNTHESIS...'}
                </span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

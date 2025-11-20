
import React, { useState, useEffect, useRef } from 'react';
import { createChatSession, getMapsIntelligence, transcribeAudio, analyzeImage, generateSpeech } from '../services/geminiService';
import { ChatMessage, ChartConfig, DashboardData } from '../types';
import { Send, Bot, User, Terminal, BrainCircuit, Clock, Mic, MapPin, Paperclip, X, Pencil, Volume2, Play } from 'lucide-react';
import { GenerateContentResponse, Chat } from "@google/genai";
import { ChartRenderer } from './ChartRenderer';
import { SketchCanvas } from './SketchCanvas';

interface ChatInterfaceProps {
  currentDashboardData?: DashboardData;
}

// Utility to parse text with embedded charts
const parseMessageContent = (text: string) => {
  const parts = [];
  const regex = /:::CHART_START([\s\S]*?):::CHART_END/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before the chart
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    
    // The Chart JSON
    try {
      const jsonStr = match[1].trim();
      const chartConfig = JSON.parse(jsonStr);
      parts.push({ type: 'chart', content: chartConfig });
    } catch (e) {
      parts.push({ type: 'code', content: match[1] }); 
    }
    
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return parts;
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentDashboardData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Identity verified. Lina active. I can generate visualized reports directly in this feed. Initialize query.", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showSketchPad, setShowSketchPad] = useState(false);
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<string | null>(null);
  
  // Attachments
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const chatSessionRef = useRef<Chat | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!chatSessionRef.current) {
      try {
        chatSessionRef.current = createChatSession();
      } catch (e) {
        console.error("Failed to init chat", e);
      }
    }
    setTimeout(() => scrollToBottom(), 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, previewUrl]);

  // --- Paste Event Handler (Visual Feedback) ---
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            setSelectedFile(blob);
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playTTS = async (text: string, msgIndex: number) => {
    // If already playing this message, stop
    // For simplicity, we'll regenerate audio if not cached. 
    // In prod, cache the blob in the message object.
    try {
       setCurrentlyPlayingAudio(msgIndex.toString());
       const base64 = await generateSpeech(text.substring(0, 500)); // Limit char count for demo latency
       
       const audio = new Audio(`data:audio/mp3;base64,${base64}`);
       audioRef.current = audio;
       audio.play();
       audio.onended = () => setCurrentlyPlayingAudio(null);
    } catch (e) {
       console.error("TTS Error", e);
       setCurrentlyPlayingAudio(null);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setCurrentlyPlayingAudio(null);
    }
  };


  // --- Audio Input Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          setIsTyping(true);
          try {
            const transcript = await transcribeAudio(base64);
            setInput(prev => prev + " " + transcript);
          } catch (e) {
             console.error("Transcription failed", e);
          } finally {
             setIsTyping(false);
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
      // Timer
      const timer = setInterval(() => {
         setRecordingTime(prev => prev + 1);
      }, 1000);
      // @ts-ignore
      mediaRecorderRef.current.timer = timer;

    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
       mediaRecorderRef.current.stop();
       // @ts-ignore
       clearInterval(mediaRecorderRef.current.timer);
       setIsRecording(false);
       setRecordingTime(0);
    }
  };

  // --- File Logic ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
     }
  };
  
  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSketchExport = (blob: Blob) => {
    const file = new File([blob], "sketch.png", { type: "image/png" });
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(blob));
    setShowSketchPad(false);
  };

  // --- Send Logic ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || !chatSessionRef.current) return;

    const currentInput = input;
    const currentFile = selectedFile;
    
    // Prepare Message
    const userMsg: ChatMessage = { 
      role: 'user', 
      text: currentInput, 
      timestamp: new Date(),
      attachments: currentFile && previewUrl ? [{ type: 'image', url: previewUrl, name: currentFile.name, mimeType: currentFile.type }] : undefined 
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    clearFile();
    setIsTyping(true);

    try {
      // Check for Geo Query specifically
      if (currentInput.toLowerCase().includes("where is") || currentInput.toLowerCase().includes("find me") || currentInput.toLowerCase().includes("map of")) {
        let location;
        try {
           // Try to get real coordinates for better grounding
           const pos = await new Promise<GeolocationPosition>((resolve, reject) => 
             navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 5000})
           );
           location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch(e) {
           console.warn("Geolocation not available, using text query only");
        }
        
        const geoResult = await getMapsIntelligence(currentInput, location);
        setMessages(prev => [...prev, { 
           role: 'model', 
           text: geoResult.text, 
           timestamp: new Date(),
           groundingChunks: geoResult.chunks
        }]);
        setIsTyping(false);
        return;
      }

      // Build context prompt
      let promptToSend = currentInput;
      if (currentDashboardData) {
        promptToSend += `\n[CONTEXT: User is viewing dashboard "${currentDashboardData.title}" with KPIs: ${currentDashboardData.kpis.map(k => `${k.label}=${k.value}`).join(', ')}]`;
      }

      // Check for Image Analysis
      if (currentFile && currentFile.type.startsWith('image/')) {
         const reader = new FileReader();
         reader.onloadend = async () => {
            const base64 = reader.result as string;
            // Use the enhanced prompt with context
            const analysis = await analyzeImage(base64, promptToSend);
            setMessages(prev => [...prev, { role: 'model', text: analysis, timestamp: new Date() }]);
            setIsTyping(false);
         };
         reader.readAsDataURL(currentFile);
         return;
      }

      // Standard Text/Chat Stream
      const result = await chatSessionRef.current.sendMessageStream({ message: promptToSend });
      let fullResponse = "";
      setMessages(prev => [...prev, { role: 'model', text: "", timestamp: new Date() }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || "";
        fullResponse += text;
        
        setMessages(prev => {
           const newArr = [...prev];
           const lastMsg = newArr[newArr.length - 1];
           if (lastMsg.role === 'model') {
             lastMsg.text = fullResponse;
           }
           return newArr;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Error: Neural link disrupted.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto relative overflow-hidden bg-transparent" ref={inputAreaRef}>
      
      {showSketchPad && (
         <SketchCanvas 
            onExport={handleSketchExport} 
            onClose={() => setShowSketchPad(false)} 
            initialImage={previewUrl} // Pass attached image for annotation
         />
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-48 space-y-8 relative z-10 scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 max-w-5xl mx-auto animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 border shadow-[0_0_10px_rgba(0,0,0,0.5)] ${msg.role === 'model' ? 'bg-zinc-900 border-white/20 text-white' : 'bg-white text-black border-white'}`}>
              {msg.role === 'model' ? <Bot size={16} /> : <User size={16} />}
            </div>
            
            {/* Message Bubble */}
            <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} ${msg.role === 'model' ? 'w-full' : ''}`}>
              <div className={`relative p-5 md:p-6 text-sm leading-relaxed font-mono border shadow-xl ${
                msg.role === 'model' 
                  ? 'border-zinc-700 bg-zinc-900/90 text-zinc-200 backdrop-blur-xl' 
                  : 'border-zinc-600 bg-zinc-800 text-white'
                }`}>
                
                {/* User Attachments */}
                {msg.attachments && msg.attachments.map((att, i) => (
                   <div key={i} className="mb-4 border border-zinc-600 p-1 inline-block bg-black">
                      <img src={att.url} alt="Attachment" className="max-h-48 object-contain" />
                   </div>
                ))}

                {/* Content */}
                <div className="mb-4">
                  {msg.role === 'user' ? (
                    msg.text
                  ) : (
                    <div className="space-y-4">
                      {parseMessageContent(msg.text).map((part, i) => {
                        if (part.type === 'text') return <p key={i} className="whitespace-pre-wrap">{part.content}</p>;
                        if (part.type === 'chart') {
                          const config = part.content as ChartConfig;
                          return (
                            <div key={i} className="mt-4 mb-2 w-full h-[350px] bg-black/50 border border-zinc-700 p-4 rounded-sm relative group overflow-hidden">
                               <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                               <div className="flex justify-between items-center mb-4">
                                  <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">{config.title}</span>
                                  <Terminal size={12} className="text-zinc-600" />
                               </div>
                               <div className="w-full h-[calc(100%-30px)]">
                                  <ChartRenderer config={config} />
                               </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}

                  {/* Grounding / Maps Cards */}
                  {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                     <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {msg.groundingChunks.map((chunk, cIdx) => (
                           chunk.web ? (
                             <a key={cIdx} href={chunk.web.uri} target="_blank" rel="noreferrer" className="block bg-zinc-950 border border-zinc-800 p-3 hover:border-cyan-500 transition-colors group">
                                <div className="flex items-center gap-2 mb-2 text-cyan-500">
                                   <MapPin size={14} />
                                   <span className="text-[10px] uppercase font-bold tracking-widest">Google Maps</span>
                                </div>
                                <div className="text-white font-bold text-sm truncate group-hover:text-cyan-400">{chunk.web.title}</div>
                             </a>
                           ) : null
                        ))}
                     </div>
                  )}
                </div>

                {/* Footer: Timestamp + Actions (TTS) */}
                <div className={`flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase pt-2 border-t ${msg.role === 'user' ? 'border-zinc-600 justify-end' : 'border-zinc-800 justify-start'}`}>
                  <Clock size={10} />
                  {msg.timestamp.toLocaleTimeString()}
                  {msg.role === 'model' && (
                    <>
                       <span className="ml-2 text-cyan-900">LIDATAI_CORE_V1</span>
                       <div className="flex-1"></div>
                       <button 
                         onClick={() => currentlyPlayingAudio === idx.toString() ? stopAudio() : playTTS(msg.text, idx)}
                         className="flex items-center gap-2 text-cyan-500 hover:text-white transition-colors px-2 py-1 rounded-sm hover:bg-white/5"
                       >
                          {currentlyPlayingAudio === idx.toString() ? (
                             <>
                               <div className="flex gap-0.5 items-end h-3">
                                 <div className="w-0.5 bg-cyan-500 animate-[pulse_0.5s_infinite] h-2"></div>
                                 <div className="w-0.5 bg-cyan-500 animate-[pulse_0.7s_infinite] h-3"></div>
                                 <div className="w-0.5 bg-cyan-500 animate-[pulse_0.4s_infinite] h-1.5"></div>
                               </div>
                               <span>SPEAKING...</span>
                             </>
                          ) : (
                             <>
                               <Volume2 size={12} />
                               <span>READ</span>
                             </>
                          )}
                       </button>
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex gap-4 animate-pulse max-w-5xl mx-auto">
              <div className="w-8 h-8 bg-zinc-900 border border-white/20 text-white rounded-none flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="flex items-center gap-3 p-4 border border-zinc-800 bg-black/40 text-zinc-500 font-mono text-xs backdrop-blur-sm">
                <BrainCircuit className="animate-pulse text-cyan-500" size={16} />
                <span>REASONING WITH 32K TOKEN STREAM...</span>
              </div>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Floating Input - Advanced Neural Interface */}
      <div className="absolute bottom-10 left-0 right-0 px-6 z-30 pointer-events-none">
        <form onSubmit={handleSend} className="flex gap-0 max-w-4xl mx-auto pointer-events-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative">
          
          {/* File Attachment Preview (Above input) */}
          {previewUrl && (
             <div className="absolute -top-24 left-0 p-2 bg-zinc-900 border border-zinc-700 shadow-lg flex items-start gap-2 animate-fade-in">
                <img src={previewUrl} alt="Upload" className="h-16 w-16 object-cover border border-zinc-600" />
                <button type="button" onClick={clearFile} className="text-zinc-500 hover:text-white"><X size={14}/></button>
             </div>
          )}

          <div className="relative flex-1 group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={(e) => {
                 // Standard paste handling is done via window listener
              }}
              placeholder={isRecording ? "Listening..." : "Paste screenshot (Ctrl+V), draw sketch, or type..."}
              className={`w-full bg-black/90 backdrop-blur-xl border border-zinc-600 border-r-0 px-6 py-5 pl-12 text-white font-mono text-sm focus:outline-none focus:border-white/70 transition-all placeholder-zinc-600 ${isRecording ? 'text-red-500 border-red-900' : ''}`}
            />
            
            {/* Attachment Button */}
            <button 
               type="button" 
               onClick={() => fileInputRef.current?.click()} 
               className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
               title="Attach File"
            >
               <Paperclip size={16} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50"></div>
          </div>
          
          {/* Sketch Button (NEW) */}
          <button 
            type="button"
            onClick={() => setShowSketchPad(true)}
            className={`px-4 border-y border-zinc-600 border-l border-zinc-600 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-900/10 transition-colors ${previewUrl ? 'bg-cyan-900/20 text-cyan-400 border-cyan-900' : 'bg-black'}`}
            title={previewUrl ? "Annotate Attached Image" : "Open Sketchpad"}
          >
             <Pencil size={18} />
          </button>

          {/* Mic Button */}
          <button 
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className={`px-6 border-y border-zinc-600 flex items-center justify-center transition-colors ${isRecording ? 'bg-red-900/20 text-red-500 border-red-500' : 'bg-black text-zinc-400 hover:text-white'}`}
          >
             {isRecording ? <span className="animate-pulse font-mono text-xs">{recordingTime}s</span> : <Mic size={18} />}
          </button>

          <button 
            type="submit" 
            disabled={isTyping || (!input.trim() && !selectedFile)}
            className="bg-white text-black px-8 py-4 font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest flex items-center gap-2 border border-white"
          >
            <span>Transmit</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};


import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { NICHES, STYLES, VIBES, DEFAULT_CONFIG, createDefaultText, FONTS, TEXT_PRESETS } from './constants';
import { GeneratorConfig, GeneratedResult, NicheType, VisualStyle, EmotionalVibe, TextOverlay } from './types';
import { generateThumbnailInsights, generateThumbnailImage } from './services/geminiService';

const App: React.FC = () => {
  const [config, setConfig] = useState<GeneratorConfig>(DEFAULT_CONFIG);
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTextInput, setNewTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const activeOverlay = overlays.find(o => o.id === activeId);

  const handleGenerate = async () => {
    if (!config.topic.trim()) {
      setError("Please enter a video topic or title.");
      return;
    }
    
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const data = await generateThumbnailInsights(config);
      setResult(data);
      if (overlays.length === 0) {
        const id = Math.random().toString(36).substr(2, 9);
        setOverlays([createDefaultText(id, config.topic.split(' ').slice(0, 3).join(' '))]);
        setActiveId(id);
      }
    } catch (err) {
      setError("Failed to generate prompt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewImage = async () => {
    if (!result?.prompt) return;
    
    setImageLoading(true);
    try {
      const imageUrl = await generateThumbnailImage(result.prompt);
      setResult(prev => prev ? { ...prev, imageUrl } : null);
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => {
        imageObjRef.current = img;
        drawCanvas();
      };
    } catch (err) {
      setError("Failed to generate image preview.");
    } finally {
      setImageLoading(false);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1280;
    canvas.height = 720;
    ctx.drawImage(img, 0, 0, 1280, 720);

    overlays.forEach(ov => {
      if (ov.text.trim()) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `italic 900 ${ov.fontSize}px "${ov.font}"`;
        
        const x = (ov.posX / 100) * 1280;
        const y = (ov.posY / 100) * 720;

        if (ov.id === activeId) {
          ctx.save();
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
          ctx.lineWidth = 4;
          ctx.setLineDash([15, 10]);
          const metrics = ctx.measureText(ov.text.toUpperCase());
          const padding = 25;
          ctx.strokeRect(
            x - metrics.width / 2 - padding, 
            y - ov.fontSize / 2 - padding, 
            metrics.width + padding * 2, 
            ov.fontSize + padding * 2
          );
          ctx.restore();
        }

        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = ov.textOutline;
        ctx.lineWidth = Math.max(6, ov.fontSize / 7);
        ctx.strokeText(ov.text.toUpperCase(), x, y);

        ctx.shadowBlur = 0;
        ctx.fillStyle = ov.textColor;
        ctx.fillText(ov.text.toUpperCase(), x, y);
      }
    });
  };

  useEffect(() => {
    if (imageObjRef.current) {
      drawCanvas();
    }
  }, [overlays, activeId, result?.imageUrl]);

  const addTextLayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9);
    const textToAdd = newTextInput.trim() || 'NEW TEXT';
    const lastOverlay = overlays[overlays.length - 1];
    
    const newText = createDefaultText(id, textToAdd);
    if (lastOverlay) {
      newText.posY = Math.min(90, lastOverlay.posY + 10);
    }

    setOverlays([...overlays, newText]);
    setActiveId(id);
    setNewTextInput('');
  };

  const removeTextLayer = (id: string) => {
    setOverlays(overlays.filter(o => o.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const updateActiveOverlay = (updates: Partial<TextOverlay>) => {
    if (!activeId) return;
    setOverlays(overlays.map(ov => ov.id === activeId ? { ...ov, ...updates } : ov));
  };

  const findNearestOverlay = (x: number, y: number): string | null => {
    let nearestId = null;
    let minDistance = 15;
    overlays.forEach(ov => {
      const dist = Math.sqrt(Math.pow(ov.posX - x, 2) + Math.pow(ov.posY - y, 2));
      if (dist < minDistance) {
        minDistance = dist;
        nearestId = ov.id;
      }
    });
    return nearestId;
  };

  const handleCanvasInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!result?.imageUrl || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    if (e.type === 'mousedown' || e.type === 'touchstart') {
      const clickedId = findNearestOverlay(x, y);
      if (clickedId) {
        setActiveId(clickedId);
        setIsDragging(true);
      } else {
        setActiveId(null);
      }
    }

    if (isDragging && activeId) {
      updateActiveOverlay({ posX: x, posY: y });
    }
  };

  const applyPreset = (preset: typeof TEXT_PRESETS[0]) => {
    updateActiveOverlay({
      textColor: preset.text,
      textOutline: preset.outline,
      font: preset.font
    });
  };

  const downloadFinal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `thumbnail-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2 sm:px-0">
        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-5 sm:p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <span className="mr-2">⚡</span> AI Generator
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Video Concept</label>
                <textarea
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm sm:text-base"
                  rows={2}
                  placeholder="What is your video about?"
                  value={config.topic}
                  onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Niche</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                    value={config.niche}
                    onChange={(e) => setConfig({ ...config, niche: e.target.value as NicheType })}
                  >
                    {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visual Style</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                      value={config.style}
                      onChange={(e) => setConfig({ ...config, style: e.target.value as VisualStyle })}
                    >
                      {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vibe / Emotion</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                    value={config.vibe}
                    onChange={(e) => setConfig({ ...config, vibe: e.target.value as EmotionalVibe })}
                  >
                    {VIBES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                  loading 
                    ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {loading ? 'Synthesizing...' : 'Engineer Viral Formula 🚀'}
              </button>
            </div>
          </div>

          {result?.imageUrl && (
            <div className="glass p-5 sm:p-6 rounded-2xl space-y-6 animate-in slide-in-from-left duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase text-blue-400">Typography Studio</h3>
              </div>

              {/* Add New Text Input */}
              <form onSubmit={addTextLayer} className="relative">
                <input
                  type="text"
                  placeholder="New text layer..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none pr-12"
                  value={newTextInput}
                  onChange={(e) => setNewTextInput(e.target.value)}
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg font-bold transition-all text-xs"
                >
                  ADD
                </button>
              </form>

              {/* Layers List */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {overlays.map((ov, idx) => (
                  <button 
                    key={ov.id}
                    onClick={() => setActiveId(ov.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                      activeId === ov.id 
                        ? 'bg-blue-600 border-blue-400 text-white' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Layer {idx + 1}
                  </button>
                ))}
              </div>

              {activeOverlay && (
                <div className="space-y-4 p-4 sm:p-5 bg-slate-900 rounded-2xl border border-blue-500/10 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Active Layer</label>
                    <button onClick={() => removeTextLayer(activeOverlay.id)} className="text-red-500 text-[10px] font-bold uppercase">Remove</button>
                  </div>
                  
                  <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold"
                    value={activeOverlay.text}
                    onChange={(e) => updateActiveOverlay({ text: e.target.value })}
                  />

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Typography Presets</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TEXT_PRESETS.map(p => (
                        <button
                          key={p.name}
                          onClick={() => applyPreset(p)}
                          className="text-[9px] font-black p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 transition-all text-slate-300 uppercase truncate"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Font</label>
                      <select
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none"
                        value={activeOverlay.font}
                        onChange={(e) => updateActiveOverlay({ font: e.target.value })}
                      >
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Scale</label>
                        <span className="text-[10px] font-mono text-blue-400">{activeOverlay.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="500"
                        value={activeOverlay.fontSize}
                        onChange={(e) => updateActiveOverlay({ fontSize: parseInt(e.target.value) })}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5">
                      <input type="color" className="w-6 h-6" value={activeOverlay.textColor} onChange={(e) => updateActiveOverlay({ textColor: e.target.value })} />
                      <span className="text-[9px] uppercase font-bold text-slate-400">Fill</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5">
                      <input type="color" className="w-6 h-6" value={activeOverlay.textOutline} onChange={(e) => updateActiveOverlay({ textOutline: e.target.value })} />
                      <span className="text-[9px] uppercase font-bold text-slate-400">Stroke</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={downloadFinal}
                className="w-full py-4 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95"
              >
                💾 Export Result
              </button>
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="lg:col-span-8 space-y-6">
          {!result && !loading && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-6 sm:p-12 glass rounded-3xl border-dashed border-2 border-slate-800/50">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mb-6 text-3xl sm:text-4xl shadow-inner">🎨</div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mb-2 uppercase tracking-tight">Thumbnail AI Engine</h2>
              <p className="text-slate-500 max-w-sm mx-auto leading-relaxed text-xs sm:text-sm">
                Unlock viral potential. We build the base imagery, color strategy, and layout for professional YouTube CTR.
              </p>
            </div>
          )}

          {loading && (
            <div className="glass rounded-3xl p-12 sm:p-20 text-center animate-in fade-in duration-500">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-blue-100 uppercase tracking-widest">Designing Your Vision...</h3>
              <p className="text-slate-500 mt-4 text-[10px] sm:text-sm max-w-xs mx-auto">Computing high-CTR color weights and visual components.</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              {/* Canvas Editor Area */}
              <div className="glass rounded-3xl overflow-hidden shadow-2xl relative border border-white/5">
                {!result.imageUrl ? (
                  <div className="aspect-video bg-slate-900/50 flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                    <div className="text-5xl sm:text-6xl mb-6">✨</div>
                    <h3 className="text-xl sm:text-2xl font-black mb-2 uppercase tracking-tighter">Render Cinematic Base</h3>
                    <p className="text-slate-400 max-w-xs mb-8 text-xs sm:text-sm">Synthesize a professional, text-free visual base optimized for ${config.style} style.</p>
                    <button
                      onClick={handlePreviewImage}
                      disabled={imageLoading}
                      className="px-8 sm:px-10 py-4 sm:py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl"
                    >
                      {imageLoading ? 'Synthesizing...' : 'GENERATE BASE'}
                    </button>
                  </div>
                ) : (
                  <div className="relative group overflow-hidden touch-none">
                    <canvas 
                      ref={canvasRef} 
                      onMouseDown={handleCanvasInteraction}
                      onMouseMove={handleCanvasInteraction}
                      onMouseUp={() => setIsDragging(false)}
                      onMouseLeave={() => setIsDragging(false)}
                      onTouchStart={handleCanvasInteraction}
                      onTouchMove={handleCanvasInteraction}
                      onTouchEnd={() => setIsDragging(false)}
                      className="w-full aspect-video object-contain bg-black shadow-inner cursor-crosshair select-none"
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black text-blue-400 border border-blue-500/30 pointer-events-none uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                      <span className="mr-2">💡</span> Drag to Position • Click to Select
                    </div>
                  </div>
                )}
                
                {imageLoading && (
                  <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-20">
                    <div className="text-center">
                       <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                       <p className="font-black text-blue-400 uppercase tracking-widest text-[10px]">Processing Visual</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Insights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="glass p-5 rounded-2xl border-l-4 border-blue-600">
                  <h3 className="text-blue-100 font-black text-[10px] uppercase tracking-widest mb-3">AI Prompt Logic</h3>
                  <div className="bg-black/40 p-4 rounded-xl text-[10px] font-mono text-slate-400 border border-slate-800 max-h-32 overflow-y-auto no-scrollbar leading-relaxed">
                    {result.prompt}
                  </div>
                </div>

                <div className="glass p-5 rounded-2xl border-l-4 border-purple-600">
                  <h3 className="text-purple-100 font-black text-[10px] uppercase tracking-widest mb-3">CTR Analysis</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed italic opacity-90">
                    {result.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default App;

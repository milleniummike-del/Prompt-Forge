import React, { useRef, useEffect, useState } from 'react';
import { Wand2, Image as ImageIcon, Copy, RotateCcw, History, Trash2, X, ImagePlus, Type, FileImage, Hash, ScanSearch, Save, Bookmark } from 'lucide-react';
import { getHistory, clearHistory, getImageHistory, clearImageHistory, getSavedPrompts, saveSavedPrompt, deleteSavedPrompt, clearSavedPrompts } from '../services/storage';
import { GeneratedImage, SavedPrompt } from '../types';

interface PromptCanvasProps {
  prompt: string;
  setPrompt: (value: string) => void;
  uploadedImage: string | null;
  setUploadedImage: (val: string | null) => void;
  onEnhance: () => void;
  onGenerate: () => void;
  onAnalyze: () => void;
  isEnhancing: boolean;
  isGenerating: boolean;
  isAnalyzing: boolean;
  generatedImage: GeneratedImage | null;
  setGeneratedImage: (val: GeneratedImage | null) => void;
}

export const PromptCanvas: React.FC<PromptCanvasProps> = ({
  prompt,
  setPrompt,
  uploadedImage,
  setUploadedImage,
  onEnhance,
  onGenerate,
  onAnalyze,
  isEnhancing,
  isGenerating,
  isAnalyzing,
  generatedImage,
  setGeneratedImage,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompts' | 'images' | 'saved'>('prompts');
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [prompt]);

  // Load history when panel is opened or new image generated
  useEffect(() => {
    if (showHistory) {
      setHistoryItems(getHistory());
      setImageHistory(getImageHistory());
      setSavedPrompts(getSavedPrompts());
    }
  }, [showHistory, generatedImage]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt);
  };

  const handleRestorePrompt = (historyItem: string) => {
    setPrompt(historyItem);
  };

  const handleRestoreImage = (item: GeneratedImage) => {
      setPrompt(item.prompt);
      setGeneratedImage(item);
      setShowHistory(false);
  }

  const handleSavePrompt = () => {
      if (!prompt.trim()) return;
      const updated = saveSavedPrompt(prompt);
      setSavedPrompts(updated);
      setActiveTab('saved');
      setShowHistory(true);
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = deleteSavedPrompt(id);
      setSavedPrompts(updated);
  };

  const handleClearHistory = () => {
    if (activeTab === 'prompts') {
        if (window.confirm('Clear all prompt history?')) {
            clearHistory();
            setHistoryItems([]);
        }
    } else if (activeTab === 'images') {
        if (window.confirm('Clear all image history?')) {
            clearImageHistory();
            setImageHistory([]);
        }
    } else if (activeTab === 'saved') {
        if (window.confirm('Clear all saved prompts?')) {
            clearSavedPrompts();
            setSavedPrompts([]);
        }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        // Reset input value so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
      setUploadedImage(null);
  };

  const formatDate = (ts: number) => {
      return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-row relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload} 
      />

      {/* Main Canvas Area */}
      <div className="flex-1 h-full overflow-y-auto bg-slate-950 p-6 md:p-8 flex flex-col gap-6">
        
        {/* Editor Section */}
        <div className="w-full max-w-4xl mx-auto space-y-4">
          <div className="flex justify-between items-end">
              <div>
                   <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Canvas</h1>
                   <p className="text-slate-400 text-sm">Assemble your masterpiece. Click blocks to merge.</p>
              </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-lg transition-colors ${uploadedImage ? 'text-indigo-400 bg-indigo-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Add Reference Image"
              >
                <ImagePlus size={18} />
              </button>
              <button
                onClick={handleSavePrompt}
                disabled={!prompt}
                className={`p-2 rounded-lg transition-colors ${!prompt ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Save Prompt to List"
              >
                <Save size={18} />
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg transition-colors ${showHistory ? 'text-indigo-400 bg-indigo-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Activity & Saved"
              >
                <History size={18} />
              </button>
              <button
                onClick={() => setPrompt('')}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Clear Canvas"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={copyToClipboard}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Copy to Clipboard"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>

          <div className="relative group">
            {uploadedImage && (
                <div className="bg-slate-900/50 border-x border-t border-slate-700 rounded-t-xl p-4 flex items-start animate-in slide-in-from-bottom-2">
                    <div className="relative group/img">
                        <img 
                            src={uploadedImage} 
                            alt="Reference" 
                            className="h-24 w-auto rounded-lg border border-slate-600 object-cover"
                        />
                        <button
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-600 rounded-full p-1 shadow-md transition-colors"
                            title="Remove image"
                        >
                            <X size={12} strokeWidth={3} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white px-2 py-0.5 rounded-b-lg text-center truncate backdrop-blur-sm">
                            Reference
                        </div>
                    </div>
                    <div className="ml-4 text-sm text-slate-500 mt-2">
                        <p>Image added to context.</p>
                        <p className="text-xs opacity-70">Will be used for enhancement and generation.</p>
                    </div>
                </div>
            )}

            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Start typing or select blocks from the library..."
              className={`w-full min-h-[200px] bg-slate-900/50 border border-slate-700 p-6 text-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none shadow-xl ${
                  uploadedImage ? 'rounded-b-xl border-t-0' : 'rounded-xl'
              }`}
            />
            <div className="absolute bottom-4 right-4 text-xs text-slate-500 font-mono bg-slate-900/80 px-2 py-1 rounded">
              {prompt.length} chars
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onAnalyze}
              disabled={isAnalyzing || !prompt}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg ${
                isAnalyzing
                  ? 'bg-blue-900/50 text-blue-300 cursor-wait'
                  : (!prompt)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-800 text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500'
              }`}
              title="Extract reusable blocks from prompt"
            >
               <ScanSearch size={18} className={isAnalyzing ? "animate-pulse" : ""} />
               {isAnalyzing ? 'Analyzing...' : 'Analyze Prompt'}
            </button>

            <button
              onClick={onEnhance}
              disabled={isEnhancing || (!prompt && !uploadedImage)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg ${
                isEnhancing
                  ? 'bg-purple-900/50 text-purple-300 cursor-wait'
                  : (!prompt && !uploadedImage)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/25'
              }`}
            >
              <Wand2 size={18} className={isEnhancing ? "animate-spin" : ""} />
              {isEnhancing ? 'Enhancing...' : 'Enhance with Gemini'}
            </button>

            <button
              onClick={onGenerate}
              disabled={isGenerating || (!prompt && !uploadedImage)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg ${
                isGenerating
                  ? 'bg-emerald-900/50 text-emerald-300 cursor-wait'
                  : (!prompt && !uploadedImage)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500'
              }`}
            >
              <ImageIcon size={18} className={isGenerating ? "animate-pulse" : ""} />
              {isGenerating ? 'Dreaming...' : 'Generate Preview'}
            </button>
          </div>
        </div>

        {/* Output / Preview Section */}
        {generatedImage && (
          <div className="w-full max-w-4xl mx-auto mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-1 overflow-hidden shadow-2xl">
               <div className="relative aspect-square md:aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden rounded-lg group">
                  <img 
                      src={generatedImage.url} 
                      alt="Generated output" 
                      className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a 
                          href={generatedImage.url} 
                          download={`promptforge-${Date.now()}.png`}
                          className="bg-white text-black px-4 py-2 rounded-full font-bold hover:scale-105 transition-transform"
                      >
                          Download
                      </a>
                  </div>
               </div>
               <div className="p-3 flex justify-between items-center text-xs text-slate-500 font-mono">
                   <span>Generated by Gemini Flash Image</span>
                   {generatedImage.seed !== undefined && (
                       <span className="flex items-center gap-1 text-slate-400"><Hash size={10}/> Seed: {generatedImage.seed}</span>
                   )}
                   <span>1:1 Ratio</span>
               </div>
            </div>
          </div>
        )}
        
        {!generatedImage && !isGenerating && prompt.length > 0 && (
            <div className="w-full max-w-4xl mx-auto mt-8 border-t border-slate-800 pt-8 text-center text-slate-600">
                <p>Ready to visualize? Click "Generate Preview".</p>
            </div>
        )}
      </div>

      {/* History Sidebar */}
      <div 
        className={`absolute right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-10 flex flex-col ${
          showHistory ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
            <h2 className="font-bold text-white flex items-center gap-2">
              <History size={18} className="text-indigo-500" />
              Activity
            </h2>
            <div className="flex items-center gap-1">
              {(
                 (activeTab === 'prompts' && historyItems.length > 0) || 
                 (activeTab === 'images' && imageHistory.length > 0) ||
                 (activeTab === 'saved' && savedPrompts.length > 0)
                ) && (
                <button 
                  onClick={handleClearHistory}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                  title={`Clear ${activeTab}`}
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button 
                onClick={() => setShowHistory(false)}
                className="p-2 text-slate-400 hover:text-white rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800 shrink-0">
             <button 
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'saved' 
                    ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
                onClick={() => setActiveTab('saved')}
            >
                <Bookmark size={14} />
                Saved
            </button>
            <button 
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'prompts' 
                    ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
                onClick={() => setActiveTab('prompts')}
            >
                <Type size={14} />
                Prompts
            </button>
            <button 
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'images' 
                    ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
                onClick={() => setActiveTab('images')}
            >
                <FileImage size={14} />
                Images
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {activeTab === 'saved' && (
                savedPrompts.length === 0 ? (
                    <div className="text-center text-slate-500 mt-8 text-sm">
                        No saved prompts yet.<br/>Use the save icon in the toolbar.
                    </div>
                ) : (
                    savedPrompts.map((item) => (
                        <div 
                        key={item.id}
                        onClick={() => handleRestorePrompt(item.content)}
                        className="p-3 border rounded-lg cursor-pointer group transition-all bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-indigo-500/50"
                        >
                        <p className="text-xs text-slate-300 font-mono line-clamp-3 group-hover:text-white mb-2">
                            {item.content}
                        </p>
                        <div className="flex justify-between items-center">
                             <span className="text-[10px] text-slate-500">
                                {formatDate(item.timestamp)}
                             </span>
                             <button
                                onClick={(e) => handleDeleteSaved(item.id, e)}
                                className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                             >
                                <Trash2 size={12} />
                             </button>
                        </div>
                        </div>
                    ))
                )
            )}

            {activeTab === 'prompts' && (
                historyItems.length === 0 ? (
                    <div className="text-center text-slate-500 mt-8 text-sm">
                        No prompt history yet.<br/>Edits are saved automatically.
                    </div>
                ) : (
                    historyItems.map((item, index) => (
                        <div 
                        key={index}
                        onClick={() => handleRestorePrompt(item)}
                        className={`p-3 border rounded-lg cursor-pointer group transition-all ${
                            index === 0 
                                ? 'bg-indigo-900/10 border-indigo-500/30 hover:border-indigo-400/60' 
                                : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-indigo-500/50'
                        }`}
                        >
                        <p className="text-xs text-slate-300 font-mono line-clamp-3 group-hover:text-white">
                            {item}
                        </p>
                        <div className="mt-2 flex justify-between items-center">
                            <span className={`text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 ${index === 0 ? 'text-indigo-400' : 'text-slate-500'}`}>
                                {index === 0 && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                                {index === 0 ? 'Latest' : 'Previous'}
                            </span>
                            <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to restore
                            </span>
                        </div>
                        </div>
                    ))
                )
            )}
            
            {activeTab === 'images' && (
                imageHistory.length === 0 ? (
                    <div className="text-center text-slate-500 mt-8 text-sm">
                        No image history yet.<br/>Generate a preview to see it here.
                    </div>
                ) : (
                    imageHistory.map((item, index) => (
                        <div 
                            key={index}
                            className="relative group"
                        >
                            {/* New Badge for most recent */}
                            {index === 0 && (
                                <div className="absolute -top-2 -right-2 z-20 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-indigo-500/50 animate-bounce">
                                    New
                                </div>
                            )}
                            
                            <div
                                onClick={() => handleRestoreImage(item)}
                                className={`bg-slate-800/50 hover:bg-slate-800 border rounded-lg cursor-pointer group transition-all overflow-hidden ${
                                    index === 0 
                                    ? 'border-indigo-500/40 ring-1 ring-indigo-500/20' 
                                    : 'border-slate-700 hover:border-indigo-500/50'
                                }`}
                            >
                                <div className="aspect-square w-full overflow-hidden bg-black relative">
                                    <img 
                                        src={item.url} 
                                        alt="history" 
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105" 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                        <span className="text-xs font-bold text-white bg-black/60 px-3 py-1.5 rounded-full border border-white/20 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                            Restore & View
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-xs text-slate-300 font-mono line-clamp-2 group-hover:text-white mb-2 transition-colors">
                                        {item.prompt}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-500">
                                            {formatDate(item.timestamp)}
                                        </span>
                                        {item.seed !== undefined && (
                                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5" title={`Seed: ${item.seed}`}>
                                                <Hash size={8} /> {item.seed.toString().slice(0,4)}...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )
            )}
          </div>
      </div>
    </div>
  );
};
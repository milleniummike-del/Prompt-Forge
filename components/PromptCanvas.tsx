
import React, { useRef, useEffect, useState } from 'react';
import { Wand2, Image as ImageIcon, Copy, RotateCcw, History, Trash2, X, ImagePlus, Type, FileImage, Hash, ScanSearch, Save, Bookmark, LogOut, Check } from 'lucide-react';
import { getHistory, clearHistory, getImageHistory, clearImageHistory, getSavedPrompts, saveSavedPrompt, deleteSavedPrompt, clearSavedPrompts, getSavedImages, saveSavedImage, deleteSavedImage, clearSavedImages } from '../services/storage';
import { GeneratedImage, SavedPrompt, GoogleUser, SavedImage } from '../types';
import { TokenUsage } from './TokenUsage';

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
  user: GoogleUser | null;
  onLogout: () => void;
  onMockLogin: () => void;
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
  user,
  onLogout,
  onMockLogin
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompts' | 'images' | 'saved' | 'saved_images'>('saved');
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [isSavingImage, setIsSavingImage] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [prompt]);

  // Load history when panel is opened or new items generated
  useEffect(() => {
    if (showHistory) {
        const loadData = async () => {
            try {
                const [hData, iData, sData, siData] = await Promise.all([
                    getHistory(),
                    getImageHistory(),
                    getSavedPrompts(),
                    getSavedImages()
                ]);
                setHistoryItems(hData);
                setImageHistory(iData);
                setSavedPrompts(sData);
                setSavedImages(siData);
            } catch (e) {
                console.error("Failed to load history data", e);
            }
        };
        loadData();
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

  const handleSavePrompt = async () => {
      if (!prompt.trim()) return;
      try {
        const newPrompt = await saveSavedPrompt(prompt);
        setSavedPrompts(prev => [newPrompt, ...prev]);
        setActiveTab('saved');
        setShowHistory(true);
      } catch (e) {
          console.error("Failed to save prompt", e);
      }
  };

  const handleSaveImage = async () => {
      if (!generatedImage) return;
      setIsSavingImage(true);
      try {
          const newSaved = await saveSavedImage(generatedImage);
          setSavedImages(prev => [newSaved, ...prev]);
          setActiveTab('saved_images');
          setShowHistory(true);
      } catch (e) {
          console.error("Failed to save image", e);
      } finally {
          setIsSavingImage(false);
      }
  };

  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await deleteSavedPrompt(id);
        setSavedPrompts(prev => prev.filter(p => p.id !== id));
      } catch (e) {
          console.error("Failed to delete saved prompt", e);
      }
  };

  const handleDeleteSavedImage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        await deleteSavedImage(id);
        setSavedImages(prev => prev.filter(p => p.id !== id));
    } catch (e) {
        console.error("Failed to delete saved image", e);
    }
  };

  const handleClearHistory = async () => {
    try {
        if (activeTab === 'prompts') {
            if (window.confirm('Clear all prompt history?')) {
                await clearHistory();
                setHistoryItems([]);
            }
        } else if (activeTab === 'images') {
            if (window.confirm('Clear all image history?')) {
                await clearImageHistory();
                setImageHistory([]);
            }
        } else if (activeTab === 'saved') {
            if (window.confirm('Clear all saved prompts?')) {
                await clearSavedPrompts();
                setSavedPrompts([]);
            }
        } else if (activeTab === 'saved_images') {
            if (window.confirm('Clear all saved images?')) {
                await clearSavedImages();
                setSavedImages([]);
            }
        }
    } catch (e) {
        console.error("Failed to clear history", e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
      setUploadedImage(null);
  };

  const formatDate = (ts: number) => {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const isAlreadySaved = generatedImage && savedImages.some(si => si.url === generatedImage.url);

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
            
            {/* User Profile & Actions */}
            <div className="flex items-center gap-3">
               {user && (
                   <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full pl-1 pr-3 py-1">
                       <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" />
                       <span className="text-xs text-slate-300 font-medium max-w-[80px] truncate hidden md:block">{user.name}</span>
                       <button onClick={onLogout} className="ml-1 text-slate-500 hover:text-red-400 transition-colors" title="Logout">
                           <LogOut size={14} />
                       </button>
                   </div>
               )}

              <div className="w-px h-6 bg-slate-800 mx-1"></div>
              
              <TokenUsage />
              <div className="w-px h-6 bg-slate-800 mx-1"></div>
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
                title="Activity & Vault"
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
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <a 
                          href={generatedImage.url} 
                          download={`promptforge-${Date.now()}.png`}
                          className="bg-white text-black px-4 py-2 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2"
                      >
                          Download
                      </a>
                      <button 
                        onClick={handleSaveImage}
                        disabled={isSavingImage || isAlreadySaved}
                        className={`px-4 py-2 rounded-full font-bold hover:scale-105 transition-all flex items-center gap-2 ${
                            isAlreadySaved 
                            ? 'bg-emerald-600 text-white cursor-default' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-500'
                        }`}
                      >
                         {isAlreadySaved ? <Check size={18} /> : <Bookmark size={18} />}
                         {isSavingImage ? 'Saving...' : (isAlreadySaved ? 'Saved' : 'Save to Vault')}
                      </button>
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
              Vault & Activity
            </h2>
            <div className="flex items-center gap-1">
              {(
                 (activeTab === 'prompts' && historyItems.length > 0) || 
                 (activeTab === 'images' && imageHistory.length > 0) ||
                 (activeTab === 'saved' && savedPrompts.length > 0) ||
                 (activeTab === 'saved_images' && savedImages.length > 0)
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
          <div className="flex border-b border-slate-800 shrink-0 overflow-x-auto scrollbar-none">
            <button 
                className={`flex-1 min-w-[70px] py-3 text-[10px] uppercase tracking-tighter font-bold transition-colors flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'saved_images' 
                    ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
                onClick={() => setActiveTab('saved_images')}
            >
                <Bookmark size={12} />
                Vault
            </button>
             <button 
                className={`flex-1 min-w-[70px] py-3 text-[10px] uppercase tracking-tighter font-bold transition-colors flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'saved' 
                    ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
                onClick={() => setActiveTab('saved')}
            >
                <Type size={12} />
                Saved
            </button>
            <button 
                className={`flex-1 min-w-[70px] py-3 text-[10px] uppercase tracking-tighter font-bold transition-colors flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'prompts' 
                    ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
                onClick={() => setActiveTab('prompts')}
            >
                <RotateCcw size={12} />
                Recents
            </button>
            <button 
                className={`flex-1 min-w-[70px] py-3 text-[10px] uppercase tracking-tighter font-bold transition-colors flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'images' 
                    ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
                onClick={() => setActiveTab('images')}
            >
                <ImageIcon size={12} />
                Gallery
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {activeTab === 'saved' && (
                savedPrompts.length === 0 ? (
                    <div className="text-center text-slate-500 mt-8 text-sm">
                        No saved prompts yet.
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

            {activeTab === 'saved_images' && (
                savedImages.length === 0 ? (
                    <div className="text-center text-slate-500 mt-8 text-sm">
                        No images in vault yet.<br/>Use 'Save to Vault' after generating.
                    </div>
                ) : (
                    savedImages.map((item) => (
                        <div key={item.id} className="relative group">
                             <div
                                onClick={() => handleRestoreImage(item)}
                                className="bg-slate-800/50 hover:bg-slate-800 border rounded-lg cursor-pointer transition-all overflow-hidden border-indigo-500/40"
                            >
                                <div className="aspect-square w-full overflow-hidden bg-black relative">
                                    <img src={item.url} alt="saved" className="w-full h-full object-cover" />
                                </div>
                                <div className="p-3">
                                    <p className="text-xs text-slate-300 font-mono line-clamp-2 mb-2">{item.prompt}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-500">{formatDate(item.timestamp)}</span>
                                        <button
                                            onClick={(e) => handleDeleteSavedImage(item.id, e)}
                                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )
            )}

            {activeTab === 'prompts' && (
                historyItems.length === 0 ? (
                    <div className="text-center text-slate-500 mt-8 text-sm">
                        No recent activity.
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
                        </div>
                        </div>
                    ))
                )
            )}
            
            {activeTab === 'images' && (
                imageHistory.length === 0 ? (
                    <div className="text-center text-slate-500 mt-8 text-sm">
                        No generated images yet.
                    </div>
                ) : (
                    imageHistory.map((item, index) => (
                        <div 
                            key={index}
                            className="relative group"
                        >
                            <div
                                onClick={() => handleRestoreImage(item)}
                                className={`bg-slate-800/50 hover:bg-slate-800 border rounded-lg cursor-pointer group transition-all overflow-hidden ${
                                    index === 0 
                                    ? 'border-indigo-500/40' 
                                    : 'border-slate-700 hover:border-indigo-500/50'
                                }`}
                            >
                                <div className="aspect-square w-full overflow-hidden bg-black relative">
                                    <img src={item.url} alt="history" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                                </div>
                                <div className="p-3">
                                    <p className="text-xs text-slate-300 font-mono line-clamp-2 mb-1">{item.prompt}</p>
                                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                                        <span>{formatDate(item.timestamp)}</span>
                                        {item.seed !== undefined && <span>Seed: {item.seed.toString().slice(0,4)}...</span>}
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

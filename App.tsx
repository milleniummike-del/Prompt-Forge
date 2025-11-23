import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BlockLibrary } from './components/BlockLibrary';
import { PromptCanvas } from './components/PromptCanvas';
import { BlockModal } from './components/BlockModal';
import { AnalysisModal } from './components/AnalysisModal';
import { PromptBlock, BlockFormData, GeneratedImage } from './types';
import { getBlocks, saveBlock, updateBlock, deleteBlock, saveHistory, saveImageToHistory } from './services/storage';
import { enhancePrompt, generateImagePreview, analyzePromptForBlocks } from './services/gemini';
import { Menu, X } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [blocks, setBlocks] = useState<PromptBlock[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<PromptBlock | null>(null);
  const [modalInitialData, setModalInitialData] = useState<BlockFormData | null>(null);
  
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisSuggestions, setAnalysisSuggestions] = useState<BlockFormData[]>([]);

  // Gemini State
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);

  // Mobile Menu State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    setBlocks(getBlocks());
  }, []);

  // Compute unique tags for Folder/Group suggestions
  const availableTags = useMemo(() => {
    return Array.from(new Set(blocks.map(b => b.tag))).sort();
  }, [blocks]);

  // Auto-save history when prompt changes (Debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (prompt.trim()) {
        saveHistory(prompt);
      }
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [prompt]);

  // CRUD Handlers
  const handleSaveBlock = (data: BlockFormData) => {
    if (editingBlock) {
      setBlocks(updateBlock(editingBlock.id, data));
    } else {
      setBlocks(prev => [saveBlock(data), ...prev]);
    }
    setEditingBlock(null);
  };

  const handleSaveAnalysisBlocks = (blocksData: BlockFormData[]) => {
    const newBlocks = blocksData.map(data => saveBlock(data));
    setBlocks(prev => [...newBlocks, ...prev]);
    setIsAnalysisModalOpen(false);
    setAnalysisSuggestions([]);
  };

  const handleCloneBlock = (data: BlockFormData) => {
    // Instead of saving immediately, switch to Create mode with the data populated
    setEditingBlock(null);
    setModalInitialData({
      ...data,
      title: `${data.title} (Copy)`
    });
    // Keep modal open, but it will re-render as "New Block" with copied data
  };

  const handleDeleteBlock = (id: string) => {
    if (window.confirm('Are you sure you want to delete this block?')) {
      setBlocks(deleteBlock(id));
    }
  };

  const handleEditBlock = (block: PromptBlock) => {
    setModalInitialData(null);
    setEditingBlock(block);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingBlock(null);
    setModalInitialData(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBlock(null);
    setModalInitialData(null);
  };

  // Merge/Toggle Logic - Robust Regex based
  const handleToggleBlock = useCallback((content: string) => {
    setPrompt((prev) => {
      const normalizedContent = content.trim();
      if (!normalizedContent) return prev;

      // Escape regex characters
      const escapedContent = normalizedContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Check for exact match surround by comma or boundaries
      const regex = new RegExp(`(^|,\\s*)${escapedContent}(,\\s*|$)`, 'i');
      
      if (regex.test(prev)) {
        // Remove the segment
        // Logic: Identify if we are removing from start, middle, or end to handle commas correctly
        let newPrompt = prev.replace(regex, (match, p1, p2) => {
          // If flanked by commas (middle of list), keep one comma
          if (p1 && p1.includes(',') && p2 && p2.includes(',')) {
            return ', ';
          }
          // If at start or end, replace with empty string (will clean up leading/trailing commas next)
          return '';
        });
        
        // Cleanup any dangling commas at start or end caused by the removal
        newPrompt = newPrompt.replace(/^,\s*/, '').replace(/,\s*$/, '');
        return newPrompt;
      } else {
        // Add the segment
        const cleanPrev = prev.trim();
        // Append with comma if prev content exists and doesn't already end with one
        if (cleanPrev.length > 0) {
           if (cleanPrev.endsWith(',')) {
             return `${cleanPrev} ${normalizedContent}`;
           }
           return `${cleanPrev}, ${normalizedContent}`;
        }
        return normalizedContent;
      }
    });
  }, []);

  // Gemini Handlers
  const handleEnhance = async () => {
    if (!prompt && !uploadedImage) return;
    // Save state before enhancing
    if (prompt) saveHistory(prompt);
    
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(prompt, uploadedImage || undefined);
      setPrompt(enhanced);
    } catch (e) {
      alert("Failed to enhance prompt. Please check your API key.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!prompt) return;
    
    setIsAnalyzing(true);
    try {
      const results = await analyzePromptForBlocks(prompt);
      setAnalysisSuggestions(results);
      setIsAnalysisModalOpen(true);
    } catch (e) {
        alert("Failed to analyze prompt. Please check API Key.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !uploadedImage) return;
    // Save state before generating (often users tweak right before)
    if (prompt) saveHistory(prompt);
    
    setIsGenerating(true);
    setGeneratedImage(null);

    const seed = Math.floor(Math.random() * 1000000000);

    try {
      const imageUrl = await generateImagePreview(prompt, uploadedImage || undefined, seed);
      
      const newImage: GeneratedImage = {
        url: imageUrl,
        prompt: prompt,
        timestamp: Date.now(),
        seed: seed
      };

      setGeneratedImage(newImage);
      
      // Save generated image to history
      saveImageToHistory(newImage);
    } catch (e) {
       alert("Failed to generate image. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Library) */}
      <div className={`
        fixed md:relative z-30 h-full transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <BlockLibrary 
          blocks={blocks}
          currentPrompt={prompt}
          onSelect={handleToggleBlock}
          onEdit={handleEditBlock}
          onDelete={handleDeleteBlock}
          onAddNew={handleAddNew}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content (Canvas) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-300 hover:text-white">
                <Menu size={24} />
            </button>
            <span className="font-bold text-white flex items-center gap-2">
              <span className="bg-indigo-600 w-2 h-6 rounded-sm"></span>
              PromptForge
            </span>
            <div className="w-8"></div> {/* Spacer */}
        </div>

        <PromptCanvas 
          prompt={prompt}
          setPrompt={setPrompt}
          uploadedImage={uploadedImage}
          setUploadedImage={setUploadedImage}
          onEnhance={handleEnhance}
          onGenerate={handleGenerate}
          onAnalyze={handleAnalyze}
          isEnhancing={isEnhancing}
          isGenerating={isGenerating}
          isAnalyzing={isAnalyzing}
          generatedImage={generatedImage}
          setGeneratedImage={setGeneratedImage}
        />
      </div>

      <BlockModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveBlock}
        onClone={handleCloneBlock}
        editingBlock={editingBlock}
        initialData={modalInitialData}
        availableTags={availableTags}
        blocks={blocks}
      />

      <AnalysisModal 
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        suggestions={analysisSuggestions}
        onSave={handleSaveAnalysisBlocks}
      />
    </div>
  );
};

export default App;
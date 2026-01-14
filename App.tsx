import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BlockLibrary } from './components/BlockLibrary';
import { PromptCanvas } from './components/PromptCanvas';
import { BlockModal } from './components/BlockModal';
import { AnalysisModal } from './components/AnalysisModal';
import { LandingPage } from './components/LandingPage';
import { PromptBlock, BlockFormData, GeneratedImage, GoogleUser } from './types';
import { getBlocks, saveBlock, updateBlock, deleteBlock, saveHistory, saveImageToHistory, exportData, importData, STORAGE_MODE } from './services/storage';
import { enhancePrompt, generateImagePreview, analyzePromptForBlocks } from './services/gemini';
import { Menu } from 'lucide-react';

// Helper to decode JWT from Google
const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const App: React.FC = () => {
  // State
  const [blocks, setBlocks] = useState<PromptBlock[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // User State - Initialize as null (logged out)
  const [user, setUser] = useState<GoogleUser | null>(null);
  
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

  // Initialize Google Sign-In
  useEffect(() => {
    // Check if Google script is loaded
    const initializeGoogle = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE', 
          auto_select: false, // Ensure user is logged out by default (no auto-signin)
          callback: (response: any) => {
            const profile = parseJwt(response.credential);
            if (profile) {
              setUser({
                name: profile.name,
                email: profile.email,
                picture: profile.picture,
                sub: profile.sub
              });
            }
          }
        });
        
        // If we are on the landing page (no user), render the button there
        if (!user) {
            const btnContainer = document.getElementById('google-btn-landing');
            if (btnContainer) {
                window.google.accounts.id.renderButton(
                    btnContainer,
                    { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with' }
                );
            }
        }
      }
    };

    // If script is already present
    if (window.google) {
      initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initializeGoogle();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [user]); // Re-run when user state changes (logout -> re-render button)

  const handleLogout = () => {
    // Disable auto-select to prevent immediate re-login if they refresh
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
    // Clear application state
    setUser(null);
  };

  const handleMockLogin = () => {
    setUser({
      name: "Test User",
      email: "test@example.com",
      picture: "https://ui-avatars.com/api/?name=Test+User&background=6366f1&color=fff",
      sub: "mock-123"
    });
  };

  // Load initial data
  const loadBlocks = async () => {
    const data = await getBlocks();
    setBlocks(data);
  };

  useEffect(() => {
    if (user) {
        loadBlocks();
    }
  }, [user]);

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

  // Data Management Handlers (Export/Import)
  const handleExport = async () => {
      try {
          const json = await exportData();
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `promptforge-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (e: any) {
          alert(e.message || "Failed to export data");
      }
  };

  const handleImport = async (file: File) => {
      if (!window.confirm("Importing will overwrite current data. Continue?")) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const json = e.target?.result as string;
              await importData(json);
              await loadBlocks(); // Refresh blocks from new storage
              alert("Data imported successfully!");
              // Note: History/Images panels refresh themselves when opened
          } catch (e: any) {
              alert(e.message || "Failed to import data. Check file format.");
          }
      };
      reader.readAsText(file);
  };

  // CRUD Handlers
  const handleSaveBlock = async (data: BlockFormData) => {
    try {
      if (editingBlock) {
        const updated = await updateBlock(editingBlock.id, data);
        setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
      } else {
        const newBlock = await saveBlock(data);
        setBlocks(prev => [newBlock, ...prev]);
      }
      setEditingBlock(null);
    } catch (error) {
      console.error("Failed to save block:", error);
      alert("Failed to save block. Please check console for details.");
    }
  };

  const handleSaveAnalysisBlocks = async (blocksData: BlockFormData[]) => {
    try {
      // Execute in parallel
      const savePromises = blocksData.map(data => saveBlock(data));
      const newBlocks = await Promise.all(savePromises);
      setBlocks(prev => [...newBlocks, ...prev]);
      setIsAnalysisModalOpen(false);
      setAnalysisSuggestions([]);
    } catch (error) {
      console.error("Failed to save analysis blocks:", error);
    }
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

  const handleDeleteBlock = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this block?')) {
      try {
        await deleteBlock(id);
        setBlocks(prev => prev.filter(b => b.id !== id));
      } catch (error) {
        console.error("Failed to delete block:", error);
        alert("Failed to delete block.");
      }
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
      await saveImageToHistory(newImage);
    } catch (e) {
       alert("Failed to generate image. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- RENDER ---

  // 1. Landing Page (Logged Out)
  if (!user) {
      return <LandingPage onMockLogin={handleMockLogin} />;
  }

  // 2. Main App (Logged In)
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
          onExport={STORAGE_MODE === 'LOCAL' ? handleExport : undefined}
          onImport={STORAGE_MODE === 'LOCAL' ? handleImport : undefined}
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
          user={user}
          onLogout={handleLogout}
          onMockLogin={handleMockLogin}
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
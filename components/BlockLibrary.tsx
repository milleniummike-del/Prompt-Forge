import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PromptBlock } from '../types';
import { Plus, Search, Trash2, Edit2, Check, X, Folder, FolderOpen, ChevronRight, ChevronDown, SlidersHorizontal, Download, Upload } from 'lucide-react';

interface BlockLibraryProps {
  blocks: PromptBlock[];
  currentPrompt: string;
  onSelect: (content: string) => void;
  onEdit: (block: PromptBlock) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onClose?: () => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
}

export const BlockLibrary: React.FC<BlockLibraryProps> = ({
  blocks,
  currentPrompt,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
  onClose,
  onExport,
  onImport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group blocks by tag
  const groupedBlocks = useMemo(() => {
    const groups: Record<string, PromptBlock[]> = {};
    blocks.forEach((block) => {
      const tag = block.tag || 'Uncategorized';
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(block);
    });
    return groups;
  }, [blocks]);

  const sortedTags = useMemo(() => Object.keys(groupedBlocks).sort(), [groupedBlocks]);

  // Get all unique tags for filter chips
  const allTags = useMemo(() => {
      const tags = new Set(blocks.map(b => b.tag));
      return Array.from(tags).sort();
  }, [blocks]);

  // Auto-expand folders initially or when new ones are added
  useEffect(() => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      sortedTags.forEach((tag) => {
        if (prev.size === 0 || !prev.has(tag)) {
             next.add(tag);
        }
      });
      return next;
    });
  }, [sortedTags.length]);

  const toggleFolder = (tag: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
        onImport(file);
    }
    // Reset so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredBlocks = useMemo(() => {
    // If no search and no specific tag filter, return null to trigger Folder View
    if (!searchTerm && !selectedTag) return null;

    return blocks.filter((block) => {
      // 1. Tag Filter
      if (selectedTag && block.tag !== selectedTag) return false;

      // 2. Search Text
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          block.title.toLowerCase().includes(term) ||
          block.content.toLowerCase().includes(term) ||
          block.subTag?.toLowerCase().includes(term) ||
          block.tag.toLowerCase().includes(term)
        );
      }
      
      return true;
    });
  }, [blocks, searchTerm, selectedTag]);

  // Helper to check if block is active using Regex for strict exact matching
  const checkIsActive = (prompt: string, content: string) => {
    if (!content.trim()) return false;
    const escapedContent = content.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|,\\s*)${escapedContent}(,\\s*|$)`, 'i');
    return regex.test(prompt);
  };

  const renderBlockItem = (block: PromptBlock) => {
    const isActive = checkIsActive(currentPrompt, block.content);
    
    return (
      <div
        key={block.id}
        className={`group relative border rounded-xl p-4 transition-all cursor-pointer select-none ${
          isActive
            ? 'bg-indigo-900/30 border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,0.5)]'
            : 'bg-slate-800 hover:bg-slate-750 border-slate-700 hover:border-indigo-500/30 hover:shadow-lg'
        }`}
        onClick={() => onSelect(block.content)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className={`font-semibold truncate pr-6 ${isActive ? 'text-indigo-200' : 'text-white'}`}>
            {block.title}
          </h3>

          {/* Active Indicator / Actions */}
          <div className="absolute right-2 top-2 flex items-center gap-1">
            {isActive && (
              <span className="p-1.5 text-indigo-400 bg-indigo-950/50 rounded animate-in fade-in zoom-in duration-200">
                <Check size={14} strokeWidth={3} />
              </span>
            )}

            <div
              className={`flex gap-1 transition-opacity ${
                isActive ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(block);
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded transition-colors"
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(block.id);
                }}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        <p className={`text-xs line-clamp-2 font-mono mb-3 ${isActive ? 'text-indigo-300/70' : 'text-slate-400'}`}>
          {block.content}
        </p>

        <div className="flex items-center gap-2 mt-auto">
           {(searchTerm || selectedTag) && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                  isActive ? 'bg-indigo-900 text-indigo-300' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {block.tag}
              </span>
           )}
          {block.subTag && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                isActive
                  ? 'bg-indigo-900/50 text-indigo-300/80 border-indigo-800'
                  : 'bg-slate-700/50 text-slate-400 border-slate-700'
              }`}
            >
              {block.subTag}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-full md:w-96 flex-shrink-0 shadow-2xl md:shadow-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Close Library"
              >
                <X size={24} />
              </button>
            )}
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-indigo-600 w-2 h-6 rounded-sm"></span>
              Library
            </h2>
          </div>
          <button
            onClick={onAddNew}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
            title="Create New Block"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
             <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    !selectedTag 
                    ? 'bg-white text-slate-900 border-white shadow-lg shadow-white/10' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
             >
                <SlidersHorizontal size={12} />
                All
             </button>
             {allTags.map(tag => (
                 <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                        selectedTag === tag
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                    }`}
                 >
                    {tag}
                 </button>
             ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredBlocks ? (
          filteredBlocks.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
              <p>No matching blocks found.</p>
              {selectedTag && <p className="text-xs mt-2">Filter: {selectedTag}</p>}
              {searchTerm && <p className="text-xs">Search: "{searchTerm}"</p>}
            </div>
          ) : (
            filteredBlocks.map(renderBlockItem)
          )
        ) : (
            // Folder View
            sortedTags.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">
                    <p>No blocks. Create one to get started!</p>
                </div>
            ) : (
                sortedTags.map(tag => {
                    const isExpanded = expandedFolders.has(tag);
                    const count = groupedBlocks[tag].length;
                    return (
                        <div key={tag} className="mb-1">
                            <button
                                onClick={() => toggleFolder(tag)}
                                className={`flex items-center gap-2 w-full text-left p-2 rounded-lg transition-colors group ${
                                    isExpanded ? 'text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                            >
                                {isExpanded ? (
                                    <FolderOpen size={18} className="text-indigo-400 shrink-0" />
                                ) : (
                                    <Folder size={18} className="text-slate-500 group-hover:text-indigo-400 shrink-0" />
                                )}
                                <span className="font-semibold text-sm truncate flex-1">{tag}</span>
                                <span className="text-[10px] font-mono bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full group-hover:bg-slate-700 group-hover:text-slate-300">
                                    {count}
                                </span>
                                {isExpanded ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
                            </button>
                            
                            {isExpanded && (
                                <div className="mt-2 pl-3 border-l border-slate-800 ml-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                    {groupedBlocks[tag].map(renderBlockItem)}
                                </div>
                            )}
                        </div>
                    );
                })
            )
        )}
      </div>

      {/* Footer / Data Management */}
      {(onExport && onImport) && (
          <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0 z-10 flex gap-2">
              <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".json" 
                  onChange={handleFileChange} 
              />
              <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
                  title="Import Backup"
              >
                  <Upload size={14} />
                  Import
              </button>
              <button
                  onClick={onExport}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
                  title="Export Backup"
              >
                  <Download size={14} />
                  Export
              </button>
          </div>
      )}
    </div>
  );
};
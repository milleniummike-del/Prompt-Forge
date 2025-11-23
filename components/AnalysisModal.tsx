import React, { useState, useEffect } from 'react';
import { BlockFormData } from '../types';
import { X, Save, Check, Search } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: BlockFormData[];
  onSave: (blocks: BlockFormData[]) => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  suggestions,
  onSave,
}) => {
  const [items, setItems] = useState<BlockFormData[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen && suggestions) {
      setItems(suggestions);
      // Select all by default
      setSelected(new Set(suggestions.map((_, i) => i)));
    }
  }, [isOpen, suggestions]);

  const toggleSelect = (index: number) => {
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelected(next);
  };

  const updateItem = (index: number, field: keyof BlockFormData, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSave = () => {
    const toSave = items.filter((_, i) => selected.has(i));
    onSave(toSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Search size={20} className="text-indigo-400" />
                        Prompt Analysis
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                        Found {suggestions.length} potential blocks. Review and save.
                    </p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X /></button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 flex-1 bg-slate-950/50">
                {items.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">
                        No clear blocks identified in the prompt.
                    </div>
                ) : (
                    items.map((item, idx) => (
                        <div 
                            key={idx} 
                            className={`p-4 rounded-lg border transition-all ${
                                selected.has(idx) 
                                ? 'bg-slate-800 border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
                                : 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-100'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <button
                                    onClick={() => toggleSelect(idx)}
                                    className={`mt-1 w-6 h-6 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                        selected.has(idx)
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'border-slate-600 hover:border-indigo-400 bg-slate-900'
                                    }`}
                                >
                                    {selected.has(idx) && <Check size={14} strokeWidth={3} />}
                                </button>
                                
                                <div className="flex-1 space-y-3">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Title</label>
                                            <input 
                                                className="w-full bg-slate-900/50 border-b border-slate-700 focus:border-indigo-500 outline-none text-sm font-semibold text-white py-1 transition-colors"
                                                value={item.title}
                                                onChange={(e) => updateItem(idx, 'title', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-32">
                                             <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Tag</label>
                                             <input 
                                                className="w-full bg-slate-900/50 border-b border-slate-700 focus:border-indigo-500 outline-none text-sm text-indigo-300 py-1 transition-colors"
                                                value={item.tag}
                                                onChange={(e) => updateItem(idx, 'tag', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Content</label>
                                        <textarea 
                                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-slate-300 focus:border-indigo-500 outline-none resize-none h-16 transition-colors"
                                            value={item.content}
                                            onChange={(e) => updateItem(idx, 'content', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-xl flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button 
                    onClick={handleSave}
                    disabled={selected.size === 0}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 transition-all"
                >
                    <Save size={18} />
                    Save {selected.size} Blocks
                </button>
            </div>
        </div>
    </div>
  );
}
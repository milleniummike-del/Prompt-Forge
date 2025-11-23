import React, { useState, useEffect, useMemo } from 'react';
import { PromptBlock, BlockFormData } from '../types';
import { X, Save, Copy, AlertCircle } from 'lucide-react';

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BlockFormData) => void;
  onClone?: (data: BlockFormData) => void;
  editingBlock: PromptBlock | null;
  initialData?: BlockFormData | null;
  availableTags: string[];
  blocks: PromptBlock[];
}

export const BlockModal: React.FC<BlockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onClone,
  editingBlock,
  initialData,
  availableTags,
  blocks,
}) => {
  const [formData, setFormData] = useState<BlockFormData>({
    title: '',
    content: '',
    tag: '',
    subTag: '',
  });

  useEffect(() => {
    if (editingBlock) {
      setFormData({
        title: editingBlock.title,
        content: editingBlock.content,
        tag: editingBlock.tag,
        subTag: editingBlock.subTag || '',
      });
    } else if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content,
        tag: initialData.tag,
        subTag: initialData.subTag || '',
      });
    } else {
      setFormData({ title: '', content: '', tag: '', subTag: '' });
    }
  }, [editingBlock, initialData, isOpen]);

  // Check for duplicate content to prevent double-selection bugs
  const isDuplicate = useMemo(() => {
    if (!formData.content) return false;
    return blocks.some(b => 
      b.content.trim().toLowerCase() === formData.content.trim().toLowerCase() &&
      b.id !== editingBlock?.id
    );
  }, [formData.content, blocks, editingBlock]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.tag) return;
    if (isDuplicate) return;
    onSave(formData);
    onClose();
  };

  const handleClone = () => {
    if (!formData.title || !formData.content || !formData.tag) return;
    onClone?.(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl transform transition-all scale-100">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white">
            {editingBlock ? 'Edit Block' : 'New Prompt Block'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Cinematic Lighting"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Folder (Tag)
              </label>
              <input
                type="text"
                list="tag-suggestions"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Style"
                required
              />
              <datalist id="tag-suggestions">
                {availableTags.map(tag => (
                    <option key={tag} value={tag} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Sub Tag (Optional)
              </label>
              <input
                type="text"
                value={formData.subTag}
                onChange={(e) => setFormData({ ...formData, subTag: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Dark"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Prompt Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className={`w-full h-32 bg-slate-800 border rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-1 resize-none ${
                isDuplicate 
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' 
                : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              placeholder="The actual text to be merged..."
              required
            />
             {isDuplicate && (
                <div className="flex items-center gap-2 text-red-400 text-xs mt-2 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={12} />
                    <span>This content already exists in another block. Please make it unique.</span>
                </div>
             )}
          </div>

          <div className="pt-4 flex justify-between items-center gap-3">
            <div>
              {editingBlock && onClone && (
                <button
                  type="button"
                  onClick={handleClone}
                  className="px-3 py-2 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 transition-colors flex items-center gap-2 text-sm font-medium"
                  title="Create a copy of this block"
                >
                  <Copy size={16} />
                  Clone
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDuplicate}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isDuplicate 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <Save size={18} />
                {editingBlock ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
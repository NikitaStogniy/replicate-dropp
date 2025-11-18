'use client';

import { useAppDispatch, useAppSelector } from '@/app/store';
import { setSelectedModel } from '@/app/store/slices/modelsSlice';
import { getAllModels, getModelById } from '@/app/lib/models';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const ModelSelectorInline = () => {
  const dispatch = useAppDispatch();
  const selectedModelId = useAppSelector((state) => state.models.selectedModelId);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const models = getAllModels();
  const selectedModel = getModelById(selectedModelId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectModel = (modelId: string) => {
    dispatch(setSelectedModel(modelId));
    setIsOpen(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'text-to-image':
        return '🎨';
      case 'image-to-image':
        return '🖼️';
      case 'image-to-video':
        return '🎬';
      case 'text-to-video':
        return '📹';
      default:
        return '✨';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' to ');
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-100"
      >
        <span className="text-lg">{selectedModel ? getCategoryIcon(selectedModel.category) : '✨'}</span>
        <span className="font-medium text-gray-100">{selectedModel?.name || 'Select Model'}</span>
        <ChevronDown size={16} className={`transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-gray-800 rounded-lg shadow-lg border border-gray-700 max-h-96 overflow-y-auto z-50">
          <div className="p-2">
            {models.map((model) => {
              const isSelected = model.id === selectedModelId;
              return (
                <button
                  key={model.id}
                  onClick={() => handleSelectModel(model.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700 text-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">{getCategoryIcon(model.category)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{model.name}</div>
                      <div className={`text-xs mt-0.5 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                        {getCategoryLabel(model.category)}
                      </div>
                      {model.description && (
                        <div className={`text-xs mt-1 line-clamp-2 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                          {model.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelectorInline;

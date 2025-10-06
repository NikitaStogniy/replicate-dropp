'use client';

import { ModelConfig } from '@/app/lib/models';
import { ClockIcon } from '@heroicons/react/24/outline';

interface ModelCardProps {
  model: ModelConfig;
  isSelected: boolean;
  onSelect: (modelId: string) => void;
}

export default function ModelCard({ model, isSelected, onSelect }: ModelCardProps) {
  return (
    <div
      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected
          ? 'border-green-500 bg-green-50/50 shadow-lg'
          : 'border-gray-200 bg-white/70 hover:border-gray-300'
      }`}
      onClick={() => onSelect(model.id)}
    >
      <input
        type="radio"
        value={model.id}
        checked={isSelected}
        onChange={() => {}}
        className="absolute top-3 right-3 w-4 h-4 text-green-600"
      />
      <div className="pr-6">
        <h3 className="font-semibold text-gray-900 mb-1">{model.name}</h3>
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{model.description}</p>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              model.quality === 'fast'
                ? 'bg-blue-100 text-blue-800'
                : model.quality === 'balanced'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {model.quality === 'fast' ? 'Быстро' : model.quality === 'balanced' ? 'Сбалансировано' : 'Высокое качество'}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            {model.estimatedTime}
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { ModelConfig, supportsInpainting } from '@/app/lib/models';
import { ChevronDownIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import ModelCard from './ModelCard';

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModelId: string;
  currentModel: ModelConfig | undefined;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (modelId: string) => void;
  inpaintingMode?: boolean;
}

export default function ModelSelector({
  models,
  selectedModelId,
  currentModel,
  isOpen,
  onToggle,
  onSelect,
  inpaintingMode = false,
}: ModelSelectorProps) {
  return (
    <div className="mb-8">
      <div
        className="flex items-center justify-between cursor-pointer p-2 -m-2 rounded-lg hover:bg-gray-50/50 transition-colors"
        onClick={onToggle}
      >
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <CpuChipIcon className="w-5 h-5 mr-2 text-green-600" />
          Выбор модели
        </h2>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {!isOpen && currentModel && (
        <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <CpuChipIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">{currentModel.name}</h4>
              <p className="text-xs text-blue-700">{currentModel.description}</p>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
            {models.map((model) => (
              <ModelCard key={model.id} model={model} isSelected={selectedModelId === model.id} onSelect={onSelect} />
            ))}
          </div>

          {currentModel && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <CpuChipIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-grow">
                  <h4 className="font-semibold text-blue-900 mb-1">
                    Выбрана модель: {currentModel.name}
                    {inpaintingMode && supportsInpainting(currentModel) && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Inpainting режим
                      </span>
                    )}
                    {inpaintingMode && !supportsInpainting(currentModel) && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        ⚠️ Не поддерживает inpainting
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-blue-700">{currentModel.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

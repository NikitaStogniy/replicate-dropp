'use client';

import { SparklesIcon } from '@heroicons/react/24/outline';
import { ModelConfig, supportsInpainting, requiresCharacterImage } from '@/app/lib/models';

interface GenerateButtonProps {
  isGenerating: boolean;
  prompt: string;
  inpaintingMode: boolean;
  maskPrompt: string;
  currentModel: ModelConfig | undefined;
  characterImage: File | null;
  onGenerate: () => void;
}

export default function GenerateButton({
  isGenerating,
  prompt,
  inpaintingMode,
  maskPrompt,
  currentModel,
  characterImage,
  onGenerate,
}: GenerateButtonProps) {
  const isDisabled =
    isGenerating ||
    (!prompt && !inpaintingMode) ||
    (inpaintingMode && (!maskPrompt || (currentModel && !supportsInpainting(currentModel)))) ||
    (currentModel && requiresCharacterImage(currentModel) && !characterImage);

  const getHelpText = () => {
    if (!prompt && !inpaintingMode) return 'Введите описание изображения';
    if (inpaintingMode && currentModel && !supportsInpainting(currentModel))
      return 'Выберите модель с поддержкой inpainting (Ideogram)';
    if (inpaintingMode && !maskPrompt) return 'Опишите что вы хотите изменить в выделенной области';
    if (currentModel && requiresCharacterImage(currentModel) && !characterImage)
      return 'Загрузите референсное изображение для этой модели';
    return null;
  };

  const helpText = getHelpText();

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <button
        onClick={onGenerate}
        disabled={isDisabled}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center space-x-3"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Генерируется...</span>
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5" />
            <span>Создать изображение</span>
          </>
        )}
      </button>

      {helpText && <p className="text-center text-sm text-gray-500 mt-3">{helpText}</p>}
    </div>
  );
}

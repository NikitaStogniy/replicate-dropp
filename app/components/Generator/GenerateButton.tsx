'use client';

import { SparklesIcon } from '@heroicons/react/24/outline';
import { ModelConfig, supportsInpainting, validateAllParameters } from '@/app/lib/models';

interface GenerateButtonProps {
  isGenerating: boolean;
  inpaintingMode: boolean;
  maskPrompt: string;
  currentModel: ModelConfig | undefined;
  parameters: Record<string, unknown>;
  onGenerate: () => void;
}

export default function GenerateButton({
  isGenerating,
  inpaintingMode,
  maskPrompt,
  currentModel,
  parameters,
  onGenerate,
}: GenerateButtonProps) {
  // Validate using schema-driven validation
  const validationResult = currentModel
    ? validateAllParameters(currentModel, parameters)
    : { valid: false, errors: ['Модель не выбрана'] };

  const isDisabled =
    isGenerating ||
    !validationResult.valid ||
    (inpaintingMode && (!maskPrompt || (currentModel && !supportsInpainting(currentModel))));

  const getHelpText = () => {
    // Show inpainting-specific errors first (not schema-related)
    if (inpaintingMode && currentModel && !supportsInpainting(currentModel))
      return 'Выберите модель с поддержкой inpainting (Ideogram)';
    if (inpaintingMode && !maskPrompt)
      return 'Опишите что вы хотите изменить в выделенной области';

    // Show first validation error from schema
    if (!validationResult.valid && validationResult.errors.length > 0) {
      return validationResult.errors[0];
    }

    return null;
  };

  const helpText = getHelpText();

  return (
    <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
      <button
        onClick={onGenerate}
        disabled={isDisabled}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center space-x-2 sm:space-x-3"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Генерируется...</span>
          </>
        ) : (
          <>
            <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Создать изображение</span>
          </>
        )}
      </button>

      {helpText && <p className="text-center text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 px-2">{helpText}</p>}
    </div>
  );
}

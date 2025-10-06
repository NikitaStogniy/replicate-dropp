'use client';

import Image from 'next/image';
import { PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline';
import MaskPreview from './MaskPreview';
import { ModelConfig, supportsInpainting } from '@/app/lib/models';

interface InpaintingPanelProps {
  inpaintImage: string;
  maskImage: string | null;
  maskPrompt: string;
  currentModel: ModelConfig | undefined;
  isGenerating: boolean;
  onExit: () => void;
  onOpenMaskEditor: () => void;
  onRemoveMask: () => void;
  onUploadMask: (maskDataUrl: string) => void;
  onMaskPromptChange: (prompt: string) => void;
  onGenerate: () => void;
}

export default function InpaintingPanel({
  inpaintImage,
  maskImage,
  maskPrompt,
  currentModel,
  isGenerating,
  onExit,
  onOpenMaskEditor,
  onRemoveMask,
  onUploadMask,
  onMaskPromptChange,
  onGenerate,
}: InpaintingPanelProps) {
  const canGenerate = maskPrompt && maskImage && currentModel && supportsInpainting(currentModel);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-green-200 shadow-2xl z-40 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-800">Режим Inpainting</h2>
              <p className="text-sm text-green-600">Отредактируйте выбранные области изображения</p>
            </div>
          </div>
          <button
            onClick={onExit}
            className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 p-2 rounded-xl transition-all duration-200 flex items-center space-x-2 group"
            title="Выйти из режима inpainting"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm font-medium">Закрыть</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Original Image */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-green-100">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <PhotoIcon className="w-4 h-4 mr-2 text-green-600" />
                Исходное изображение
              </h4>
              <Image
                src={inpaintImage}
                alt="Original"
                className="w-full rounded-xl border border-gray-200 shadow-sm"
                width={400}
                height={400}
              />
            </div>
          </div>

          {/* Mask Preview */}
          <div className="lg:col-span-1">
            <MaskPreview
              maskImage={maskImage}
              onOpenEditor={onOpenMaskEditor}
              onRemoveMask={onRemoveMask}
              onUploadMask={onUploadMask}
            />
          </div>

          {/* Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-green-100 space-y-4">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <SparklesIcon className="w-4 h-4 mr-2 text-green-600" />
                Описание изменений
              </h4>

              <div className="relative">
                <textarea
                  value={maskPrompt}
                  onChange={(e) => onMaskPromptChange(e.target.value)}
                  placeholder="Опишите что должно появиться в выделенных областях. Например: 'красивые цветы', 'синий автомобиль', 'современное здание'..."
                  className="w-full p-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500 transition-all resize-none bg-white/70 backdrop-blur-sm text-sm leading-relaxed"
                  rows={4}
                  maxLength={300}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-1 rounded">
                  {maskPrompt.length}/300
                </div>
              </div>

              {canGenerate && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-green-800 font-medium">Готово к генерации!</p>
                  </div>
                  <p className="text-xs text-green-700 mt-1 ml-8">
                    Нажмите кнопку &ldquo;Создать изображение&rdquo; ниже
                  </p>
                </div>
              )}

              <button
                onClick={onGenerate}
                disabled={isGenerating || !canGenerate}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Генерируется...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    <span>Создать изображение</span>
                  </>
                )}
              </button>

              {!canGenerate && (
                <p className="text-center text-xs text-gray-500">
                  {currentModel && !supportsInpainting(currentModel)
                    ? 'Выберите модель с поддержкой inpainting (Ideogram)'
                    : !maskImage
                    ? 'Создайте маску для редактирования'
                    : 'Опишите желаемые изменения'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

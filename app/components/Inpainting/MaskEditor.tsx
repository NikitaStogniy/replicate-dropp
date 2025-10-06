'use client';

import Image from 'next/image';
import { useCanvasDrawing } from '@/app/hooks/useCanvasDrawing';
import { clearCanvas as clearCanvasUtil, saveMask as saveMaskUtil } from '@/app/utils/inpainting';

interface MaskEditorProps {
  inpaintImage: string;
  brushSize: number;
  isDrawing: boolean;
  onBrushSizeChange: (size: number) => void;
  onDrawingChange: (isDrawing: boolean) => void;
  onClose: () => void;
  onSaveMask: (maskDataUrl: string) => void;
}

export default function MaskEditor({
  inpaintImage,
  brushSize,
  isDrawing,
  onBrushSizeChange,
  onDrawingChange,
  onClose,
  onSaveMask,
}: MaskEditorProps) {
  const { handleMouseDrawing, handleTouchDrawing } = useCanvasDrawing(brushSize, isDrawing);

  const handleClearCanvas = () => {
    const canvas = document.getElementById('mask-canvas') as HTMLCanvasElement;
    if (canvas) clearCanvasUtil(canvas);
  };

  const handleSaveMask = () => {
    const canvas = document.getElementById('mask-canvas') as HTMLCanvasElement;
    if (canvas) {
      const maskDataUrl = saveMaskUtil(canvas);
      onSaveMask(maskDataUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Рисование маски</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Размер кисти:</label>
              <input
                type="range"
                min="5"
                max="50"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-600 w-8">{brushSize}</span>
            </div>

            <button
              onClick={handleClearCanvas}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
            >
              Очистить
            </button>

            <button
              onClick={handleSaveMask}
              className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 transition-colors"
            >
              Сохранить маску
            </button>
          </div>

          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={inpaintImage}
              alt="Original"
              className="w-full h-auto"
              width={800}
              height={600}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                const canvas = document.getElementById('mask-canvas') as HTMLCanvasElement;
                if (canvas) {
                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;
                  canvas.style.width = img.offsetWidth + 'px';
                  canvas.style.height = img.offsetHeight + 'px';
                  clearCanvasUtil(canvas);
                }
              }}
            />
            <canvas
              id="mask-canvas"
              className="absolute inset-0 cursor-crosshair"
              onMouseDown={() => onDrawingChange(true)}
              onMouseUp={() => onDrawingChange(false)}
              onMouseLeave={() => onDrawingChange(false)}
              onMouseMove={(e) => {
                const canvas = e.target as HTMLCanvasElement;
                handleMouseDrawing(canvas, e);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                onDrawingChange(true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onDrawingChange(false);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const canvas = e.target as HTMLCanvasElement;
                const touch = e.touches[0];
                handleTouchDrawing(canvas, touch);
              }}
            />
          </div>

          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-gray-600">
              🎨 <strong>Закрасьте черным</strong> области, которые хотите изменить
            </p>
            <p className="text-xs text-gray-500">
              Используйте мышь или палец для рисования. Размер кисти можно изменить выше.
            </p>
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">
              <span>💡</span>
              <span>Совет: Опишите выше что должно появиться в черных областях</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

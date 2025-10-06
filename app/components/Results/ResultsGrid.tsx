'use client';

import ImageResult from './ImageResult';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface ResultsGridProps {
  output: string | string[];
  onEdit?: (imageUrl: string) => void;
  onDownload?: (imageUrl: string, filename: string) => void;
}

export default function ResultsGrid({ output, onEdit, onDownload }: ResultsGridProps) {
  // Массив изображений
  if (Array.isArray(output)) {
    const validImages = output.filter(
      (imageUrl) => imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== ''
    );

    if (validImages.length === 0) {
      return (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <PhotoIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Нет валидных изображений</h3>
          <p className="text-yellow-700">Генерация завершилась, но не вернула валидные изображения</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {validImages.map((imageUrl, index) => (
          <ImageResult
            key={index}
            imageUrl={imageUrl}
            alt={`Сгенерированное изображение ${index + 1}`}
            onEdit={onEdit}
            onDownload={onDownload}
            filename={`generated-image-${index + 1}.png`}
          />
        ))}
      </div>
    );
  }

  // Одно изображение
  if (typeof output === 'string' && output.trim() !== '') {
    return (
      <div className="max-w-2xl mx-auto">
        <ImageResult
          imageUrl={output}
          alt="Сгенерированное изображение"
          onEdit={onEdit}
          onDownload={onDownload}
          filename="generated-image.png"
        />
      </div>
    );
  }

  // Нет валидного output
  return (
    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <PhotoIcon className="w-6 h-6 text-yellow-600" />
      </div>
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Нет валидных изображений</h3>
      <p className="text-yellow-700">Генерация завершилась, но не вернула валидные изображения</p>
    </div>
  );
}

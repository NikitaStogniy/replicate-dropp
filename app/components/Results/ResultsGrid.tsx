'use client';

import ImageResult from './ImageResult';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface ResultsGridProps {
  output: string | string[];
  onEdit?: (imageUrl: string) => void;
  onDownload?: (imageUrl: string, filename: string) => void;
  parameters?: Record<string, unknown>;
}

export default function ResultsGrid({ output, onEdit, onDownload, parameters }: ResultsGridProps) {
  // Определяем расширение файла на основе output_format или URL
  const getFileExtension = (imageUrl?: string) => {
    // Сначала проверяем параметры модели (output_format для nano-banana)
    const format = parameters?.output_format || parameters?.format || parameters?.outputFormat;

    if (typeof format === 'string') {
      const normalized = format.toLowerCase();
      // Нормализуем 'jpeg' к 'jpg'
      return normalized === 'jpeg' ? 'jpg' : normalized;
    }

    // Если формата нет в параметрах, определяем из URL изображения
    if (imageUrl) {
      // Проверяем data URL (base64)
      if (imageUrl.startsWith('data:image/')) {
        const mimeType = imageUrl.split(';')[0].split(':')[1];
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
          return 'jpg';
        }
        if (mimeType === 'image/png') {
          return 'png';
        }
        if (mimeType === 'image/webp') {
          return 'webp';
        }
      }

      // Проверяем обычный URL с расширением файла
      const urlExtension = imageUrl.split('.').pop()?.toLowerCase().split('?')[0];
      if (urlExtension === 'jpg' || urlExtension === 'jpeg') {
        return 'jpg';
      }
      if (urlExtension === 'png' || urlExtension === 'webp') {
        return urlExtension;
      }
    }

    return 'png';
  };

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
        {validImages.map((imageUrl, index) => {
          // Определяем расширение для каждого изображения отдельно
          const extension = getFileExtension(imageUrl);
          return (
            <ImageResult
              key={index}
              imageUrl={imageUrl}
              alt={`Сгенерированное изображение ${index + 1}`}
              onEdit={onEdit}
              onDownload={onDownload}
              filename={`generated-image-${index + 1}.${extension}`}
            />
          );
        })}
      </div>
    );
  }

  // Одно изображение
  if (typeof output === 'string' && output.trim() !== '') {
    const extension = getFileExtension(output);
    return (
      <div className="max-w-2xl mx-auto">
        <ImageResult
          imageUrl={output}
          alt="Сгенерированное изображение"
          onEdit={onEdit}
          onDownload={onDownload}
          filename={`generated-image.${extension}`}
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

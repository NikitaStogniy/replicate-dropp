'use client';

import { ClockIcon } from '@heroicons/react/24/outline';

interface ResultStatusProps {
  status: 'processing' | 'failed' | 'starting';
  error?: string;
  onRetry?: () => void;
}

export default function ResultStatus({ status, error, onRetry }: ResultStatusProps) {
  if (status === 'processing') {
    return (
      <div className="text-center py-12">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Обработка...</h3>
        <p className="text-gray-600">Создаем ваше изображение, пожалуйста подождите...</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Ошибка генерации</h3>
        <p className="text-red-700 mb-4">{error || 'Неизвестная ошибка'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        )}
      </div>
    );
  }

  if (status === 'starting') {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <ClockIcon className="w-6 h-6 text-yellow-600" />
        </div>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Запуск генерации</h3>
        <p className="text-yellow-700">Подготавливаем модель для создания вашего изображения...</p>
      </div>
    );
  }

  return null;
}

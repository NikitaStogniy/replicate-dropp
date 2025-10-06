'use client';

import { PhotoIcon } from '@heroicons/react/24/outline';

interface ResultHeaderProps {
  title: string;
  seed?: number;
}

export default function ResultHeader({ title, seed }: ResultHeaderProps) {
  const handleSeedCopy = async () => {
    if (seed) {
      await navigator.clipboard.writeText(seed.toString());
      alert('Seed скопирован в буфер обмена!');
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
          <PhotoIcon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>

      {seed && (
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-600 mr-2">Seed: {seed}</span>
          <button
            onClick={handleSeedCopy}
            className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
            title="Копировать seed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface StyleSelectorProps {
  styles: string[];
  selected: string;
  onChange: (style: string) => void;
}

const styleLabels: Record<string, string> = {
  Auto: 'Авто',
  Fiction: 'Художественный',
  Realistic: 'Реалистичный',
  General: 'Общий',
  Design: 'Дизайн',
  Photographic: 'Фотографический',
  Anime: 'Аниме',
  'Digital Art': 'Цифровое искусство',
  'Comic Book': 'Комикс',
  'Fantasy Art': 'Фэнтези',
};

export default function StyleSelector({ styles, selected, onChange }: StyleSelectorProps) {
  return (
    <div>
      <label className="block text-lg font-semibold text-gray-800 mb-3">Стиль изображения</label>
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white/70 backdrop-blur-sm appearance-none cursor-pointer"
        >
          {styles.map((style) => (
            <option key={style} value={style}>
              {styleLabels[style] || style}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

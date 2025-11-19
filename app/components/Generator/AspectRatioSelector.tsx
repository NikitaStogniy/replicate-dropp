'use client';

interface AspectRatioSelectorProps {
  ratios: string[];
  selected: string;
  onChange: (ratio: string) => void;
}

const ratioLabels: Record<string, string> = {
  '1:1': 'Квадрат',
  '16:9': 'Широкий',
  '9:16': 'Вертикальный',
  '4:3': 'Альбомный',
  '3:4': 'Портретный',
};

export default function AspectRatioSelector({ ratios, selected, onChange }: AspectRatioSelectorProps) {
  return (
    <div>
      <label className="block text-lg font-semibold text-gray-200 mb-3">Соотношение сторон</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {ratios.map((ratio) => (
          <button
            key={ratio}
            type="button"
            onClick={() => onChange(ratio)}
            className={`p-2.5 sm:p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
              selected === ratio
                ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="font-semibold text-xs sm:text-sm">{ratio}</div>
              <div className="text-[10px] sm:text-xs opacity-75">{ratioLabels[ratio] || ''}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

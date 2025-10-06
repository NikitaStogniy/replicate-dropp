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
      <label className="block text-lg font-semibold text-gray-800 mb-3">Соотношение сторон</label>
      <div className="grid grid-cols-2 gap-3">
        {ratios.map((ratio) => (
          <button
            key={ratio}
            type="button"
            onClick={() => onChange(ratio)}
            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
              selected === ratio
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white/70 text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="font-semibold">{ratio}</div>
              <div className="text-xs opacity-75">{ratioLabels[ratio] || ''}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

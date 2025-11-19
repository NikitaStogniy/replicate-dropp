'use client';

interface ResolutionSelectorProps {
  resolutions: string[];
  selected: string;
  onChange: (resolution: string) => void;
}

const resolutionLabels: Record<string, string> = {
  '512p': 'Стандарт',
  '768p': 'Высокое',
  '1080p': 'Pro HD',
};

export default function ResolutionSelector({ resolutions, selected, onChange }: ResolutionSelectorProps) {
  return (
    <div>
      <label className="block text-lg font-semibold text-gray-200 mb-3">Разрешение</label>
      <div className="grid grid-cols-3 gap-3">
        {resolutions.map((resolution) => (
          <button
            key={resolution}
            type="button"
            onClick={() => onChange(resolution)}
            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
              selected === resolution
                ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="font-semibold">{resolution}</div>
              <div className="text-xs opacity-75">{resolutionLabels[resolution] || ''}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

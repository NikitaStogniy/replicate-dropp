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
      <label className="block text-lg font-semibold text-gray-800 mb-3">Разрешение</label>
      <div className="grid grid-cols-3 gap-3">
        {resolutions.map((resolution) => (
          <button
            key={resolution}
            type="button"
            onClick={() => onChange(resolution)}
            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
              selected === resolution
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white/70 text-gray-700 hover:border-gray-300'
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

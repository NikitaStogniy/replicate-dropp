'use client';

interface DurationSelectorProps {
  durations: number[];
  selected: number;
  onChange: (duration: number) => void;
}

export default function DurationSelector({ durations, selected, onChange }: DurationSelectorProps) {
  return (
    <div>
      <label className="block text-lg font-semibold text-gray-200 mb-3">Длительность видео</label>
      <div className="grid grid-cols-2 gap-3">
        {durations.map((duration) => (
          <button
            key={duration}
            type="button"
            onClick={() => onChange(duration)}
            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
              selected === duration
                ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="font-semibold">{duration} сек</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

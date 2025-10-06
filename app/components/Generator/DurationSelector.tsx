'use client';

interface DurationSelectorProps {
  durations: number[];
  selected: number;
  onChange: (duration: number) => void;
}

export default function DurationSelector({ durations, selected, onChange }: DurationSelectorProps) {
  return (
    <div>
      <label className="block text-lg font-semibold text-gray-800 mb-3">Длительность видео</label>
      <div className="grid grid-cols-2 gap-3">
        {durations.map((duration) => (
          <button
            key={duration}
            type="button"
            onClick={() => onChange(duration)}
            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
              selected === duration
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white/70 text-gray-700 hover:border-gray-300'
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

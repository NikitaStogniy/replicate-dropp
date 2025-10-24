'use client';

interface ToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export default function Toggle({ label, description, enabled, onChange }: ToggleProps) {
  return (
    <div className="bg-white/70 p-3 sm:p-4 rounded-xl border-2 border-gray-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <label className="block text-base sm:text-lg font-semibold text-gray-800">{label}</label>
          {description && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(!enabled)}
          className={`relative inline-flex h-7 w-12 sm:h-8 sm:w-14 flex-shrink-0 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

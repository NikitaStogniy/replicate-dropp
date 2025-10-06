'use client';

interface PromptOptimizerToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export default function PromptOptimizerToggle({ enabled, onChange }: PromptOptimizerToggleProps) {
  return (
    <div className="bg-white/70 p-4 rounded-xl border-2 border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-lg font-semibold text-gray-800">Оптимизатор промпта</label>
          <p className="text-sm text-gray-600 mt-1">
            Автоматически улучшает промпт для лучших результатов
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(!enabled)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

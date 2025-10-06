'use client';

interface SeedInputProps {
  seed: string;
  onSeedChange: (seed: string) => void;
}

export default function SeedInput({
  seed,
  onSeedChange,
}: SeedInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Seed (для воспроизводимости)</label>
      <input
        type="text"
        value={seed}
        onChange={(e) => onSeedChange(e.target.value.replace(/\D/g, ''))}
        placeholder="Оставьте пустым для случайного seed"
        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white/70 backdrop-blur-sm placeholder-gray-500"
      />
      <p className="text-xs text-gray-500 mt-1">Используйте тот же seed для воспроизведения результата</p>
    </div>
  );
}

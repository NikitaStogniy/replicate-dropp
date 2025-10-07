'use client';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  maxLength?: number;
}

export default function PromptInput({ value, onChange, onSubmit, maxLength = 500 }: PromptInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter без Shift - submit
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
    // Shift + Enter - обычный перенос строки (по умолчанию)
  };

  return (
    <div>
      <label className="block text-lg font-semibold text-gray-800 mb-3">Описание изображения</label>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Опишите детально изображение, которое хотите создать. Например: 'Футуристический город на закате с летающими автомобилями, неоновые огни, киберпанк стиль'..."
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-colors resize-none bg-white/70 backdrop-blur-sm"
          rows={5}
          maxLength={maxLength}
        />
        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
          {value.length}/{maxLength}
        </div>
      </div>
    </div>
  );
}

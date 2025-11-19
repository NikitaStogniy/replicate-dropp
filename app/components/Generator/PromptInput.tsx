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
      <label className="block text-base sm:text-lg font-semibold text-gray-200 mb-2 sm:mb-3">Описание изображения</label>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Опишите детально изображение, которое хотите создать. Например: 'Футуристический город на закате с летающими автомобилями, неоновые огни, киберпанк стиль'..."
          className="w-full p-3 sm:p-4 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-100 placeholder-gray-500 transition-colors resize-none bg-gray-800"
          rows={4}
          maxLength={maxLength}
        />
        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-xs text-gray-400">
          {value.length}/{maxLength}
        </div>
      </div>
    </div>
  );
}

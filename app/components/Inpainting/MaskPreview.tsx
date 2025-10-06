'use client';

import Image from 'next/image';

interface MaskPreviewProps {
  maskImage: string | null;
  onOpenEditor: () => void;
  onRemoveMask: () => void;
  onUploadMask: (maskDataUrl: string) => void;
}

export default function MaskPreview({ maskImage, onOpenEditor, onRemoveMask, onUploadMask }: MaskPreviewProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => onUploadMask(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 border border-green-100">
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          Маска для редактирования
        </div>
        <button
          onClick={onOpenEditor}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          <span>Рисовать</span>
        </button>
      </h4>

      {maskImage ? (
        <div className="relative">
          <Image
            src={maskImage}
            alt="Mask"
            className="w-full rounded-xl border border-gray-200 shadow-sm"
            width={400}
            height={400}
          />
          <button
            onClick={onRemoveMask}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm transition-colors flex items-center justify-center shadow-lg"
          >
            ×
          </button>
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
            <p className="text-xs text-green-700 font-medium">✅ Готово</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-48 border-2 border-dashed border-green-300 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <p className="text-green-700 font-semibold text-sm mb-1">Создайте маску</p>
          <p className="text-xs text-green-600 text-center max-w-xs mb-3">Отметьте области для изменения</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="inpaint-mask-upload"
          />
          <label
            htmlFor="inpaint-mask-upload"
            className="cursor-pointer text-green-700 text-sm hover:text-green-800 underline font-medium transition-colors"
          >
            или загрузить файл
          </label>
        </div>
      )}
    </div>
  );
}

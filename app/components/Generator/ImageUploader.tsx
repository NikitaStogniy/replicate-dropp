'use client';

import { PhotoIcon } from '@heroicons/react/24/outline';
import { fileToImageValue, type ImageValue } from '@/app/utils/fileConversion';

interface ImageUploaderProps {
  label: string;
  file: ImageValue | null | undefined;
  required?: boolean;
  onChange: (file: ImageValue | null) => void;
}

export default function ImageUploader({ label, file, required = false, onChange }: ImageUploaderProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imageValue = await fileToImageValue(e.target.files[0]);
      onChange(imageValue);
    }
  };

  return (
    <div>
      <label className="block text-lg font-semibold text-gray-800 mb-3">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="character-upload"
        />
        <label
          htmlFor="character-upload"
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            file
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 bg-white/70 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <PhotoIcon className={`w-8 h-8 mb-2 ${file ? 'text-green-500' : 'text-gray-400'}`} />
          {file ? (
            <span className="text-sm font-medium text-green-700">Загружено: {file.name}</span>
          ) : (
            <div className="text-center">
              <span className="text-sm font-medium text-gray-700">Загрузить изображение</span>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG до 10MB</p>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}

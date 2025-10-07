'use client';

import { useId } from 'react';
import Image from 'next/image';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { fileToImageValue, type ImageValue } from '@/app/utils/fileConversion';

interface ImageUploaderProps {
  label: string;
  file: ImageValue | null | undefined;
  required?: boolean;
  onChange: (file: ImageValue | null) => void;
}

export default function ImageUploader({ label, file, required = false, onChange }: ImageUploaderProps) {
  const inputId = useId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const imageValue = await fileToImageValue(e.target.files[0]);
        onChange(imageValue);
        // Reset input to allow re-uploading the same file
        e.target.value = '';
      } catch (error) {
        console.error('ImageUploader: Error converting file', error);
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div>
      <label className="block text-lg font-semibold text-gray-800 mb-3">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {file ? (
        <div className="relative group">
          <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-green-400">
            <Image
              src={file.dataUrl}
              alt={file.name}
              fill
              className="object-cover"
            />
          </div>
          <button
            onClick={handleRemove}
            type="button"
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <p className="text-sm text-green-700 mt-2 font-medium">Загружено: {file.name}</p>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors border-gray-300 bg-white/70 hover:border-blue-400 hover:bg-blue-50"
          >
            <PhotoIcon className="w-8 h-8 mb-2 text-gray-400" />
            <div className="text-center">
              <span className="text-sm font-medium text-gray-700">Загрузить изображение</span>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG до 10MB</p>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}

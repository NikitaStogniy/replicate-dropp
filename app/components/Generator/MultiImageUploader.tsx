'use client';

import { useId } from 'react';
import Image from 'next/image';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ImageInputItem } from '../../store/slices/generatorSlice';
import { fileToImageValue } from '@/app/utils/fileConversion';

interface MultiImageUploaderProps {
  label: string;
  files: ImageInputItem[];
  onChange: (files: ImageInputItem[]) => void;
}

export default function MultiImageUploader({ label, files, onChange }: MultiImageUploaderProps) {
  const inputId = useId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const imageInputItems: ImageInputItem[] = [];

      for (const file of newFiles) {
        try {
          const imageValue = await fileToImageValue(file);
          imageInputItems.push({
            dataUrl: imageValue.dataUrl,
            name: imageValue.name,
            type: imageValue.type,
          });
        } catch (error) {
          console.error('Failed to process file:', file.name, error);
        }
      }

      onChange([...files, ...imageInputItems]);
      // Reset input to allow re-uploading the same files
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  return (
    <div>
      <label className="block text-lg font-semibold text-gray-800 mb-3">
        {label}
      </label>

      {/* Upload Area */}
      <div className="relative mb-3">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          id={inputId}
        />
        <label
          htmlFor={inputId}
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors border-gray-300 bg-white/70 hover:border-blue-400 hover:bg-blue-50"
        >
          <PhotoIcon className="w-8 h-8 mb-2 text-gray-400" />
          <div className="text-center">
            <span className="text-sm font-medium text-gray-700">
              {files.length > 0 ? 'Добавить еще изображения' : 'Загрузить изображения'}
            </span>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG (можно выбрать несколько)</p>
          </div>
        </label>
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-green-400">
                <Image
                  src={file.dataUrl}
                  alt={`Upload ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

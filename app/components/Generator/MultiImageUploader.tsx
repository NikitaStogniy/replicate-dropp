'use client';

import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ImageInputItem } from '../../store/slices/generatorSlice';

interface MultiImageUploaderProps {
  label: string;
  files: ImageInputItem[];
  onChange: (files: ImageInputItem[]) => void;
}

export default function MultiImageUploader({ label, files, onChange }: MultiImageUploaderProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const imageInputItems: ImageInputItem[] = [];

      for (const file of newFiles) {
        const dataUrl = await fileToDataUrl(file);
        imageInputItems.push({
          dataUrl,
          name: file.name,
          type: file.type,
        });
      }

      onChange([...files, ...imageInputItems]);
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="multi-image-upload"
        />
        <label
          htmlFor="multi-image-upload"
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
                <img
                  src={file.dataUrl}
                  alt={`Upload ${index + 1}`}
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

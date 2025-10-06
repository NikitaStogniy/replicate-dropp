"use client";

import Image from "next/image";

interface ImageResultProps {
  imageUrl: string;
  alt: string;
  onEdit?: (imageUrl: string) => void;
  onDownload?: (imageUrl: string, filename: string) => void;
  filename?: string;
}

export default function ImageResult({
  imageUrl,
  alt,
  onEdit,
  onDownload,
  filename = "generated-image.png",
}: ImageResultProps) {
  return (
    <div className="group relative bg-white rounded-2xl p-2 shadow-lg hover:shadow-xl transition-shadow duration-100">
      <Image
        src={imageUrl}
        alt={alt}
        className="w-full rounded-xl"
        width={800}
        height={800}
        onError={(e) => {
          console.error("Ошибка загрузки изображения:", imageUrl);
          e.currentTarget.style.display = "none";
        }}
      />
      <div className="absolute inset-0 backdrop-blur-lg bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex space-x-2 flex-wrap justify-center">
          {onEdit && (
            <button
              onClick={() => onEdit(imageUrl)}
              className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              <span>Редактировать</span>
            </button>
          )}
          {onDownload && (
            <button
              onClick={() => onDownload(imageUrl, filename)}
              className="bg-white text-gray-900 px-4 py-2 rounded-xl font-medium shadow-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Скачать</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

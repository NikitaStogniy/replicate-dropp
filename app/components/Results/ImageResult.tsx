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
  // Check if it's an SVG file and fix the URL if needed
  const { isSvg, fixedImageUrl } = (() => {
    if (imageUrl.toLowerCase().includes('.svg') || filename.endsWith('.svg')) {
      return { isSvg: true, fixedImageUrl: imageUrl };
    }
    // Check if it's a base64 SVG (Replicate may return SVG with wrong MIME type)
    if (imageUrl.startsWith('data:')) {
      try {
        const base64Data = imageUrl.split(',')[1];
        if (base64Data) {
          const decoded = atob(base64Data.slice(0, 100)); // Check first 100 chars
          if (decoded.includes('<svg') || decoded.includes('<?xml')) {
            // Fix the MIME type to image/svg+xml
            const correctedUrl = `data:image/svg+xml;base64,${base64Data}`;
            return { isSvg: true, fixedImageUrl: correctedUrl };
          }
        }
      } catch {
        // Ignore decoding errors
      }
    }
    return { isSvg: false, fixedImageUrl: imageUrl };
  })();

  return (
    <div className="group relative bg-white rounded-2xl p-2 shadow-lg hover:shadow-xl transition-shadow duration-100">
      {isSvg ? (
        // Use regular img tag for SVG (Next.js Image doesn't handle SVG well)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fixedImageUrl}
          alt={alt}
          className="w-full rounded-xl"
          onError={(e) => {
            console.error("Ошибка загрузки SVG:", fixedImageUrl);
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
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
      )}
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

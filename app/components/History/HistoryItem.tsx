"use client";

import Image from "next/image";
import { TrashIcon } from "@heroicons/react/24/outline";
import type { HistoryItem as HistoryItemType } from "@/app/store/slices/historySlice";
import { base64ToImageUrl } from "@/app/utils/imageStorage";

interface HistoryItemProps {
  item: HistoryItemType;
  onSelect: (item: HistoryItemType) => void;
  onDelete: (id: string) => void;
}

export default function HistoryItem({
  item,
  onSelect,
  onDelete,
}: HistoryItemProps) {
  const timestamp = new Date(item.timestamp);
  const timeAgo = getTimeAgo(timestamp);

  // Get image URL
  const imageUrl = item.imageBase64
    ? base64ToImageUrl(item.imageBase64)
    : item.result.output
    ? Array.isArray(item.result.output)
      ? item.result.output[0]
      : item.result.output
    : null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  return (
    <div
      className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 overflow-hidden"
      onClick={() => onSelect(item)}
    >
      {/* Image Preview */}
      <div className="relative w-full aspect-square bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.modelName}
            fill
            className="object-cover"
            sizes="200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Delete button overlay */}
        <button
          onClick={handleDelete}
          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          aria-label="Delete"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium text-gray-900 truncate">
          {item.modelName}
        </p>
        <p className="text-xs text-gray-500">{timeAgo}</p>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} дн назад`;

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

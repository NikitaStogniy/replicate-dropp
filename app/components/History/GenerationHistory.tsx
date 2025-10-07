"use client";

import { useEffect } from "react";
import {
  ClockIcon,
  XMarkIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/app/store";
import {
  loadHistory,
  clearHistory,
  deleteHistoryItem,
  toggleHistory,
  type HistoryItem as HistoryItemType,
} from "@/app/store/slices/historySlice";
import { setParameters } from "@/app/store/slices/generatorSlice";
import { setSelectedModel } from "@/app/store/slices/modelsSlice";
import { setResult } from "@/app/store/slices/generatorSlice";
import HistoryItem from "./HistoryItem";
import { showSuccess, showError } from "@/app/utils/toast";

export default function GenerationHistory() {
  const dispatch = useAppDispatch();
  const { items, isOpen } = useAppSelector((state) => state.history);

  // Load history on mount
  useEffect(() => {
    dispatch(loadHistory());
  }, [dispatch]);

  const handleSelectItem = (item: HistoryItemType) => {
    try {
      // Switch to the model
      dispatch(setSelectedModel(item.modelId));

      // Restore parameters
      dispatch(setParameters(item.parameters));

      // Restore result
      dispatch(
        setResult({
          modelId: item.modelId,
          result: item.result,
        })
      );

      showSuccess("Параметры и результат восстановлены");

      // Scroll to result
      setTimeout(() => {
        const resultElement = document.querySelector("[data-result-section]");
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (error) {
      console.error("Failed to restore history item:", error);
      showError("Ошибка при восстановлении");
    }
  };

  const handleDeleteItem = (id: string) => {
    dispatch(deleteHistoryItem(id));
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        "Вы уверены что хотите удалить всю историю? Это действие нельзя отменить."
      )
    ) {
      dispatch(clearHistory());
      showSuccess("История очищена");
    }
  };

  const handleToggle = () => {
    dispatch(toggleHistory());
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="fixed top-4 right-4 z-40 bg-white rounded-lg shadow-lg p-3 hover:shadow-xl transition-all border border-gray-200 group"
        aria-label={isOpen ? "Закрыть историю" : "Открыть историю"}
      >
        {isOpen ? (
          <ChevronRightIcon className="w-5 h-5 text-gray-700" />
        ) : (
          <ClockIcon className="w-5 h-5 text-gray-700" />
        )}
        {!isOpen && items.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>

      {/* History Panel */}
      <div
        className={`fixed top-0 right-0 h-screen w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-5 h-5" />
            <h2 className="text-lg font-semibold">История</h2>
            <span className="text-sm bg-white/20 rounded-full px-2 py-0.5">
              {items.length}
            </span>
          </div>
          <button
            onClick={handleToggle}
            className="hover:bg-white/20 rounded-lg p-1 transition-colors"
            aria-label="Закрыть"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-64px-60px)] overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ClockIcon className="w-16 h-16 mb-4" />
              <p className="text-center">
                История генераций пуста
                <br />
                <span className="text-sm">Создайте первое изображение</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => (
                <HistoryItem
                  key={`${item.id}-${item.timestamp}`}
                  item={item}
                  onSelect={handleSelectItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 p-3">
            <button
              onClick={handleClearAll}
              className="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
            >
              Очистить всё
            </button>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={handleToggle}
        />
      )}
    </>
  );
}

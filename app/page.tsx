"use client";

import { useEffect } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import AuthGuard from "./components/AuthGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import { getModelById, getAllModels, getDefaultParametersForModel } from "./lib/models";
import { useAppDispatch, useAppSelector } from "./store";
import { toggleModelSelector } from "./store/slices/uiSlice";
import { loadSelectedModelFromStorage, setSelectedModel } from "./store/slices/modelsSlice";
import { setParameters } from "./store/slices/generatorSlice";
import { useImageDownload } from "./hooks/useImageDownload";
import { useGenerationHandler } from "./hooks/useGenerationHandler";
import { useInpaintingHandler } from "./hooks/useInpaintingHandler";
import { validateGenerationParams } from "./services/validationService";
import { showError } from "./utils/toast";

// Components
import ModelSelector from "./components/ModelSelector/ModelSelector";
import GenerateButton from "./components/Generator/GenerateButton";
import GenerationHistory from "./components/History/GenerationHistory";

// Containers
import DynamicGeneratorForm from "./containers/DynamicGeneratorForm";
import ResultsSection from "./containers/ResultsSection";
import InpaintingSection from "./containers/InpaintingSection";

export default function Home() {
  const dispatch = useAppDispatch();
  const { downloadImage } = useImageDownload();

  // Redux state
  const generatorState = useAppSelector((state) => state.generator);
  const uiState = useAppSelector((state) => state.ui);
  const { selectedModelId } = useAppSelector((state) => state.models);

  const currentModel = getModelById(selectedModelId);
  const availableModels = getAllModels();

  // Get result for current model only
  const currentResult = generatorState.resultsByModel[selectedModelId] || null;

  // Custom hooks
  const { handleGenerate, isGenerating } = useGenerationHandler();
  const { handleStartInpainting } = useInpaintingHandler(currentModel);

  // Load selected model from localStorage on mount
  useEffect(() => {
    dispatch(loadSelectedModelFromStorage());
  }, [dispatch]);

  // Initialize parameters with defaults when model changes
  useEffect(() => {
    if (currentModel) {
      const defaults = getDefaultParametersForModel(currentModel);
      dispatch(setParameters(defaults));
    }
  }, [currentModel, dispatch]);

  const handleModelChange = (modelId: string) => {
    dispatch(setSelectedModel(modelId));
  };

  const onGenerate = async () => {
    const validationError = validateGenerationParams({
      currentModel,
      parameters: generatorState.parameters,
      inpaintingMode: uiState.inpaintingMode,
      maskPrompt: uiState.maskPrompt,
    });

    if (validationError) {
      showError(validationError);
      return;
    }

    await handleGenerate({
      ...generatorState,
      selectedModelId,
      inpaintingMode: uiState.inpaintingMode,
      inpaintImage: uiState.inpaintImage,
      maskImage: uiState.maskImage,
      maskPrompt: uiState.maskPrompt,
    });
  };

  return (
    <ErrorBoundary>
      <AuthGuard>
        {/* Generation History */}
        <GenerationHistory />

        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-4 sm:py-8">
          <div className="max-w-5xl mx-auto px-3 sm:px-4">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-3 sm:mb-4 shadow-lg">
              <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2 px-4">
              AI Image Generator
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              Создавайте потрясающие изображения с помощью передовых AI моделей
            </p>
          </div>

          {/* Main Form */}
          <div
            className={`bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 transition-all duration-300 ${
              uiState.inpaintingMode ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <ModelSelector
              models={availableModels}
              selectedModelId={selectedModelId}
              currentModel={currentModel}
              isOpen={uiState.isModelSelectorOpen}
              onToggle={() => dispatch(toggleModelSelector())}
              onSelect={handleModelChange}
              inpaintingMode={uiState.inpaintingMode}
            />

            <DynamicGeneratorForm currentModel={currentModel} onSubmit={onGenerate} />

            <GenerateButton
              isGenerating={isGenerating}
              inpaintingMode={uiState.inpaintingMode}
              maskPrompt={uiState.maskPrompt}
              currentModel={currentModel}
              parameters={generatorState.parameters}
              onGenerate={onGenerate}
            />
          </div>

          {/* Results */}
          {currentResult && (
            <ResultsSection
              result={currentResult}
              currentModel={currentModel}
              onEdit={handleStartInpainting}
              onDownload={downloadImage}
              onRetry={onGenerate}
            />
          )}
        </div>

        {/* Inpainting Panel & Mask Editor */}
        <InpaintingSection
          {...uiState}
          currentModel={currentModel}
          isGenerating={isGenerating}
          onGenerate={onGenerate}
          />
        </div>
      </AuthGuard>
    </ErrorBoundary>
  );
}

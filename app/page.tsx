"use client";

import { useEffect } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import AuthGuard from "./components/AuthGuard";
import { getModelById, getAllModels } from "./lib/models";
import { useAppDispatch, useAppSelector } from "./store";
import { toggleModelSelector } from "./store/slices/uiSlice";
import { loadSelectedModelFromStorage, setSelectedModel } from "./store/slices/modelsSlice";
import { useImageDownload } from "./hooks/useImageDownload";
import { useGenerationHandler } from "./hooks/useGenerationHandler";
import { useInpaintingHandler } from "./hooks/useInpaintingHandler";
import { validateGenerationParams } from "./services/validationService";

// Components
import ModelSelector from "./components/ModelSelector/ModelSelector";
import GenerateButton from "./components/Generator/GenerateButton";

// Containers
import GeneratorForm from "./containers/GeneratorForm";
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

  const handleModelChange = (modelId: string) => {
    dispatch(setSelectedModel(modelId));
  };

  const onGenerate = async () => {
    // Collect all parameters for validation
    const parameters = {
      prompt: generatorState.prompt,
      characterImage: generatorState.characterImage,
      imageInputs: generatorState.imageInputs,
      styleType: generatorState.styleType,
      aspectRatio: generatorState.aspectRatio,
      seed: generatorState.seed,
      duration: generatorState.duration,
      resolution: generatorState.resolution,
      promptOptimizer: generatorState.promptOptimizer,
      firstFrameImage: generatorState.firstFrameImage,
      lastFrameImage: generatorState.lastFrameImage,
    };

    const validationError = validateGenerationParams({
      currentModel,
      parameters,
      inpaintingMode: uiState.inpaintingMode,
      maskPrompt: uiState.maskPrompt,
    });

    if (validationError) {
      alert(validationError);
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
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              AI Image Generator
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Создавайте потрясающие изображения с помощью передовых AI моделей
            </p>
          </div>

          {/* Main Form */}
          <div
            className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8 transition-all duration-300 ${
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

            <GeneratorForm
              currentModel={currentModel}
              {...generatorState}
            />

            <GenerateButton
              isGenerating={isGenerating}
              prompt={generatorState.prompt}
              inpaintingMode={uiState.inpaintingMode}
              maskPrompt={uiState.maskPrompt}
              currentModel={currentModel}
              characterImage={generatorState.characterImage}
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
  );
}

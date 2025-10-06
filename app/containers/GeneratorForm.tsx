'use client';

import { useAppDispatch } from '../store';
import {
  setPrompt,
  setCharacterImage,
  setImageInputs,
  setStyleType,
  setAspectRatio,
  setSeed,
  setDuration,
  setResolution,
  setPromptOptimizer,
  setFirstFrameImage,
  setLastFrameImage,
} from '../store/slices/generatorSlice';
import {
  getSupportedStyles,
  getSupportedAspectRatios,
  supportsCharacterImage,
  requiresCharacterImage,
  supportsImageInput,
  supportsFirstFrame,
  supportsLastFrame,
  supportsDuration,
  supportsResolution,
  supportsPromptOptimizer,
  getParameterSchema,
  getDefaultResolutions,
} from '../lib/models';
import type { ModelConfig } from '../lib/models/types';
import type { ImageInputItem } from '../store/slices/generatorSlice';

// Components
import PromptInput from '../components/Generator/PromptInput';
import ImageUploader from '../components/Generator/ImageUploader';
import MultiImageUploader from '../components/Generator/MultiImageUploader';
import StyleSelector from '../components/Generator/StyleSelector';
import AspectRatioSelector from '../components/Generator/AspectRatioSelector';
import SeedInput from '../components/Generator/SeedInput';
import DurationSelector from '../components/Generator/DurationSelector';
import ResolutionSelector from '../components/Generator/ResolutionSelector';
import PromptOptimizerToggle from '../components/Generator/PromptOptimizerToggle';

interface GeneratorFormProps {
  currentModel: ModelConfig | null | undefined;
  prompt: string;
  characterImage: File | null;
  imageInputs: ImageInputItem[];
  styleType: string;
  aspectRatio: string;
  seed: string;
  duration: number;
  resolution: string;
  promptOptimizer: boolean;
  firstFrameImage: File | null;
  lastFrameImage: File | null;
}

export default function GeneratorForm({
  currentModel,
  prompt,
  characterImage,
  imageInputs,
  styleType,
  aspectRatio,
  seed,
  duration,
  resolution,
  promptOptimizer,
  firstFrameImage,
  lastFrameImage,
}: GeneratorFormProps) {
  const dispatch = useAppDispatch();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <PromptInput
          value={prompt}
          onChange={(value) => dispatch(setPrompt(value))}
        />

        {currentModel && supportsCharacterImage(currentModel) && (
          <ImageUploader
            label={
              currentModel?.category === 'image-to-video'
                ? 'Первый кадр видео'
                : 'Референсное изображение персонажа'
            }
            file={characterImage}
            required={requiresCharacterImage(currentModel)}
            onChange={(file) => dispatch(setCharacterImage(file))}
          />
        )}

        {currentModel && supportsFirstFrame(currentModel) && (
          <ImageUploader
            label="Первый кадр видео (опционально)"
            file={firstFrameImage}
            required={false}
            onChange={(file) => dispatch(setFirstFrameImage(file))}
          />
        )}

        {currentModel && supportsLastFrame(currentModel) && (
          <ImageUploader
            label="Последний кадр видео (опционально)"
            file={lastFrameImage}
            required={false}
            onChange={(file) => dispatch(setLastFrameImage(file))}
          />
        )}

        {currentModel && supportsImageInput(currentModel) && (
          <MultiImageUploader
            label="Входные изображения"
            files={imageInputs}
            onChange={(files) => dispatch(setImageInputs(files))}
          />
        )}
      </div>

      <div className="space-y-6">
        {currentModel && getSupportedStyles(currentModel) && (
          <StyleSelector
            styles={getSupportedStyles(currentModel)!}
            selected={styleType}
            onChange={(style) => dispatch(setStyleType(style))}
          />
        )}

        {currentModel && supportsDuration(currentModel) && (
          <DurationSelector
            durations={
              (getParameterSchema(currentModel, 'duration')?.enum as number[]) || [
                6, 10,
              ]
            }
            selected={duration}
            onChange={(dur) => dispatch(setDuration(dur))}
          />
        )}

        {currentModel && supportsResolution(currentModel) && (
          <ResolutionSelector
            resolutions={getDefaultResolutions(currentModel)}
            selected={resolution}
            onChange={(res) => dispatch(setResolution(res))}
          />
        )}

        {currentModel && getSupportedAspectRatios(currentModel).length > 0 && (
          <AspectRatioSelector
            ratios={getSupportedAspectRatios(currentModel)}
            selected={aspectRatio}
            onChange={(ratio) => dispatch(setAspectRatio(ratio))}
          />
        )}

        {currentModel && supportsPromptOptimizer(currentModel) && (
          <PromptOptimizerToggle
            enabled={promptOptimizer}
            onChange={(enabled) => dispatch(setPromptOptimizer(enabled))}
          />
        )}

        <SeedInput
          seed={seed}
          onSeedChange={(value) => dispatch(setSeed(value))}
        />
      </div>
    </div>
  );
}

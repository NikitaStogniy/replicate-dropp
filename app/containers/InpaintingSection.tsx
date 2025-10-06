'use client';

import { useAppDispatch } from '../store';
import {
  exitInpainting,
  setShowMaskEditor,
  setMaskImage,
  setBrushSize,
  setIsDrawing,
  setMaskPrompt,
} from '../store/slices/uiSlice';
import type { ModelConfig } from '../lib/models/types';
import InpaintingPanel from '../components/Inpainting/InpaintingPanel';
import MaskEditor from '../components/Inpainting/MaskEditor';

interface InpaintingSectionProps {
  inpaintingMode: boolean;
  inpaintImage: string | null;
  maskImage: string | null;
  maskPrompt: string;
  showMaskEditor: boolean;
  brushSize: number;
  isDrawing: boolean;
  currentModel: ModelConfig | null | undefined;
  isGenerating: boolean;
  onGenerate: () => void;
}

export default function InpaintingSection({
  inpaintingMode,
  inpaintImage,
  maskImage,
  maskPrompt,
  showMaskEditor,
  brushSize,
  isDrawing,
  currentModel,
  isGenerating,
  onGenerate,
}: InpaintingSectionProps) {
  const dispatch = useAppDispatch();

  if (!inpaintingMode || !inpaintImage) {
    return null;
  }

  return (
    <>
      <InpaintingPanel
        inpaintImage={inpaintImage}
        maskImage={maskImage}
        maskPrompt={maskPrompt}
        currentModel={currentModel || undefined}
        isGenerating={isGenerating}
        onExit={() => dispatch(exitInpainting())}
        onOpenMaskEditor={() => dispatch(setShowMaskEditor(true))}
        onRemoveMask={() => dispatch(setMaskImage(null))}
        onUploadMask={(maskDataUrl) => dispatch(setMaskImage(maskDataUrl))}
        onMaskPromptChange={(prompt) => dispatch(setMaskPrompt(prompt))}
        onGenerate={onGenerate}
      />

      {showMaskEditor && (
        <MaskEditor
          inpaintImage={inpaintImage}
          brushSize={brushSize}
          isDrawing={isDrawing}
          onBrushSizeChange={(size) => dispatch(setBrushSize(size))}
          onDrawingChange={(drawing) => dispatch(setIsDrawing(drawing))}
          onClose={() => dispatch(setShowMaskEditor(false))}
          onSaveMask={(maskDataUrl) => {
            dispatch(setMaskImage(maskDataUrl));
            dispatch(setShowMaskEditor(false));
          }}
        />
      )}
    </>
  );
}

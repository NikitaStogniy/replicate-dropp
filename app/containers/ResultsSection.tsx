"use client";

import type { GenerationResult } from "../store/services/replicateApi";
import type { ModelConfig } from "../lib/models/types";
import ResultHeader from "../components/Results/ResultHeader";
import VideoResult from "../components/Results/VideoResult";
import ResultsGrid from "../components/Results/ResultsGrid";
import ResultStatus from "../components/Results/ResultStatus";

interface ResultsSectionProps {
  result: GenerationResult;
  currentModel: ModelConfig | null | undefined;
  onEdit: (imageUrl: string) => void;
  onDownload: (url: string, filename: string) => Promise<void>;
}

export default function ResultsSection({
  result,
  currentModel,
  onEdit,
  onDownload,
}: ResultsSectionProps) {
  return (
    <div
      className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8"
      data-result-section
    >
      <ResultHeader
        title={
          currentModel?.category === "image-to-video"
            ? "Результат генерации видео"
            : "Результат генерации"
        }
        seed={result.seed}
      />

      {result.status === "succeeded" && result.output && (
        <div className="max-w-4xl mx-auto">
          {currentModel?.category === "image-to-video" ? (
            <VideoResult
              videoUrl={
                Array.isArray(result.output) ? result.output[0] : result.output
              }
              onDownload={onDownload}
            />
          ) : (
            <ResultsGrid
              output={result.output}
              onEdit={onEdit}
              onDownload={onDownload}
            />
          )}
        </div>
      )}

      {(result.status === "processing" ||
        result.status === "failed" ||
        result.status === "starting") && (
        <ResultStatus
          status={result.status as "processing" | "failed" | "starting"}
          error={result.error}
        />
      )}
    </div>
  );
}

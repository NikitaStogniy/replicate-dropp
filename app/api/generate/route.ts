import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { getModelById, isVideoModel } from "../../lib/models";
import { buildApiInput, processReplicateOutput, handleSeed } from "./utils";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const modelId = formData.get("model_id") as string;

    if (!modelId) {
      return NextResponse.json({ error: "Модель не выбрана" }, { status: 400 });
    }

    const selectedModel = getModelById(modelId);
    if (!selectedModel) {
      return NextResponse.json(
        { error: "Неизвестная модель" },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: "REPLICATE_API_TOKEN не настроен" },
        { status: 500 }
      );
    }

    // Build API input from FormData using model schema
    const input = await buildApiInput(formData, selectedModel);

    // Initialize Replicate SDK
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // Form model name for Replicate
    const modelName = `${selectedModel.owner}/${selectedModel.model}`;

    console.log("Sending to Replicate:", {
      modelName,
      modelCategory: selectedModel.category,
      input: Object.keys(input).reduce((acc, key) => {
        const value = input[key];
        acc[key] = key.includes("image")
          ? "[IMAGE_DATA]"
          : Array.isArray(value)
          ? `[${value.length} items]`
          : String(value);
        return acc;
      }, {} as Record<string, string | number>),
    });

    // Run generation through SDK
    const output = await replicate.run(modelName as `${string}/${string}`, {
      input,
    });

    const isVideo = isVideoModel(selectedModel);

    console.log("=== REPLICATE OUTPUT ===");
    console.log("Model:", selectedModel.name);
    console.log("Category:", selectedModel.category);
    console.log("Output type:", typeof output);
    console.log("Output:", output);
    console.log("=== END ===");

    // Process output to consistent format
    const finalOutput = await processReplicateOutput(output, isVideo);

    console.log("=== FINAL OUTPUT ===");
    console.log("Final output type:", typeof finalOutput);
    console.log("Final output:", finalOutput);
    console.log("=== END ===");

    // Handle seed
    const seedParam = formData.get("seed") as string;
    const seed = handleSeed(seedParam);

    const responseData = {
      id: "sdk-generated",
      status: "succeeded",
      output: finalOutput,
      seed,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Ошибка при генерации изображения:", error);

    let errorMessage = "Произошла неизвестная ошибка";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: `Ошибка при генерации: ${errorMessage}`,
        status: "failed",
      },
      { status: 500 }
    );
  }
}

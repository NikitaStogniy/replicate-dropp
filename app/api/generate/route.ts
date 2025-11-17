import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { getModelById, isVideoModel } from "../../lib/models";
import { buildApiInput, processReplicateOutput, handleSeed } from "./utils";
import { auth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    if (!session.user.isActive) {
      return NextResponse.json(
        { error: "Your account has been disabled" },
        { status: 403 }
      );
    }

    if (!session.user.teamId) {
      return NextResponse.json(
        { error: "No team assigned to your account" },
        { status: 400 }
      );
    }

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

    // Get team's Replicate API key
    const teamApiKey = await queryOne<{ replicate_api_key: string | null }>(
      'SELECT replicate_api_key FROM teams WHERE id = $1',
      [session.user.teamId]
    );

    if (!teamApiKey?.replicate_api_key) {
      return NextResponse.json(
        { error: "Replicate API key not configured for your team. Please contact your administrator to set up the API key in team settings." },
        { status: 403 }
      );
    }

    // Check usage limits
    // Get user's current generation count
    const userGenerationCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM generations WHERE user_id = $1',
      [session.user.id]
    );

    // Check personal limit
    const userLimit = await queryOne<{ usage_limit: number | null }>(
      'SELECT usage_limit FROM users WHERE id = $1',
      [session.user.id]
    );

    if (userLimit?.usage_limit && userGenerationCount) {
      if (userGenerationCount.count >= userLimit.usage_limit) {
        return NextResponse.json(
          { error: `Personal usage limit reached (${userLimit.usage_limit} generations)` },
          { status: 429 }
        );
      }
    }

    // Check team limit
    const teamGenerationCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM generations WHERE team_id = $1',
      [session.user.teamId]
    );

    const teamLimit = await queryOne<{ usage_limit: number | null }>(
      'SELECT usage_limit FROM teams WHERE id = $1',
      [session.user.teamId]
    );

    if (teamLimit?.usage_limit && teamGenerationCount) {
      if (teamGenerationCount.count >= teamLimit.usage_limit) {
        return NextResponse.json(
          { error: `Team usage limit reached (${teamLimit.usage_limit} generations)` },
          { status: 429 }
        );
      }
    }

    // Build API input from FormData using model schema
    const input = await buildApiInput(formData, selectedModel);

    // Initialize Replicate SDK with team's API key
    const replicate = new Replicate({
      auth: teamApiKey.replicate_api_key,
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

    // Log generation to database
    const prompt = formData.get("prompt") as string || "";

    // Collect all parameters for logging
    const parameters: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (key !== "model_id" && !key.includes("image")) {
        parameters[key] = value;
      }
    });

    try {
      await query(
        `INSERT INTO generations (user_id, team_id, model_id, prompt, parameters, result_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          session.user.id,
          session.user.teamId,
          modelId,
          prompt,
          JSON.stringify(parameters),
          Array.isArray(finalOutput) ? finalOutput[0] : finalOutput,
          "succeeded",
        ]
      );
    } catch (dbError) {
      console.error("Failed to log generation to database:", dbError);
      // Don't fail the request if logging fails
    }

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

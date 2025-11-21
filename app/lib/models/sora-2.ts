import { ModelConfig } from "./types";

export const sora2: ModelConfig = {
  id: "sora-2",
  name: "Sora 2",
  owner: "openai",
  model: "sora-2",
  description:
    "OpenAI's advanced text-to-video and image-to-video generation model with exceptional quality and realism",
  category: "image-to-video",
  estimatedTime: "60-120 сек",
  quality: "high",
  schema: {
    required: ["prompt"],
    properties: {
      prompt: {
        type: "string",
        title: "Prompt",
        description: "Text description of the video you want to generate",
        "x-order": 0,
        "x-component": "textarea",
        "x-grid-column": 1,
        "x-ui-field": "prompt",
        "x-api-field": "prompt",
      },
      input_reference: {
        type: "string",
        format: "uri",
        title: "Input Reference Image",
        description:
          "Optional reference image to guide video generation. The video will be based on this image.",
        "x-order": 1,
        "x-component": "image-upload",
        "x-grid-column": 1,
        "x-ui-field": "inputReference",
        "x-api-field": "input_reference",
      },
      aspect_ratio: {
        type: "string",
        title: "Aspect Ratio",
        description: "Choose the aspect ratio for your video",
        enum: ["landscape", "portrait", "square"],
        default: "landscape",
        "x-order": 2,
        "x-component": "button-group",
        "x-grid-column": 2,
        "x-ui-field": "aspectRatio",
        "x-api-field": "aspect_ratio",
      },
      seed: {
        type: "integer",
        title: "Seed",
        description: "Random seed for reproducible generation",
        "x-order": 3,
        "x-component": "number-input",
        "x-grid-column": 2,
        "x-ui-field": "seed",
        "x-api-field": "seed",
      },
    },
  },
  output: {
    type: "string",
    format: "uri",
    title: "Output",
  },
};

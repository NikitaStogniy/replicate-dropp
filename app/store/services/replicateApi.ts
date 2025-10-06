import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ImageInputItem } from '../slices/generatorSlice';

export interface GenerationResult {
  id: string;
  status: string;
  output?: string | string[];
  error?: string;
  seed?: number;
}

export interface GenerateImageRequest {
  prompt: string;
  model_id: string;
  character_reference_image?: File | null;
  image_inputs?: ImageInputItem[];
  style_type?: string;
  aspect_ratio?: string;
  rendering_speed?: string;
  magic_prompt_option?: string;
  seed?: string;
  inpaint_image?: File | null;
  inpaint_mask?: File | null;
  // Video-specific parameters
  duration?: number;
  resolution?: string;
  prompt_optimizer?: boolean;
  first_frame_image?: File | null;
  last_frame_image?: File | null;
}

export const replicateApi = createApi({
  reducerPath: 'replicateApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    generateImage: builder.mutation<GenerationResult, GenerateImageRequest>({
      query: (params) => {
        const formData = new FormData();

        formData.append('prompt', params.prompt);
        formData.append('model_id', params.model_id);

        if (params.character_reference_image) {
          formData.append('character_reference_image', params.character_reference_image);
        }

        if (params.style_type) {
          formData.append('style_type', params.style_type);
        }

        if (params.aspect_ratio) {
          formData.append('aspect_ratio', params.aspect_ratio);
        }

        if (params.rendering_speed) {
          formData.append('rendering_speed', params.rendering_speed);
        }

        if (params.magic_prompt_option) {
          formData.append('magic_prompt_option', params.magic_prompt_option);
        }

        if (params.seed && params.seed.trim()) {
          formData.append('seed', params.seed.trim());
        }

        if (params.inpaint_image) {
          formData.append('inpaint_image', params.inpaint_image);
        }

        if (params.inpaint_mask) {
          formData.append('inpaint_mask', params.inpaint_mask);
        }

        if (params.image_inputs && params.image_inputs.length > 0) {
          params.image_inputs.forEach((item, index) => {
            formData.append(`image_input_${index}_dataUrl`, item.dataUrl);
            formData.append(`image_input_${index}_name`, item.name);
            formData.append(`image_input_${index}_type`, item.type);
          });
          formData.append('image_inputs_count', params.image_inputs.length.toString());
        }

        // Video-specific parameters
        if (params.duration !== undefined) {
          formData.append('duration', params.duration.toString());
        }

        if (params.resolution) {
          formData.append('resolution', params.resolution);
        }

        if (params.prompt_optimizer !== undefined) {
          formData.append('prompt_optimizer', params.prompt_optimizer.toString());
        }

        if (params.first_frame_image) {
          formData.append('first_frame_image', params.first_frame_image);
        }

        if (params.last_frame_image) {
          formData.append('last_frame_image', params.last_frame_image);
        }

        return {
          url: '/generate',
          method: 'POST',
          body: formData,
        };
      },
    }),
  }),
});

export const { useGenerateImageMutation } = replicateApi;

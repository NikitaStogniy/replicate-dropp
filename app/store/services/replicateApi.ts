import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getModelById } from '@/app/lib/models';
import { schemaToFormData } from '@/app/utils/formDataUtils';

export interface GenerationResult {
  id: string;
  status: string;
  output?: string | string[];
  error?: string;
  seed?: number;
  parameters?: Record<string, unknown>;
}

export interface GenerateImageRequest {
  model_id: string;
  parameters: Record<string, unknown>;
}

export const replicateApi = createApi({
  reducerPath: 'replicateApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Generation', 'User'], // Define cache tags
  endpoints: (builder) => ({
    generateImage: builder.mutation<GenerationResult, GenerateImageRequest>({
      query: ({ model_id, parameters }) => {
        // Get model config to build FormData from schema
        const model = getModelById(model_id);

        if (!model) {
          throw new Error(`Model ${model_id} not found`);
        }

        // Use schema to convert parameters to FormData
        const formData = schemaToFormData(model, parameters);

        // Always append model_id
        formData.append('model_id', model_id);

        return {
          url: '/generate',
          method: 'POST',
          body: formData,
        };
      },
      // Invalidate relevant caches after generation
      invalidatesTags: ['Generation'],
    }),
  }),
});

export const { useGenerateImageMutation } = replicateApi;

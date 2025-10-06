import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import {
  getModelById,
  requiresCharacterImage,
  supportsCharacterImage,
  supportsImageToImage,
  supportsInpainting,
  supportsImageInput,
  getSupportedStyles
} from '../../lib/models';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const prompt = formData.get('prompt') as string;
    const modelId = formData.get('model_id') as string;
    const characterImage = formData.get('character_reference_image') as File;
    const styleType = formData.get('style_type') as string;
    const aspectRatio = formData.get('aspect_ratio') as string;
    const seed = formData.get('seed') as string;
    const referenceImage = formData.get('reference_image') as File;
    const promptStrength = formData.get('prompt_strength') as string;
    const inpaintImage = formData.get('inpaint_image') as File;
    const inpaintMask = formData.get('inpaint_mask') as File;

    // Video-specific parameters
    const duration = formData.get('duration') as string;
    const resolution = formData.get('resolution') as string;
    const promptOptimizer = formData.get('prompt_optimizer') as string;
    const firstFrameImage = formData.get('first_frame_image') as File;
    const lastFrameImage = formData.get('last_frame_image') as File;

    // Handle multiple image inputs
    const imageInputsCount = formData.get('image_inputs_count');
    const imageInputs: string[] = [];
    if (imageInputsCount) {
      const count = parseInt(imageInputsCount as string, 10);
      for (let i = 0; i < count; i++) {
        const dataUrl = formData.get(`image_input_${i}_dataUrl`) as string;
        if (dataUrl) {
          imageInputs.push(dataUrl);
        }
      }
    }

    if (!modelId) {
      return NextResponse.json(
        { error: 'Модель не выбрана' },
        { status: 400 }
      );
    }

    const selectedModel = getModelById(modelId);
    if (!selectedModel) {
      return NextResponse.json(
        { error: 'Неизвестная модель' },
        { status: 400 }
      );
    }

    // Note: Schema-driven validation happens on the frontend via validateGenerationParams
    // Backend keeps minimal validation to avoid duplication

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN не настроен' },
        { status: 500 }
      );
    }

    // Инициализируем Replicate SDK
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // Подготавливаем входные параметры для модели
    const input: Record<string, string | number | string[]> = {
      prompt,
    };

    // Добавляем параметры в зависимости от модели
    if (getSupportedStyles(selectedModel) && styleType) {
      input.style_type = styleType;
    }

    // Only send aspect_ratio if the model schema explicitly defines it
    if (aspectRatio && selectedModel.schema.properties.aspect_ratio) {
      input.aspect_ratio = aspectRatio;
    }

    // Добавляем seed если указан
    if (seed && seed.trim() && !isNaN(Number(seed))) {
      input.seed = parseInt(seed, 10);
    }

    // Обрабатываем загрузку изображения для персонажей
    if (characterImage && supportsCharacterImage(selectedModel)) {
      const imageBuffer = Buffer.from(await characterImage.arrayBuffer());
      const imageBase64 = `data:${characterImage.type};base64,${imageBuffer.toString('base64')}`;

      // Different models expect different parameter names for the reference image
      if (selectedModel.id === 'hailuo-02') {
        // Hailuo-02 expects first_frame_image
        input.first_frame_image = imageBase64;
      } else if (selectedModel.category === 'image-to-video') {
        // Other image-to-video models use start_image
        input.start_image = imageBase64;
      } else {
        // Text-to-image models use character_reference_image
        input.character_reference_image = imageBase64;
      }
    }

    // Обрабатываем референсное изображение для image-to-image
    if (referenceImage && supportsImageToImage(selectedModel)) {
      const imageBuffer = Buffer.from(await referenceImage.arrayBuffer());
      const imageBase64 = `data:${referenceImage.type};base64,${imageBuffer.toString('base64')}`;

      // Добавляем изображение и prompt_strength
      input.image = imageBase64;

      if (promptStrength && !isNaN(parseFloat(promptStrength))) {
        input.prompt_strength = parseFloat(promptStrength);
      }

      console.log('Используем image-to-image режим с prompt_strength:', input.prompt_strength);
    }
    
    // Обработка inpainting для Ideogram v2
    if (inpaintImage && inpaintMask && supportsInpainting(selectedModel)) {
      const imageBuffer = Buffer.from(await inpaintImage.arrayBuffer());
      const imageBase64 = `data:${inpaintImage.type};base64,${imageBuffer.toString('base64')}`;

      const maskBuffer = Buffer.from(await inpaintMask.arrayBuffer());
      const maskBase64 = `data:${inpaintMask.type};base64,${maskBuffer.toString('base64')}`;

      input.image = imageBase64;
      input.mask = maskBase64;

      console.log('Используем inpainting режим для', selectedModel.name);
    }

    // Handle image_input array (for models like nano-banana)
    if (imageInputs.length > 0 && supportsImageInput(selectedModel)) {
      input.image_input = imageInputs;
      console.log('Using image_input array with', imageInputs.length, 'images for', selectedModel.name);
    }

    // Handle video-specific parameters
    if (duration && !isNaN(Number(duration))) {
      input.duration = parseInt(duration, 10);
    }

    // Only send resolution if the model schema explicitly defines it
    if (resolution && selectedModel.schema.properties.resolution) {
      input.resolution = resolution;
    }

    if (promptOptimizer !== null && promptOptimizer !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (input as any).prompt_optimizer = promptOptimizer === 'true';
    }

    // Handle first frame image for video
    if (firstFrameImage) {
      const imageBuffer = Buffer.from(await firstFrameImage.arrayBuffer());
      const imageBase64 = `data:${firstFrameImage.type};base64,${imageBuffer.toString('base64')}`;
      input.first_frame_image = imageBase64;
    }

    // Handle last frame image for video
    if (lastFrameImage) {
      const imageBuffer = Buffer.from(await lastFrameImage.arrayBuffer());
      const imageBase64 = `data:${lastFrameImage.type};base64,${imageBuffer.toString('base64')}`;
      input.last_frame_image = imageBase64;
    }

    // Формируем имя модели для Replicate
    const modelName = `${selectedModel.owner}/${selectedModel.model}`;

    console.log('Sending to Replicate:', {
      modelName,
      modelCategory: selectedModel.category,
      input: Object.keys(input).reduce((acc, key) => {
        const value = input[key];
        acc[key] = key.includes('image') ? '[IMAGE_DATA]' : (Array.isArray(value) ? value.length : value);
        return acc;
      }, {} as Record<string, string | number>)
    });

    console.log('Seed value:', seed);
    console.log('Parsed seed:', seed && seed.trim() && !isNaN(Number(seed)) ? parseInt(seed, 10) : 'none');
    console.log('Final input object:', JSON.stringify(input, null, 2));

    // Запускаем генерацию через SDK
    const output = await replicate.run(modelName as `${string}/${string}`, { input });

    const isVideoModel = selectedModel.category === 'text-to-video' || selectedModel.category === 'image-to-video';

    console.log('=== REPLICATE OUTPUT DEBUG ===');
    console.log('Model category:', selectedModel.category);
    console.log('Is video model:', isVideoModel);
    console.log('Output type:', typeof output);
    console.log('Output is array:', Array.isArray(output));
    console.log('Output is ReadableStream:', output && typeof output === 'object' && 'getReader' in output);
    console.log('Output first 200 chars:', typeof output === 'string' ? (output as string).substring(0, 200) : 'not string');
    console.log('Raw output:', output);
    console.log('=== END DEBUG ===');

    let finalOutput: string | string[] = output as string | string[];

    // Для видео моделей - если получили URL строку, сразу возвращаем её
    if (isVideoModel && typeof finalOutput === 'string' && finalOutput.startsWith('http')) {
      console.log('Video model returned direct URL:', finalOutput);
    }
    // Обработка массива от FLUX и других моделей
    else if (Array.isArray(output) && output.length > 0) {
      console.log('Processing array output, length:', output.length);
      
      // Обрабатываем каждый элемент массива
      const processedItems = [];
      for (const item of output) {
        // Если элемент - это ReadableStream
        if (item && typeof item === 'object' && 'getReader' in item) {
          console.log('Processing ReadableStream in array...');
          try {
            const reader = (item as ReadableStream).getReader();
            const chunks: Uint8Array[] = [];
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
            }
            
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const buffer = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
              buffer.set(chunk, offset);
              offset += chunk.length;
            }
            
            const base64 = Buffer.from(buffer).toString('base64');
            processedItems.push(`data:image/png;base64,${base64}`);
            
          } catch (error) {
            console.error('Error reading stream in array:', error);
            processedItems.push(item);
          }
        }
        // Если элемент уже URL строка
        else if (typeof item === 'string' && (item.startsWith('http') || item.startsWith('data:'))) {
          processedItems.push(item);
        }
        // Другие типы оставляем как есть
        else {
          processedItems.push(item);
        }
      }
      
      finalOutput = processedItems.length === 1 ? processedItems[0] : processedItems;
      console.log('Processed array items:', processedItems.length);
    }
    
    // Если это ReadableStream
    if (output && typeof output === 'object' && 'getReader' in output) {
      console.log('Processing ReadableStream...');

      // Для видео моделей - не конвертируем в base64, ждём URL
      if (isVideoModel) {
        console.log('Video model detected - skipping stream conversion, expecting URL');
        finalOutput = output as string | string[];
      } else {
        // Для изображений - конвертируем stream в base64
        const reader = (output as ReadableStream).getReader();
        const chunks: Uint8Array[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }

          const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const buffer = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            buffer.set(chunk, offset);
            offset += chunk.length;
          }

          const base64 = Buffer.from(buffer).toString('base64');
          finalOutput = `data:image/png;base64,${base64}`;

        } catch (error) {
          console.error('Error reading image stream:', error);
          finalOutput = output as string | string[];
        }
      }
    }
    // Если это уже готовый URL (включая видео)
    if (typeof output === 'string' && ((output as string).startsWith('http') || (output as string).startsWith('data:'))) {
      console.log('Output is already a URL');
      finalOutput = output;
    }
    // Если это строка с бинарными данными PNG (только для изображений)
    else if (typeof output === 'string' && (output as string).startsWith('�PNG')) {
      console.log('Converting binary PNG string to base64...');
      try {
        // Конвертируем строку в buffer и затем в base64
        const buffer = Buffer.from(output, 'binary');
        const base64 = buffer.toString('base64');
        finalOutput = `data:image/png;base64,${base64}`;
      } catch (error) {
        console.error('Error converting PNG data:', error);
        finalOutput = output as string | string[];
      }
    }

    console.log('Final output type:', typeof finalOutput);
    console.log('Final output first 100 chars:', typeof finalOutput === 'string' ? (finalOutput as string).substring(0, 100) : 'not string');
    console.log('Final processed output:', finalOutput);
    console.log('Selected model category:', selectedModel.category);

    // Генерируем или получаем seed для ответа
    const responseData: {
      id: string;
      status: string;
      output: string | string[];
      seed?: number;
    } = {
      id: 'sdk-generated',
      status: 'succeeded',
      output: finalOutput,
    };

    // Добавляем seed в ответ
    if (seed && seed.trim() && !isNaN(Number(seed))) {
      responseData.seed = parseInt(seed, 10);
    } else {
      // Если seed не был указан, генерируем случайный для отображения
      responseData.seed = Math.floor(Math.random() * 1000000000);
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Ошибка при генерации изображения:', error);
    
    let errorMessage = 'Произошла неизвестная ошибка';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        error: `Ошибка при генерации: ${errorMessage}`,
        status: 'failed'
      },
      { status: 500 }
    );
  }
}
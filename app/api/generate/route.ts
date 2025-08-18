import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { getModelById } from '../../lib/models';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const prompt = formData.get('prompt') as string;
    const modelId = formData.get('model_id') as string;
    const characterImage = formData.get('character_reference_image') as File;
    const styleType = formData.get('style_type') as string;
    const aspectRatio = formData.get('aspect_ratio') as string;
    const renderingSpeed = formData.get('rendering_speed') as string;
    const magicPrompt = formData.get('magic_prompt_option') as string;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Промпт обязателен' },
        { status: 400 }
      );
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

    if (selectedModel.requiresCharacterImage && !characterImage) {
      return NextResponse.json(
        { error: 'Для этой модели необходимо референсное изображение' },
        { status: 400 }
      );
    }

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
    const input: Record<string, string> = {
      prompt,
    };

    // Добавляем параметры в зависимости от модели
    if (selectedModel.supportedStyles && styleType) {
      input.style_type = styleType;
    }
    
    if (aspectRatio) {
      input.aspect_ratio = aspectRatio;
    }

    // Добавляем rendering_speed только для моделей, которые его поддерживают
    if (renderingSpeed !== 'Default' && (selectedModel.id === 'ideogram-character' || selectedModel.owner !== 'ideogram-ai')) {
      input.rendering_speed = renderingSpeed;
    }

    // Добавляем magic_prompt_option для моделей Ideogram (только если не Auto)
    if (selectedModel.owner === 'ideogram-ai' && magicPrompt && magicPrompt !== 'Auto') {
      input.magic_prompt_option = magicPrompt;
    }

    // Обрабатываем загрузку изображения для персонажей
    if (characterImage && selectedModel.supportsCharacterImage) {
      const imageBuffer = Buffer.from(await characterImage.arrayBuffer());
      const imageBase64 = `data:${characterImage.type};base64,${imageBuffer.toString('base64')}`;
      input.character_reference_image = imageBase64;
    }

    // Формируем имя модели для Replicate
    const modelName = `${selectedModel.owner}/${selectedModel.model}`;

    console.log('Sending to Replicate:', {
      modelName,
      input: Object.keys(input).reduce((acc, key) => {
        acc[key] = key.includes('image') ? '[IMAGE_DATA]' : input[key];
        return acc;
      }, {} as Record<string, string>)
    });

    // Запускаем генерацию через SDK
    const output = await replicate.run(modelName as `${string}/${string}`, { input });
    
    console.log('Replicate response type:', typeof output);
    console.log('Replicate response is array:', Array.isArray(output));
    console.log('Replicate response first 100 chars:', typeof output === 'string' ? (output as string).substring(0, 100) : 'not string');

    let finalOutput: any = output;
    
    // Если это ReadableStream
    if (output && typeof output === 'object' && 'getReader' in output) {
      console.log('Processing ReadableStream...');
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
        finalOutput = output;
      }
    }
    // Если это строка с бинарными данными PNG
    else if (typeof output === 'string' && (output as string).startsWith('�PNG')) {
      console.log('Converting binary PNG string to base64...');
      try {
        // Конвертируем строку в buffer и затем в base64
        const buffer = Buffer.from(output, 'binary');
        const base64 = buffer.toString('base64');
        finalOutput = `data:image/png;base64,${base64}`;
      } catch (error) {
        console.error('Error converting PNG data:', error);
        finalOutput = output;
      }
    }
    // Если это уже готовый URL
    else if (typeof output === 'string' && ((output as string).startsWith('http') || (output as string).startsWith('data:'))) {
      console.log('Output is already a URL');
      finalOutput = output;
    }

    console.log('Final output type:', typeof finalOutput);
    console.log('Final output first 100 chars:', typeof finalOutput === 'string' ? (finalOutput as string).substring(0, 100) : 'not string');

    return NextResponse.json({
      id: 'sdk-generated',
      status: 'succeeded',
      output: finalOutput,
    });

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
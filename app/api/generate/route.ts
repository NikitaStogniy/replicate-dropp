import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const prompt = formData.get('prompt') as string;
    const generationMode = formData.get('generation_mode') as string;
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

    if (generationMode === 'character' && !characterImage) {
      return NextResponse.json(
        { error: 'Для режима персонажа необходимо референсное изображение' },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN не настроен' },
        { status: 500 }
      );
    }

    let input: any = {
      prompt,
      style_type: styleType,
      aspect_ratio: aspectRatio,
      magic_prompt_option: magicPrompt,
    };

    // Добавляем rendering_speed только если он не Default
    if (renderingSpeed !== 'Default') {
      input.rendering_speed = renderingSpeed;
    }

    let modelEndpoint: string;

    if (generationMode === 'character' && characterImage) {
      // Режим персонажа - используем ideogram-character
      const imageBuffer = Buffer.from(await characterImage.arrayBuffer());
      const imageBase64 = `data:${characterImage.type};base64,${imageBuffer.toString('base64')}`;
      input.character_reference_image = imageBase64;
      modelEndpoint = 'https://api.replicate.com/v1/models/ideogram-ai/ideogram-character/predictions';
    } else {
      // Обычная генерация - используем ideogram-v3-turbo
      modelEndpoint = 'https://api.replicate.com/v1/models/ideogram-ai/ideogram-v3-turbo/predictions';
    }

    // Создаем prediction без ожидания
    const response = await fetch(modelEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} - ${errorData.detail || errorData.title || 'Unknown error'}`);
    }

    let prediction = await response.json();

    // Если prediction еще не завершен, делаем polling
    if (prediction.status === 'starting' || prediction.status === 'processing') {
      const maxAttempts = 30; // максимум 5 минут ожидания
      let attempts = 0;

      while (attempts < maxAttempts && (prediction.status === 'starting' || prediction.status === 'processing')) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // ждем 10 секунд
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`
          }
        });

        if (statusResponse.ok) {
          prediction = await statusResponse.json();
        }
        
        attempts++;
      }
    }

    return NextResponse.json({
      id: prediction.id || 'unknown',
      status: prediction.status || 'unknown',
      output: prediction.output || null,
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
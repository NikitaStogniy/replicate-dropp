'use client';

import { useState } from 'react';
import AuthGuard from './components/AuthGuard';

interface GenerationResult {
  id: string;
  status: string;
  output?: string | string[];
  error?: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [styleType, setStyleType] = useState('Auto');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [renderingSpeed, setRenderingSpeed] = useState('Default');
  const [magicPrompt, setMagicPrompt] = useState('Auto');
  const [generationMode, setGenerationMode] = useState<'character' | 'standard'>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCharacterImage(e.target.files[0]);
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при скачивании изображения:', error);
      alert('Ошибка при скачивании изображения');
    }
  };

  const handleGenerate = async () => {
    if (!prompt) {
      alert('Пожалуйста, введите промпт');
      return;
    }

    if (generationMode === 'character' && !characterImage) {
      alert('Для режима "Персонаж" необходимо загрузить референсное изображение');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('generation_mode', generationMode);
      
      if (generationMode === 'character' && characterImage) {
        formData.append('character_reference_image', characterImage);
      }
      
      formData.append('style_type', styleType);
      formData.append('aspect_ratio', aspectRatio);
      formData.append('rendering_speed', renderingSpeed);
      formData.append('magic_prompt_option', magicPrompt);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setResult(data);
    } catch (error) {
      console.error('Ошибка при генерации:', error);
      setResult({
        id: '',
        status: 'failed',
        error: 'Произошла ошибка при генерации изображения'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Ideogram AI Generator
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Режим генерации
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="standard"
                  checked={generationMode === 'standard'}
                  onChange={(e) => setGenerationMode(e.target.value as 'character' | 'standard')}
                  className="mr-2"
                />
                <span className="text-black">Обычная генерация</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="character"
                  checked={generationMode === 'character'}
                  onChange={(e) => setGenerationMode(e.target.value as 'character' | 'standard')}
                  className="mr-2"
                />
                <span className="text-black">Персонаж с референсом</span>
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {generationMode === 'standard' 
                ? 'Создание изображений только по текстовому описанию' 
                : 'Создание консистентного персонажа на основе референсного изображения'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Промпт для генерации
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Опишите изображение, которое хотите создать..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  rows={4}
                />
              </div>

              {generationMode === 'character' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Референсное изображение персонажа
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                  {characterImage && (
                    <p className="text-sm text-gray-600 mt-1">
                      Выбрано: {characterImage.name}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Стиль
                </label>
                <select
                  value={styleType}
                  onChange={(e) => setStyleType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="Auto">Авто</option>
                  <option value="Fiction">Художественный</option>
                  <option value="Realistic">Реалистичный</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Соотношение сторон
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="1:1">1:1 (квадрат)</option>
                  <option value="16:9">16:9 (широкий)</option>
                  <option value="9:16">9:16 (вертикальный)</option>
                  <option value="4:3">4:3</option>
                  <option value="3:4">3:4</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Скорость рендеринга
                </label>
                <select
                  value={renderingSpeed}
                  onChange={(e) => setRenderingSpeed(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="Default">По умолчанию</option>
                  <option value="Turbo">Турбо</option>
                  <option value="Quality">Качество</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Магический промпт
                </label>
                <select
                  value={magicPrompt}
                  onChange={(e) => setMagicPrompt(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="Auto">Авто</option>
                  <option value="On">Включен</option>
                  <option value="Off">Выключен</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt || (generationMode === 'character' && !characterImage)}
            className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Генерируется...' : 'Создать изображение'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Результат генерации</h2>
            
            {result.status === 'succeeded' && result.output && (
              <div className="max-w-2xl mx-auto">
                {Array.isArray(result.output) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.output.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img
                          src={imageUrl}
                          alt={`Сгенерированное изображение ${index + 1}`}
                          className="w-full rounded-lg shadow-md"
                          onError={(e) => {
                            console.error('Ошибка загрузки изображения:', imageUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <button
                          onClick={() => downloadImage(imageUrl, `generated-image-${index + 1}.png`)}
                          className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                        >
                          Скачать
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={typeof result.output === 'string' ? result.output : ''}
                      alt="Сгенерированное изображение"
                      className="w-full rounded-lg shadow-md"
                      onError={(e) => {
                        console.error('Ошибка загрузки изображения:', result.output);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <button
                      onClick={() => downloadImage(typeof result.output === 'string' ? result.output : '', 'generated-image.png')}
                      className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                    >
                      Скачать
                    </button>
                  </div>
                )}
              </div>
            )}

            {result.status === 'processing' && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Обработка...</p>
              </div>
            )}

            {result.status === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">
                  Ошибка: {result.error || 'Неизвестная ошибка'}
                </p>
              </div>
            )}

            {result.status === 'starting' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800">Запуск генерации...</p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </AuthGuard>
  );
}

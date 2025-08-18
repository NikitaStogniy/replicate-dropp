'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AuthGuard from './components/AuthGuard';
import { getModelById, getAllModels } from './lib/models';
import { ChevronDownIcon, SparklesIcon, PhotoIcon, CpuChipIcon, ClockIcon } from '@heroicons/react/24/outline';

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
  const [selectedModel, setSelectedModel] = useState('ideogram-v3-turbo');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const currentModel = getModelById(selectedModel);
  const availableModels = getAllModels();

  // Load selected model from localStorage on component mount
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel && getAllModels().some(model => model.id === savedModel)) {
      setSelectedModel(savedModel);
    }
  }, []);

  // Save selected model to localStorage when it changes
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('selectedModel', modelId);
  };

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

    if (currentModel?.requiresCharacterImage && !characterImage) {
      alert('Для этой модели необходимо загрузить референсное изображение');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('model_id', selectedModel);
      
      if (characterImage && currentModel?.supportsCharacterImage) {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              AI Image Generator
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Создавайте потрясающие изображения с помощью передовых AI моделей
            </p>
          </div>
        
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          {/* Model Selection */}
          <div className="mb-8">
            <div 
              className="flex items-center justify-between cursor-pointer p-2 -m-2 rounded-lg hover:bg-gray-50/50 transition-colors"
              onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
            >
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <CpuChipIcon className="w-5 h-5 mr-2 text-green-600" />
                Выбор модели
              </h2>
              <ChevronDownIcon 
                className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                  isModelSelectorOpen ? 'rotate-180' : ''
                }`} 
              />
            </div>
            
            {/* Show selected model info when collapsed */}
            {!isModelSelectorOpen && currentModel && (
              <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <CpuChipIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">{currentModel.name}</h4>
                    <p className="text-xs text-blue-700">{currentModel.description}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Expanded model selection */}
            {isModelSelectorOpen && (
              <div className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
              {availableModels.map((model) => (
                <div 
                  key={model.id}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedModel === model.id 
                      ? 'border-green-500 bg-green-50/50 shadow-lg' 
                      : 'border-gray-200 bg-white/70 hover:border-gray-300'
                  }`}
                  onClick={() => handleModelChange(model.id)}
                >
                  <input
                    type="radio"
                    value={model.id}
                    checked={selectedModel === model.id}
                    onChange={() => {}}
                    className="absolute top-3 right-3 w-4 h-4 text-green-600"
                  />
                  <div className="pr-6">
                    <h3 className="font-semibold text-gray-900 mb-1">{model.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{model.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        model.quality === 'fast' ? 'bg-blue-100 text-blue-800' :
                        model.quality === 'balanced' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {model.quality === 'fast' ? 'Быстро' : model.quality === 'balanced' ? 'Сбалансировано' : 'Высокое качество'}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {model.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
                </div>
                
                {currentModel && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <CpuChipIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-semibold text-blue-900 mb-1">Выбрана модель: {currentModel.name}</h4>
                        <p className="text-sm text-blue-700">{currentModel.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Описание изображения
                </label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Опишите детально изображение, которое хотите создать. Например: 'Футуристический город на закате с летающими автомобилями, неоновые огни, киберпанк стиль'..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-colors resize-none bg-white/70 backdrop-blur-sm"
                    rows={5}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {prompt.length}/500
                  </div>
                </div>
              </div>

              {currentModel?.supportsCharacterImage && (
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">
                    Референсное изображение персонажа {currentModel?.requiresCharacterImage && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="character-upload"
                    />
                    <label 
                      htmlFor="character-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        characterImage 
                          ? 'border-green-400 bg-green-50' 
                          : 'border-gray-300 bg-white/70 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <PhotoIcon className={`w-8 h-8 mb-2 ${
                        characterImage ? 'text-green-500' : 'text-gray-400'
                      }`} />
                      {characterImage ? (
                        <span className="text-sm font-medium text-green-700">
                          Загружено: {characterImage.name}
                        </span>
                      ) : (
                        <div className="text-center">
                          <span className="text-sm font-medium text-gray-700">Загрузить изображение</span>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG до 10MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {currentModel?.supportedStyles && (
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">
                    Стиль изображения
                  </label>
                  <div className="relative">
                    <select
                      value={styleType}
                      onChange={(e) => setStyleType(e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white/70 backdrop-blur-sm appearance-none cursor-pointer"
                    >
                      {currentModel.supportedStyles.map((style) => (
                        <option key={style} value={style}>
                          {style === 'Auto' ? 'Авто' : 
                           style === 'Fiction' ? 'Художественный' :
                           style === 'Realistic' ? 'Реалистичный' :
                           style === 'General' ? 'Общий' :
                           style === 'Design' ? 'Дизайн' :
                           style === 'Photographic' ? 'Фотографический' :
                           style === 'Anime' ? 'Аниме' :
                           style === 'Digital Art' ? 'Цифровое искусство' :
                           style === 'Comic Book' ? 'Комикс' :
                           style === 'Fantasy Art' ? 'Фэнтези' : style}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Соотношение сторон
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {currentModel?.supportedAspectRatios.map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                        aspectRatio === ratio
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white/70 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold">{ratio}</div>
                        <div className="text-xs opacity-75">
                          {ratio === '1:1' ? 'Квадрат' :
                           ratio === '16:9' ? 'Широкий' :
                           ratio === '9:16' ? 'Вертикальный' :
                           ratio === '4:3' ? 'Альбомный' :
                           ratio === '3:4' ? 'Портретный' : ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Скорость рендеринга
                  </label>
                  <div className="relative">
                    <select
                      value={renderingSpeed}
                      onChange={(e) => setRenderingSpeed(e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white/70 backdrop-blur-sm appearance-none cursor-pointer"
                    >
                      <option value="Default">По умолчанию</option>
                      <option value="Turbo">Турбо</option>
                      <option value="Quality">Качество</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Магический промпт
                  </label>
                  <div className="relative">
                    <select
                      value={magicPrompt}
                      onChange={(e) => setMagicPrompt(e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white/70 backdrop-blur-sm appearance-none cursor-pointer"
                    >
                      <option value="Auto">Авто</option>
                      <option value="On">Включен</option>
                      <option value="Off">Выключен</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt || (currentModel?.requiresCharacterImage && !characterImage)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center space-x-3"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Генерируется...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span>Создать изображение</span>
                </>
              )}
            </button>
            
            {(!prompt || (currentModel?.requiresCharacterImage && !characterImage)) && (
              <p className="text-center text-sm text-gray-500 mt-3">
                {!prompt ? 'Введите описание изображения' : 'Загрузите референсное изображение для этой модели'}
              </p>
            )}
          </div>
        </div>

        {result && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                <PhotoIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Результат генерации</h2>
            </div>
            
            {result.status === 'succeeded' && result.output && (
              <div className="max-w-4xl mx-auto">
                {Array.isArray(result.output) ? (
                  result.output.filter(imageUrl => imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {result.output.filter(imageUrl => imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '').map((imageUrl, index) => (
                        <div key={index} className="group relative bg-white rounded-2xl p-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <Image
                            src={imageUrl}
                            alt={`Сгенерированное изображение ${index + 1}`}
                            className="w-full rounded-xl"
                            width={800}
                            height={800}
                            onError={(e) => {
                              console.error('Ошибка загрузки изображения:', imageUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => downloadImage(imageUrl, `generated-image-${index + 1}.png`)}
                              className="bg-white text-gray-900 px-4 py-2 rounded-xl font-medium shadow-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Скачать</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <PhotoIcon className="w-6 h-6 text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Нет валидных изображений</h3>
                      <p className="text-yellow-700">Генерация завершилась, но не вернула валидные изображения</p>
                    </div>
                  )
                ) : (
                  typeof result.output === 'string' && result.output.trim() !== '' ? (
                    <div className="group relative bg-white rounded-2xl p-2 shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-2xl mx-auto">
                      <Image
                        src={result.output}
                        alt="Сгенерированное изображение"
                        className="w-full rounded-xl"
                        width={800}
                        height={800}
                        onError={(e) => {
                          console.error('Ошибка загрузки изображения:', result.output);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => downloadImage(result.output as string, 'generated-image.png')}
                          className="bg-white text-gray-900 px-4 py-2 rounded-xl font-medium shadow-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Скачать</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <PhotoIcon className="w-6 h-6 text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Нет валидных изображений</h3>
                      <p className="text-yellow-700">Генерация завершилась, но не вернула валидные изображения</p>
                    </div>
                  )
                )}
              </div>
            )}

            {result.status === 'processing' && (
              <div className="text-center py-12">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Обработка...</h3>
                <p className="text-gray-600">Создаем ваше изображение, пожалуйста подождите...</p>
              </div>
            )}

            {result.status === 'failed' && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Ошибка генерации</h3>
                <p className="text-red-700">{result.error || 'Неизвестная ошибка'}</p>
              </div>
            )}

            {result.status === 'starting' && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Запуск генерации</h3>
                <p className="text-yellow-700">Подготавливаем модель для создания вашего изображения...</p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </AuthGuard>
  );
}

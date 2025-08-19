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
  seed?: number;
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
  const [seed, setSeed] = useState('');
  const [inpaintingMode, setInpaintingMode] = useState(false);
  const [inpaintImage, setInpaintImage] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [showMaskEditor, setShowMaskEditor] = useState(false);
  const [maskPrompt, setMaskPrompt] = useState('');
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


  const startInpainting = (imageUrl: string) => {
    setInpaintImage(imageUrl);
    setInpaintingMode(true);
    setMaskImage(null);
    setShowMaskEditor(true);
    
    // Автоматически переключаемся на модель с поддержкой inpainting, если текущая не поддерживает
    if (!currentModel?.supportsInpainting) {
      // Ищем лучшую модель для inpainting (приоритет: v3-quality > v3-balanced > v3-turbo > v2)
      const inpaintingModels = availableModels.filter(model => model.supportsInpainting);
      const preferredOrder = ['ideogram-v3-quality', 'ideogram-v3-balanced', 'ideogram-v3-turbo', 'ideogram-v2'];
      
      let selectedInpaintingModel = null;
      for (const preferredId of preferredOrder) {
        selectedInpaintingModel = inpaintingModels.find(model => model.id === preferredId);
        if (selectedInpaintingModel) break;
      }
      
      if (selectedInpaintingModel) {
        setSelectedModel(selectedInpaintingModel.id);
        localStorage.setItem('selectedModel', selectedInpaintingModel.id);
        
        // Показываем уведомление о смене модели
        setTimeout(() => {
          alert(`Переключено на модель "${selectedInpaintingModel.name}" для поддержки inpainting`);
        }, 100);
      }
    }
  };

  const handleCanvasDrawing = (canvas: HTMLCanvasElement, e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, (brushSize / 2) * scaleX, 0, 2 * Math.PI);
    ctx.fill();
  };

  const clearCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveMask = (canvas: HTMLCanvasElement) => {
    // Создаем новый canvas для финальной маски с белым фоном
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const finalCtx = finalCanvas.getContext('2d');
    
    if (finalCtx) {
      // Заливаем белым фоном
      finalCtx.fillStyle = '#FFFFFF';
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      // Получаем данные исходной маски
      const sourceCtx = canvas.getContext('2d');
      if (sourceCtx) {
        const imageData = sourceCtx.getImageData(0, 0, canvas.width, canvas.height);
        const newImageData = finalCtx.createImageData(canvas.width, canvas.height);
        const sourceData = imageData.data;
        const newData = newImageData.data;
        
        // Конвертируем в чёрно-белую маску
        for (let i = 0; i < sourceData.length; i += 4) {
          if (sourceData[i + 3] > 0) { // Если есть альфа (нарисованная область)
            // Делаем чёрным (область для изменения)
            newData[i] = 0;     // R = 0
            newData[i + 1] = 0; // G = 0  
            newData[i + 2] = 0; // B = 0
            newData[i + 3] = 255; // A = 255
          } else {
            // Оставляем белым (область без изменений)
            newData[i] = 255;     // R = 255
            newData[i + 1] = 255; // G = 255  
            newData[i + 2] = 255; // B = 255
            newData[i + 3] = 255; // A = 255
          }
        }
        
        finalCtx.putImageData(newImageData, 0, 0);
      }
    }
    
    const dataUrl = finalCanvas.toDataURL('image/png');
    setMaskImage(dataUrl);
    setShowMaskEditor(false);
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
    if (!prompt && !inpaintingMode) {
      alert('Пожалуйста, введите промпт');
      return;
    }

    if (inpaintingMode && !maskPrompt) {
      alert('Пожалуйста, опишите что вы хотите изменить в выделенной области');
      return;
    }

    if (inpaintingMode && !currentModel?.supportsInpainting) {
      alert('Выбранная модель не поддерживает inpainting. Пожалуйста, выберите одну из Ideogram моделей.');
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
      const finalPrompt = inpaintingMode && maskPrompt ? maskPrompt : prompt;
      formData.append('prompt', finalPrompt);
      formData.append('model_id', selectedModel);
      
      if (characterImage && currentModel?.supportsCharacterImage) {
        formData.append('character_reference_image', characterImage);
      }
      
      // Inpainting параметры
      if (inpaintingMode && inpaintImage && maskImage) {
        // Конвертируем base64 в File
        const imageBlob = await fetch(inpaintImage).then(r => r.blob());
        const imageFile = new File([imageBlob], 'inpaint-source.png', { type: 'image/png' });
        formData.append('inpaint_image', imageFile);
        
        const maskBlob = await fetch(maskImage).then(r => r.blob());
        const maskFile = new File([maskBlob], 'inpaint-mask.png', { type: 'image/png' });
        formData.append('inpaint_mask', maskFile);
      }
      
      formData.append('style_type', styleType);
      formData.append('aspect_ratio', aspectRatio);
      formData.append('rendering_speed', renderingSpeed);
      formData.append('magic_prompt_option', magicPrompt);
      
      if (seed && seed.trim()) {
        formData.append('seed', seed.trim());
      }

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
      
      // Прокручиваем к результатам когда генерация завершена
      setTimeout(() => {
        const resultElement = document.querySelector('[data-result-section]');
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
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
        
          <div className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8 transition-all duration-300 ${inpaintingMode ? 'opacity-50 pointer-events-none' : ''}`}>
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
                        <h4 className="font-semibold text-blue-900 mb-1">
                          Выбрана модель: {currentModel.name}
                          {inpaintingMode && currentModel.supportsInpainting && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Inpainting режим
                            </span>
                          )}
                          {inpaintingMode && !currentModel.supportsInpainting && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              ⚠️ Не поддерживает inpainting
                            </span>
                          )}
                        </h4>
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
                    {currentModel?.category === 'image-to-video' ? 'Первый кадр видео' : 'Референсное изображение персонажа'} {currentModel?.requiresCharacterImage && <span className="text-red-500">*</span>}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seed (для воспроизводимости)
                </label>
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value.replace(/\D/g, ''))}
                  placeholder="Оставьте пустым для случайного seed"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white/70 backdrop-blur-sm placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Используйте тот же seed для воспроизведения результата
                </p>
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
              disabled={isGenerating || (!prompt && !inpaintingMode) || (inpaintingMode && (!maskPrompt || !currentModel?.supportsInpainting)) || (currentModel?.requiresCharacterImage && !characterImage)}
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
            
            {((!prompt && !inpaintingMode) || (inpaintingMode && (!maskPrompt || !currentModel?.supportsInpainting)) || (currentModel?.requiresCharacterImage && !characterImage)) && (
              <p className="text-center text-sm text-gray-500 mt-3">
                {!prompt && !inpaintingMode ? 'Введите описание изображения' : 
                 inpaintingMode && !currentModel?.supportsInpainting ? 'Выберите модель с поддержкой inpainting (Ideogram)' :
                 inpaintingMode && !maskPrompt ? 'Опишите что вы хотите изменить в выделенной области' :
                 'Загрузите референсное изображение для этой модели'}
              </p>
            )}
          </div>
        </div>

        {result && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8" data-result-section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                  <PhotoIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentModel?.category === 'image-to-video' ? 'Результат генерации видео' : 'Результат генерации'}
                </h2>
              </div>
              
              {result.seed && (
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-600 mr-2">Seed: {result.seed}</span>
                  <button
                    onClick={() => {
                      setSeed(result.seed?.toString() || '');
                      navigator.clipboard.writeText(result.seed?.toString() || '');
                      alert('Seed скопирован в буфер обмена и добавлен в форму!');
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                    title="Копировать seed и добавить в форму"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            {result.status === 'succeeded' && result.output && (
              <div className="max-w-4xl mx-auto">
                {/* Check if this is a video result */}
                {currentModel?.category === 'image-to-video' ? (
                  <div className="group relative bg-white rounded-2xl p-2 shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-2xl mx-auto">
                    <video
                      src={Array.isArray(result.output) ? result.output[0] : result.output}
                      className="w-full rounded-xl"
                      controls
                      autoPlay
                      loop
                      muted
                      onError={() => {
                        console.error('Ошибка загрузки видео:', result.output);
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      <div className="flex space-x-2 flex-wrap justify-center pointer-events-auto">
                        <button
                          onClick={() => {
                            const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output as string;
                            downloadImage(videoUrl, 'generated-video.mp4');
                          }}
                          className="bg-white text-gray-900 px-4 py-2 rounded-xl font-medium shadow-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Скачать</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Regular image results */
                  Array.isArray(result.output) ? (
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
                              <div className="flex space-x-2 flex-wrap justify-center">
                                <button
                                  onClick={() => startInpainting(imageUrl)}
                                  className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  <span>Редактировать</span>
                                </button>
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
                        <div className="flex space-x-2 flex-wrap justify-center">
                          <button
                            onClick={() => startInpainting(result.output as string)}
                            className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Редактировать</span>
                          </button>
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
        
        {/* Inpainting Bottom Panel */}
        {inpaintingMode && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-green-200 shadow-2xl z-40 animate-in slide-in-from-bottom duration-300">
            <div className="max-w-5xl mx-auto px-4 py-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-green-800">Режим Inpainting</h2>
                    <p className="text-sm text-green-600">Отредактируйте выбранные области изображения</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setInpaintingMode(false);
                    setInpaintImage(null);
                    setMaskImage(null);
                    setMaskPrompt('');
                  }}
                  className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 p-2 rounded-xl transition-all duration-200 flex items-center space-x-2 group"
                  title="Выйти из режима inpainting"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm font-medium">Закрыть</span>
                </button>
              </div>

              {/* Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Image Preview */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-lg p-4 border border-green-100">
                    {inpaintImage && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <PhotoIcon className="w-4 h-4 mr-2 text-green-600" />
                          Исходное изображение
                        </h4>
                        <Image 
                          src={inpaintImage} 
                          alt="Original" 
                          className="w-full rounded-xl border border-gray-200 shadow-sm"
                          width={400}
                          height={400}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Mask Section */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-lg p-4 border border-green-100">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Маска для редактирования
                      </div>
                      <button
                        onClick={() => setShowMaskEditor(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Рисовать</span>
                      </button>
                    </h4>
                    
                    {maskImage ? (
                      <div className="relative">
                        <Image 
                          src={maskImage} 
                          alt="Mask" 
                          className="w-full rounded-xl border border-gray-200 shadow-sm"
                          width={400}
                          height={400}
                        />
                        <button
                          onClick={() => setMaskImage(null)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm transition-colors flex items-center justify-center shadow-lg"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                          <p className="text-xs text-green-700 font-medium">✅ Готово</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 border-2 border-dashed border-green-300 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 transition-all duration-200 hover:border-green-400 hover:bg-gradient-to-br hover:from-green-100 hover:to-emerald-100">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <p className="text-green-700 font-semibold text-sm mb-1">Создайте маску</p>
                        <p className="text-xs text-green-600 text-center max-w-xs mb-3">
                          Отметьте области для изменения
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => setMaskImage(e.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="inpaint-mask-upload"
                        />
                        <label 
                          htmlFor="inpaint-mask-upload" 
                          className="cursor-pointer text-green-700 text-sm hover:text-green-800 underline font-medium transition-colors"
                        >
                          или загрузить файл
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-lg p-4 border border-green-100 space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <SparklesIcon className="w-4 h-4 mr-2 text-green-600" />
                      Описание изменений
                    </h4>
                    
                    <div className="relative">
                      <textarea
                        value={maskPrompt}
                        onChange={(e) => setMaskPrompt(e.target.value)}
                        placeholder="Опишите что должно появиться в выделенных областях. Например: 'красивые цветы', 'синий автомобиль', 'современное здание'..."
                        className="w-full p-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500 transition-all resize-none bg-white/70 backdrop-blur-sm text-sm leading-relaxed"
                        rows={4}
                        maxLength={300}
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-1 rounded">
                        {maskPrompt.length}/300
                      </div>
                    </div>

                    {maskImage && maskPrompt && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-sm text-green-800 font-medium">
                            Готово к генерации!
                          </p>
                        </div>
                        <p className="text-xs text-green-700 mt-1 ml-8">
                          Нажмите кнопку &ldquo;Создать изображение&rdquo; ниже
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !maskPrompt || !maskImage || !currentModel?.supportsInpainting}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center space-x-2"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Генерируется...</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-4 h-4" />
                          <span>Создать изображение</span>
                        </>
                      )}
                    </button>
                    
                    {(!maskPrompt || !maskImage || !currentModel?.supportsInpainting) && (
                      <p className="text-center text-xs text-gray-500">
                        {!currentModel?.supportsInpainting ? 'Выберите модель с поддержкой inpainting (Ideogram)' :
                         !maskImage ? 'Создайте маску для редактирования' : 'Опишите желаемые изменения'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Canvas Mask Editor Modal */}
        {showMaskEditor && inpaintImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Рисование маски</h3>
                  <button
                    onClick={() => setShowMaskEditor(false)}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Размер кисти:</label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600 w-8">{brushSize}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      const canvas = document.getElementById('mask-canvas') as HTMLCanvasElement;
                      if (canvas) clearCanvas(canvas);
                    }}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    Очистить
                  </button>
                  
                  <button
                    onClick={() => {
                      const canvas = document.getElementById('mask-canvas') as HTMLCanvasElement;
                      if (canvas) saveMask(canvas);
                    }}
                    className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Сохранить маску
                  </button>
                </div>
                
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <Image 
                    src={inpaintImage} 
                    alt="Original" 
                    className="w-full h-auto"
                    width={800}
                    height={600}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      const canvas = document.getElementById('mask-canvas') as HTMLCanvasElement;
                      if (canvas) {
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        canvas.style.width = img.offsetWidth + 'px';
                        canvas.style.height = img.offsetHeight + 'px';
                        clearCanvas(canvas);
                      }
                    }}
                  />
                  <canvas
                    id="mask-canvas"
                    className="absolute inset-0 cursor-crosshair"
                    onMouseDown={() => setIsDrawing(true)}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                    onMouseMove={(e) => {
                      const canvas = e.target as HTMLCanvasElement;
                      handleCanvasDrawing(canvas, e);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      setIsDrawing(true);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setIsDrawing(false);
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      const canvas = e.target as HTMLCanvasElement;
                      const touch = e.touches[0];
                      const rect = canvas.getBoundingClientRect();
                      const scaleX = canvas.width / rect.width;
                      const scaleY = canvas.height / rect.height;
                      
                      const x = (touch.clientX - rect.left) * scaleX;
                      const y = (touch.clientY - rect.top) * scaleY;
                      
                      const ctx = canvas.getContext('2d');
                      if (ctx && isDrawing) {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                        ctx.beginPath();
                        ctx.arc(x, y, (brushSize / 2) * scaleX, 0, 2 * Math.PI);
                        ctx.fill();
                      }
                    }}
                  />
                </div>
                
                <div className="mt-4 text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    🎨 <strong>Закрасьте черным</strong> области, которые хотите изменить
                  </p>
                  <p className="text-xs text-gray-500">
                    Используйте мышь или палец для рисования. Размер кисти можно изменить выше.
                  </p>
                  <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">
                    <span>💡</span>
                    <span>Совет: Опишите выше что должно появиться в черных областях</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

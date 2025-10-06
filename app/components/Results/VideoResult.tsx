'use client';

interface VideoResultProps {
  videoUrl: string;
  onDownload?: (videoUrl: string, filename: string) => void;
}

export default function VideoResult({ videoUrl, onDownload }: VideoResultProps) {
  return (
    <div className="group relative bg-white rounded-2xl p-2 shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-2xl mx-auto">
      <video
        src={videoUrl}
        className="w-full rounded-xl"
        controls
        autoPlay
        loop
        muted
        onError={() => {
          console.error('Ошибка загрузки видео:', videoUrl);
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
        <div className="flex space-x-2 flex-wrap justify-center pointer-events-auto">
          {onDownload && (
            <button
              onClick={() => onDownload(videoUrl, 'generated-video.mp4')}
              className="bg-white text-gray-900 px-4 py-2 rounded-xl font-medium shadow-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Скачать</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

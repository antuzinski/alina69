import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { storage } from '../lib/storage';
import { MediaType } from '../lib/supabase';

interface MediaDisplayProps {
  src: string;
  alt: string;
  mediaType?: MediaType;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
  showControls?: boolean;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({
  src,
  alt,
  mediaType = 'image',
  className = '',
  loading = 'lazy',
  onError,
  showControls = true
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getMediaUrl = () => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:')) {
      return src;
    }
    return storage.getPublicUrl(src);
  };

  const mediaUrl = getMediaUrl();

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setIsPlaying(false);
    setCanPlay(false);
  }, [src, mediaUrl]);

  const handleVideoLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleVideoCanPlay = () => {
    setCanPlay(true);
    setIsLoading(false);
    setHasError(false);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    console.error('[MEDIA] Video error:', {
      code: error?.code,
      message: error?.message,
      src: video.src
    });

    setHasError(true);
    setIsLoading(false);
    setCanPlay(false);
    onError?.();
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (error) {
      console.error('[MEDIA] Play/pause error:', error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !video.muted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  const forceReload = () => {
    setIsLoading(true);
    setHasError(false);
    setCanPlay(false);

    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleMediaError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleMediaLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  if (!src) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-gray-500 text-sm">Нет медиа</div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-gray-500 text-sm mb-2">Медиа недоступно</div>
          <button
            onClick={forceReload}
            className="text-emerald-500 hover:text-emerald-400 text-xs underline"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const LoadingOverlay = () => (
    isLoading && (
      <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
        <div className="text-gray-500 text-sm">Загрузка...</div>
      </div>
    )
  );

  switch (mediaType) {
    case 'video':
      return (
        <div className={`relative ${className}`}>
          <LoadingOverlay />

          <video
            ref={videoRef}
            src={mediaUrl}
            className={`w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
            controls={showControls}
            preload="metadata"
            playsInline
            onLoadStart={handleVideoLoadStart}
            onCanPlay={handleVideoCanPlay}
            onError={handleVideoError}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            style={{ backgroundColor: '#1f2937' }}
          >
            Ваш браузер не поддерживает воспроизведение видео.
          </video>

          {!showControls && canPlay && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30">
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlayPause}
                  className="bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
                  disabled={!canPlay}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                <button
                  onClick={toggleMute}
                  className="bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
                  disabled={!canPlay}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

        </div>
      );

    case 'gif':
      return (
        <div className={`relative ${className}`}>
          <LoadingOverlay />
          <img
            src={mediaUrl}
            alt={alt}
            className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
            loading={loading}
            onError={handleMediaError}
            onLoad={handleMediaLoad}
          />

          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            GIF
          </div>
        </div>
      );

    case 'image':
    default:
      return (
        <div className={`relative ${className}`}>
          <LoadingOverlay />
          <img
            src={mediaUrl}
            alt={alt}
            className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
            loading={loading}
            onError={handleMediaError}
            onLoad={handleMediaLoad}
          />
        </div>
      );
  }
};

export default MediaDisplay;

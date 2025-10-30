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
  const [isIOS, setIsIOS] = useState(false);

  // Detect iOS
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    console.log('[MEDIA] iOS detected:', iOS);
  }, []);

  // Get the media URL
  const getMediaUrl = () => {
    if (!src) return '';
    
    // If it's already a full URL, return as is
    if (src.startsWith('http') || src.startsWith('data:')) {
      return src;
    }
    
    // Convert storage path to public URL
    const url = storage.getPublicUrl(src);
    
    // Add cache control for mobile networks
    if (url.includes('supabase')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}cache=3600`;
    }
    
    return url;
  };
  
  const mediaUrl = getMediaUrl();

  // Reset states when src changes
  useEffect(() => {
    console.log('[MEDIA] Source changed:', { src, mediaUrl, mediaType });
    setHasError(false);
    setIsLoading(true);
    setIsPlaying(false);
    setCanPlay(false);
    setIsMuted(false); // Start with sound enabled
  }, [src, mediaUrl, mediaType, isIOS]);

  // Video event handlers
  const handleVideoLoadStart = () => {
    console.log('[MEDIA] Video load started');
    setIsLoading(true);
    setHasError(false);
  };

  const handleVideoCanPlay = () => {
    console.log('[MEDIA] Video can play');
    setCanPlay(true);
    setIsLoading(false);
    setHasError(false);
    
    // On iOS, try to prepare for playback
    if (isIOS && videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    console.error('[MEDIA] Video error:', {
      code: error?.code,
      message: error?.message,
      src: video.src,
      networkState: video.networkState,
      readyState: video.readyState
    });
    
    setHasError(true);
    setIsLoading(false);
    setCanPlay(false);
    onError?.();
  };

  const handleVideoPlay = () => {
    console.log('[MEDIA] Video started playing');
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    console.log('[MEDIA] Video paused');
    setIsPlaying(false);
  };

  // Play/Pause handler
  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (!video) {
      console.error('[MEDIA] Video element not found');
      return;
    }

    console.log('[MEDIA] Toggle play/pause clicked', {
      paused: video.paused,
      currentTime: video.currentTime,
      duration: video.duration,
      readyState: video.readyState,
      canPlay
    });

    try {
      if (video.paused) {
        console.log('[MEDIA] Attempting to play video');
        
        // On iOS, ensure video is loaded
        if (isIOS && video.readyState < 2) {
          console.log('[MEDIA] iOS: Loading video first');
          video.load();
          await new Promise(resolve => {
            video.addEventListener('canplay', resolve, { once: true });
          });
        }
        
        await video.play();
      } else {
        console.log('[MEDIA] Pausing video');
        video.pause();
      }
    } catch (error) {
      console.error('[MEDIA] Play/pause error:', error);
    }
  };

  // Mute/Unmute handler
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) {
      console.error('[MEDIA] Video element not found for mute toggle');
      return;
    }

    const newMutedState = !video.muted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
    console.log('[MEDIA] Mute toggled:', newMutedState);
  };

  // Force reload
  const forceReload = () => {
    console.log('[MEDIA] Force reloading media...');
    setIsLoading(true);
    setHasError(false);
    setCanPlay(false);
    
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Handle general media errors (for images)
  const handleMediaError = () => {
    console.log('[MEDIA] Media failed to load:', mediaUrl);
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleMediaLoad = () => {
    console.log('[MEDIA] Media loaded successfully');
    setIsLoading(false);
    setHasError(false);
  };

  // Empty source
  if (!src) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-gray-500 text-sm">Нет медиа</div>
      </div>
    );
  }

  // Error state
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

  // Loading overlay
  const LoadingOverlay = () => (
    isLoading && (
      <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
        <div className="text-gray-500 text-sm">Загрузка...</div>
      </div>
    )
  );

  // Render based on media type
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
            preload="auto"
            playsInline
            crossOrigin="anonymous"
            onLoadStart={handleVideoLoadStart}
            onCanPlay={handleVideoCanPlay}
            onError={handleVideoError}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onLoadedMetadata={() => {
              console.log('[MEDIA] Video metadata loaded');
              if (isIOS && videoRef.current) {
                videoRef.current.currentTime = 0.1;
              }
            }}
            style={{ backgroundColor: '#1f2937' }}
          >
            Ваш браузер не поддерживает воспроизведение видео.
          </video>

          {/* Custom controls overlay */}
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
          
          {/* GIF indicator */}
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
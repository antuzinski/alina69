import React, { useState } from 'react';
import MediaDisplay from './MediaDisplay';
import { MediaType } from '../lib/supabase';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  mediaType?: MediaType;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  mediaType = 'image',
  className = '',
  loading = 'lazy',
  onError
}) => {
  return (
    <MediaDisplay
      src={src}
      alt={alt}
      mediaType={mediaType}
      className={className}
      loading={loading}
      onError={onError}
    />
  );
};

export default ImageWithFallback;
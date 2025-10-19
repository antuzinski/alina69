import React from 'react';

/**
 * Convert URLs in text to clickable links
 */
export const linkifyReact = (text: string): React.ReactNode => {
  if (!text) return text;
  
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
  
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Clean the URL by removing trailing punctuation
      const cleanUrl = part.replace(/[.,;:!?]+$/, '');
      
      return (
        <a
          key={index}
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 underline transition-colors"
        >
          {cleanUrl}
        </a>
      );
    }
    
    return part;
  });
};
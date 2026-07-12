import { useState, useCallback } from 'react';

export const useDownloadFile = (defaultOptions = {}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  const download = useCallback((content, options = {}) => {
    const filename = options.filename || defaultOptions.filename || 'download.txt';
    const mimeType = options.mimeType || defaultOptions.mimeType || 'text/plain';
    
    setIsDownloading(true);
    setError(null);

    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      
      // Needs to be appended to the DOM for some browsers
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsDownloading(false);
      return true;
    } catch (err) {
      console.error('Failed to download file:', err);
      setError(err);
      setIsDownloading(false);
      return false;
    }
  }, [defaultOptions.filename, defaultOptions.mimeType]);

  return { download, isDownloading, error };
};

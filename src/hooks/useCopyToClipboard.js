import { useState, useCallback } from 'react';

export const useCopyToClipboard = (resetInterval = 2000) => {
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState(null);

  const copy = useCallback(async (text) => {
    if (!navigator?.clipboard) {
      setError(new Error('Clipboard not supported'));
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setError(null);

      if (resetInterval) {
        setTimeout(() => setIsCopied(false), resetInterval);
      }
      return true;
    } catch (err) {
      setIsCopied(false);
      setError(err);
      return false;
    }
  }, [resetInterval]);

  return { isCopied, copy, error };
};

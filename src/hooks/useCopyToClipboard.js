import { useState, useCallback } from 'react';

export const useCopyToClipboard = (resetInterval = 2000) => {
    const [isCopied, setIsCopied] = useState(false);

    const copy = useCallback((text) => {
        if (!text) return;

        navigator.clipboard.writeText(text)
            .then(() => {
                setIsCopied(true);
                setTimeout(() => {
                    setIsCopied(false);
                }, resetInterval);
            })
            .catch((err) => {
                console.error('Failed to copy text: ', err);
            });
    }, [resetInterval]);

    return [isCopied, copy];
};

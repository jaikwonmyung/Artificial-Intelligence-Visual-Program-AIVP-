import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modKey = isMac ? e.metaKey : e.ctrlKey;

            if (modKey && e.key === 'Enter') {
                e.preventDefault();
                shortcuts.generate?.();
            }

            if (modKey && e.key === 'u') {
                e.preventDefault();
                shortcuts.upscale?.();
            }

            if (e.key === 'Escape') {
                shortcuts.escape?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
};

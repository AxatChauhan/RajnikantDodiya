import { useEffect } from 'react';

/**
 * Universal hook to handle the Escape key for dismissing modals, overlays, and dialogs.
 * Listens on window keydown and triggers onClose when Escape is pressed.
 */
export function useModalEscape(
  isOpen: boolean,
  onClose: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!isOpen || !enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, enabled]);
}

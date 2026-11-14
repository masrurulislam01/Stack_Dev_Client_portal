import {X} from 'lucide-react';
import {useEffect} from 'react';

interface TimelineLightboxModalProps {
  imageSrc: string | null;
  onClose: () => void;
}

export function TimelineLightboxModal({imageSrc, onClose}: TimelineLightboxModalProps) {
  useEffect(() => {
    if (!imageSrc) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [imageSrc, onClose]);

  if (!imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Image attachment preview"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image preview"
          className="absolute -top-12 right-0 p-2 rounded-xl bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
        <img
          src={imageSrc}
          alt="Full size update attachment"
          referrerPolicy="no-referrer"
          className="max-h-[85vh] w-auto max-w-full rounded-2xl border border-slate-800 shadow-2xl object-contain bg-slate-900"
        />
      </div>
    </div>
  );
}

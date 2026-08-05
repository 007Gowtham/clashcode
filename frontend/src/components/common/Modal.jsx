'use client';

import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-3xl',
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-retro-ink/40 backdrop-blur-sm p-4">
      {/* Modal Card — neobrutalist hard border + shadow */}
      <div
        className={`bg-retro-cream w-full ${maxWidth} flex flex-col max-h-[90vh] border-2 border-retro-ink shadow-retro-lg animate-in fade-in zoom-in-95 duration-200 relative z-10 ${className}`}
      >
        {/* Modal Header */}
        {title && (
          <div className="px-6 py-4 border-b-2 border-retro-ink flex items-center justify-between flex-shrink-0 bg-retro-ink">
            <h2 className="text-base font-black uppercase tracking-widest text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-retro-paper hover:text-retro-orange transition-colors p-1"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-retro-paper">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-5 border-t-2 border-retro-ink bg-retro-cream flex items-center justify-between flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

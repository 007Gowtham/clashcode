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
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/10 backdrop-blur-sm p-4">
 {/* Background blur effect */}
 <div className="absolute inset-0 z-0 flex blur-[4px] scale-[1.01] pointer-events-none opacity-40 grayscale-[20%]">
 <div className="w-16 border-r border-gray-200 bg-white flex flex-col items-center py-5">
 <div className="w-9 h-9 bg-emerald-500 rounded-xl mb-8"></div>
 <div className="flex flex-col gap-6 w-full px-3">
 <div className="w-10 h-10 bg-gray-100 rounded-xl"></div>
 <div className="w-10 h-10 rounded-xl border border-gray-100"></div>
 </div>
 </div>
 <div className="flex-1 bg-white">
 <div className="h-16 border-b border-gray-200"></div>
 <div className="flex h-full">
 <div className="w-[30%] border-r border-gray-200 p-6">
 <div className="h-6 w-1/2 bg-gray-100 rounded mb-4"></div>
 <div className="h-4 w-full bg-gray-50 rounded mb-2"></div>
 <div className="h-4 w-3/4 bg-gray-50 rounded mb-2"></div>
 </div>
 <div className="flex-1 bg-gray-50/50"></div>
 </div>
 </div>
 </div>

 {/* Modal Card */}
 <div
 className={`bg-white rounded-2xl shadow-2xl shadow-gray-200/50 w-full ${maxWidth} flex flex-col max-h-[90vh] border border-gray-200 animate-in fade-in zoom-in-95 duration-200 relative z-10 ${className}`}
 >
 {/* Modal Header */}
 {title && (
 <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
 <h2 className="text-lg font-bold tracking-tight text-slate-900 ">{title}</h2>
 <button
 onClick={onClose}
 className="text-gray-400 hover:text-black hover:bg-black/5 p-2 rounded-lg transition-colors"
 >
 <X size={24} className="w-5 h-5" />
 </button>
 </div>
 )}

 {/* Modal Content */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-8">{children}</div>

 {/* Modal Footer */}
 {footer && (
 <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center justify-between flex-shrink-0">
 {footer}
 </div>
 )}
 </div>
 </div>
 );
};

export default Modal;

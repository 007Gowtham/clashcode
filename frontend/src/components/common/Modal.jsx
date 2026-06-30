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
<<<<<<< HEAD
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/10 backdrop-blur-sm p-4">
 {/* Background blur effect */}
 <div className="absolute inset-0 z-0 flex blur-[4px] scale-[1.01] pointer-events-none opacity-40 grayscale-[20%]">
=======
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 dark:bg-black/50 backdrop-blur-sm p-4">
 {/* Background blur effect */}
 <div className="absolute inset-0 z-0 flex blur-[4px] scale-[1.01] pointer-events-none opacity-40 dark:opacity-5 grayscale-[20%]">
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
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
<<<<<<< HEAD
 className={`bg-white rounded-2xl shadow-2xl shadow-gray-200/50 w-full ${maxWidth} flex flex-col max-h-[90vh] border border-gray-200 animate-in fade-in zoom-in-95 duration-200 relative z-10 ${className}`}
 >
 {/* Modal Header */}
 {title && (
 <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
 <h2 className="text-lg font-bold tracking-tight text-slate-900 ">{title}</h2>
 <button
 onClick={onClose}
 className="text-gray-400 hover:text-black hover:bg-black/5 p-2 rounded-lg transition-colors"
=======
 className={`bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-none w-full ${maxWidth} flex flex-col max-h-[90vh] border border-gray-200 dark:border-[#2d2d2d] animate-in fade-in zoom-in-95 duration-200 relative z-10 ${className}`}
 >
 {/* Modal Header */}
 {title && (
 <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2d2d2d] flex items-center justify-between flex-shrink-0">
 <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
 <button
 onClick={onClose}
 className="text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-lg transition-colors"
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
 >
 <X size={24} className="w-5 h-5" />
 </button>
 </div>
 )}

 {/* Modal Content */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-8">{children}</div>

 {/* Modal Footer */}
 {footer && (
<<<<<<< HEAD
 <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center justify-between flex-shrink-0">
=======
 <div className="px-6 py-5 border-t border-gray-100 dark:border-[#2d2d2d] bg-gray-50/50 dark:bg-[#1a1a1a]/50 rounded-b-2xl flex items-center justify-between flex-shrink-0">
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
 {footer}
 </div>
 )}
 </div>
 </div>
 );
};

export default Modal;

import { Loader2 } from 'lucide-react';

export default function Loader({ size = 'md', className = '' }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <Loader size="lg" />
                <p className="text-sm font-medium text-gray-500 animate-pulse">Loading...</p>
            </div>
        </div>
    );
}

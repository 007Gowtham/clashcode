export default function Avatar({ src, name, size = 'md', className = '', indicatorColor = null }) {
    const sizeClasses = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
    };

    const getInitials = (n) => {
        if (!n) return '?';
        return n.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className={`relative inline-block ${className}`}>
            {src ? (
                <img
                    src={src}
                    alt={name || 'Avatar'}
                    className={`${sizeClasses[size]} rounded-full object-cover border border-gray-200 bg-gray-50`}
                />
            ) : (
                <div
                    className={`
            ${sizeClasses[size]} rounded-full flex items-center justify-center font-bold
            bg-indigo-50 text-indigo-600 border border-indigo-100
          `}
                >
                    {getInitials(name)}
                </div>
            )}

            {indicatorColor && (
                <span
                    className={`
            absolute bottom-0 right-0 block rounded-full ring-2 ring-white
            ${indicatorColor === 'green' ? 'bg-emerald-500' :
                            indicatorColor === 'red' ? 'bg-rose-500' :
                                indicatorColor === 'gray' ? 'bg-gray-400' :
                                    indicatorColor
                        }
            ${size === 'xs' ? 'w-1.5 h-1.5' :
                            size === 'sm' ? 'w-2 h-2' :
                                'w-3 h-3'
                        }
          `}
                />
            )}
        </div>
    );
}

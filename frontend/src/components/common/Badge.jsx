export default function Badge({ children, variant = 'gray', className = '', size = 'sm' }) {
    const variants = {
        gray: 'bg-gray-100 text-gray-700 border-gray-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        red: 'bg-rose-50 text-rose-700 border-rose-100',
        yellow: 'bg-amber-50 text-amber-700 border-amber-100',
        purple: 'bg-purple-50 text-purple-700 border-purple-100',
        dark: 'bg-gray-900 text-white border-gray-800',
    };

    const sizes = {
        xs: 'text-[10px] px-1.5 py-0.5',
        sm: 'text-xs px-2 sm:px-2.5 py-0.5 sm:py-1',
        md: 'text-sm px-3 py-1',
    };

    return (
        <span
            className={`
        inline-flex items-center justify-center font-medium rounded-md border
        ${variants[variant] || variants.gray}
        ${sizes[size] || sizes.sm}
        ${className}
      `}
        >
            {children}
        </span>
    );
}

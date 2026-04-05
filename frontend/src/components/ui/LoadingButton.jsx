'use client';

export default function LoadingButton({ isLoading, children, className = '', disabled, ...rest }) {
  return (
    <button
      disabled={isLoading || disabled}
      className={`relative ${className} ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
      {...rest}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          Loading...
        </span>
      ) : children}
    </button>
  );
}

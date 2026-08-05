'use client';

import React, { forwardRef } from 'react';

const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary:
        'border-2 border-retro-ink bg-retro-orange text-white shadow-retro hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm disabled:bg-retro-muted disabled:shadow-none',
      secondary:
        'border-2 border-retro-ink bg-retro-paper text-retro-ink shadow-retro hover:bg-retro-ink hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm disabled:opacity-50 disabled:shadow-none',
      outline:
        'border-2 border-retro-ink bg-transparent text-retro-ink shadow-retro-sm hover:bg-retro-paper active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50',
      ghost:
        'border-2 border-transparent text-retro-muted hover:border-retro-ink hover:text-retro-ink hover:bg-retro-paper disabled:opacity-50',
      danger:
        'border-2 border-retro-ink bg-red-600 text-white shadow-retro hover:bg-red-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm disabled:opacity-50 disabled:shadow-none',
    };

    const sizeClasses = {
      sm: 'py-1.5 px-3 text-xs font-black uppercase tracking-wide',
      md: 'px-5 py-2.5 text-sm font-black uppercase tracking-wide',
      lg: 'px-8 py-4 text-base font-black uppercase tracking-wide',
      full: 'w-full py-3 text-sm font-black uppercase tracking-wide',
    };

    return (
      <button
        ref={ref}
        suppressHydrationWarning={true}
        className={`
          whitespace-nowrap
          font-black
          uppercase
          tracking-wide
          transition-all
          duration-150
          flex
          items-center
          gap-2
          justify-center
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-retro-orange
          focus-visible:ring-offset-2
          disabled:pointer-events-none
          [&_svg]:pointer-events-none
          [&_svg]:size-4
          [&_svg]:shrink-0
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {icon && !isLoading && icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

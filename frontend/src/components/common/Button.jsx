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
        'bg-gray-900 text-white hover:bg-gray-900/90 active:bg-gray-950 disabled:bg-gray-400',
      secondary:
        'bg-gray-500 text-white hover:bg-gray-500/90 active:bg-gray-600 disabled:bg-gray-400',
      outline:
        'border-2 border-gray-900 text-gray-900 hover:bg-gray-50 active:bg-gray-100 disabled:border-gray-400 disabled:text-gray-400',
      ghost:
        'text-gray-900 hover:bg-gray-50 active:bg-gray-100 disabled:text-gray-400',
      danger:
        'bg-red-600 text-white hover:bg-red-600/90 active:bg-red-700 disabled:bg-red-400',
    };

    const sizeClasses = {
      sm: 'py-1.5 px-3 text-sm rounded-md h-8',
      md: 'px-4 py-2 text-sm rounded-md h-10',
      lg: 'px-6 py-3 text-base rounded-md h-12',
      full: ' rounded-full ',
    };

    return (
      <button
        ref={ref}
        suppressHydrationWarning={true}
        className={`
      
          whitespace-nowrap
        
          font-medium
          transition-all
          duration-300
          flex
          items-center
          gap-1
          justify-center
           bg-gradient-to-br from-[#0f0f14] via-[#16161d] to-[#1f1f2b]
          shadow-2xl
        
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-gray-900
          focus-visible:ring-offset-2
          disabled:pointer-events-none
          disabled:opacity-50
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

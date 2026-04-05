'use client';

import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      variant = 'outlined',
      inputSize = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    const variantClasses = {
      default: 'border border-gray-200 bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10',
      filled: 'border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900',
      outlined: 'border border-gray-200 bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10',
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs text-gray-700 font-semibold mb-2">
            {label}
            
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full
            rounded-md
            transition-all
            duration-300
            text-sm
            text-gray-700
            placeholder-gray-500
            focus:outline-none
            disabled:opacity-50
            disabled:cursor-not-allowed
            ${sizeClasses[inputSize]}
            ${variantClasses[variant]}
            ${error ? 'border-red-500 focus:ring-red-100' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

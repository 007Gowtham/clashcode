'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({
  label,
  error,
  icon,
  options,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`
            w-full
            appearance-none
            bg-white
            border
            rounded-xl
            px-4
            py-2.5
            text-sm
            text-gray-900
            focus:ring-4
            focus:ring-gray-900/10
            focus:border-gray-900
            outline-none
            transition-all
            cursor-pointer
            font-medium
            hover:border-gray-300
            hover:bg-gray-50
            disabled:bg-gray-50
            disabled:text-gray-500
            disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500/10 focus:border-red-500' : 'border-gray-200'}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
          {icon || <ChevronDown size={16} className="w-4 h-4 stroke-[1.5]" />}
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Select;

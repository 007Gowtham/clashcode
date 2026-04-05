'use client';

import React from 'react';

const NumberInput = ({
  label,
  error,
  min = 0,
  max = 100,
  value,
  onChange,
  helperText,
  className = '',
  ...props
}) => {
  const handleIncrement = () => {
    const newValue = Math.min((value || 0) + 1, max);
    onChange?.(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max((value || 0) - 1, min);
    onChange?.(newValue);
  };

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value) || 0;
    if (newValue >= min && newValue <= max) {
      onChange?.(newValue);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex items-center shadow-sm gap-3 bg-white px-3 py-2 rounded-md border border-gray-200">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value === min}
          className="w-5 h-5 rounded-md bg-white text-gray-500 hover:text-black hover:border-black hover:bg-black/5 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-minus"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          className={`
            flex-1
            text-center
            text-sm
            font-bold
            text-gray-900
            bg-transparent
            outline-none
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none
            [-moz-appearance:textfield]
            ${className}
          `}
          {...props}
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value === max}
          className="w-5 h-5 bg-white text-gray-500 hover:text-black hover:border-black hover:bg-black/5 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-plus"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default NumberInput;

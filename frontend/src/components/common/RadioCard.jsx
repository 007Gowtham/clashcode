'use client';

import React from 'react';
import { Check } from 'lucide-react';

const RadioButtonCard = ({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  direction = 'horizontal',
  icon,
}) => {
  return (
    <label
      className={`
        cursor-pointer rounded-xl border transition-all
        ${checked ? 'bg-gray-50/50 border-gray-200' : 'bg-white border-gray-200 hover:bg-gray-100'}
        ${direction === 'horizontal' ? 'p-3.5 flex items-center gap-3' : 'p-4'}
      `}
    >
      {/* Native radio (accessibility) */}
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />

      {/* ================= HORIZONTAL ================= */}
      {direction === 'horizontal' && (
        <>
          {icon && (
            <div
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                ${checked ? 'bg-black/10 text-black' : 'bg-gray-100 text-gray-500'}
              `}
            >
              {icon}
            </div>
          )}

          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            {description && (
              <p className="text-[10px] text-gray-500">{description}</p>
            )}
          </div>

          <div
            className={`
              w-4 h-4 rounded-full border flex items-center justify-center
              ${checked ? 'border-black bg-black' : 'border-gray-300'}
            `}
          >
            {checked && <Check className="w-3 h-3 text-white" />}
          </div>
        </>
      )}

      {/* ================= VERTICAL (LIKE YOUR OLD CODE) ================= */}
      {direction === 'vertical' && (
        <>
          {/* Top Row */}
          <div className="flex items-start justify-between mb-3">
            {icon && (
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${checked ? 'bg-black/10 text-black' : 'bg-gray-100 text-gray-500'}
                `}
              >
                {icon}
              </div>
            )}

            <div
              className={`
                w-5 h-5 rounded-full border flex items-center justify-center transition-all
                ${checked ? 'border-black bg-black' : 'border-gray-300'}
              `}
            >
              {checked && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>

          {/* Text */}
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {title}
          </h4>
          {description && (
            <p className="text-xs text-gray-500 leading-relaxed">
              {description}
            </p>
          )}
        </>
      )}
    </label>
  );
};

export default RadioButtonCard;

'use client';

import React from 'react';
import NumberInput from './NumberInput';

const DifficultyMix = ({
  value,
  onChange,
  totalProblems = 5,
}) => {
  const total = value.easy + value.medium + value.hard;

  const handleChange = (difficulty, newValue) => {
    const updated = { ...value, [difficulty]: newValue };
    onChange(updated);
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">
          Problem Difficulty Mix
        </label>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded border ${
            total === totalProblems
              ? 'text-blue-600 bg-blue-50 border-blue-100'
              : 'text-amber-600 bg-amber-50 border-amber-100'
          }`}
        >
          {total} / {totalProblems} Problems
        </span>
      </div>

      <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
        {/* Easy */}
        <div className="flex-1 flex flex-col gap-2">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
            Easy
          </span>
          <NumberInput
            value={value.easy}
            onChange={(val) => handleChange('easy', val)}
            min={0}
            max={totalProblems}
          />
        </div>

        <div className="w-px h-10 bg-gray-200"></div>

        {/* Medium */}
        <div className="flex-1 flex flex-col gap-2">
          <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
            Medium
          </span>
          <NumberInput
            value={value.medium}
            onChange={(val) => handleChange('medium', val)}
            min={0}
            max={totalProblems}
          />
        </div>

        <div className="w-px h-10 bg-gray-200"></div>

        {/* Hard */}
        <div className="flex-1 flex flex-col gap-2">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wide">
            Hard
          </span>
          <NumberInput
            value={value.hard}
            onChange={(val) => handleChange('hard', val)}
            min={0}
            max={totalProblems}
          />
        </div>
      </div>
    </div>
  );
};

export default DifficultyMix;

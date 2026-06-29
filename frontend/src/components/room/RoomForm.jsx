'use client';
import { useState } from 'react';
import { Hash, LayoutGrid, Clock, BarChart2 } from 'lucide-react';

const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon size={14} className="text-slate-400 dark:text-[#8c8c8c]" />
    <span className="text-xs font-semibold text-slate-500 dark:text-[#8c8c8c]">
      {label}
    </span>
  </div>
);

const RoomForm = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    roomName: '',
    questionsPerUser: 1,
    maxTeamSize: 4,
    timeLimitMinutes: 30,
    difficulty: 'MIXED'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const difficultyOptions = [
    { value: 'EASY', label: 'Easy' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HARD', label: 'Hard' },
    { value: 'MIXED', label: 'Mixed (Recommended)' },
  ];

  const inputClass = "w-full px-4 py-2 bg-[#fafafa] dark:bg-[#262626] border border-[#d9d9d9] dark:border-[#333333] rounded-lg text-sm text-[#262626] dark:text-white placeholder-[#bfbfbf] dark:placeholder-[#8c8c8c] focus:outline-none focus:border-[#262626] dark:focus:border-[#ffa116] focus:bg-[#fafafa] dark:focus:bg-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#262626] transition-all disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-2 text-[#262626] dark:text-[#eff1f6]">

      {/* Room Name */}
      <div>
        <SectionLabel icon={Hash} label="Room Identity" />
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 dark:text-[#8c8c8c]">Room Name</label>
          <input
            type="text"
            value={formData.roomName}
            onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
            placeholder="e.g. Alpha Strike Battle"
            minLength={3}
            maxLength={50}
            required
            disabled={isLoading}
            className={inputClass}
          />
        </div>
      </div>

      {/* Configuration Grid */}
      <div>
        <SectionLabel icon={LayoutGrid} label="Match Configuration" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-[#8c8c8c]">Questions per Player</label>
            <input
              type="number"
              value={formData.questionsPerUser}
              min={1}
              max={5}
              onChange={(e) => setFormData({ ...formData, questionsPerUser: parseInt(e.target.value) })}
              required
              disabled={isLoading}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-[#8c8c8c]">Max Team Size</label>
            <input
              type="number"
              value={formData.maxTeamSize}
              min={2}
              max={10}
              onChange={(e) => setFormData({ ...formData, maxTeamSize: parseInt(e.target.value) })}
              required
              disabled={isLoading}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Duration */}
      <div>
        <SectionLabel icon={Clock} label="Time Limit" />
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 dark:text-[#8c8c8c]">Duration (minutes)</label>
          <input
            type="number"
            value={formData.timeLimitMinutes}
            min={10}
            max={180}
            onChange={(e) => setFormData({ ...formData, timeLimitMinutes: parseInt(e.target.value) })}
            required
            disabled={isLoading}
            className={inputClass}
          />
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <SectionLabel icon={BarChart2} label="Difficulty" />
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 dark:text-[#8c8c8c]">Difficulty Level</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            disabled={isLoading}
            className="w-full px-4 py-2.5 bg-[#fafafa] dark:bg-[#262626] border border-[#d9d9d9] dark:border-[#333333] rounded-lg text-sm text-[#262626] dark:text-white focus:outline-none focus:border-[#262626] dark:focus:border-[#ffa116] focus:bg-[#fafafa] dark:focus:bg-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#262626] transition-all cursor-pointer font-medium disabled:opacity-50"
          >
            {difficultyOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-white dark:bg-[#1e1e1e]">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-[#2d2d2d]">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-[#262626] dark:bg-[#ffa116] hover:bg-[#333333] dark:hover:bg-[#e08e12] active:bg-black dark:active:bg-[#1a1a1a] text-white dark:text-black rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Room...' : 'Create Room'}
        </button>
      </div>
    </form>
  );
};

export default RoomForm;
'use client';
import { useState } from 'react';
import { Hash, LayoutGrid, Clock, BarChart2 } from 'lucide-react';

const SectionLabel = ({ icon: Icon, label, bgColor = 'bg-retro-paper', textColor = 'text-retro-ink' }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`w-8 h-8 flex items-center justify-center border-2 border-retro-ink shadow-retro-sm ${bgColor}`}>
      <Icon size={14} className={textColor} strokeWidth={3} />
    </div>
    <span className="font-mono text-xs font-black uppercase tracking-widest text-retro-ink">
      {label}
    </span>
  </div>
);

const inputClass =
  "w-full px-4 py-3 bg-white border-2 border-retro-ink text-retro-ink font-sans font-bold shadow-retro-sm focus:outline-none focus:border-retro-orange focus:translate-y-[-2px] focus:shadow-retro transition-all disabled:opacity-50";

const RoomForm = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    roomName: '',
    questionsPerUser: 1,
    maxTeamSize: 4,
    timeLimitMinutes: 30,
    difficulty: 'MIXED',
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-retro-ink">

      {/* Room Name */}
      <div className="border-2 border-retro-ink bg-retro-paper p-6 shadow-retro-sm relative">
        <SectionLabel icon={Hash} label="Room Identity" bgColor="bg-retro-blue" textColor="text-white" />
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-retro-muted">
            Room Name
          </label>
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
      <div className="border-2 border-retro-ink bg-retro-paper p-6 shadow-retro-sm">
        <SectionLabel icon={LayoutGrid} label="Match Configuration" bgColor="bg-retro-mint" textColor="text-white" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-retro-muted">
              Questions per Player
            </label>
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
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-retro-muted">
              Max Team Size
            </label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Duration */}
        <div className="border-2 border-retro-ink bg-retro-paper p-6 shadow-retro-sm">
          <SectionLabel icon={Clock} label="Time Limit" bgColor="bg-retro-yellow" textColor="text-retro-ink" />
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-retro-muted">
              Duration (minutes)
            </label>
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
        <div className="border-2 border-retro-ink bg-retro-paper p-6 shadow-retro-sm">
          <SectionLabel icon={BarChart2} label="Difficulty" bgColor="bg-retro-orange" textColor="text-white" />
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-retro-muted">
              Difficulty Level
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              disabled={isLoading}
              className={`${inputClass} cursor-pointer appearance-none`}
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-retro-orange border-2 border-retro-ink text-white font-sans font-black uppercase tracking-tight text-lg shadow-retro hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Room...' : 'Create Room'}
        </button>
      </div>
    </form>
  );
};

export default RoomForm;
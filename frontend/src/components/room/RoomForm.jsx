'use client';
import { useState } from 'react';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { Hash, LayoutGrid, Clock, BarChart2, Users } from 'lucide-react';

const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon size={14} className="text-slate-400" />
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] font-[family-name:var(--font-mono)]">
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
    { value: 'EASY',   label: 'Easy' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HARD',   label: 'Hard' },
    { value: 'MIXED',  label: 'Mixed (Recommended)' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-7 py-2 font-[family-name:var(--font-inter)]">

      {/* Room Name */}
      <div>
        <SectionLabel icon={Hash} label="Room Identity" />
        <Input
          label="Room Name"
          value={formData.roomName}
          onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
          placeholder="e.g. Alpha Strike Battle"
          required
        />
      </div>

      {/* Configuration Grid */}
      <div>
        <SectionLabel icon={LayoutGrid} label="Match Configuration" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            label="Questions per Player"
            value={formData.questionsPerUser}
            min={1}
            max={5}
            onChange={(e) => setFormData({ ...formData, questionsPerUser: parseInt(e.target.value) })}
            required
          />
          <Input
            type="number"
            label="Max Team Size"
            value={formData.maxTeamSize}
            min={2}
            max={10}
            onChange={(e) => setFormData({ ...formData, maxTeamSize: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <SectionLabel icon={Clock} label="Time Limit" />
        <Input
          type="number"
          label="Duration (minutes)"
          value={formData.timeLimitMinutes}
          min={10}
          max={180}
          onChange={(e) => setFormData({ ...formData, timeLimitMinutes: parseInt(e.target.value) })}
          required
        />
      </div>

      {/* Difficulty */}
      <div>
        <SectionLabel icon={BarChart2} label="Difficulty" />
        <Select
          label="Difficulty Level"
          options={difficultyOptions}
          value={formData.difficulty}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
        />
      </div>

      <div className="pt-4 border-t border-slate-100">
        <Button
          type="submit"
          disabled={isLoading}
          isLoading={isLoading}
          className="w-full"
        >
          Create Room
        </Button>
      </div>
    </form>
  );
};

export default RoomForm;
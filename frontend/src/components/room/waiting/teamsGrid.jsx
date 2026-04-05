'use client';

import { useState } from 'react';
import { Search, Plus, LayoutGrid, Unlock, Users, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TeamCard from './teamcard';
import { Button } from '@/components/common';

const FilterTab = ({ id, label, icon: Icon, colorClass = "bg-gray-400", currentFilter, onFilterChange }) => (
  <button
    onClick={() => onFilterChange(id)}
    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors isolate ${currentFilter === id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
      }`}
  >
    {currentFilter === id && (
      <motion.div
        layoutId="activeTeamFilter"
        className="absolute inset-0 bg-white shadow-sm border border-gray-200 rounded-lg -z-10"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
    <span className="flex items-center gap-2">
      {Icon ? <Icon className="w-4 h-4" /> : <div className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />}
      {label}
    </span>
  </button>
);

export default function TeamsGrid({ teams = [], onTeamClick, onCreateTeam, isLoading, hasTeam = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTeams = teams.map(team => {
    // Calculate derived status
    let status = 'Open';
    const memberCount = Array.isArray(team.members) ? team.members.length : (team.members || 0);
    const maxMembers = team.maxMembers || 3;

    if (team.visibility === 'PRIVATE') {
      status = 'Locked';
    } else if (memberCount >= maxMembers) {
      status = 'Full';
    }

    return { ...team, status, memberCount };
  }).filter(team => {
    const leaderName = team.leader || team.leaderName || '';
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leaderName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || team.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleTeamCardClick = (team) => {
    if (onTeamClick) {
      onTeamClick(team);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" />
          Active Teams
        </h2>
        <div className="flex items-center gap-3">
          {!hasTeam && (
            <>
              <Button
                onClick={onCreateTeam}
                size="sm"
                className="font-bold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Team
              </Button>
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
            </>
          )}

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center p-1 bg-gray-100/50 rounded-xl border border-gray-200/50 overflow-x-auto max-w-full">
          <FilterTab id="all" label="All Teams" icon={LayoutGrid} currentFilter={filterStatus} onFilterChange={setFilterStatus} />
          <FilterTab id="Open" label="Open" colorClass="bg-emerald-500" currentFilter={filterStatus} onFilterChange={setFilterStatus} />
          <FilterTab id="Full" label="Full" colorClass="bg-amber-500" currentFilter={filterStatus} onFilterChange={setFilterStatus} />
          <FilterTab id="Locked" label="Locked" icon={Lock} currentFilter={filterStatus} onFilterChange={setFilterStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-full">
                <TeamCard isLoading={true} />
              </div>
            ))}
          </>
        ) : (
          <AnimatePresence>
            {filteredTeams.map((team) => (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <TeamCard
                  {...team}
                  members={team.memberCount}
                  userHasTeam={hasTeam}
                  onClick={() => handleTeamCardClick(team)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {!isLoading && filteredTeams.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-900 font-medium">No teams found matching your search.</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting criteria or create a new team.</p>
        </div>
      )}
    </div>
  );
}

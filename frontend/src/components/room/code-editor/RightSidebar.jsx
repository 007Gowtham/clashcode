import { useState } from 'react';
import { ChevronsRight, Mic, Volume2, Settings, MessageSquare, Users, X, ChevronLeft, ChevronsLeft, MicOff, VolumeX, Crown, ClipboardList } from 'lucide-react';
import TeamManagement from './TeamManagement';
import ChatInterface from './ChatInterface';
import RequestManagement from './RequestManagement';

export default function RightSidebar({
  isLeader,
  leaderId,
  teamMembers = [],
  currentUserId,
  questionAssignments,
  pendingRequests = [],
  onAssignQuestion,
  onRejectQuestion,
  // Lifted State
  expandedPanel,
  setExpandedPanel,
  activeTab,
  setActiveTab
}) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVolumeOn, setIsVolumeOn] = useState(true);

  // Fallback for independent testing
  const [internalExpandedPanel, setInternalExpandedPanel] = useState(null);
  const [internalActiveTab, setInternalActiveTab] = useState('chat');

  const actualExpandedPanel = expandedPanel !== undefined ? expandedPanel : internalExpandedPanel;
  const actualSetExpandedPanel = setExpandedPanel || setInternalExpandedPanel;
  const actualActiveTab = activeTab !== undefined ? activeTab : internalActiveTab;
  const actualSetActiveTab = setActiveTab || setInternalActiveTab;

  const handleExpandPanel = (tab) => {
    if (actualExpandedPanel === tab) {
      actualSetExpandedPanel(null);
    } else {
      actualSetExpandedPanel(tab);
      actualSetActiveTab(tab);
    }
  };

  const handleCollapsePanel = () => {
    actualSetExpandedPanel(null);
  };

  // Helper for avatars
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500',
      'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
      'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
      'bg-pink-500', 'bg-rose-500'
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Split members
  const myMember = teamMembers.find(m => m.userId === currentUserId) || { username: 'Me', avatar: null };
  const otherMembers = teamMembers.filter(m => m.userId !== currentUserId);

  return (
    <>
      {/* Narrow Right Sidebar - Hide when panel is expanded */}
      <div className={`w-16 border-l border-gray-200 flex flex-col items-center py-6 bg-white flex-shrink-0 transition-transform duration-500 ease-in-out z-[60] ${actualExpandedPanel ? 'translate-x-[200%]' : 'translate-x-0'
        }`}>

        {/* Voice Channel Controls (Me) */}
        <div className="flex flex-col gap-4 mb-8 text-center w-full px-2">
          <div className="relative group cursor-pointer">
            <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white border border-gray-200 overflow-hidden ${getAvatarColor(myMember.username)}`}>
              {myMember.avatar ? (
                <img
                  src={myMember.avatar}
                  alt={myMember.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(myMember.username)
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>

            {/* Tooltip for Me */}
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]">
              {myMember.username} (You)
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${!isMicOn
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                : 'bg-red-50 text-red-500'
                }`}
              title="Toggle Mic"
            >
              {!isMicOn ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsVolumeOn(!isVolumeOn)}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isVolumeOn
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                : 'bg-red-50 text-red-500'
                }`}
              title="Toggle Audio"
            >
              {isVolumeOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="w-8 h-px bg-gray-100 mb-6"></div>

        {/* Other Team Members */}
        <div className="flex-1 flex flex-col gap-3 w-full items-center px-2 overflow-y-auto scrollbar-hide">
          {otherMembers.map((member) => {
            const isMemberLeader = member.userId === leaderId;
            return (
              <div key={member.userId} className="relative group cursor-pointer">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white shadow-sm border border-gray-100 ${getAvatarColor(member.username)}`}>
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.username} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    getInitials(member.username)
                  )}
                </div>

                {/* Leader Indicator */}
                {isMemberLeader && (
                  <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 border border-gray-100 shadow-sm z-10">
                    <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                  </div>
                )}

                {/* Tooltip */}
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]">
                  {member.username}
                  <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                </div>
              </div>
            )
          })}

          {/* Add Placeholder if empty */}
          {otherMembers.length === 0 && (
            <div className="w-8 h-8 rounded-full bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
              <Users className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto w-full flex flex-col items-center gap-3 px-2 py-4 border-t border-gray-100">
          {/* Requests Tab (Leader Only) */}
          {isLeader && (
            <button
              onClick={() => handleExpandPanel('requests')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative ${actualExpandedPanel === 'requests'
                ? 'bg-black text-white shadow-lg shadow-black/20'
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                }`}
              title="Requests"
            >
              <ClipboardList className="w-5 h-5" />
              {/* Pending Request Badge */}
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => handleExpandPanel('chat')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${actualExpandedPanel === 'chat'
              ? 'bg-black text-white shadow-lg shadow-black/20'
              : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            title="Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleExpandPanel('team')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative ${actualExpandedPanel === 'team'
              ? 'bg-black text-white shadow-lg shadow-black/20'
              : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            title="Team"
          >
            <Users className="w-5 h-5" />
          </button>

          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/10 backdrop-blur-[1px] z-[80] transition-opacity duration-300 ${actualExpandedPanel ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={handleCollapsePanel}
      />

      {/* Expanded Panel - Slides from right */}
      <div className={`fixed inset-y-0 right-0 z-[100] w-[400px] bg-white border-l border-gray-200 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${actualExpandedPanel ? 'translate-x-0' : 'translate-x-full'
        }`}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 bg-white">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 h-9">
            <button
              onClick={() => {
                actualSetActiveTab('chat');
                actualSetExpandedPanel('chat'); // ensure correct panel is open
              }}
              className={`px-4 h-full rounded-md text-xs font-semibold transition-all ${actualActiveTab === 'chat' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Chat
            </button>
            <button
              onClick={() => {
                actualSetActiveTab('team');
                actualSetExpandedPanel('team');
              }}
              className={`px-4 h-full rounded-md text-xs font-semibold transition-all ${actualActiveTab === 'team' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Team
            </button>
            {isLeader && (
              <button
                onClick={() => {
                  actualSetActiveTab('requests');
                  actualSetExpandedPanel('requests');
                }}
                className={`px-4 h-full rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${actualActiveTab === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Requests
                {pendingRequests.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                )}
              </button>
            )}
          </div>

          <button
            onClick={handleCollapsePanel}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative bg-gray-50/50">
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${actualActiveTab === 'chat' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
          >
            <ChatInterface />
          </div>
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${actualActiveTab === 'team' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
          >
            <TeamManagement
              isLeader={isLeader}
              leaderId={leaderId}
              teamMembers={teamMembers}
              currentUserId={currentUserId}
              questionAssignments={questionAssignments}
              pendingRequests={pendingRequests}
              onAssignQuestion={onAssignQuestion}
              onRejectQuestion={onRejectQuestion}
            />
          </div>
          {isLeader && (
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${actualActiveTab === 'requests' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
            >
              <RequestManagement
                pendingRequests={pendingRequests}
                onAssignQuestion={onAssignQuestion}
                onRejectQuestion={onRejectQuestion}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

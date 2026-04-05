'use client';

import { useState, useEffect, useRef } from 'react';
import { LogOut, Crown, UserX, Send, Hourglass, Copy, Check, X, Play, Users, MessageSquare, Lock, Trophy } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TeamSidebar({ onClose, onLeaveTeam, onKickMember, team, currentUser, roomId, isAdmin, onStartRoom }) {
  const [activeTab, setActiveTab] = useState('team'); // 'team' | 'chat'
  const [message, setMessage] = useState('');
  // Hydration fix: only render sensitive content on client
  const [isClient, setIsClient] = useState(false);

  const chatEndRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'Gowtham', userId: 'user-2', text: 'Guys ready for DP problems?', timestamp: '10:00 AM' },
    { id: 2, user: 'Afsal', userId: 'user-3', text: 'Born ready! Lets crush it.', timestamp: '10:02 AM' },
    { id: 3, user: 'You', userId: currentUser?.id, text: 'I will handle graph questions.', timestamp: '10:05 AM' }
  ]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Safe access to team properties
  const teamName = team?.name || 'Your Team';
  const teamCode = team?.code || 'XXXX-XXXX';
  const members = team?.members || [];
  const currentMemberCount = members.length || 0;
  const maxMembers = team?.maxMembers || 3;

  // Find leader
  const leaderId = team?.leaderId;
  const isLeader = currentUser?.id === leaderId;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(teamCode);
    toast.success('Invite code copied!');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add message (mock)
    const newMsg = {
      id: Date.now(),
      user: currentUser?.username || 'You',
      userId: currentUser?.id,
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages([...chatMessages, newMsg]);
    setMessage('');
  };

  return (
    <aside className="h-full w-[450px] bg-white border-l border-gray-200 flex flex-col z-50 shadow-xl shadow-gray-200/50">

      {/* 1️⃣ Sidebar Header with Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Team Lobby</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="md:hidden p-1 hover:bg-gray-100 rounded text-gray-400"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
            <button
              className="text-gray-400 hover:text-red-600 transition-colors p-1"
              title="Leave Team"
              onClick={onLeaveTeam}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs - Filter UI Theme */}
        <div className="px-6 pb-4">
          <div className="flex p-1 bg-gray-100/80 w-68 rounded-xl border border-gray-200/50">
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${activeTab === 'team'
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-950/5'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
            >
              <Users className="w-4 h-4" />
              Team
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${activeTab === 'chat'
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-950/5'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
              {chatMessages.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'chat'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-200 text-gray-600'
                  }`}>
                  {chatMessages.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2️⃣ Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">

        {/* TEAM TAB CONTENT */}
        {activeTab === 'team' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">


              {/* Team Info Card - Premium Redesign */}
              <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 mb-6 group">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -ml-12 -mb-12 opacity-50"></div>

                <div className="relative p-6">
                  {/* Header Section */}
                  <div className="flex items-start gap-5">
                    {/* Avatar with Glow */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 rounded-2xl"></div>
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-bold shadow-inner ring-4 ring-white">
                        {teamName.substring(0, 2).toUpperCase()}
                      </div>
                      {team?.visibility === 'PRIVATE' && (
                        <div className="absolute -bottom-2 -right-2 bg-gray-900 text-white p-1.5 rounded-full ring-4 ring-white shadow-sm" title="Private Team">
                          <Lock className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight truncate leading-tight">{teamName}</h2>
                      <div className="flex items-center gap-2 mt-2">
                       
                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${team?.visibility === 'PRIVATE' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                          {team?.visibility === 'PRIVATE' ? <Lock className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {team?.visibility === 'PRIVATE' ? 'Private' : 'Public'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions: Invite Code & Link */}
                  {isClient && isLeader && (
                    <div className="flex flex-col gap-2 mt-5">
                      {team?.visibility === 'PRIVATE' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(teamCode);
                              toast.success('Team code copied!');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 rounded-xl transition-all border border-gray-200 active:scale-[0.98]"
                          >
                            <span className="font-mono text-gray-500 tracking-wider">#{teamCode}</span>
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
                          toast.success('Room link copied!');
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 rounded-xl transition-all border border-blue-200 active:scale-[0.98]"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Copy Room Link
                      </button>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Members</span>
                      <span className="text-lg font-bold text-gray-900 flex items-baseline gap-1">
                        {currentMemberCount} <span className="text-sm font-medium text-gray-400">/ {maxMembers}</span>
                      </span>
                    </div>
                    <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</span>
                      <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Recruiting
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Team Members</h3>
                </div>
                <div className="space-y-2">
                  {members.map((member) => {
                    const isMe = isClient && member.userId === currentUser?.id;
                    const isMemberLeader = member.userId === leaderId;
                    const username = member.user?.username || member.username || 'Unknown';
                    const initials = username.substring(0, 2).toUpperCase();

                    return (
                      <div key={member.userId || member.id} className={`flex items-center justify-between p-3 rounded-xl border ${isMe ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100' : 'bg-white border-gray-200 hover:border-gray-300'} transition-all group`}>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm ${isMe ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                              {initials}
                            </div>
                            {isMemberLeader && (
                              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm ring-1 ring-gray-100">
                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-900">{username}</p>
                              {isMe && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 tracking-wide">YOU</span>}
                            </div>
                            <p className="text-[11px] font-medium text-gray-500">{isMemberLeader ? 'Team Leader' : 'Member'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* UserX Button only visible on client to avoid mismatch if currentUser differs */}
                          {(isClient && isLeader && !isMe) && (
                            <button
                              onClick={() => onKickMember(member.userId)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Kick Member"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                          <div className={`w-2 h-2 rounded-full ${isMe ? 'bg-emerald-500' : 'bg-emerald-500/50'}`} title="Online"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {isClient && isAdmin ? (
                <button
                  className="w-full py-3.5 rounded-xl bg-gray-900 text-white text-sm font-bold shadow-lg shadow-gray-200/50 flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] ring-4 ring-transparent hover:ring-gray-100"
                  onClick={onStartRoom}
                >
                  <Play className="w-4 h-4 fill-current" />
                  START GAME
                </button>
              ) : (
                <button disabled className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold border border-gray-200 flex items-center justify-center gap-2 cursor-not-allowed">
                  <Hourglass className="w-4 h-4" />
                  Waiting for Host to start...
                </button>
              )}
            </div>
          </div>
        )}

        {/* CHAT TAB CONTENT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Background (Blurred Mock Content) */}
            <div className="absolute inset-0 p-4 space-y-6 overflow-hidden blur-[2px] opacity-40 select-none bg-gray-50/50">
              <div className="flex justify-start"><div className="bg-white border p-3 rounded-2xl rounded-tl-none text-sm w-3/4">Hey guys, ready?</div></div>
              <div className="flex justify-end"><div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-sm w-2/3">Born ready!</div></div>
              <div className="flex justify-start"><div className="bg-white border p-3 rounded-2xl rounded-tl-none text-sm w-4/5">Let's focus on DP problems first.</div></div>
              <div className="flex justify-end"><div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-sm w-1/2">Got it.</div></div>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-8 text-center bg-white/40">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mb-6 border border-white shadow-lg shadow-blue-500/10 rotate-3">
                <MessageSquare className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Team Chat</h3>
              <p className="text-sm text-gray-500 font-medium max-w-[280px] leading-relaxed mb-8">
                Real-time collaboration and messaging tools will be available in the next major update.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-lg shadow-gray-900/10 tracking-wide">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-current" />
                COMING IN V2.0
              </div>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}

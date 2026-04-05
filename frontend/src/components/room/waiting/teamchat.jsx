'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, MoreVertical } from 'lucide-react';

const DUMMY_MESSAGES = [
  { id: 1, user: 'System', text: 'Chat started', type: 'system', time: '10:00 AM' },
  { id: 2, user: 'Gowtham', text: 'Guys ready for DP problems?', type: 'other', time: '10:02 AM', avatar: 'G' },
  { id: 3, user: 'Afsal', text: 'Born ready! I have been practicing graph algos all week.', type: 'me', time: '10:03 AM', avatar: 'A' },
  { id: 4, user: 'Sarah', text: 'Can we agree to use C++ for performance?', type: 'other', time: '10:05 AM', avatar: 'S' },
  { id: 5, user: 'Afsal', text: 'Sure, I am fine with C++ or Python.', type: 'me', time: '10:06 AM', avatar: 'A' },
];

export default function TeamChat({ className }) {
  const [messages, setMessages] = useState(DUMMY_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      user: 'Afsal', // Hardcoded current user for demo
      text: inputValue,
      type: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: 'A'
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden ${className || 'h-96'}`}>

      {/* Header (Optional, if standalone) */}
      {/* <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-semibold text-gray-700">Team Chat</span>
          </div>
          <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="w-3.5 h-3.5" /></button>
      </div> */}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-[#F9FAFB]">
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isMe = msg.type === 'me';

          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm border ${isMe ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                {msg.avatar}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end flex flex-col' : ''}`}>
                <div className="flex items-center gap-2">
                  {!isMe && <span className="text-[10px] font-semibold text-gray-700">{msg.user}</span>}
                  <span className="text-[9px] text-gray-400">{msg.time}</span>
                </div>

                <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed shadow-sm border ${isMe
                    ? 'bg-blue-600 text-white border-blue-600 rounded-tr-none'
                    : 'bg-white text-gray-800 border-gray-200 rounded-tl-none'
                  }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <button type="button" className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="w-full text-sm bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl py-2 pl-3 pr-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim()}
            className={`p-2 rounded-xl flex-shrink-0 transition-all ${inputValue.trim()
                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400'
              }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

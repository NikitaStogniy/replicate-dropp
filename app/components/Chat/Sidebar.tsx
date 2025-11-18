'use client';

import { useAppDispatch, useAppSelector } from '@/app/store';
import {
  createSession,
  switchSession,
  deleteSession,
  clearCurrentSession,
} from '@/app/store/slices/sessionsSlice';
import { Plus, Trash2, MoreVertical } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const { sessions, currentSessionId } = useAppSelector((state) => state.sessions);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleNewChat = () => {
    dispatch(createSession());
  };

  const handleSelectSession = (id: string) => {
    dispatch(switchSession(id));
    setOpenMenuId(null);
  };

  const handleDeleteSession = (id: string) => {
    dispatch(deleteSession(id));
    setOpenMenuId(null);
  };

  const handleClearSession = (id: string) => {
    if (currentSessionId === id) {
      dispatch(clearCurrentSession());
    }
    setOpenMenuId(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full border-r border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-8">No chats yet</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`relative group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-gray-700'
                    : 'hover:bg-gray-800'
                }`}
              >
                <div
                  className="flex-1 min-w-0"
                  onClick={() => handleSelectSession(session.id)}
                >
                  <p className="text-sm font-medium truncate">{session.name}</p>
                  <p className="text-xs text-gray-400">{formatDate(session.updatedAt)}</p>
                </div>

                {/* Menu Button */}
                <div className="relative ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === session.id ? null : session.id);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === session.id && (
                    <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-48">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearSession(session.id);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 first:rounded-t-lg transition-colors"
                      >
                        Clear chat
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 last:rounded-b-lg transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        {sessions.length} chat{sessions.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";

interface SidebarProps {
  sessions: { id: string; name: string }[];
  history: { id: string; calculation: string; result: string }[];
  currentSessionId: string;
  onSessionSelect: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onDeleteHistory: (id: string) => void;
  onRenameSession: (id: string, newName: string) => void;
  onHistoryItemClick?: (result: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  history, 
  currentSessionId,
  onSessionSelect, 
  onNewSession,
  onDeleteSession,
  onDeleteHistory,
  onRenameSession,
  onHistoryItemClick,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"sessions" | "history">("sessions");

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleFinishRename = () => {
    if (editingId && editName.trim()) {
      onRenameSession(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleFinishRename();
    if (e.key === "Escape") setEditingId(null);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 sm:w-14 md:w-16 bg-[#1c1c1c] text-white flex flex-col items-center py-3 sm:py-4 border-r border-[#333]">
        <button 
          onClick={onToggleCollapse}
          className="p-2 sm:p-3 hover:bg-[#2c2c2c] rounded-xl transition-colors mb-3 sm:mb-4"
          title="Expand sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <button 
          onClick={onNewSession}
          className="p-2 sm:p-3 hover:bg-[#2c2c2c] rounded-xl transition-colors mb-3 sm:mb-4"
          title="New session"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <div className="flex-1 flex flex-col gap-1 sm:gap-2 overflow-y-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSessionSelect(session.id)}
              className={`p-2 sm:p-3 rounded-xl transition-colors ${
                currentSessionId === session.id 
                  ? "bg-[#ff9f0a] text-white" 
                  : "hover:bg-[#2c2c2c] text-gray-400"
              }`}
              title={session.name}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 sm:w-72 md:w-80 bg-[#1c1c1c] text-white flex flex-col border-r border-[#333] transition-all duration-300">
      <div className="p-3 sm:p-4 border-b border-[#333] flex justify-between items-center">
        <h1 className="text-base sm:text-lg font-bold hidden sm:block">Calculator</h1>
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={onNewSession}
            className="bg-[#ff9f0a] hover:bg-[#ffb447] text-white rounded-full p-1.5 sm:p-2 transition-colors"
            title="New session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button 
            onClick={onToggleCollapse}
            className="p-1.5 sm:p-2 hover:bg-[#2c2c2c] rounded-lg transition-colors"
            title="Collapse sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex border-b border-[#333]">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
            activeTab === "sessions"
              ? "text-[#ff9f0a] border-b-2 border-[#ff9f0a]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span className="hidden sm:inline">Sessions</span> ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "text-[#ff9f0a] border-b-2 border-[#ff9f0a]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span className="hidden sm:inline">History</span> ({history.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "sessions" ? (
          <div className="p-2 sm:p-4">
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between p-2 sm:p-3 rounded-xl transition-colors ${
                    currentSessionId === session.id 
                      ? "bg-[#333] text-[#ff9f0a]" 
                      : "hover:bg-[#2c2c2c] text-gray-300"
                  }`}
                >
                  {editingId === session.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleFinishRename}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-[#121212] text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-[#ff9f0a] outline-none text-xs sm:text-sm"
                    />
                  ) : (
                    <>
                      <button
                        onClick={() => onSessionSelect(session.id)}
                        className="flex-1 text-left flex items-center gap-2 sm:gap-3 overflow-hidden"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span className="truncate text-sm">{session.name}</span>
                      </button>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStartRename(session.id, session.name); }}
                          className="p-1.5 sm:p-2 hover:text-[#ff9f0a] transition-all"
                          title="Rename"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                        </button>
                        {sessions.length > 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                            className="p-1.5 sm:p-2 hover:text-red-500 transition-all"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-2 sm:p-4">
            {history.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 sm:mb-3 opacity-50">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <p className="text-xs sm:text-sm">No history yet</p>
                <p className="text-[10px] sm:text-xs mt-1 hidden sm:block">Calculations will appear here</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="group relative">
                    <button
                      onClick={() => onHistoryItemClick?.(item.result)}
                      className="w-full text-left p-2 sm:p-3 bg-[#2c2c2c] rounded-xl border border-[#333] hover:border-[#ff9f0a] hover:bg-[#333] transition-all cursor-pointer"
                    >
                      <div className="text-[10px] sm:text-xs text-gray-400 mb-1 pr-6">{item.calculation}</div>
                      <div className="text-base sm:text-lg font-medium text-white">= {item.result}</div>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }}
                      className="absolute top-2 sm:top-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 p-1.5 sm:p-2 hover:text-red-500 transition-all"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-2 sm:p-4 border-t border-[#333] bg-[#121212]">
        <div className="text-[10px] sm:text-xs text-gray-500 text-center">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} • {history.length} calc{history.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

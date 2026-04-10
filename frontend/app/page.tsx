"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Calculator from "../components/Calculator";
import Sidebar from "../components/Sidebar";
import { calculatorApi } from "../lib/api";

interface HistoryItem {
  id: string;
  calculation: string;
  result: string;
}

interface Session {
  id: string;
  name: string;
  history: HistoryItem[];
  backendId?: number;
  isDirty?: boolean;
}

const Home = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [sessions, setSessions] = useState<Session[]>([
    { id: "1", name: "Budget Planning", history: [], backendId: undefined, isDirty: false },
  ]);
  const [currentSessionId, setCurrentSessionId] = useState("1");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [editingSessionTitle, setEditingSessionTitle] = useState(false);
  const [tempSessionName, setTempSessionName] = useState("");
  const [displayValue, setDisplayValue] = useState("0");
  const [calculatorKey, setCalculatorKey] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastTokenRef = useRef<string | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const hasUnsavedChanges = sessions.some(s => s.isDirty);

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setUsername(null);
        return;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/v1/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUsername(userData.username || userData.email?.split("@")[0] || null);
      }
    } catch (err) {
      console.log("Not logged in");
    }
  }, []);

  const loadSessionsFromBackend = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        return;
      }

      const backendSessions = await calculatorApi.getSessions();
      if (backendSessions && backendSessions.length > 0) {
        const sessionsWithHistory = await Promise.all(
          backendSessions.map(async (s: { id: number; name: string }) => {
            const history = await calculatorApi.getHistory(s.id);
            return {
              id: `backend-${s.id}`,
              name: s.name,
              history: history.map((h: { id: number; expression: string; result: string }) => ({
                id: `h-${h.id}`,
                calculation: h.expression,
                result: h.result,
              })),
              backendId: s.id,
              isDirty: false,
            };
          })
        );
        setSessions(sessionsWithHistory);
        setCurrentSessionId(sessionsWithHistory[0].id);
      }
    } catch (err) {
      console.log("Using local sessions (not logged in or error)");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token !== lastTokenRef.current) {
      lastTokenRef.current = token;
      fetchUserProfile();
      loadSessionsFromBackend();
    }
  }, [pathname, fetchUserProfile, loadSessionsFromBackend]);

  const handleNewSession = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const newBackendSession = await calculatorApi.createSession(`Session ${sessions.length + 1}`);
        const newSession: Session = {
          id: `backend-${newBackendSession.id}`,
          name: newBackendSession.name,
          history: [],
          backendId: newBackendSession.id,
          isDirty: false,
        };
        setSessions(prev => [...prev, newSession]);
        setCurrentSessionId(newSession.id);
      } else {
        const newId = `local-${Date.now()}`;
        const newSession: Session = {
          id: newId,
          name: `Session ${sessions.length + 1}`,
          history: [],
          isDirty: true,
        };
        setSessions(prev => [...prev, newSession]);
        setCurrentSessionId(newId);
      }
    } catch (err) {
      const newId = `local-${Date.now()}`;
      const newSession: Session = {
        id: newId,
        name: `Session ${sessions.length + 1}`,
        history: [],
        isDirty: true,
      };
      setSessions(prev => [...prev, newSession]);
      setCurrentSessionId(newId);
    }
  };

  const handleSessionSelect = (id: string) => {
    setCurrentSessionId(id);
  };

  const handleCalculate = async (calculation: string, result: string) => {
    const newHistoryItem: HistoryItem = {
      id: `local-${Date.now()}`,
      calculation,
      result,
    };

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          display: result,
          history: [newHistoryItem, ...s.history],
          isDirty: true,
        };
      }
      return s;
    }));
  };

  const handleDeleteSession = async (id: string) => {
    if (sessions.length <= 1) return;
    
    const sessionToDelete = sessions.find(s => s.id === id);
    if (sessionToDelete?.backendId) {
      try {
        await calculatorApi.deleteSession(sessionToDelete.backendId);
      } catch (err) {
        console.error("Failed to delete session from backend");
      }
    }

    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
      setCurrentSessionId(newSessions[0].id);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    const historyItem = currentSession?.history.find(h => h.id === id);
    
    if (historyItem && historyItem.id.startsWith("h-")) {
      const backendItemId = historyItem.id.replace("h-", "");
      try {
        await calculatorApi.deleteHistoryItem(Number(backendItemId));
      } catch (err) {
        console.error("Failed to delete history from backend");
      }
    }

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          history: s.history.filter(h => h.id !== id),
          isDirty: true,
        };
      }
      return s;
    }));
  };

  const handleRenameSession = async (id: string, newName: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, name: newName, isDirty: true };
      }
      return s;
    }));

    const session = sessions.find(s => s.id === id);
    if (session?.backendId) {
      try {
        await calculatorApi.renameSession(session.backendId, newName);
        setSessions(prev => prev.map(s => {
          if (s.id === id) {
            return { ...s, isDirty: false };
          }
          return s;
        }));
      } catch (err) {
        console.error("Failed to rename session on backend");
      }
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setSaveMessage("Please login to save");
        setIsSaving(false);
        return;
      }

      for (const session of sessions) {
        if (session.backendId) {
          if (session.isDirty && session.name) {
            await calculatorApi.renameSession(session.backendId, session.name);
          }
        } else {
          const newBackendSession = await calculatorApi.createSession(session.name);
          for (const historyItem of session.history) {
            if (!historyItem.id.startsWith("h-")) {
              await calculatorApi.calculate(historyItem.calculation, newBackendSession.id);
            }
          }
        }
      }

      setSessions(prev => prev.map(s => ({ ...s, isDirty: false })));
      await loadSessionsFromBackend();
      setSaveMessage("All saved!");
    } catch (err) {
      setSaveMessage("Save failed");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 2000);
    }
  };

  const handleSaveCurrentSession = async () => {
    if (!currentSession) return;
    setIsSaving(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setSaveMessage("Please login to save");
        setIsSaving(false);
        return;
      }

      if (currentSession.backendId) {
        await calculatorApi.renameSession(currentSession.backendId, currentSession.name);
      } else {
        const newBackendSession = await calculatorApi.createSession(currentSession.name);
        for (const historyItem of currentSession.history) {
          await calculatorApi.calculate(historyItem.calculation, newBackendSession.id);
        }
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return { ...s, backendId: newBackendSession.id, isDirty: false };
          }
          return s;
        }));
      }
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, isDirty: false };
        }
        return s;
      }));
      await loadSessionsFromBackend();
      setSaveMessage("Session saved!");
    } catch (err) {
      setSaveMessage("Save failed");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 2000);
    }
  };

  const handleStartEditTitle = () => {
    setTempSessionName(currentSession?.name || "");
    setEditingSessionTitle(true);
  };

  const handleSaveTitle = () => {
    if (tempSessionName.trim()) {
      handleRenameSession(currentSessionId, tempSessionName.trim());
    }
    setEditingSessionTitle(false);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleHistoryItemClick = (result: string) => {
    setDisplayValue(result);
    setCalculatorKey(prev => prev + 1);
  };

  return (
    <main className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <Sidebar 
        sessions={sessions.map(s => ({ id: s.id, name: s.name }))}
        history={currentSession?.history || []}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onDeleteHistory={handleDeleteHistory}
        onRenameSession={handleRenameSession}
        onHistoryItemClick={handleHistoryItemClick}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-8 overflow-auto">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 md:gap-8 w-full max-w-full">
          <Calculator 
            key={`calc-${currentSessionId}-${calculatorKey}`}
            onCalculate={handleCalculate}
            initialDisplay={displayValue}
          />
          <div className="flex flex-col items-center lg:items-start pt-2 sm:pt-4 gap-3 sm:gap-5 w-full lg:w-56 xl:w-64">
            <div className="w-full max-w-[280px] lg:max-w-full">
              <h2 className="text-gray-500 text-xs font-medium tracking-widest uppercase mb-2">Session</h2>
              {editingSessionTitle ? (
                <input
                  autoFocus
                  value={tempSessionName}
                  onChange={(e) => setTempSessionName(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setEditingSessionTitle(false);
                  }}
                  className="bg-[#1c1c1c] text-white text-base sm:text-lg font-bold px-3 sm:px-4 py-2 rounded-xl border border-[#ff9f0a] outline-none w-full"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h3 
                    className="text-white text-base sm:text-lg font-bold cursor-pointer hover:text-[#ff9f0a] transition-colors truncate"
                    onClick={handleStartEditTitle}
                  >
                    {currentSession?.name || "Untitled"}
                  </h3>
                  <button 
                    onClick={handleStartEditTitle}
                    className="p-1.5 text-gray-500 hover:text-white transition-colors shrink-0"
                    title="Edit session name"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="w-full max-w-[280px] lg:max-w-full space-y-2">
              <button
                onClick={handleSaveCurrentSession}
                disabled={isSaving || !currentSession?.isDirty}
                className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  currentSession?.isDirty
                    ? "bg-[#ff9f0a] hover:bg-[#ffb447] text-white"
                    : "bg-[#333] text-gray-500 cursor-not-allowed"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Save Session
              </button>
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  hasUnsavedChanges
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-[#333] text-gray-500 cursor-not-allowed"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Save All
              </button>
            </div>

            {saveMessage && (
              <div className={`text-xs font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${
                saveMessage.includes("failed") || saveMessage.includes("login")
                  ? "bg-red-500/20 text-red-400"
                  : "bg-green-500/20 text-green-400"
              }`}>
                {saveMessage}
              </div>
            )}

            {hasUnsavedChanges && (
              <span className="text-xs text-yellow-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                Unsaved changes
              </span>
            )}

            <div className="flex items-center gap-3 mt-1 sm:mt-2">
              <Link 
                href="/user/signin"
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs sm:text-sm"
              >
                Sign In
              </Link>
              <Link 
                href="/user/signup"
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs sm:text-sm"
              >
                Sign Up
              </Link>
              <Link 
                href="/user/profile"
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs sm:text-sm"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#ff9f0a] flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                  {username ? username[0].toUpperCase() : "U"}
                </div>
                <span className="font-medium hidden sm:inline">{username || "Profile"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;

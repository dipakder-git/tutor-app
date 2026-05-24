import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export function useSession() {
  const [activeSession, setActiveSession] = useState(null);
  const [userName, setUserName] = useState('');
  const [memoryBlock, setMemoryBlock] = useState('');
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState(null);

  // Start new session
  const startSession = useCallback(async (userId, subject, level) => {
    setIsSessionLoading(true);
    setSessionError(null);
    try {
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, subject, level }),
      });

      if (!res.ok) {
        throw new Error('Failed to create session');
      }

      const data = await res.json();
      // data: { session, memoryBlock, userName }
      setActiveSession(data.session);
      setMemoryBlock(data.memoryBlock);
      setUserName(data.userName);
      
      // Store active session ID in local storage to support refreshing
      localStorage.setItem('active_tutor_session_id', data.session.id);
      
      return data;
    } catch (err) {
      console.error(err);
      setSessionError(err.message || 'Error starting session');
      throw err;
    } finally {
      setIsSessionLoading(false);
    }
  }, []);

  // Resume session from id
  const resumeSession = useCallback(async (sessionId) => {
    if (!sessionId) return null;
    
    setIsSessionLoading(true);
    setSessionError(null);
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`);
      if (!res.ok) {
        localStorage.removeItem('active_tutor_session_id');
        throw new Error('Session not found or expired');
      }

      const data = await res.json();
      // data: { session, messages, memoryBlock, userName }
      setActiveSession(data.session);
      setMemoryBlock(data.memoryBlock);
      setUserName(data.userName);
      return data;
    } catch (err) {
      console.error(err);
      setSessionError(err.message || 'Error resuming session');
      return null;
    } finally {
      setIsSessionLoading(false);
    }
  }, []);

  // End active session
  const endSession = useCallback(async (sessionId) => {
    const id = sessionId || (activeSession && activeSession.id);
    if (!id) return;

    setIsSessionLoading(true);
    setSessionError(null);
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${id}/end`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Failed to end session');
      }

      const data = await res.json();
      
      // Clear active session
      setActiveSession(null);
      localStorage.removeItem('active_tutor_session_id');
      return data;
    } catch (err) {
      console.error(err);
      setSessionError(err.message || 'Error ending session');
      throw err;
    } finally {
      setIsSessionLoading(false);
    }
  }, [activeSession]);

  const clearSessionState = useCallback(() => {
    setActiveSession(null);
    setMemoryBlock('');
    localStorage.removeItem('active_tutor_session_id');
  }, []);

  return {
    activeSession,
    userName,
    memoryBlock,
    isSessionLoading,
    sessionError,
    startSession,
    resumeSession,
    endSession,
    clearSessionState
  };
}

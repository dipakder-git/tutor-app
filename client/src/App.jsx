import React, { useState, useEffect } from 'react';
import Onboarding from './pages/Onboarding';
import Session from './pages/Session';
import Progress from './pages/Progress';
import { useSession } from './hooks/useSession';
import { useChat } from './hooks/useChat';
import { useProgress } from './hooks/useProgress';

export default function App() {
  const [page, setPage] = useState('onboarding'); // 'onboarding' | 'session' | 'progress'
  const [currentUser, setCurrentUser] = useState(null);

  const {
    activeSession,
    userName,
    memoryBlock,
    isSessionLoading,
    sessionError,
    startSession,
    resumeSession,
    endSession,
    clearSessionState
  } = useSession();

  const {
    messages,
    isLoading: isChatLoading,
    error: chatError,
    sendMessage,
    setConversation,
    startSessionInitialGreeting
  } = useChat();

  const {
    progressData,
    isProgressLoading,
    progressError,
    fetchProgress
  } = useProgress();

  // 1. Initial hydration: Check local storage for existing user and active session
  useEffect(() => {
    const storedUser = localStorage.getItem('active_tutor_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    const activeSessionId = localStorage.getItem('active_tutor_session_id');
    if (activeSessionId) {
      resumeSession(activeSessionId).then((data) => {
        if (data) {
          // Restore conversation messages
          setConversation(data.messages || []);
          setPage('session');
        }
      });
    }
  }, [resumeSession, setConversation]);

  // 2. Handle Session start
  const handleSessionStarted = async (userId, subject, level) => {
    try {
      const data = await startSession(userId, subject, level);
      // Immediately trigger initial greeting behavior with Gemini
      await startSessionInitialGreeting({
        sessionId: data.session.id,
        subject: data.session.subject,
        level: data.session.level,
        topic: subject,
        memoryBlock: data.memoryBlock
      });
      setPage('session');
    } catch (err) {
      console.error('Error starting learning session:', err);
    }
  };

  // 3. Handle sending chat message
  const handleSendMessage = async (content) => {
    if (!activeSession) return;
    await sendMessage({
      sessionId: activeSession.id,
      userContent: content,
      subject: activeSession.subject,
      level: activeSession.level,
      topic: activeSession.subject,
      memoryBlock
    });
  };

  // 4. Handle ending session
  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      await endSession();
      // Navigate to progress dashboard
      if (currentUser) {
        await fetchProgress(currentUser.id);
      }
      setPage('progress');
    } catch (err) {
      console.error('Error ending learning session:', err);
    }
  };

  // 5. Navigate to progress page
  const handleNavigateToProgress = async (userId) => {
    if (userId) {
      await fetchProgress(userId);
      setPage('progress');
    }
  };

  // 6. Logout / Change user
  const handleLogout = () => {
    setCurrentUser(null);
    clearSessionState();
    localStorage.removeItem('active_tutor_user');
    setPage('onboarding');
  };

  // Render correct page view
  return (
    <div className="min-h-screen bg-bg-dark text-white font-sans selection:bg-brand-purple/35 selection:text-white">
      {page === 'onboarding' && (
        <Onboarding
          onSessionStarted={handleSessionStarted}
          onNavigateToProgress={handleNavigateToProgress}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      )}

      {page === 'session' && (
        <Session
          activeSession={activeSession}
          messages={messages}
          isLoading={isSessionLoading || isChatLoading}
          error={sessionError || chatError}
          memoryBlock={memoryBlock}
          onSendMessage={handleSendMessage}
          onEndSession={handleEndSession}
          onGoHome={() => setPage('onboarding')}
        />
      )}

      {page === 'progress' && (
        <Progress
          currentUser={currentUser}
          progressData={progressData}
          isLoading={isProgressLoading}
          error={progressError}
          onFetchProgress={fetchProgress}
          onStartNewSession={() => setPage('onboarding')}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

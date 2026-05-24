import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const setConversation = useCallback((loadedMessages) => {
    setMessages(loadedMessages);
  }, []);

  const sendMessage = useCallback(async ({
    sessionId,
    userContent,
    subject,
    level,
    topic,
    memoryBlock,
    onQuizDetected // callback if a quiz result was parsed
  }) => {
    if (!sessionId || !userContent.trim()) return;

    // 1. Create a user message object
    const userMessage = { role: 'user', content: userContent };
    
    // 2. Optimistically update local message state
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    try {
      // 3. Post to Express backend /api/chat
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          messages: updatedMessages,
          subject,
          level,
          topic: topic || subject, // fallback
          memoryBlock
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // 4. Update messages with the assistant response
      const assistantMessage = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMessage]);

      // 5. Trigger quiz check callback if quiz results are parsed
      // format in response text: QUIZ_RESULT: { ... }
      if (data.response.includes('QUIZ_RESULT:')) {
        if (onQuizDetected) {
          onQuizDetected(data.response);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const startSessionInitialGreeting = useCallback(async ({
    sessionId,
    subject,
    level,
    topic,
    memoryBlock
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      // For the first message, we send an empty array to indicate session start.
      // The backend will generate the initial prompt, save the greeting, and return it.
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          messages: [],
          subject,
          level,
          topic: topic || subject,
          memoryBlock
        }),
      });

      if (!response.ok) {
        throw new Error('Could not fetch initial greeting');
      }

      const data = await response.json();
      
      // The backend saves both the virtual user message "Hello! Let's begin our session."
      // and the assistant message response.
      // So we set our messages to both.
      setMessages([
        { role: 'user', content: "Hello! Let's begin our session." },
        { role: 'assistant', content: data.response }
      ]);
    } catch (err) {
      console.error('Error starting initial greeting:', err);
      setError(err.message || 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    setConversation,
    startSessionInitialGreeting
  };
}

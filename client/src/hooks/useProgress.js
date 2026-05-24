import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export function useProgress() {
  const [progressData, setProgressData] = useState({
    sessions: [],
    weakAreas: [],
    streak: 0
  });
  const [isProgressLoading, setIsProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState(null);

  const fetchProgress = useCallback(async (userId) => {
    if (!userId) return;

    setIsProgressLoading(true);
    setProgressError(null);
    try {
      const res = await fetch(`${API_BASE}/api/sessions/user/${userId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch progress metrics');
      }

      const data = await res.json();
      // data: { sessions, weakAreas, streak }
      setProgressData({
        sessions: data.sessions || [],
        weakAreas: data.weakAreas || [],
        streak: data.streak || 0
      });
      return data;
    } catch (err) {
      console.error('Error fetching progress:', err);
      setProgressError(err.message || 'Could not load progress data');
    } finally {
      setIsProgressLoading(false);
    }
  }, []);

  return {
    progressData,
    isProgressLoading,
    progressError,
    fetchProgress
  };
}

import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { buildMemoryBlock } from '../lib/memoryBuilder.js';
import { summarizeTopics } from '../lib/gemini.js';

const router = Router();

// 1. Create new session
router.post('/', async (req, res) => {
  const { userId, subject, level } = req.body;

  if (!userId || !subject || !level) {
    return res.status(400).json({ error: 'userId, subject, and level are required' });
  }

  try {
    // Get user's name
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build memory block from past sessions
    const memoryBlock = await buildMemoryBlock(userId, user.name, subject);

    // Create session in database
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        subject,
        level,
        topics_covered: []
      })
      .select('*')
      .single();

    if (sessionError) throw sessionError;

    res.status(201).json({
      session,
      memoryBlock,
      userName: user.name
    });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 2. Get session details (for resume on refresh)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        users ( name )
      `)
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Fetch messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Rebuild memory block
    const memoryBlock = await buildMemoryBlock(session.user_id, session.users.name, session.subject);

    res.json({
      session,
      messages,
      memoryBlock,
      userName: session.users.name
    });
  } catch (err) {
    console.error('Error getting session details:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 3. End session and summarize topics
router.post('/:id/end', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch messages to summarize
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    let topics = [];
    if (messages && messages.length > 0) {
      // 2. Ask Gemini to summarize topics covered
      topics = await summarizeTopics(messages);
    }

    // 3. Update session in Supabase
    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update({
        ended_at: new Date().toISOString(),
        topics_covered: topics
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    res.json(updatedSession);
  } catch (err) {
    console.error('Error ending session:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// 4. Get progress and history for a user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch all sessions for this user with quiz results
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        subject,
        level,
        topics_covered,
        started_at,
        ended_at,
        quiz_results (
          score_numerator,
          score_denominator,
          weak_areas,
          taken_at
        )
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (sessionsError) throw sessionsError;

    // Collect weak areas and format past sessions list
    const weakAreasSet = new Set();
    const pastSessionsList = [];

    sessions.forEach(s => {
      // Format session for response
      pastSessionsList.push({
        id: s.id,
        subject: s.subject,
        level: s.level,
        topics: s.topics_covered || [],
        started_at: s.started_at,
        ended_at: s.ended_at,
        quizzes: s.quiz_results || []
      });

      // Aggregate weak areas
      if (s.quiz_results) {
        const results = Array.isArray(s.quiz_results) ? s.quiz_results : [s.quiz_results];
        results.forEach(qr => {
          if (qr && qr.weak_areas) {
            qr.weak_areas.forEach(wa => {
              if (wa) weakAreasSet.add(wa.trim());
            });
          }
        });
      }
    });

    // Calculate streak
    // Find all unique dates when a session was started (YYYY-MM-DD in local time/UTC)
    const dates = sessions.map(s => {
      const d = new Date(s.started_at);
      return d.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    });

    // De-duplicate dates and sort descending
    const uniqueDates = Array.from(new Set(dates)).sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    if (uniqueDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      const lastSessionDate = uniqueDates[0];

      // If the last session was today or yesterday, we can calculate active streak
      if (lastSessionDate === todayStr || lastSessionDate === yesterdayStr) {
        streak = 1;
        let currentRefDate = new Date(lastSessionDate);

        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDateStr = uniqueDates[i];
          const expectedPrevDateStr = new Date(currentRefDate.getTime() - 86400000).toISOString().split('T')[0];
          
          if (prevDateStr === expectedPrevDateStr) {
            streak++;
            currentRefDate = new Date(prevDateStr);
          } else {
            break;
          }
        }
      }
    }

    res.json({
      sessions: pastSessionsList,
      weakAreas: Array.from(weakAreasSet),
      streak
    });
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

export default router;

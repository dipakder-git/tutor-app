import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { sendChatMessage } from '../lib/gemini.js';

const router = Router();

// Handle chat completions
router.post('/', async (req, res) => {
  const { sessionId, messages, subject, level, topic, memoryBlock } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    let history = messages || [];

    // If history is empty, it means we are starting a new session.
    // We will simulate a user greeting to trigger the first message behavior.
    if (history.length === 0) {
      const initialGreeting = 'Hello! Let\'s begin our session.';
      
      // Save initial user message to DB
      const { data: userMsg, error: userMsgErr } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: initialGreeting
        })
        .select('*')
        .single();

      if (userMsgErr) throw userMsgErr;

      history = [{ role: 'user', content: initialGreeting }];
    } else {
      // Save only the latest user message to DB (since previous ones are already saved)
      const latestMessage = history[history.length - 1];
      if (latestMessage.role === 'user') {
        const { error: userMsgErr } = await supabase
          .from('messages')
          .insert({
            session_id: sessionId,
            role: 'user',
            content: latestMessage.content
          });
        
        if (userMsgErr) {
          console.warn('Error saving user message to DB (might be duplicate):', userMsgErr);
        }
      }
    }

    // Call Gemini with full history
    const context = { subject, level, topic, memoryBlock };
    const responseText = await sendChatMessage(history, context);

    // Save assistant response to DB
    const { error: assistantMsgErr } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: responseText
      });

    if (assistantMsgErr) {
      console.warn('Error saving assistant message to DB:', assistantMsgErr);
    }

    // Parse QUIZ_RESULT tag if it exists in the assistant response
    // Format: QUIZ_RESULT: { "score": "X/Y", "weak_areas": ["topic1", "topic2"] }
    // Note: AI might output double or single quotes, or unquoted keys, let's use a regex that matches JSON.
    const quizResultMatch = responseText.match(/QUIZ_RESULT:\s*(\{.*?\})/s);
    if (quizResultMatch) {
      try {
        const jsonStr = quizResultMatch[1].trim();
        const resultObj = JSON.parse(jsonStr);
        
        if (resultObj.score) {
          const parts = resultObj.score.split('/');
          const numerator = parseInt(parts[0], 10);
          const denominator = parseInt(parts[1], 10);

          if (!isNaN(numerator) && !isNaN(denominator)) {
            const { error: quizErr } = await supabase
              .from('quiz_results')
              .insert({
                session_id: sessionId,
                score_numerator: numerator,
                score_denominator: denominator,
                weak_areas: resultObj.weak_areas || []
              });
            
            if (quizErr) {
              console.error('Error saving quiz results to DB:', quizErr);
            }
          }
        }
      } catch (parseErr) {
        console.error('Error parsing quiz result JSON:', parseErr, 'Raw string:', quizResultMatch[1]);
      }
    }

    res.json({ response: responseText });
  } catch (err) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

export default router;

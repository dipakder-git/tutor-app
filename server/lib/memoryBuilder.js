import { supabase } from './supabase.js';

/**
 * Builds the memory block string for a user and subject.
 * Format:
 * "[Name] has studied [subject] for [N] sessions. Last session covered [topics]. 
 *  Quiz results show weakness in [weak_areas]. Preferred explanation style: [inferred style]."
 * 
 * @param {string} userId - User UUID
 * @param {string} userName - User name
 * @param {string} subject - Selected subject
 * @returns {Promise<string>} Injected memory block string
 */
export async function buildMemoryBlock(userId, userName, subject) {
  try {
    // 1. Get total number of sessions for this subject
    const { count: sessionCount, error: countError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('subject', subject);

    if (countError) throw countError;

    const N = sessionCount || 0;

    // 2. Fetch the user's last 5 sessions (any subject, or this subject)
    // We fetch any subject to get the absolute last session, but we also filter for details.
    // Let's fetch the last 5 sessions for this subject specifically to provide relevant context.
    const { data: pastSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        subject,
        topics_covered,
        started_at,
        quiz_results (
          score_numerator,
          score_denominator,
          weak_areas
        )
      `)
      .eq('user_id', userId)
      .eq('subject', subject)
      .order('started_at', { ascending: false })
      .limit(5);

    if (sessionsError) throw sessionsError;

    // 3. Format topics from the last session
    let lastTopics = 'nothing yet (first session)';
    if (pastSessions && pastSessions.length > 0) {
      const lastSession = pastSessions[0];
      if (lastSession.topics_covered && lastSession.topics_covered.length > 0) {
        lastTopics = lastSession.topics_covered.join(', ');
      }
    }

    // 4. Gather weak areas from recent quizzes
    const weakAreasSet = new Set();
    if (pastSessions) {
      for (const s of pastSessions) {
        if (s.quiz_results) {
          const results = Array.isArray(s.quiz_results) ? s.quiz_results : [s.quiz_results];
          for (const qr of results) {
            if (qr && qr.weak_areas) {
              qr.weak_areas.forEach(wa => weakAreasSet.add(wa));
            }
          }
        }
      }
    }
    const weakAreas = weakAreasSet.size > 0 
      ? Array.from(weakAreasSet).join(', ') 
      : 'no major weak areas identified yet';

    // 5. Infer preferred explanation style based on subject and level
    // We can also make it adapt dynamically.
    let preferredStyle = 'practical and code-heavy (inferred)';
    if (subject) {
      const subLower = subject.toLowerCase();
      if (subLower.includes('python') || subLower.includes('code') || subLower.includes('math') || subLower.includes('science')) {
        preferredStyle = 'hands-on, code-first examples and problem-solving (inferred)';
      } else if (subLower.includes('history') || subLower.includes('english') || subLower.includes('literature')) {
        preferredStyle = 'narrative, contextual, and analogy-driven (inferred)';
      } else {
        preferredStyle = 'interactive, question-and-answer style (inferred)';
      }
    }

    // Construct final block
    return `${userName} has studied ${subject} for ${N} sessions. Last session covered: ${lastTopics}. Quiz results show weakness in: ${weakAreas}. Preferred explanation style: ${preferredStyle}.`;
  } catch (err) {
    console.error('Error building memory block:', err);
    return `${userName} has studied ${subject} for some sessions. Preferred explanation style: interactive.`;
  }
}

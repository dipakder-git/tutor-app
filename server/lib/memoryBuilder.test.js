import test from 'node:test';
import assert from 'node:assert';
import { buildMemoryBlock } from './memoryBuilder.js';
import { supabase } from './supabase.js';

test('memoryBuilder - buildMemoryBlock first session fallback', async (t) => {
  // Save original from
  const originalFrom = supabase.from;

  // Mock supabase.from to simulate 0 sessions
  supabase.from = (tableName) => {
    return {
      select: (selectQuery, options) => {
        // Mock count query
        if (options && options.count) {
          return {
            eq: () => ({
              eq: () => Promise.resolve({ count: 0, error: null })
            })
          };
        }
        
        // Mock fetch sessions query
        return {
          eq: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [], error: null })
              })
            })
          })
        };
      }
    };
  };

  try {
    const memory = await buildMemoryBlock('mock-user-id', 'John', 'Python');
    
    assert.match(memory, /John has studied Python for 0 sessions/);
    assert.match(memory, /Last session covered: nothing yet \(first session\)/);
    assert.match(memory, /Quiz results show weakness in: no major weak areas identified yet/);
    assert.match(memory, /Preferred explanation style: hands-on, code-first examples/);
  } finally {
    // Restore
    supabase.from = originalFrom;
  }
});

test('memoryBuilder - buildMemoryBlock with past history', async (t) => {
  const originalFrom = supabase.from;

  const mockSessions = [
    {
      id: 'session-1',
      subject: 'Python',
      topics_covered: ['Variables', 'Lists'],
      started_at: '2026-05-24T10:00:00Z',
      quiz_results: [
        {
          score_numerator: 3,
          score_denominator: 5,
          weak_areas: ['Lists']
        }
      ]
    },
    {
      id: 'session-2',
      subject: 'Python',
      topics_covered: ['Syntax'],
      started_at: '2026-05-23T10:00:00Z',
      quiz_results: []
    }
  ];

  // Mock supabase.from
  supabase.from = (tableName) => {
    return {
      select: (selectQuery, options) => {
        // Count query
        if (options && options.count) {
          return {
            eq: () => ({
              eq: () => Promise.resolve({ count: 2, error: null })
            })
          };
        }
        
        // Fetch sessions
        return {
          eq: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: mockSessions, error: null })
              })
            })
          })
        };
      }
    };
  };

  try {
    const memory = await buildMemoryBlock('mock-user-id', 'John', 'Python');

    assert.match(memory, /John has studied Python for 2 sessions/);
    assert.match(memory, /Last session covered: Variables, Lists/);
    assert.match(memory, /Quiz results show weakness in: Lists/);
  } finally {
    supabase.from = originalFrom;
  }
});

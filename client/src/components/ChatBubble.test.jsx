import { describe, it, expect } from 'vitest';
import React from 'react';

// Helper function equivalent to the cleaning logic inside ChatBubble.jsx
function getCleanContent(content) {
  return content.replace(/QUIZ_RESULT:\s*\{[\s\S]*?\}/gs, '').trim();
}

describe('ChatBubble component logic', () => {
  it('should remove the raw QUIZ_RESULT tag block from message content', () => {
    const rawContent = 'Here is your quiz result.\nQUIZ_RESULT: { "score": "3/5", "weak_areas": ["Lists"] }\nPlease review this.';
    const clean = getCleanContent(rawContent);
    expect(clean).toBe('Here is your quiz result.\n\nPlease review this.');
  });

  it('should return empty string if the content is only the QUIZ_RESULT block', () => {
    const rawContent = 'QUIZ_RESULT: { "score": "5/5", "weak_areas": [] }';
    const clean = getCleanContent(rawContent);
    expect(clean).toBe('');
  });

  it('should not alter normal text without the QUIZ_RESULT tag', () => {
    const rawContent = 'This is a normal explanation about variables in Python.';
    const clean = getCleanContent(rawContent);
    expect(clean).toBe('This is a normal explanation about variables in Python.');
  });
});

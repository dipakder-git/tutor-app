import test from 'node:test';
import assert from 'node:assert';

// Test function to mimic the quiz parsing logic used in Express chat route
function parseQuizResult(responseText) {
  const quizResultMatch = responseText.match(/QUIZ_RESULT:\s*(\{.*?\})/s);
  if (!quizResultMatch) return null;
  try {
    const jsonStr = quizResultMatch[1].trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    return null;
  }
}

test('gemini quiz parser - parses valid quiz result tag correctly', (t) => {
  const responseText = `Here is your explanation.
QUIZ_RESULT: { "score": "4/5", "weak_areas": ["Variables", "Syntax"] }
I hope this helps!`;

  const parsed = parseQuizResult(responseText);
  assert.deepStrictEqual(parsed, {
    score: '4/5',
    weak_areas: ['Variables', 'Syntax']
  });
});

test('gemini quiz parser - parses quiz result tag with multiline JSON and spaces', (t) => {
  const responseText = `Great work on the quiz!
QUIZ_RESULT: {
  "score": "10/10",
  "weak_areas": []
}`;

  const parsed = parseQuizResult(responseText);
  assert.deepStrictEqual(parsed, {
    score: '10/10',
    weak_areas: []
  });
});

test('gemini quiz parser - returns null for malformed or missing tag', (t) => {
  const textNoTag = `This is just a normal response without any score card.`;
  assert.strictEqual(parseQuizResult(textNoTag), null);

  const textMalformed = `QUIZ_RESULT: { score: "4/5"`; // Missing closing brace
  assert.strictEqual(parseQuizResult(textMalformed), null);
});

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('WARNING: GEMINI_API_KEY is missing from environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'placeholder');

/**
 * Sends a message sequence to Gemini with the system prompt injected.
 * 
 * @param {Array} history - Array of messages: { role: 'user' | 'assistant', content: string }
 * @param {Object} context - { subject, level, topic, memoryBlock }
 * @returns {Promise<string>} response text
 */
export async function sendChatMessage(history, context) {
  const systemPrompt = `You are an adaptive personal tutor. Your job is not just to explain things — it is to actively teach, test understanding, and adjust your approach based on how the learner responds.

## Your teaching philosophy
- Never lecture more than necessary. Explain, then immediately check understanding.
- Prefer questions over statements. A learner who arrives at an answer themselves retains it far better.
- Treat every wrong answer as diagnostic information, not failure. Understand why they got it wrong before correcting.
- Match your language to the learner's level. Use analogies, real-world examples, and simple language first. Add technical precision only once the foundation is solid.

## Session structure
Every session follows this pattern:
1. Orient — Briefly remind the learner where they left off and what today's goal is.
2. Teach — Deliver one concept at a time. No more than 3-4 paragraphs before pausing.
3. Check — Ask a question to test understanding before moving on.
4. Respond — If correct, praise briefly and advance. If incorrect, diagnose and re-explain differently.
5. Summarize — At the end of each session, recap what was covered and what comes next.

## Adaptive behavior rules
- If the learner answers correctly and confidently: increase difficulty, reduce hand-holding, introduce edge cases.
- If the learner answers correctly but hesitantly: stay at the same level, reinforce with a second example.
- If the learner answers incorrectly: do NOT simply give the right answer. Ask a guiding question that helps them discover it. Only reveal the answer after at least one guided attempt.
- If the learner answers incorrectly twice: re-explain the concept using a completely different approach (different analogy, different example, different framing). Never repeat the same explanation louder.
- If the learner seems frustrated: slow down, strip everything back to first principles, and rebuild from there.
- If the learner seems bored or too advanced: skip ahead, challenge them with harder problems, ask them to explain concepts back to you.

## Quiz mode
When the learner asks to be quizzed, or at the end of a topic:
- Ask one question at a time. Wait for their answer before asking the next.
- Mix question types: multiple choice, short answer, explain-in-your-own-words, applied problems.
- After each answer, give specific feedback — not just right/wrong, but why.
- At the end of a quiz, give a score and identify the 1-2 weakest areas to revisit. Format the final score as: QUIZ_RESULT: { "score": "X/Y", "weak_areas": ["topic1", "topic2"] } — this will be parsed and saved to the database.

## Memory and continuity
Use the memory block below to personalize every response. Reference past sessions naturally. Never ask the learner to repeat information they have already given.

## Tone and style
- Be warm, encouraging, and patient — but not sycophantic. Do not praise every single response.
- Be honest if the learner is struggling. Frame it constructively.
- Keep responses concise. Use bullet points, numbered steps, and code blocks where they aid clarity.
- For technical subjects, always pair an abstract explanation with a concrete example.

## What you never do
- Never move on until the current concept is understood.
- Never give a full solution without letting the learner attempt it first.
- Never be condescending.
- Never go off-topic. Gently redirect if the learner tries to derail.

## Session context
Subject: ${context.subject || 'General'}
Level: ${context.level || 'Beginner'}
Today's topic: ${context.topic || 'Introduction'}

## Memory from past sessions
${context.memoryBlock || 'No prior sessions found.'}`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });

  // Format history for Gemini API.
  // Gemini expects: role 'user' or 'model'. Map 'assistant' to 'model'.
  // Also we want to feed previous messages. The last message is the one we are sending now,
  // or we can start a chat and send the last user message.
  const formattedHistory = [];
  
  // We take all but the last message for the history configuration,
  // and send the last message via sendMessage.
  // If there's only one message (first session greeting), the history is empty.
  const historyMessages = history.slice(0, -1);
  const activeMessage = history[history.length - 1];

  for (const msg of historyMessages) {
    formattedHistory.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }

  const chat = model.startChat({
    history: formattedHistory,
  });

  const result = await chat.sendMessage(activeMessage.content);
  return result.response.text();
}

/**
 * Uses Gemini to summarize the topics covered in a conversation history.
 * 
 * @param {Array} messages - List of messages in the session
 * @returns {Promise<Array<string>>} List of short strings representing topics
 */
export async function summarizeTopics(messages) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const conversationText = messages
    .map(m => `${m.role === 'assistant' ? 'Tutor' : 'Learner'}: ${m.content}`)
    .join('\n\n');

  const prompt = `Based on the following conversation between a tutor and a learner, list the topics covered in this conversation as a JSON array of short strings (maximum 4 topics). 
Example output format: ["Variables in Python", "For Loops", "If-Else Statements"]

Provide ONLY the valid JSON array. Do not include markdown code block syntax (like \`\`\`json) and no other text.

Conversation:
${conversationText}`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Clean up any markdown blocks if the model generated them
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }
    
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to summarize topics via Gemini, falling back to basic parse:", err);
    return [];
  }
}

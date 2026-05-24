# Aegis AI Tutor - Personal Adaptive AI Learning Companion

Aegis AI Tutor is a full-stack personal tutor web application where learners can pick a subject, experience adaptive AI-powered lessons, take customized quizzes, and track their learning metrics over time. 

Powered by the **Gemini-2.0-flash** model, the tutor adjusts its pacing, explanation style, and quiz complexity dynamically based on student performance.

---

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express.js, CORS, dotenv
- **Database**: Supabase (Postgres)
- **AI Brain**: Gemini API (`@google/generative-ai`)

---

## Project Structure
```text
/tutor-app
  /client          ← React + Vite frontend
    /src
      /components  ← ChatBubble, QuizPanel, ProgressCard, SubjectPicker
      /pages       ← Onboarding, Session, Progress
      /hooks       ← useChat, useSession, useProgress
      App.jsx
      main.jsx
      index.css
  /server          ← Express backend
    /routes        ← chat.js, sessions.js, users.js
    /lib           ← supabase.js, gemini.js, memoryBuilder.js, schema.sql
    index.js
  vercel.json
  .env.example
  README.md
```

---

## Getting Started

### 1. Database Setup (Supabase)
1. Go to [Supabase](https://supabase.com) and create a new project.
2. Navigate to the **SQL Editor** from the left-hand sidebar.
3. Click **New Query** and copy-paste the contents of `/server/lib/schema.sql`.
4. Click **Run** to execute the query. This creates the tables: `users`, `sessions`, `quiz_results`, and `messages`, along with necessary indices.

### 2. Configure Environment Variables
1. Copy the `.env.example` file in the root directory to `.env` in **both** `/server` and `/client` directories, or simply create a single `.env` in the `/server` directory:
   ```bash
   cp .env.example server/.env
   ```
2. Fill in the values:
   - `GEMINI_API_KEY`: Obtain from [Google AI Studio](https://aistudio.google.com/).
   - `SUPABASE_URL`: Get from Supabase Project Settings > API > Project URL.
   - `SUPABASE_ANON_KEY`: Get from Supabase Project Settings > API > `anon` `public` key.

*Note: For the client, Vite loads variables prefixed with `VITE_`. Make sure your client env is placed at `client/.env` if you override base ports:*
```bash
# client/.env
VITE_API_BASE_URL=http://localhost:3001
```

### 3. Install Dependencies & Start Server

#### Backend Server:
```bash
cd server
npm install
npm run dev
```
The server will boot up on `http://localhost:3001`.

#### Frontend Client:
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
The Vite client will boot up on `http://localhost:5173` (or similar). Open this URL in your web browser.

---

## Features Built

### 1. Onboarding Screen
- Dynamic, glassmorphic layout.
- Subject selection grid supporting quick selection cards (Python, Mathematics, English, History, Science) and a text-based "Custom Subject" input.
- Level selection (Beginner, Intermediate, Advanced).

### 2. Session / Chat Screen
- Clean scrolling chat window with left-aligned tutor bubbles and right-aligned student bubbles.
- Custom lightweight React-based markdown parser rendering bold text, lists, and syntax-highlighted code blocks.
- Smart header tracking the subject and experience level.
- **Quiz Me** action button prompting AI to deliver immediate quizzes.
- **End Session** action button summarizing the topic covered and saving metrics before showing progress.

### 3. Progress Screen
- Visual growth dashboard.
- Streak Counter tracking consecutive study days.
- Total Sessions count card.
- Overall Quiz Accuracy representation.
- Areas of Growth (aggregated weak topics flagged by AI quiz results).
- Learning history timeline.

---

## Adaptive AI Rules Implemented
- Explains concepts in brief chunks, then pauses to check understanding.
- Adjusts complexity based on learner speed.
- If incorrect, guides the user to discover the answer instead of giving it.
- Flags quiz performance weak areas and saves it using the custom `QUIZ_RESULT` parse block.
- Injects a summary Memory Block of the last 5 sessions into each chat prompt.

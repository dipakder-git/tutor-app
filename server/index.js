import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRoute from './routes/users.js';
import sessionsRoute from './routes/sessions.js';
import chatRoute from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup - allow client origin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/users', usersRoute);
app.use('/api/sessions', sessionsRoute);
app.use('/api/chat', chatRoute);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initDB } from './db.js';
import authRoutes from './routes/auth.js';
import boardingRoutes from './routes/boardings.js';
import userRoutes from './routes/users.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boardings', boardingRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bodim API is running' });
});

// Initialize DB then start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  🏠 Bodim API running at http://localhost:${PORT}`);
    console.log(`  📦 Endpoints:`);
    console.log(`     POST   /api/auth/register`);
    console.log(`     POST   /api/auth/login`);
    console.log(`     POST   /api/auth/google`);
    console.log(`     GET    /api/boardings`);
    console.log(`     POST   /api/boardings`);
    console.log(`     DELETE /api/boardings/:id\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

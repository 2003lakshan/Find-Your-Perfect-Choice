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

// Railway will provide PORT automatically
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ======================
// Middleware
// ======================

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',

        // Replace this with your Vercel URL after deployment
        'https://your-vercel-app.vercel.app'
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadsDir));

// ======================
// Health Routes
// ======================

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        application: 'Bodim API',
        status: 'Online',
        message: 'Backend is running successfully 🚀'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        message: 'Bodim API is healthy'
    });
});

// ======================
// API Routes
// ======================

app.use('/api/auth', authRoutes);
app.use('/api/boardings', boardingRoutes);
app.use('/api/users', userRoutes);

// ======================
// Initialize Database
// ======================

initDB()
    .then(() => {

        app.listen(PORT, () => {

            console.log('===================================');
            console.log('🏠 Bodim Backend Started');
            console.log(`🚀 Server running on port ${PORT}`);
            console.log('===================================');

            console.log('Available Routes:');
            console.log('GET    /');
            console.log('GET    /api/health');

            console.log('POST   /api/auth/register');
            console.log('POST   /api/auth/login');
            console.log('POST   /api/auth/google');

            console.log('GET    /api/boardings');
            console.log('POST   /api/boardings');
            console.log('DELETE /api/boardings/:id');

            console.log('GET    /api/users');
            console.log('===================================');

        });

    })
    .catch(err => {

        console.error('❌ Failed to initialize database');
        console.error(err);

        process.exit(1);

    });
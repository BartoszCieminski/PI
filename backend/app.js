import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth.routes.js';
import trainingRoutes from './training.routes.js';
import bookingRoutes from './booking.routes.js';
import usersRoutes from './users.routes.js'; // ⬅️ dodane

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// log pomocniczy
console.log('Mounting routes: /api/auth, /api/trainings, /api/bookings, /api/users');

app.use('/api/auth', authRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/auth/hello', (_req, res) => {
  res.json({ message: 'Backend działa poprawnie!' });
});

export default app;

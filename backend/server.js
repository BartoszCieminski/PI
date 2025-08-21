import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth.routes.js';
import trainingRoutes from './training.routes.js';
import bookingRoutes from './booking.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/trainings', trainingRoutes); // <--- dodaj to

app.use('/api/bookings', bookingRoutes);

app.get('/api/auth/hello', (req, res) => {
  res.json({ message: 'Backend działa poprawnie!' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

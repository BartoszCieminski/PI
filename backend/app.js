import express from 'express';
import cors from 'cors';
import authRoutes from './auth.routes.js'; // zmiana ścieżki!

const app = express();

// ✅ Dokładna konfiguracja CORS
app.use(cors({
  origin: 'http://localhost:5173', // dopuszczamy front Vite
  credentials: true, // pozwala na ciasteczka/autoryzację
  allowedHeaders: ['Content-Type', 'Authorization'], // 🟢 kluczowe!
}));

app.use(express.json());
app.use('/api/auth', authRoutes);

// 👇 jeśli masz inne route'y, dodaj też je
// app.use('/api/trainings', trainingsRoutes);

export default app;

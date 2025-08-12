import express from 'express';
import { supabase } from './supabase.js'; // poprawiona ścieżka

const router = express.Router();

// Rejestracja użytkownika
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Rejestracja udana!', user: data.user });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

import express from 'express';
import supabase from './supabase.js';
import { requireRole } from './auth.middleware.js';

const router = express.Router();

// Rejestracja użytkownika z rolą
router.post('/register', async (req, res) => {
  const { email, password, role, first_name, last_name } = req.body;

  if (!email || !password || !role || !first_name || !last_name) {
    return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
  }

  try {
    const { data: user, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) return res.status(400).json({ error: signUpError.message });

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: user.user.id, role, first_name, last_name }]);

    if (profileError) return res.status(400).json({ error: profileError.message });

    res.json({ message: 'Rejestracja udana' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Logowanie użytkownika
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email i hasło są wymagane' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Logowanie udane!', session: data.session });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobieranie danych zalogowanego użytkownika
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Brak tokena' });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Nieprawidłowy token' });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return res.status(404).json({ error: 'Profil nie znaleziony' });

    res.json({ user, role: profile.role });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

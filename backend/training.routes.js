import express from 'express';
import supabase from './supabase.js';
import { requireRole } from './auth.middleware.js';

const router = express.Router();

// Pobieranie wszystkich treningów
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trainings')
      .select(`
        id,
        name,
        day_of_week,
        time_of_day,
        occupied_spots,
        room_id,
        trainer:profiles!trainings_trainer_id_fkey (first_name, last_name)
      `);

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobieranie listy trenerów (tylko dla admina)
router.get('/trainers', requireRole(['admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'trainer');

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobieranie listy sal (tylko dla admina)
router.get('/rooms', requireRole(['admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('id, name, capacity');

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodawanie treningu - tylko dla trenera lub admina
router.post('/', requireRole(['trainer', 'admin']), async (req, res) => {
  const { name, trainer_id, day_of_week, time_of_day, room_id } = req.body;

  if (!name || !trainer_id || !day_of_week || !time_of_day || !room_id) {
    return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
  }

  try {
    const { data, error } = await supabase
      .from('trainings')
      .insert([{ name, trainer_id, day_of_week, time_of_day, room_id }])
      .select();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Trening dodany pomyślnie', training: data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

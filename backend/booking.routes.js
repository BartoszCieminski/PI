// backend/booking.routes.js
import express from 'express';
import supabase from './supabase.js';
import { requireRole } from './auth.middleware.js';

const router = express.Router();

// Zapis klienta na trening
router.post('/', requireRole(['client']), async (req, res) => {
  const userId = req.user.id;
  const { training_id } = req.body;

  if (!training_id) {
    return res.status(400).json({ error: 'Brak ID treningu' });
  }

  try {
    // Czy już zapisany?
    const { data: existing, error: checkError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('training_id', training_id)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      return res.status(400).json({ error: 'Już zapisany na ten trening' });
    }

    // Wstaw nowy zapis
    const { error: insertError } = await supabase
      .from('bookings')
      .insert([{ user_id: userId, training_id }]);

    if (insertError) throw insertError;

    res.status(201).json({ message: 'Zapisano na trening' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Lista zapisów klienta
router.get('/', requireRole(['client']), async (req, res) => {
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        created_at,
        training:trainings (
          id,
          name,
          day_of_week,
          time_of_day,
          room:rooms (name),
          trainer:profiles (first_name, last_name)
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania zapisów' });
  }
});

// Anulowanie zapisu klienta
router.delete('/:id', requireRole(['client']), async (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;

  try {
    // Upewnij się, że to jego zapis
    const { data: existing, error: checkError } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('id', bookingId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (!existing || existing.user_id !== userId) {
      return res.status(403).json({ error: 'Nie masz dostępu do tego zapisu' });
    }

    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (deleteError) throw deleteError;

    res.json({ message: 'Wypisano z treningu' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

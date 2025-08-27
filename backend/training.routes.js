import express from 'express';
import supabase from './supabase.js';
import { requireRole } from './auth.middleware.js';

const router = express.Router();

// ✅ Pobieranie wszystkich treningów z opcjonalnym filtrem
router.get('/', async (req, res) => {
  try {
    const { day, trainer } = req.query;

    let query = supabase
      .from('trainings')
      .select(`
        id,
        name,
        day_of_week,
        time_of_day,
        end_time,
        duration,
        trainer:profiles!trainings_trainer_id_fkey (
          id,
          first_name,
          last_name
        ),
        room:rooms!trainings_room_id_fkey (
          id,
          name,
          capacity
        ),
        bookings (
          id,
          user_id
        )
      `);

    if (day) query = query.eq('day_of_week', day);
    if (trainer) query = query.eq('trainer_id', trainer);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    const enriched = data.map((training) => ({
      ...training,
      booked_count: training.bookings?.length || 0,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// 🧑‍🏫 Trener: lista swoich treningów z klientami
router.get('/with-clients', requireRole(['trainer']), async (req, res) => {
  const trainerId = req.user.id;

  const { data, error } = await supabase
    .from('trainings')
    .select(`
      id,
      name,
      day_of_week,
      time_of_day,
      end_time,
      bookings (
        id,
        user_id,
        user:profiles (
          first_name,
          last_name,
          email
        )
      )
    `)
    .eq('trainer_id', trainerId);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// 📋 Lista trenerów
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

// 🏟️ Lista sal z liczbą przypisanych treningów
router.get('/rooms', requireRole(['admin']), async (req, res) => {
  try {
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, capacity');

    if (roomsError) return res.status(400).json({ error: roomsError.message });

    const { data: trainings, error: trainingsError } = await supabase
      .from('trainings')
      .select('id, room_id');

    if (trainingsError) return res.status(400).json({ error: trainingsError.message });

    const trainingCountMap = trainings.reduce((acc, t) => {
      if (!t.room_id) return acc;
      acc[t.room_id] = (acc[t.room_id] || 0) + 1;
      return acc;
    }, {});

    const enrichedRooms = rooms.map((room) => ({
      ...room,
      assignedTrainingsCount: trainingCountMap[room.id] || 0,
    }));

    res.json(enrichedRooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ➕ Dodanie nowej sali
router.post('/rooms', requireRole(['admin']), async (req, res) => {
  const { name, capacity } = req.body;

  if (!name || !capacity || isNaN(capacity)) {
    return res.status(400).json({ error: 'Nazwa i liczba miejsc są wymagane' });
  }

  const { data, error } = await supabase
    .from('rooms')
    .insert([{ name, capacity: parseInt(capacity) }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Sala dodana pomyślnie', room: data[0] });
});

// ✏️ Edycja sali
router.put('/rooms/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { name, capacity } = req.body;

  if (!name || !capacity || isNaN(capacity)) {
    return res.status(400).json({ error: 'Nazwa i liczba miejsc są wymagane' });
  }

  const { error } = await supabase
    .from('rooms')
    .update({ name, capacity: parseInt(capacity) })
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Sala zaktualizowana' });
});

// 🛡️ Usuwanie sali z walidacją
router.delete('/rooms/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  const { data: usedTrainings, error: usageError } = await supabase
    .from('trainings')
    .select('id')
    .eq('room_id', id)
    .limit(1);

  if (usageError) {
    return res.status(500).json({ error: 'Błąd sprawdzania powiązań sali' });
  }

  if (usedTrainings.length > 0) {
    return res.status(400).json({ error: 'Nie można usunąć sali, która jest przypisana do treningów' });
  }

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Sala usunięta pomyślnie' });
});

// 🔍 Pobierz jedną salę po ID
router.get('/rooms/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('rooms')
    .select('id, name, capacity')
    .eq('id', id)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ➕ Dodanie treningu
router.post('/', requireRole(['trainer', 'admin']), async (req, res) => {
  const { name, trainer_id, day_of_week, time_of_day, end_time, room_id } = req.body;

  if (!name || !trainer_id || !day_of_week || !time_of_day || !end_time || !room_id) {
    return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
  }

  const [sh, sm] = time_of_day.split(':').map(Number);
  const [eh, em] = end_time.split(':').map(Number);
  const duration = (eh * 60 + em) - (sh * 60 + sm);

  if (duration <= 0) {
    return res.status(400).json({ error: 'Godzina zakończenia musi być późniejsza niż rozpoczęcia' });
  }

  try {
    const { data, error } = await supabase
      .from('trainings')
      .insert([{ name, trainer_id, day_of_week, time_of_day, end_time, duration, room_id }])
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Trening dodany pomyślnie', training: data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// 📆 Sprawdzenie dostępności sal
router.post('/check-room-availability', requireRole(['admin']), async (req, res) => {
  const { day_of_week, time_of_day, end_time } = req.body;

  if (!day_of_week || !time_of_day || !end_time) {
    return res.status(400).json({ error: 'Brakuje wymaganych danych.' });
  }

  const { data, error } = await supabase
    .from('trainings')
    .select('room_id, time_of_day, end_time')
    .eq('day_of_week', day_of_week);

  if (error) return res.status(400).json({ error: error.message });

  const [newStartH, newStartM] = time_of_day.split(':').map(Number);
  const [newEndH, newEndM] = end_time.split(':').map(Number);
  const newStart = newStartH * 60 + newStartM;
  const newEnd = newEndH * 60 + newEndM;

  const busyRoomIds = data
    .filter(({ time_of_day: start, end_time: end }) => {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      return newStart < endMin && newEnd > startMin; // kolizja
    })
    .map(t => t.room_id);

  res.json({ busyRoomIds });
});

// ✏️ Edycja treningu (z walidacją kolizji trenera)
router.put('/:id', requireRole(['admin']), async (req, res) => {
  const trainingId = req.params.id;
  const { name, trainer_id, day_of_week, time_of_day, end_time, room_id } = req.body;

  const [sh, sm] = time_of_day.split(':').map(Number);
  const [eh, em] = end_time.split(':').map(Number);
  const duration = (eh * 60 + em) - (sh * 60 + sm);

  if (duration <= 0) {
    return res.status(400).json({ error: 'Czas zakończenia musi być późniejszy niż rozpoczęcia' });
  }

  // ⛔️ Walidacja kolizji trenera (pomijamy edytowany trening)
  const { data: sameDayByTrainer, error: trainerQErr } = await supabase
    .from('trainings')
    .select('id, time_of_day, end_time')
    .eq('trainer_id', trainer_id)
    .eq('day_of_week', day_of_week)
    .neq('id', trainingId);

  if (trainerQErr) return res.status(400).json({ error: trainerQErr.message });

  const newStart = sh * 60 + sm;
  const newEnd = eh * 60 + em;

  const hasTrainerConflict = (sameDayByTrainer || []).some(({ time_of_day: s, end_time: e }) => {
    const [sh2, sm2] = s.split(':').map(Number);
    const [eh2, em2] = e.split(':').map(Number);
    const startMin = sh2 * 60 + sm2;
    const endMin = eh2 * 60 + em2;
    return newStart < endMin && newEnd > startMin;
  });

  if (hasTrainerConflict) {
    return res.status(400).json({ error: 'Trener jest w tym czasie zajęty.' });
  }

  const { error } = await supabase
    .from('trainings')
    .update({
      name,
      trainer_id,
      day_of_week,
      time_of_day,
      end_time,
      duration,
      room_id,
    })
    .eq('id', trainingId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Trening zaktualizowany' });
});

// 🔍 Pobierz jeden trening
router.get('/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('trainings')
    .select('id, name, day_of_week, time_of_day, end_time, trainer_id, room_id')
    .eq('id', id)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ❌ Usuwanie treningu
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('training_id', id)
      .limit(1);

    if (bookingError) {
      return res.status(500).json({ error: 'Błąd sprawdzania zapisów' });
    }

    if (bookings.length > 0) {
      return res.status(400).json({ error: 'Nie można usunąć treningu z zapisanymi klientami' });
    }

    const { error } = await supabase
      .from('trainings')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Trening usunięty pomyślnie' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// 📆 Sprawdzenie dostępności trenerów (z pominięciem edytowanego treningu)
router.post('/check-trainer-availability', requireRole(['admin']), async (req, res) => {
  const { day_of_week, time_of_day, end_time, ignore_training_id } = req.body;

  if (!day_of_week || !time_of_day || !end_time) {
    return res.status(400).json({ error: 'Brakuje wymaganych danych.' });
  }

  let query = supabase
    .from('trainings')
    .select('id, trainer_id, time_of_day, end_time')
    .eq('day_of_week', day_of_week);

  if (ignore_training_id) {
    query = query.neq('id', ignore_training_id);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  const [newStartH, newStartM] = time_of_day.split(':').map(Number);
  const [newEndH, newEndM] = end_time.split(':').map(Number);
  const newStart = newStartH * 60 + newStartM;
  const newEnd = newEndH * 60 + newEndM;

  const busyTrainerIds = Array.from(new Set(
    data
      .filter(({ time_of_day: start, end_time: end }) => {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        return newStart < endMin && newEnd > startMin; // kolizja
      })
      .map(t => t.trainer_id)
  ));

  res.json({ busyTrainerIds });
});

export default router;

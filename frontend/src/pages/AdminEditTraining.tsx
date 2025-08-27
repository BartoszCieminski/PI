// src/pages/AdminEditTraining.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
}
interface Room {
  id: string;
  name: string;
  capacity: number;
}
interface TrainingDto {
  id: string;
  name: string;
  day_of_week: string;
  time_of_day: string;
  end_time: string;
  trainer_id: string;
  room_id: string;
}

const daysOfWeek = [
  { value: 'monday', label: 'Poniedziałek' },
  { value: 'tuesday', label: 'Wtorek' },
  { value: 'wednesday', label: 'Środa' },
  { value: 'thursday', label: 'Czwartek' },
  { value: 'friday', label: 'Piątek' },
  { value: 'saturday', label: 'Sobota' },
  { value: 'sunday', label: 'Niedziela' },
];

const AdminEditTraining: React.FC = () => {
  const { id: trainingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [name, setName] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [busyTrainers, setBusyTrainers] = useState<string[]>([]);
  const [busyRooms, setBusyRooms] = useState<string[]>([]); // jeśli chcesz też sprawdzać sale

  // 1) Pobierz dane treningu + listy
  useEffect(() => {
    if (!token || !trainingId) return;

    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/trainings/${trainingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/api/trainings/trainers`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/api/trainings/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
    ])
      .then(([training, trainersData, roomsData]: [TrainingDto, Trainer[], Room[]]) => {
        setTrainers(trainersData);
        setRooms(roomsData);
        setName(training.name);
        setTrainerId(training.trainer_id);
        setDayOfWeek(training.day_of_week);
        setTimeOfDay(training.time_of_day);
        setEndTime(training.end_time);
        setRoomId(training.room_id);
      })
      .catch(() => setMessage('Błąd pobierania danych.'));
  }, [token, trainingId]);

  // 2) Sprawdź zajętość trenerów (z pominięciem aktualnego treningu)
  useEffect(() => {
    if (!token || !dayOfWeek || !timeOfDay || !endTime || !trainingId) return;
    if (timeOfDay >= endTime) return; // guard

    fetch(`${import.meta.env.VITE_API_URL}/api/trainings/check-trainer-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        day_of_week: dayOfWeek,
        time_of_day: timeOfDay,
        end_time: endTime,
        ignore_training_id: trainingId, // ⬅️ KLUCZOWE
      }),
    })
      .then(res => res.json())
      .then(data => setBusyTrainers(data.busyTrainerIds || []))
      .catch(() => setMessage('Błąd sprawdzania dostępności trenera'));
  }, [token, trainingId, dayOfWeek, timeOfDay, endTime]);

  // (opcjonalnie) Sprawdź zajętość sal identycznie – też z ignore_training_id
  useEffect(() => {
    if (!token || !dayOfWeek || !timeOfDay || !endTime || !trainingId) return;
    if (timeOfDay >= endTime) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/trainings/check-room-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        day_of_week: dayOfWeek,
        time_of_day: timeOfDay,
        end_time: endTime,
        ignore_training_id: trainingId, // ⬅️ jeśli rozszerzysz backend o to samo dla sal
      }),
    })
      .then(res => res.json())
      .then(data => setBusyRooms(data.busyRoomIds || []))
      .catch(() => {});
  }, [token, trainingId, dayOfWeek, timeOfDay, endTime]);

  // Jeśli wybrany trener stał się zajęty po zmianie godzin → wyczyść
  useEffect(() => {
    if (trainerId && busyTrainers.includes(trainerId)) {
      setMessage('Wybrany trener jest w tym czasie zajęty. Wybierz innego.');
      setTrainerId('');
    }
  }, [busyTrainers, trainerId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!token || !trainingId) return;

    if (timeOfDay >= endTime) {
      setMessage('Godzina zakończenia musi być późniejsza niż rozpoczęcia.');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings/${trainingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          trainer_id: trainerId,
          day_of_week: dayOfWeek,
          time_of_day: timeOfDay,
          end_time: endTime,
          room_id: roomId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        navigate('/admin/trainings');
      } else {
        setMessage(data.error || 'Błąd podczas zapisu.');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem.');
    }
  };

  const isSelectedTrainerBusy = !!trainerId && busyTrainers.includes(trainerId);
  const isSelectedRoomBusy = !!roomId && busyRooms.includes(roomId);

  return (
    <div style={{ padding: 20 }}>
      <h2>Edytuj trening</h2>

      <form onSubmit={handleSave} style={{ maxWidth: 520 }}>
        <div>
          <label>Nazwa:</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div>
          <label>Trener:</label>
          <select value={trainerId} onChange={e => setTrainerId(e.target.value)} required>
            <option value="">Wybierz trenera</option>
            {trainers.map(t => {
              const busy = busyTrainers.includes(t.id);
              return (
                <option key={t.id} value={t.id} disabled={busy}>
                  {t.first_name} {t.last_name} {busy ? ' - zajęty' : ''}
                </option>
              );
            })}
          </select>
          {isSelectedTrainerBusy && <p style={{ color: 'crimson' }}>Wybrany trener jest zajęty.</p>}
        </div>

        <div>
          <label>Dzień:</label>
          <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} required>
            <option value="">Wybierz dzień</option>
            {daysOfWeek.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Start:</label>
          <input type="time" value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)} required />
        </div>

        <div>
          <label>Koniec:</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
        </div>

        <div>
          <label>Sala:</label>
          <select value={roomId} onChange={e => setRoomId(e.target.value)} required>
            <option value="">Wybierz salę</option>
            {rooms.map(r => {
              const busy = busyRooms.includes(r.id);
              return (
                <option key={r.id} value={r.id} disabled={busy}>
                  {r.name} (pojemność: {r.capacity}) {busy ? ' - zajęta' : ''}
                </option>
              );
            })}
          </select>
          {isSelectedRoomBusy && <p style={{ color: 'crimson' }}>Wybrana sala jest zajęta.</p>}
        </div>

        <button type="submit" disabled={isSelectedTrainerBusy}>Zapisz</button>
        <button type="button" onClick={() => navigate('/admin/trainings')} style={{ marginLeft: 10 }}>
          Anuluj
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

export default AdminEditTraining;

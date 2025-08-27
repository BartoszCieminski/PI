// src/pages/AdminAddTraining.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

const daysOfWeek = [
  { value: 'monday', label: 'Poniedziałek' },
  { value: 'tuesday', label: 'Wtorek' },
  { value: 'wednesday', label: 'Środa' },
  { value: 'thursday', label: 'Czwartek' },
  { value: 'friday', label: 'Piątek' },
  { value: 'saturday', label: 'Sobota' },
  { value: 'sunday', label: 'Niedziela' },
];

const AdminAddTraining: React.FC = () => {
  const [name, setName] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [busyRooms, setBusyRooms] = useState<string[]>([]);
  const [busyTrainers, setBusyTrainers] = useState<string[]>([]); // 🔹 nowy stan

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/trainings/trainers`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setTrainers)
      .catch(() => setMessage('Błąd pobierania listy trenerów'));

    fetch(`${import.meta.env.VITE_API_URL}/api/trainings/rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setRooms)
      .catch(() => setMessage('Błąd pobierania listy sal'));
  }, [token]);

  // ✅ sprawdzanie zajętości sal
  useEffect(() => {
    if (!token || !dayOfWeek || !timeOfDay || !endTime) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/trainings/check-room-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ day_of_week: dayOfWeek, time_of_day: timeOfDay, end_time: endTime })
    })
      .then(res => res.json())
      .then(data => setBusyRooms(data.busyRoomIds || []))
      .catch(() => setMessage('Błąd sprawdzania dostępności sal'));
  }, [dayOfWeek, timeOfDay, endTime, token]);

  // ✅ NOWE: sprawdzanie zajętości trenera (analogicznie do sal)
  useEffect(() => {
    if (!token || !dayOfWeek || !timeOfDay || !endTime) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/trainings/check-trainer-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ day_of_week: dayOfWeek, time_of_day: timeOfDay, end_time: endTime })
    })
      .then(res => res.json())
      .then(data => setBusyTrainers(data.busyTrainerIds || []))
      .catch(() => setMessage('Błąd sprawdzania dostępności trenera'));
  }, [dayOfWeek, timeOfDay, endTime, token]);

  // (opcjonalnie) jeśli wybrany trener stał się zajęty po zmianie godzin — wyczyść pole i pokaż info
  useEffect(() => {
    if (trainerId && busyTrainers.includes(trainerId)) {
      setMessage('Wybrany trener jest w tym czasie zajęty. Wybierz innego.');
      setTrainerId('');
    }
  }, [busyTrainers, trainerId]);

  const handleAddTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!token) {
      setMessage('Brak tokena. Zaloguj się ponownie.');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings`, {
        method: 'POST',
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
        setMessage(data.error || 'Błąd podczas dodawania treningu.');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dodaj nowy trening</h2>

      <form onSubmit={handleAddTraining} style={{ marginTop: '20px' }}>
        <div>
          <label>Nazwa treningu:</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Trener:</label>
          <select
            value={trainerId}
            onChange={e => setTrainerId(e.target.value)}
            required
          >
            <option value="">Wybierz trenera</option>
            {trainers.map(t => {
              const isBusy = busyTrainers.includes(t.id);
              return (
                <option key={t.id} value={t.id} disabled={isBusy}>
                  {t.first_name} {t.last_name}
                  {isBusy ? ' - ten trener jest w tym czasie zajęty' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label>Dzień tygodnia:</label>
          <select
            value={dayOfWeek}
            onChange={e => setDayOfWeek(e.target.value)}
            required
          >
            <option value="">Wybierz dzień</option>
            {daysOfWeek.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Godzina rozpoczęcia:</label>
          <input
            type="time"
            value={timeOfDay}
            onChange={e => setTimeOfDay(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Godzina zakończenia:</label>
          <input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Sala:</label>
          <select
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            required
          >
            <option value="">Wybierz salę</option>
            {rooms.map(r => {
              const isBusy = busyRooms.includes(r.id);
              return (
                <option key={r.id} value={r.id} disabled={isBusy}>
                  {r.name} (pojemność: {r.capacity})
                  {isBusy ? ' - ta sala jest w tym czasie zajęta' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <button type="submit">Zapisz</button>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          style={{ marginLeft: '10px' }}
        >
          Anuluj
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

export default AdminAddTraining;

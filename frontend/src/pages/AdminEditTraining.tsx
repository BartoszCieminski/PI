import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

const AdminEditTraining: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [training, setTraining] = useState<any>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [busyRooms, setBusyRooms] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  // Pobranie danych treningu
  useEffect(() => {
    if (!token || !id) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/trainings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setTraining(data))
      .catch(() => setMessage('Błąd podczas pobierania danych treningu'));
  }, [id, token]);

  // Pobieranie trenerów i sal
  useEffect(() => {
    if (!token) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/trainings/trainers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setTrainers(data));

    fetch(`${import.meta.env.VITE_API_URL}/api/trainings/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setRooms(data));
  }, [token]);

  // Sprawdzanie dostępności sal
  useEffect(() => {
    if (!token || !training?.day_of_week || !training?.time_of_day || !training?.end_time || !training?.id) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/trainings/check-room-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        day_of_week: training.day_of_week,
        time_of_day: training.time_of_day,
        end_time: training.end_time,
      }),
    })
      .then(res => res.json())
      .then(data => {
        const busy = data.busyRoomIds.filter((roomId: string) => roomId !== training.room_id);
        setBusyRooms(busy);
      })
      .catch(() => setMessage('Błąd sprawdzania dostępności sal'));
  }, [training?.day_of_week, training?.time_of_day, training?.end_time, token, training?.id]);

  const handleSave = async () => {
    if (!training) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(training),
      });

      const data = await res.json();
      if (res.ok) {
        navigate('/admin');
      } else {
        setMessage(data.error || 'Nie udało się zapisać zmian');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  if (!training) return <p>Ładowanie treningu...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Edytuj trening</h2>
      {message && <p>{message}</p>}

      <div>
        <label>Nazwa:</label>
        <input
          type="text"
          value={training.name}
          onChange={(e) => setTraining({ ...training, name: e.target.value })}
        />
      </div>

      <div>
        <label>Trener:</label>
        <select
          value={training.trainer_id}
          onChange={(e) => setTraining({ ...training, trainer_id: e.target.value })}
        >
          <option value="">Wybierz trenera</option>
          {trainers.map(t => (
            <option key={t.id} value={t.id}>
              {t.first_name} {t.last_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Dzień tygodnia:</label>
        <select
          value={training.day_of_week}
          onChange={(e) => setTraining({ ...training, day_of_week: e.target.value })}
        >
          <option value="">Wybierz dzień</option>
          {daysOfWeek.map(day => (
            <option key={day.value} value={day.value}>{day.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Godzina rozpoczęcia:</label>
        <input
          type="time"
          value={training.time_of_day}
          onChange={(e) => setTraining({ ...training, time_of_day: e.target.value })}
        />
      </div>

      <div>
        <label>Godzina zakończenia:</label>
        <input
          type="time"
          value={training.end_time}
          onChange={(e) => setTraining({ ...training, end_time: e.target.value })}
        />
      </div>

      <div>
        <label>Sala:</label>
        <select
          value={training.room_id}
          onChange={(e) => setTraining({ ...training, room_id: e.target.value })}
        >
          <option value="">Wybierz salę</option>
          {rooms.map((room) => {
            const isBusy = busyRooms.includes(room.id);
            return (
              <option key={room.id} value={room.id} disabled={isBusy}>
                {room.name} (pojemność: {room.capacity}) {isBusy ? ' - ta sala jest w tym czasie zajęta' : ''}
              </option>
            );
          })}
        </select>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleSave}>Zapisz zmiany</button>
        <button onClick={() => navigate('/admin')} style={{ marginLeft: '10px' }}>
          Cofnij
        </button>
      </div>
    </div>
  );
};

export default AdminEditTraining;

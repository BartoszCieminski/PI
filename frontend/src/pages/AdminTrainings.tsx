import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Training {
  id: string;
  name: string;
  day_of_week: string;
  time_of_day: string;
  end_time: string;
  trainer: { id: string; first_name: string; last_name: string };
  room: { id: string; name: string };
}

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
}

interface Room {
  id: string;
  name: string;
}

const dayMap: Record<string, string> = {
  monday: 'Poniedziałek',
  tuesday: 'Wtorek',
  wednesday: 'Środa',
  thursday: 'Czwartek',
  friday: 'Piątek',
  saturday: 'Sobota',
  sunday: 'Niedziela',
};

const AdminTrainings: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [filteredTrainings, setFilteredTrainings] = useState<Training[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [message, setMessage] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        const [trainingsRes, trainersRes, roomsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/trainings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/trainings/trainers`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/trainings/rooms`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [trainingsData, trainersData, roomsData] = await Promise.all([
          trainingsRes.json(),
          trainersRes.json(),
          roomsRes.json(),
        ]);

        const dayOrder = [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ];

        trainingsData.sort((a: Training, b: Training) => {
          const dayDiff =
            dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week);
          if (dayDiff !== 0) return dayDiff;

          return a.time_of_day.localeCompare(b.time_of_day);
        });

        setTrainings(trainingsData);
        setFilteredTrainings(trainingsData);
        setTrainers(trainersData);
        setRooms(roomsData);
      } catch {
        setMessage('Błąd pobierania danych.');
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    let filtered = [...trainings];

    if (filterDay) {
      filtered = filtered.filter((t) => t.day_of_week === filterDay);
    }

    if (filterTrainer) {
      filtered = filtered.filter((t) => t.trainer.id === filterTrainer);
    }

    if (filterRoom) {
      filtered = filtered.filter((t) => t.room.id === filterRoom);
    }

    setFilteredTrainings(filtered);
  }, [filterDay, filterTrainer, filterRoom, trainings]);

  const handleDelete = async (id: string) => {
    if (!token) return;

    const confirmed = window.confirm('Czy na pewno chcesz usunąć ten trening?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessage('Trening usunięty');
        setTrainings((prev) => prev.filter((t) => t.id !== id));
      } else {
        const data = await res.json();
        setMessage(data.error || 'Błąd usuwania treningu');
      }
    } catch {
      setMessage('Błąd serwera przy usuwaniu');
    }
  };

  const resetFilters = () => {
    setFilterDay('');
    setFilterTrainer('');
    setFilterRoom('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Lista treningów</h2>

      <button onClick={() => navigate('/admin')} style={{ marginBottom: '20px' }}>
        ← Cofnij
      </button>

      {/* Filtry */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
        <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
          <option value="">Wszystkie dni</option>
          {Object.entries(dayMap).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select value={filterTrainer} onChange={(e) => setFilterTrainer(e.target.value)}>
          <option value="">Wszyscy trenerzy</option>
          {trainers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.first_name} {t.last_name}
            </option>
          ))}
        </select>

        <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)}>
          <option value="">Wszystkie sale</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <button onClick={resetFilters}>Resetuj filtry</button>
      </div>

      {message && <p>{message}</p>}

      {filteredTrainings.map((t) => (
        <div key={t.id} style={{ border: '1px solid gray', padding: '10px', marginBottom: '10px' }}>
          <p><strong>{t.name}</strong></p>
          <p>Dzień: {dayMap[t.day_of_week]}</p>
          <p>Godzina: {t.time_of_day} – {t.end_time}</p>
          <p>Trener: {t.trainer.first_name} {t.trainer.last_name}</p>
          <p>Sala: {t.room.name}</p>
          <button onClick={() => navigate(`/admin/edit/${t.id}`)}>Edytuj</button>
          <button
            onClick={() => handleDelete(t.id)}
            style={{ marginLeft: '10px', color: 'red' }}
          >
            Usuń
          </button>
        </div>
      ))}
    </div>
  );
};

export default AdminTrainings;

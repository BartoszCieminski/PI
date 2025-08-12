import React, { useState, useEffect } from 'react';

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

const AdminDashboard: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Pobieranie listy trenerów i sal
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Lista trenerów
    fetch(`${import.meta.env.VITE_API_URL}/api/trainings/trainers`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTrainers(data))
      .catch(() => setMessage('Błąd pobierania listy trenerów'));

    // Lista sal
    fetch(`${import.meta.env.VITE_API_URL}/api/trainings/rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRooms(data))
      .catch(() => setMessage('Błąd pobierania listy sal'));
  }, []);

  // Obsługa dodawania treningu
  const handleAddTraining = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
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
          room_id: roomId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Trening dodany pomyślnie!');
        setName('');
        setTrainerId('');
        setDayOfWeek('');
        setTimeOfDay('');
        setRoomId('');
        setShowForm(false);
      } else {
        setMessage(data.error || 'Błąd podczas dodawania treningu.');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Panel administratora</h1>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Anuluj' : 'Dodaj nowy trening'}
      </button>

      {showForm && (
        <form onSubmit={handleAddTraining} style={{ marginTop: '20px' }}>
          {/* Nazwa treningu */}
          <div>
            <label>Nazwa treningu:</label>
            <input
              type="text"
              placeholder="Nazwa treningu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Wybór trenera */}
          <div>
            <label>Trener:</label>
            <select
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              required
            >
              <option value="">Wybierz trenera</option>
              {trainers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Wybór dnia tygodnia */}
          <div>
            <label>Dzień tygodnia:</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              required
            >
              <option value="">Wybierz dzień</option>
              {daysOfWeek.map(d => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Wybór godziny */}
          <div>
            <label>Godzina:</label>
            <input
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              required
            />
          </div>

          {/* Wybór sali */}
          <div>
            <label>Sala:</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            >
              <option value="">Wybierz salę</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} (pojemność: {r.capacity})
                </option>
              ))}
            </select>
          </div>

          <button type="submit">Zapisz</button>
        </form>
      )}

      {message && <p>{message}</p>}
    </div>
  );
};

export default AdminDashboard;

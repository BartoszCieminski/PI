import React, { useState, useEffect } from 'react';
import TrainingCard from '../components/TrainingCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Training {
  id: string;
  name: string;
  day_of_week: string;
  time_of_day: string;
  end_time: string;
  trainer: { first_name: string; last_name: string };
  room: { name: string; capacity: number };
  bookings: { id: string; user_id: string }[];
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

const dayOrder: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

const Classes: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const { token, role, userId } = useAuth();

  const fetchTrainings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings`);
      if (!res.ok) throw new Error('Nie udało się pobrać treningów');
      const data: Training[] = await res.json();

      const sorted = data.sort((a, b) => {
        const dayA = dayOrder[a.day_of_week];
        const dayB = dayOrder[b.day_of_week];

        if (dayA !== dayB) return dayA - dayB;
        return a.time_of_day.localeCompare(b.time_of_day);
      });

      setTrainings(sorted);
    } catch (err) {
      setError('Błąd podczas pobierania treningów');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleBookTraining = async (id: string) => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (role !== 'client') {
      alert(`Twoja rola to "${role}". Tylko użytkownik może zapisać się na trening.`);
      return;
    }

    const confirmed = window.confirm('Czy na pewno chcesz zapisać się na ten trening?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ training_id: id }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Zapisano na trening!');
        fetchTrainings();
      } else {
        setMessage(data.error || 'Nie udało się zapisać');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  if (loading) return <p>Ładowanie treningów...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Witamy w Fitness Club</h1>
      <h3>Lista dostępnych treningów</h3>
      {message && <p>{message}</p>}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {trainings.map((training) => {
          const booked = training.bookings?.length || 0;
          const capacity = training.room?.capacity || 0;
          const available = Math.max(capacity - booked, 0);
          const spots = `${available}/${capacity}`;

          const alreadyBooked = training.bookings.some(b => b.user_id === userId);
          const canBook = role === 'client' && available > 0 && !alreadyBooked;

          return (
            <TrainingCard
              key={training.id}
              training={{
                id: training.id,
                name: training.name,
                trainer: `${training.trainer?.first_name || ''} ${training.trainer?.last_name || ''}`,
                time: training.time_of_day,
                endTime: training.end_time,
                dayLabel: dayMap[training.day_of_week],
                spots,
                alreadyBooked,
              }}
              onBook={canBook ? handleBookTraining : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Classes;

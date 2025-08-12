import React, { useState, useEffect } from 'react';
import TrainingCard from '../components/TrainingCard';
import { useNavigate } from 'react-router-dom';

interface Training {
  id: string;
  name: string;
  day_of_week: string;
  time_of_day: string;
  trainer: {
    first_name: string;
    last_name: string;
  };
}

const dayMap: Record<string, string> = {
  monday: 'Poniedziałek',
  tuesday: 'Wtorek',
  wednesday: 'Środa',
  thursday: 'Czwartek',
  friday: 'Piątek',
  saturday: 'Sobota',
  sunday: 'Niedziela'
};

const Classes: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings`);
        if (!res.ok) throw new Error('Nie udało się pobrać treningów');
        const data = await res.json();
        setTrainings(data);
      } catch (err) {
        setError('Błąd podczas pobierania treningów');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainings();
  }, []);

  const handleBookTraining = (id: string) => {
    navigate('/login');
  };

  if (loading) return <p>Ładowanie treningów...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Witamy w Fitness Club</h1>
      <h3>Lista dostępnych treningów</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {trainings.map((training) => (
          <TrainingCard
            key={training.id}
            training={{
              id: training.id,
              name: training.name,
              trainer: `${training.trainer?.first_name || ''} ${training.trainer?.last_name || ''}`,
              time: `${dayMap[training.day_of_week]} ${training.time_of_day}`
            }}
            onBook={handleBookTraining}
          />
        ))}
      </div>
    </div>
  );
};

export default Classes;

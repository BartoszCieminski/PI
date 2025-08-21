import React, { useEffect, useState } from 'react';

interface Training {
  id: string;
  name: string;
  day_of_week: string;
  time_of_day: string;
  end_time: string;
  duration: number;
  booked_count: number;
  trainer: { first_name: string; last_name: string };
  room: { name: string; capacity: number };
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

const dayOrder = Object.keys(dayMap);

const Classes: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [filtered, setFiltered] = useState<Training[]>([]);
  const [dayFilter, setDayFilter] = useState('');
  const [trainerFilter, setTrainerFilter] = useState('');
  const [message, setMessage] = useState('');

  const fetchTrainings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings`);
      const data = await res.json();

      const sorted = data.sort((a: Training, b: Training) => {
        const dayDiff = dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week);
        return dayDiff !== 0
          ? dayDiff
          : a.time_of_day.localeCompare(b.time_of_day);
      });

      setTrainings(sorted);
      setFiltered(sorted);
    } catch {
      setMessage('Błąd pobierania treningów');
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  useEffect(() => {
    let filtered = trainings;

    if (dayFilter) {
      filtered = filtered.filter(t => t.day_of_week === dayFilter);
    }

    if (trainerFilter) {
      filtered = filtered.filter(
        t =>
          `${t.trainer.first_name} ${t.trainer.last_name}`.toLowerCase() ===
          trainerFilter.toLowerCase()
      );
    }

    setFiltered(filtered);
  }, [dayFilter, trainerFilter, trainings]);

  const resetFilters = () => {
    setDayFilter('');
    setTrainerFilter('');
  };

  const uniqueTrainers = Array.from(
    new Set(trainings.map(t => `${t.trainer.first_name} ${t.trainer.last_name}`))
  );

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Witamy w Fitness Club</h1>
      <p style={{ textAlign: 'center', marginBottom: '30px' }}>
        <strong>Lista dostępnych treningów</strong>
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <select value={dayFilter} onChange={e => setDayFilter(e.target.value)}>
          <option value="">Filtruj po dniu tygodnia</option>
          {Object.entries(dayMap).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select value={trainerFilter} onChange={e => setTrainerFilter(e.target.value)}>
          <option value="">Filtruj po trenerze</option>
          {uniqueTrainers.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <button onClick={resetFilters}>Resetuj filtry</button>
      </div>

      {message && <p>{message}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
        {filtered.map(t => {
          const available = t.room.capacity - t.booked_count;
          return (
            <div
              key={t.id}
              style={{
                border: '1px solid gray',
                padding: '15px',
                borderRadius: '8px',
                width: '220px',
                textAlign: 'center',
              }}
            >
              <p><strong>{t.name}</strong></p>
              <p>Trener: {t.trainer.first_name} {t.trainer.last_name}</p>
              <p>Dzień tygodnia: {dayMap[t.day_of_week]}</p>
              <p>Godzina rozpoczęcia: {t.time_of_day}</p>
              <p>Godzina zakończenia: {t.end_time}</p>
              <p>Dostępne miejsca: {available}/{t.room.capacity}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Classes;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface User {
  first_name: string;
  last_name: string;
  email: string;
}

interface Booking {
  id: string;
  user: User;
}

interface Training {
  id: string;
  name: string;
  day_of_week: string;
  time_of_day: string;
  bookings: Booking[];
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

const TrainerDashboard: React.FC = () => {
  const { token } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings/with-clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Błąd pobierania danych');
        setTrainings(data);
      } catch (err: any) {
        setError(err.message || 'Błąd serwera');
      }
    };

    fetchTrainings();
  }, [token]);

  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Twoje treningi i zapisani klienci</h2>
      {trainings.map((training) => (
        <div key={training.id} style={{ border: '1px solid #ccc', margin: '15px', padding: '10px' }}>
          <h3>{training.name}</h3>
          <p>
            {dayMap[training.day_of_week.toLowerCase()]}, godz. {training.time_of_day}
          </p>
          <h4>Zapisani uczestnicy:</h4>
          {training.bookings.length === 0 ? (
            <p>Brak zapisanych osób</p>
          ) : (
            <ul>
              {training.bookings.map((booking) => (
                <li key={booking.id}>
                  {booking.user.first_name} {booking.user.last_name} ({booking.user.email})
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default TrainerDashboard;

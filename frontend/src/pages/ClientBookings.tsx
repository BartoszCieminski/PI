import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Training {
  id: string;
  name: string;
  day_of_week: string;
  time_of_day: string;
  room: { name: string };
  trainer: { first_name: string; last_name: string };
}

interface Booking {
  id: string;
  created_at: string;
  training: Training;
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

const ClientBookings: React.FC = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchBookings = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setBookings(data);
      else setMessage(data.error || 'Błąd pobierania treningów');
    } catch {
      setMessage('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleCancelBooking = async (bookingId: string) => {
    const confirmed = window.confirm('Czy na pewno chcesz się wypisać?');
    if (!confirmed || !token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      } else {
        const data = await res.json();
        setMessage(data.error || 'Nie udało się wypisać');
      }
    } catch {
      setMessage('Błąd serwera');
    }
  };

  if (loading) return <p>Ładowanie…</p>;

  return (
    <div style={{ padding: '20px' }}>
    <button
          onClick={() => navigate('/client')}
          style={{
            marginBottom: 20,
            padding: '6px 12px',
            background: '#444',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          ← Cofnij
    </button>
      <h2>Twoje zapisy na treningi</h2>
      {message && <p>{message}</p>}
      {bookings.length === 0 ? (
        <p>Nie masz aktywnych zapisów.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {bookings.map((booking) => (
            <li
              key={booking.id}
              style={{
                marginBottom: '15px',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '8px',
              }}
            >
              <strong>{booking.training.name}</strong> <br />
              Dzień: {dayMap[booking.training.day_of_week]} <br />
              Godzina: {booking.training.time_of_day} <br />
              Trener: {booking.training.trainer.first_name} {booking.training.trainer.last_name} <br />
              Sala: {booking.training.room.name}
              <br />
              <button
                onClick={() => handleCancelBooking(booking.id)}
                style={{ marginTop: '10px', backgroundColor: '#c00', color: '#fff' }}
              >
                Wypisz się
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientBookings;

import React, { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale from '@fullcalendar/core/locales/pl';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import '../../css/FullCalendar.css';

type Trainer = { first_name: string; last_name: string };
type Room = { name: string };
type Training = {
  id: string;
  name: string;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  time_of_day: string; // "HH:mm:ss"
  duration?: number | null; // minuty (jeśli masz)
  trainer: Trainer;
  room: Room;
};

type Booking = {
  id: string;
  training: Training;
};

const dayToFcIndex: Record<Training['day_of_week'], number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

function addMinutesToTimeStr(time: string, minutes: number): string {
  // time "HH:mm:ss" => końcowy "HH:mm:ss"
  const [h, m, s] = time.split(':').map((v) => parseInt(v, 10));
  const total = h * 60 + m + minutes;
  const endH = Math.floor((total % (24 * 60)) / 60);
  const endM = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(endH)}:${pad(endM)}:${s?.toString().padStart(2, '0') ?? '00'}`;
}

const ClientCalendar: React.FC = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const navigate = useNavigate();

  const api = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchBookings = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${api}/api/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Nie udało się pobrać zapisów');
        setBookings(data);
      } catch (e: any) {
        setErrorMsg(e.message || 'Błąd połączenia z serwerem');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [token, api]);

  const events = useMemo(() => {
    return bookings
      .filter((b) => b?.training)
      .map((b) => {
        const t = b.training;
        const startTime = t.time_of_day;
        const durationMin = t.duration ?? 60; // fallback 60 min jeśli brak duration
        const endTime = addMinutesToTimeStr(startTime, durationMin);

        return {
          id: b.id,
          title: `${t.name} • ${t.trainer.first_name} ${t.trainer.last_name} • ${t.room.name}`,
          daysOfWeek: [dayToFcIndex[t.day_of_week]], // powtarzalne co tydzień
          startTime, // "HH:mm:ss"
          endTime,   // "HH:mm:ss"
          // można dodać backgroundColor/borderColor jeśli chcesz
        };
      });
  }, [bookings]);

  if (loading) return <div style={{ padding: 20 }}>Ładowanie kalendarza…</div>;

  return (
    <div style={{ padding: 20 }}>
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
      <h1>Twój kalendarz treningów</h1>
      {errorMsg && <p style={{ color: 'tomato' }}>{errorMsg}</p>}
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={plLocale}
        height="auto"
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        nowIndicator={true}
        allDaySlot={false}
        firstDay={1} // poniedziałek
        events={events as any}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
      />
    </div>
  );
};

export default ClientCalendar;

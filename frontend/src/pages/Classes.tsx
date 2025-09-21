// src/pages/Classes.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
interface Training {
  id: string;
  name: string;
  day_of_week: string;     // 'monday' | ... | 'sunday'
  time_of_day: string;     // 'HH:mm'
  end_time: string;        // 'HH:mm'
  trainer: Trainer | null;
  room: Room | null;
  booked_count?: number;
}
interface Booking {
  id: string;
  training?: { id: string } | null;
  training_id?: string;
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

const daysOrder = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

// bez regexów – zdejmujemy diakrytyki przez NFD
const stripDiacritics = (s: string) => {
  const d = s.normalize('NFD');
  let out = '';
  for (let i = 0; i < d.length; i++) {
    const code = d.charCodeAt(i);
    if (code >= 0x0300 && code <= 0x036F) continue;
    out += d[i];
  }
  return out;
};
const normalizeNoRegex = (s: string) => stripDiacritics(s).toLowerCase();

const Classes: React.FC = () => {
  const navigate = useNavigate();
  const { token, role } = useAuth();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [myBookedIds, setMyBookedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');

  // filtry
  const [filterDay, setFilterDay] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // 1) treningi
      const trainingsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings`, { headers });
      const trainingsData = trainingsRes.ok ? await trainingsRes.json() : [];
      setTrainings(Array.isArray(trainingsData) ? trainingsData : []);

      // 2) moje zapisy (tylko jeśli zalogowany)
      if (token) {
        const bookingsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, { headers });
        const bookingsData: Booking[] = bookingsRes.ok ? await bookingsRes.json() : [];
        const setIds = new Set<string>();
        bookingsData.forEach(b => {
          const id = b.training?.id || b.training_id;
          if (id) setIds.add(id);
        });
        setMyBookedIds(setIds);
      } else {
        setMyBookedIds(new Set());
      }
    } catch {
      setMessage('Błąd pobierania danych.');
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // lista trenerów wyliczona z treningów (zamiast /api/trainings/trainers)
  const trainerOptions = useMemo(() => {
    const map = new Map<string, Trainer>();
    trainings.forEach(t => {
      if (t.trainer?.id) map.set(t.trainer.id, t.trainer);
    });
    return Array.from(map.values());
  }, [trainings]);

  // filtry + wyszukiwarka
  const filtered = useMemo(() => {
    const term = normalizeNoRegex(searchTerm.trim());
    return trainings
      .filter((t) => (filterDay ? t.day_of_week === filterDay : true))
      .filter((t) => (filterTrainer ? t.trainer?.id === filterTrainer : true))
      .filter((t) => (term ? normalizeNoRegex(t.name).includes(term) : true));
  }, [trainings, filterDay, filterTrainer, searchTerm]);

  // grupowanie wg dnia + sort po godzinie
  const groupedByDay = useMemo(() => {
    const groups: Record<string, Training[]> = {
      monday: [], tuesday: [], wednesday: [],
      thursday: [], friday: [], saturday: [], sunday: [],
    };
    for (const t of filtered) if (groups[t.day_of_week]) groups[t.day_of_week].push(t);
    for (const d of Object.keys(groups)) {
      groups[d].sort((a, b) => a.time_of_day.localeCompare(b.time_of_day));
    }
    return groups;
  }, [filtered]);

  const resetFilters = () => {
    setFilterDay(''); setFilterTrainer(''); setSearchTerm('');
  };

  const handleBook = async (trainingId: string) => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (role !== 'client') {
      alert(`Twoja rola to "${role}". Tylko klient może zapisać się na trening.`);
      return;
    }
    const confirmed = window.confirm('Czy na pewno chcesz zapisać się na ten trening?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ training_id: trainingId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Zapisano na trening!');
        await fetchData(); // odśwież miejsca + moje zapisy
      } else {
        setMessage(data?.error || 'Nie udało się zapisać');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  // style kafelka (jak w Twojej wersji)
  const tileStyle: React.CSSProperties = {
    width: 320,
    border: '1px solid #333',
    borderRadius: 8,
    padding: 16,
    background: '#1c1c1c',
    color: '#eee',
    boxSizing: 'border-box',
  };
  const titleStyle: React.CSSProperties = { margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700 };
  const rowStyle: React.CSSProperties = { margin: '8px 0', fontSize: 14 };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Witamy w Fitness Club</h1>
      <p style={{ textAlign: 'center', marginBottom: 16 }}>Lista dostępnych treningów</p>

      {/* Filtry + wyszukiwarka */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
          <option value="">Filtruj po dniu tygodnia</option>
          {Object.entries(dayMap).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select value={filterTrainer} onChange={(e) => setFilterTrainer(e.target.value)}>
          <option value="">Filtruj po trenerze</option>
          {trainerOptions.map((t) => (
            <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Szukaj po nazwie…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ minWidth: 220, padding: '6px 8px' }}
        />

        <button onClick={resetFilters}>Resetuj filtry</button>
      </div>

      {message && <p style={{ textAlign: 'center', color: 'crimson' }}>{message}</p>}

      {/* Wiersze wg dni tygodnia */}
      <div style={{ display: 'grid', gap: 28 }}>
        {daysOrder.map((dayKey) => {
          const dayTrainings = groupedByDay[dayKey] || [];
          return (
            <div key={dayKey}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>
                {dayMap[dayKey]}
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {dayTrainings.length === 0 ? (
                  <span style={{ opacity: 0.7 }}>Brak treningów</span>
                ) : (
                  dayTrainings.map((t) => {
                    const capacity = t.room?.capacity ?? 0;
                    const booked = t.booked_count ?? 0;
                    const free = Math.max(capacity - booked, 0);
                    const alreadyBooked = myBookedIds.has(t.id);

                    return (
                      <div key={t.id} style={tileStyle}>
                        <h3 style={titleStyle}>{t.name}</h3>

                        <div style={rowStyle}>
                          <strong>Trener:</strong> {t.trainer?.first_name} {t.trainer?.last_name}
                        </div>
                        <div style={rowStyle}>
                          <strong>Dzień tygodnia:</strong> {dayMap[t.day_of_week]}
                        </div>
                        <div style={rowStyle}>
                          <strong>Godzina rozpoczęcia:</strong> {t.time_of_day}
                        </div>
                        <div style={rowStyle}>
                          <strong>Godzina zakończenia:</strong> {t.end_time}
                        </div>
                        <div style={rowStyle}>
                          <strong>Dostępne miejsca:</strong> {free}/{capacity}
                        </div>

                        {alreadyBooked ? (
                          <div style={{ marginTop: 10, color: 'limegreen', fontWeight: 600 }}>
                            Jesteś już zapisany na te zajęcia.{` `}
                            <a
                              href="http://localhost:5173/client/bookings"
                              style={{ color: '#4da3ff', textDecoration: 'underline', marginLeft: 4 }}
                            >
                              Zobacz to w swoim panelu klienta.
                            </a>
                          </div>
                        ) : free > 0 ? (
                          <button style={{ marginTop: 10 }} onClick={() => handleBook(t.id)}>
                            Zapisz się
                          </button>
                        ) : (
                          <div style={{ marginTop: 10, opacity: 0.7 }}>Brak miejsc</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Classes;

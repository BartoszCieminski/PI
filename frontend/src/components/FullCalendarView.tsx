// src/components/FullCalendarView.tsx
import React, { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import plLocale from '@fullcalendar/core/locales/pl';
import "../../css/FullCalendar.css";

type Training = {
  id: string;
  name: string;
  day_of_week: string;
  time_of_day: string;  // "HH:mm"
  end_time: string;     // "HH:mm"
  trainer: { id: string; first_name: string; last_name: string };
  room: { id: string; name: string };
};

const dayIndex: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
};

const mondayThisWeek = () => {
  const now = new Date();
  const day = now.getDay(); // 0..6 (Sun..Sat)
  const diff = (day === 0 ? -6 : 1 - day); // back to Monday
  const d = new Date(now);
  d.setHours(0,0,0,0);
  d.setDate(now.getDate() + diff);
  return d;
};

const toDate = (baseMonday: Date, dow: string, time: string) => {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(baseMonday);
  const idx = dayIndex[dow.toLowerCase()];
  d.setDate(d.getDate() + idx);
  d.setHours(h, m, 0, 0);
  return d;
};

const FullCalendarView: React.FC<{ groupBy?: 'room' | 'trainer' }> = ({ groupBy = 'room' }) => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/trainings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setTrainings)
      .catch(() => {/* TODO: obsługa błędu */});
  }, [token]);

  const baseMonday = useMemo(() => mondayThisWeek(), []);
  const resources = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    for (const t of trainings) {
      if (groupBy === 'room') {
        map.set(t.room.id, { id: t.room.id, title: t.room.name });
      } else {
        map.set(t.trainer.id, { id: t.trainer.id, title: `${t.trainer.first_name} ${t.trainer.last_name}` });
      }
    }
    return Array.from(map.values());
  }, [trainings, groupBy]);

  const events = useMemo(() => {
    return trainings.map((t) => ({
      id: t.id,
      title: `${t.name} (${t.trainer.first_name} ${t.trainer.last_name})`,
      start: toDate(baseMonday, t.day_of_week, t.time_of_day),
      end: toDate(baseMonday, t.day_of_week, t.end_time),
      resourceId: groupBy === 'room' ? t.room.id : t.trainer.id,
    }));
  }, [trainings, baseMonday, groupBy]);

  return (
    <div className="fc-scroll-x">        {/* poziomy scroll */}
        <div className="fc-inner-wide">    {/* duże minimum szerokości */}
        <FullCalendar
            slotEventOverlap={false}           // ⬅️ KLUCZOWE: brak nakładania w siatce — układ obok siebie
            eventOverlap={true}                // to dotyczy przeciągania, zostaw true/usuń; ważne jest slotEventOverlap
            dayMaxEventRows={false}            // bez „stackowania” w wierszach
            plugins={[timeGridPlugin, interactionPlugin, resourceTimeGridPlugin]}
            initialView="resourceTimeGridWeek"
            locales={[plLocale]}
            locale="pl"
            firstDay={1}
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            nowIndicator
            expandRows
            height="90vh"
            resources={resources}
            events={events}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimeGridWeek,timeGridWeek,timeGridDay',
            }}
            resourceAreaWidth={140}   // szerokość kolumny z nazwą sali/trenera
            handleWindowResize        // dopasuj wysokość przy zmianie okna
        />
        </div>
    </div>
    );

};

export default FullCalendarView;

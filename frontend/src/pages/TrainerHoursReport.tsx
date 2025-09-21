// src/pages/TrainerHoursReport.tsx
import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type Training = {
  id: string;
  name: string;
  day_of_week: 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday'|string;
  time_of_day: string; // "HH:mm" lub "HH:mm:ss"
  end_time: string;    // "HH:mm" lub "HH:mm:ss"
  trainer?: { id: string } | null;
  trainer_id?: string | null;
};

const dayMap: Record<string, string> = {
  monday: 'Poniedziałek',
  tuesday: 'Wtorek',
  wednesday: 'Środa',
  thursday: 'Czwartek',
  friday: 'Piątek',
  saturday: 'Sobota',
  sunday: 'Niedziela',
};

function toHM(s: string): string {
  if (!s) return '00:00';
  const [h = '00', m = '00'] = s.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}
function diffHours(startHM: string, endHM: string): number {
  const [sh, sm] = startHM.split(':').map(Number);
  const [eh, em] = endHM.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const diffMin = endMin - startMin;
  return Math.max(diffMin, 0) / 60; // zakładamy ten sam dzień
}

const TrainerHoursReport: React.FC = () => {
  const { token, role, userId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Błąd pobierania treningów');

      const trainings: Training[] = await res.json();

      // ✅ obsłuż obie struktury: trainer.id i trainer_id
      const myTrainings = trainings.filter(
        (t) => (t.trainer?.id && t.trainer.id === userId) || (t.trainer_id && t.trainer_id === userId)
      );

      if (myTrainings.length === 0) {
        alert('Brak Twoich treningów do raportu.');
        setLoading(false);
        return;
      }

      const rows = myTrainings.map((t) => {
        const start = toHM(t.time_of_day);
        const end = toHM(t.end_time);
        const hours = diffHours(start, end);
        return {
          name: t.name,
          day: dayMap[t.day_of_week] ?? t.day_of_week,
          start,
          end,
          hours,
        };
      });

      const totalHours = rows.reduce((acc, r) => acc + r.hours, 0);

      // ExcelJS workbook
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Raport godzin');

      ws.columns = [
        { header: 'Nazwa treningu', key: 'name', width: 32 },
        { header: 'Dzień tygodnia', key: 'day', width: 18 },
        { header: 'Start', key: 'start', width: 10 },
        { header: 'Koniec', key: 'end', width: 10 },
        { header: 'Czas [h]', key: 'hours', width: 12 },
      ];

      rows.forEach((r) => ws.addRow({ ...r, hours: r.hours.toFixed(2) }));

      // Wiersz sumy
      const totalRow = ws.addRow({
        name: '',
        day: '',
        start: '',
        end: 'Suma:',
        hours: totalHours.toFixed(2),
      });
      totalRow.font = { bold: true };

      // Prosty styl nagłówka
      const header = ws.getRow(1);
      header.font = { bold: true };
      header.alignment = { vertical: 'middle', horizontal: 'center' };

      const buf = await wb.xlsx.writeBuffer();
      saveAs(
        new Blob([buf], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        `raport-godzin-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (err) {
      console.error(err);
      alert('Nie udało się wygenerować raportu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate('/trainer')} style={{ marginBottom: 20 }}>
        ← Cofnij
      </button>

      <h1>Raport godzin treningów</h1>
      <p>Wygeneruj raport swoich godzin w formacie Excel (z sumą na dole).</p>

      <button onClick={generateReport} disabled={loading || role !== 'trainer'}>
        {loading ? 'Generuję…' : 'Pobierz raport XLSX'}
      </button>
    </div>
  );
};

export default TrainerHoursReport;

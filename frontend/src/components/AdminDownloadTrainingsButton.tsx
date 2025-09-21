import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useAuth } from '../context/AuthContext';

type Trainer = { first_name?: string; last_name?: string } | null;
type Training = {
  id: string;
  name?: string;
  trainer?: Trainer;
  bookings?: unknown[];
  booked_count?: number; // jeśli backend zwraca gotowy licznik
};

const AdminExportReportButton: React.FC = () => {
  const { token, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const disabled = loading || role !== 'admin';

  const fetchTrainings = async (): Promise<Training[]> => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Nie udało się pobrać treningów');
    return (await res.json()) as Training[];
  };

  const exportXlsx = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchTrainings();

      // 1) Workbook/Worksheet
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Raport');

      // 2) Nagłówki + kolumny
      ws.columns = [
        { header: 'Nazwa treningu', key: 'name', width: 32 },
        { header: 'Trener',        key: 'trainer', width: 28 },
        { header: 'Liczba zapisanych', key: 'booked', width: 20 },
      ];

      // 3) Wiersze danych
      data.forEach(t => {
        const trainerName = t.trainer
          ? `${t.trainer.first_name ?? ''} ${t.trainer.last_name ?? ''}`.trim()
          : '';
        const booked = typeof t.booked_count === 'number'
          ? t.booked_count
          : (t.bookings?.length ?? 0);

        ws.addRow({
          name: t.name ?? '',
          trainer: trainerName,
          booked,
        });
      });

      // 4) Prosty styl nagłówka
      const header = ws.getRow(1);
      header.font = { bold: true };
      header.alignment = { vertical: 'middle', horizontal: 'center' };
      header.eachCell(c => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
        c.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // 5) Zapis do pliku (przeglądarka)
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const ts = new Date().toISOString().slice(0, 10);
      saveAs(blob, `raport-treningi-${ts}.xlsx`);
    } catch (e) {
      console.error('Eksport raportu nie powiódł się', e);
      alert('Nie udało się wygenerować raportu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={exportXlsx}
      disabled={disabled}
      style={{
        padding: '8px 14px',
        borderRadius: 6,
        border: 'none',
        background: disabled ? '#666' : '#0a7',
        color: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      title={role !== 'admin' ? 'Tylko administrator' : 'Eksportuj do XLSX'}
    >
      {loading ? 'Generuję…' : 'Eksport treningów (XLSX)'}
    </button>
  );
};

export default AdminExportReportButton;

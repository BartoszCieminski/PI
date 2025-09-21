// src/pages/AdminDashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminExportReportButton from '../components/AdminDownloadTrainingsButton';
import AdminDownloadClientsButton from '../components/AdminDownloadClientsButton';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const downloadClientsXlsx = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Brak tokena. Zaloguj się ponownie.');
    return;
  }

  fetch(`${import.meta.env.VITE_API_URL}/api/users/clients.xlsx`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => {
      if (!res.ok) throw new Error('Błąd podczas pobierania pliku');

      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clients.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(() => {
      alert('Nie udało się pobrać pliku Excel.');
    });
};


  return (
    <div style={{ padding: '20px' }}>
      <h1>Panel administratora</h1>

      <button onClick={() => navigate('/admin/add-training')}>Dodaj nowy trening</button>
      <button onClick={() => navigate('/admin/trainings')} style={{ marginLeft: 10 }}>Edytuj lub usuń trening</button>
      <button onClick={() => navigate('/admin/add-room')} style={{ marginLeft: 10 }}>Dodaj nową salę</button>
      <button onClick={() => navigate('/admin/rooms')} style={{ marginLeft: 10 }}>Edytuj lub usuń salę</button>

      {/* NOWY PRZYCISK */}
      <AdminDownloadClientsButton/>
      <AdminExportReportButton/>
    </div>
  );
};

export default AdminDashboard;

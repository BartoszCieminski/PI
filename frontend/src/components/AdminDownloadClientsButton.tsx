import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminDownloadClientsButton: React.FC = () => {
  const { token, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const disabled = loading || role !== 'admin';

  const downloadClientsXlsx = async () => {
    if (!token) {
      alert('Brak tokena. Zaloguj się ponownie.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/clients.xlsx`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Błąd podczas pobierania pliku');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clients.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Nie udało się pobrać pliku Excel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={downloadClientsXlsx}
      disabled={disabled}
      style={{
        marginLeft: 10,
        padding: '8px 14px',
        borderRadius: 6,
        border: 'none',
        background: disabled ? '#666' : '#0a7',
        color: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      title={role !== 'admin' ? 'Tylko administrator' : 'Pobierz listę klientów (XLSX)'}
    >
      {loading ? 'Pobieram…' : 'Eksport klientów (XLSX)'}
    </button>
  );
};

export default AdminDownloadClientsButton;

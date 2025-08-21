import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminAddRoom: React.FC = () => {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !capacity) {
      setMessage('Wypełnij wszystkie pola.');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, capacity }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Sala dodana pomyślnie!');
        setName('');
        setCapacity('');
        setTimeout(() => navigate('/admin'), 1000);
      } else {
        setMessage(data.error || 'Wystąpił błąd.');
      }
    } catch {
      setMessage('Błąd połączenia z serwerem.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dodaj nową salę</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nazwa sali:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Liczba miejsc:</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
            min={1}
          />
        </div>
        <button type="submit">Zapisz</button>
        <button type="button" onClick={() => navigate('/admin')} style={{ marginLeft: '10px' }}>
          Anuluj
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AdminAddRoom;

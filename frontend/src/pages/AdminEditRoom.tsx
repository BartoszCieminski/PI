import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const AdminEditRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchRoom = async () => {
      const token = localStorage.getItem('token');
      if (!token || !id) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings/rooms/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('Błąd pobierania danych sali');
        }

        const data = await res.json();
        setName(data.name);
        setCapacity(data.capacity.toString());
      } catch {
        setMessage('Błąd pobierania danych sali.');
      }
    };

    fetchRoom();
  }, [id]);

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    if (!token || !id) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings/rooms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          capacity: parseInt(capacity),
        }),
      });

      if (res.ok) {
        navigate('/admin/rooms');
      } else {
        const data = await res.json();
        setMessage(data.error || 'Błąd aktualizacji sali');
      }
    } catch {
      setMessage('Błąd serwera');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Edytuj salę</h2>
      <div>
        <label>Nazwa sali:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label>Liczba miejsc:</label>
        <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
      </div>
      <button onClick={handleUpdate}>Zapisz zmiany</button>
      <button onClick={() => navigate('/admin/rooms')} style={{ marginLeft: '10px' }}>Anuluj</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AdminEditRoom;

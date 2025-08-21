import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Room {
  id: string;
  name: string;
  capacity: number;
  assignedTrainingsCount?: number;
}

const AdminRooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchRooms = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setRooms(data);
    } catch {
      setMessage('Błąd pobierania sal.');
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Czy na pewno chcesz usunąć tę salę?');
    if (!confirmed) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trainings/rooms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessage('Sala usunięta');
        fetchRooms();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Błąd usuwania sali');
      }
    } catch {
      setMessage('Błąd serwera przy usuwaniu');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Lista sal</h2>

      <button onClick={() => navigate('/admin')} style={{ marginBottom: '20px' }}>
        ← Cofnij
      </button>

      {message && <p>{message}</p>}
      {rooms.map((room) => (
        <div key={room.id} style={{ border: '1px solid gray', padding: '10px', marginBottom: '10px' }}>
          <p><strong>{room.name}</strong></p>
          <p>Liczba miejsc: {room.capacity}</p>
          <p>Liczba przypisanych treningów: {room.assignedTrainingsCount ?? 0}</p>
          <button onClick={() => navigate(`/admin/edit-room/${room.id}`)}>Edytuj</button>
          <button
            onClick={() => handleDelete(room.id)}
            style={{ marginLeft: '10px', color: 'red' }}
          >
            Usuń
          </button>
        </div>
      ))}
    </div>
  );
};

export default AdminRooms;

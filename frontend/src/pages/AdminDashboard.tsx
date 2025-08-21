import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Panel administratora</h1>

      <button onClick={() => navigate('/admin/add-training')}>
        Dodaj nowy trening
      </button>

      <button onClick={() => navigate('/admin/trainings')} style={{ marginLeft: '10px' }}>
        Edytuj lub usuń trening
      </button>

      <button onClick={() => navigate('/admin/add-room')} style={{ marginLeft: '10px' }}>
        Dodaj nową salę
      </button>

      <button onClick={() => navigate('/admin/rooms')} style={{ marginLeft: '10px' }}>
        Edytuj lub usuń salę
      </button>
    </div>
  );
};

export default AdminDashboard;

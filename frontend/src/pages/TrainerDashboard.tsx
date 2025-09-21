import React from 'react';
import { useNavigate } from 'react-router-dom';

const TrainerDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 20,
          padding: '6px 12px',
          background: '#444',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        ← Cofnij
      </button>

      <h1>Panel trenera</h1>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
        <button onClick={() => navigate('/trainer/my-trainings')}>Moje treningi i zapisani klienci</button>

        <button onClick={() => navigate('/trainer/hours-report')}>Raport godzin</button>

        {/* miejsce na kolejne przyciski akcji trenera */}
      </div>
    </div>
  );
};

export default TrainerDashboard;

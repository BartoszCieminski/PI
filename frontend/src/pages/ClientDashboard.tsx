import React from 'react';
import { useNavigate } from 'react-router-dom';

const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 20 }}>
      <h1>Panel klienta</h1>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/client/bookings')}>Twoje zapisy na treningi</button>
        <button onClick={() => navigate('/client/profile')}>Edycja profilu</button> {/* NOWY */}
        <button onClick={() => navigate('/client/calendar')}>Kalendarz (Twoje treningi)</button>
      </div>
    </div>
  );
};

export default ClientDashboard;

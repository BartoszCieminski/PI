import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterForm: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password) {
      setMessage('Wszystkie pola są wymagane.');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Rejestracja udana! Możesz się teraz zalogować.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage(data.error || 'Rejestracja nie powiodła się');
      }
    } catch (err) {
      setMessage('Błąd połączenia z serwerem');
    }
  };

  return (
    <form onSubmit={handleRegister} style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Rejestracja</h2>

      <input
        type="text"
        placeholder="Imię"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <br />

      <input
        type="text"
        placeholder="Nazwisko"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <br />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />

      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="client">Klient</option>
        <option value="trainer">Trener</option>
        <option value="admin">Administrator</option>
      </select>
      <br />

      <button type="submit">Zarejestruj</button>
      <p>{message}</p>

      <button type="button" onClick={() => navigate('/')}>
        Wróć
      </button>
    </form>
  );
};

export default RegisterForm;

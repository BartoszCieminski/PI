import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ClientProfile: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // --- email ---
  const [email, setEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // --- password ---
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  const api = import.meta.env.VITE_API_URL;

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    if (!email) return setEmailMsg('Podaj nowy adres e-mail.');
    if (!token) return setEmailMsg('Brak autoryzacji.');

    setEmailLoading(true);
    try {
      const res = await fetch(`${api}/api/users/me/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setEmailMsg('E-mail zaktualizowany.');
    } catch {
      setEmailMsg('Błąd połączenia z serwerem.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (!password) return setPassMsg('Podaj nowe hasło.');
    if (password !== password2) return setPassMsg('Hasła nie są takie same.');
    if (!token) return setPassMsg('Brak autoryzacji.');

    setPassLoading(true);
    try {
      const res = await fetch(`${api}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) setPassMsg('Hasło zostało zmienione.');
      else setPassMsg(data.error || 'Nie udało się zmienić hasła.');
    } catch {
      setPassMsg('Błąd połączenia z serwerem.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <button
      onClick={() => navigate('/client')}
      style={{
        marginBottom: 20,
        padding: '6px 12px',
        background: '#444',
        color: 'white',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer'
      }}
    >
      ← Cofnij
    </button>
      <h1>Edycja profilu</h1>

      <section style={{ marginBottom: 30 }}>
        <h2>Zmień e-mail</h2>
        <form onSubmit={handleEmail} style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
          <input
            type="email"
            placeholder="nowy@adres.pl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={emailLoading}>
            {emailLoading ? 'Aktualizuję…' : 'Zapisz e-mail'}
          </button>
          {emailMsg && <p>{emailMsg}</p>}
        </form>
      </section>

      <section>
        <h2>Zmień hasło</h2>
        <form onSubmit={handlePassword} style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
          <input
            type="password"
            placeholder="Nowe hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Powtórz nowe hasło"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />
          <button type="submit" disabled={passLoading}>
            {passLoading ? 'Aktualizuję…' : 'Zapisz hasło'}
          </button>
          {passMsg && <p>{passMsg}</p>}
        </form>
      </section>
    </div>
  );
};

export default ClientProfile;

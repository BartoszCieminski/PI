// src/components/LoginForm.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Role = 'admin' | 'trainer' | 'client';
const roleToPath: Record<Role, string> = {
  admin: '/admin',
  trainer: '/trainer',
  client: '/client',
};

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, token, role } = useAuth();

  // Jeśli już zalogowany → przenieś na własny dashboard
  useEffect(() => {
    if (token && role) {
      navigate(roleToPath[role], { replace: true });
    }
  }, [token, role, navigate]);

  const state = location.state as { from?: string } | null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setMessage('');

    try {
      // 1) Logowanie do backendu (Supabase/Twoje API)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log('LOGIN RESPONSE', data); // <- zobacz strukturę

      if (!res.ok) {
        setMessage(data.error || 'Logowanie nieudane');
        return;
      }

      // 2) Wyciągnij token (Supabase -> session.access_token)
      //    Obsługujemy też ewentualne alternatywne klucze, by kod był odporny.
      const accessToken: string | undefined =
        data.token ||
        data.access_token ||
        data.session?.access_token;

      if (!accessToken) {
        setMessage('Brak access_token w odpowiedzi logowania');
        return;
      }

      // 3) Ustal rolę
      //    a) Jeśli backend podał ją jawnie, normalizujemy
      //    b) Inaczej prosimy backend o /api/auth/me z Bearer token,
      //       który powinien zwrócić { role: 'admin' | 'trainer' | 'client', ... }
      let resolvedRole: Role | undefined;
      const rawRole: string | undefined =
        data.role ||
        data.session?.user?.user_metadata?.role ||
        data.user?.user_metadata?.role ||
        data.user?.role; // (w Supabase często to 'authenticated' – nieużyteczne dla autoryzacji appki)

      const normalized = rawRole?.toLowerCase();
      if (normalized === 'admin' || normalized === 'trainer' || normalized === 'client') {
        resolvedRole = normalized;
      } else {
        // fallback: pobierz z /me
        const meRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const me = await meRes.json();
        if (!meRes.ok || !me?.role) {
          // Ostateczny fallback: przyjmij 'client', żeby nie blokować UX
          console.warn('Nie udało się pobrać roli z /me, fallback=client', me);
          resolvedRole = 'client';
        } else {
          const meRole = String(me.role).toLowerCase();
          if (meRole === 'admin' || meRole === 'trainer' || meRole === 'client') {
            resolvedRole = meRole;
          } else {
            // jeśli backend zwrócił np. 'authenticated', to też fallback na 'client'
            resolvedRole = 'client';
          }
        }
      }

      // 4) Zapisz w kontekście (localStorage) i przekieruj
      login(accessToken, resolvedRole!);

      if (state?.from) {
        navigate(state.from, { replace: true });
      } else {
        navigate(roleToPath[resolvedRole!], { replace: true });
      }
    } catch (err) {
      setMessage('Błąd połączenia z serwerem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Logowanie</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
      />
      <br />

      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      <br />

      <button type="submit" disabled={submitting}>
        {submitting ? 'Logowanie...' : 'Zaloguj'}
      </button>

      {message && <p>{message}</p>}

      <div style={{ marginTop: '16px' }}>
        <span>Nie masz konta? </span>
        <Link to="/register">Załóż konto</Link>
      </div>

      <div style={{ marginTop: '8px' }}>
        <Link to="/">Wróć na stronę główną</Link>
      </div>
    </form>
  );
};

export default LoginForm;

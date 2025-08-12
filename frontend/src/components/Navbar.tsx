// src/components/Navbar.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../../css/Navbar.css';

const Navbar: React.FC = () => {
  const { token, role, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <Link to="/">Home</Link>
      <Link to="/classes">Zajęcia</Link>
      <Link to="/about">O nas</Link>
      <Link to="/contact">Kontakt</Link>

      {/* Linki do paneli (opcjonalnie warunkowe) */}
      {role === 'admin' && <Link to="/admin">Panel administratora</Link>}
      {role === 'trainer' && <Link to="/trainer">Panel trenera</Link>}
      {role === 'client' && <Link to="/client">Panel klienta</Link>}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
        {token ? (
          <>
            <span style={{ opacity: 0.8 }}>Zalogowany: {role}</span>
            <button
              onClick={() => {
                logout();
                navigate('/', { replace: true });
              }}
            >
              Wyloguj
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Zaloguj</Link>
            <Link to="/register">Rejestracja</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

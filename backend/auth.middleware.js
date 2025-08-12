// backend/auth.middleware.js
import supabase from './supabase.js';

export const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) return res.status(401).json({ error: 'Brak tokena autoryzacyjnego' });

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) return res.status(401).json({ error: 'Nieprawidłowy token' });

      // Pobierz profil użytkownika z tabeli profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) return res.status(403).json({ error: 'Brak dostępu' });

      if (!roles.includes(profile.role)) {
        return res.status(403).json({ error: 'Brak odpowiednich uprawnień' });
      }

      req.user = { ...user, role: profile.role };
      next();
    } catch (err) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  };
};
// backend/auth.middleware.js
import supabase from './supabase.js';

export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Brak tokena autoryzacyjnego' });

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Nieprawidłowy token' });

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) return res.status(403).json({ error: 'Brak dostępu' });
      if (!allowedRoles.includes(profile.role)) return res.status(403).json({ error: 'Brak odpowiednich uprawnień' });

      // udostępniamy id/email + rolę do dalszych handlerów
      req.user = { id: user.id, email: user.email, role: profile.role };
      next();
    } catch {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  };
};

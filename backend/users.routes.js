// users.routes.js
import express from 'express';
import exceljs from 'exceljs';
import supabase from './supabase.js';
import { requireRole } from './auth.middleware.js';

const router = express.Router();

router.get('/clients.xlsx', requireRole(['admin']), async (req, res) => {
  try {
    // 1. Pobierz klientów + ich rezerwacje
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        bookings:bookings ( id )
      `)
      .eq('role', 'client');

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Błąd pobierania klientów' });
    }

    // 2. Utwórz plik Excela
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Klienci');

    // 3. Kolumny
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Imię', key: 'first_name', width: 20 },
      { header: 'Nazwisko', key: 'last_name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Liczba rezerwacji', key: 'bookings_count', width: 20 },
    ];

    // 4. Dodaj dane
    data.forEach(client => {
      worksheet.addRow({
        id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        bookings_count: client.bookings?.length || 0,
      });
    });

    // 5. Odpowiedź HTTP → Excel
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=clients.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd podczas generowania pliku Excel' });
  }
});

// Zmiana e-maila przez zalogowanego użytkownika (bez potwierdzenia)
router.put('/me/email', requireRole(['client', 'trainer', 'admin']), async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Pole email jest wymagane' });

  try {
    // 1) Zmień email w auth.users
    const { data, error } = await supabase.auth.admin.updateUserById(req.user.id, {
      email,
      email_confirm: true, // od razu potwierdzony
    });
    if (error) return res.status(400).json({ error: error.message });

    // 2) Zsynchronizuj z tabelą profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ email })
      .eq('id', req.user.id);

    if (profileError) return res.status(400).json({ error: profileError.message });

    return res.json({
      message: 'E-mail zaktualizowany',
      user: { id: data.user.id, email: data.user.email }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Zmiana hasła przez zalogowanego użytkownika
router.put('/me/password', requireRole(['client', 'trainer', 'admin']), async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Pole password jest wymagane' });

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(req.user.id, { password });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'Hasło zaktualizowane', user_id: data.user.id });
  } catch {
    return res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

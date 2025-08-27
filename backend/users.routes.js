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

export default router;

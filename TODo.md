# TODO - Phase 1 (Business Dashboard → Sync MonthlySales & True ROAS dari Google Sheets)

- [ ] app/api/db/monthly-sales/route.ts: tambah endpoint `POST /api/db/monthly-sales/sync` (upsert by `monthYear`, validasi, hitung `roas`)
- [ ] components/Dashboard.tsx: setelah `handleLoad` selesai memuat data & mengkalkulasi KPI + spend, panggil endpoint sync sekali (auto) untuk `monthYear` terdeteksi
- [ ] (opsional) components/MonthlySalesManager.tsx: cek kebutuhan UI indikator (tidak wajib)
- [ ] Jalankan `npm run lint` dan `npm run build`
- [ ] Jalankan tests backend yang tersedia (khusus monthly-sales jika ada)

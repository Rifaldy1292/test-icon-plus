# Workflow Rifky Web

Aplikasi web sederhana untuk **menampilkan** dan **mengedit** workflow dengan nama **`rifky`**.  
Dibuat menggunakan **Vue 3 + Vite**.

---

## ✨ Fitur Utama

- **Read Workflow**  
  Menampilkan seluruh task dari workflow bernama **`rifky`**, dengan tampilan **card** yang rapi dan responsif.

- **Edit Workflow**  
  Mengubah detail workflow dengan identitas yang sama yaitu **`rifky`**.  
  **Catatan:** Saat mengubah, pastikan **nama action berbeda**, karena default nama masih sama.

---

## 🚀 Cara Menjalankan

1. Install dependencies  
   npm install
2. pastikan url mengarah ke backend /vite.config.ts

   proxy: {
   "/api": "http://localhost:8080",
   },

3. Jalankan development server  
   npm run dev

4. Aplikasi akan berjalan di http://localhost:5173 (atau port lain sesuai konfigurasi Vite).

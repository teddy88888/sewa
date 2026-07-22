# Panduan Deployment SEWA Platform

## 📋 Prasyarat

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) atau Docker Engine (Linux)
- [VS Code](https://code.visualstudio.com/) dengan ekstensi:
  - **Dev Containers** (`ms-vscode-remote.remote-containers`) — opsional
  - **Docker** (`ms-azuretools.vscode-docker`)
- Git

---

## 🚀 Metode 1: VS Code Dev Container (Rekomendasi)

Cara paling mudah — VS Code otomatis setup environment lengkap di dalam container.

### Langkah:

1. Clone repositori:

   ```bash
   git clone <repo-url>
   cd Sewa-Platform
   ```

2. Buka di VS Code:

   ```bash
   code .
   ```

3. VS Code akan mendeteksi file `.devcontainer/devcontainer.json` dan menawarkan **"Reopen in Container"**. Klik pojok kanan bawah atau:
   - Buka **Command Palette** (`Ctrl+Shift+P`)
   - Ketik: `Dev Containers: Reopen in Container`

4. Tunggu build container selesai. VS Code akan:
   - Setup PostgreSQL + API Server otomatis
   - Install semua dependencies (`pnpm install`)
   - Forward port 8080 (API) dan 5173 (Vite dev server)

5. Jalankan API server:

   ```bash
   pnpm --filter @workspace/api-server run dev
   ```

6. Di terminal terpisah, jalankan frontend:

   ```bash
   pnpm --filter @workspace/sewa run dev
   ```

7. Buka `http://localhost:5173` di browser.

### Keuntungan:

- ✅ Environment identik untuk semua developer
- ✅ Tidak perlu install Node.js / PostgreSQL lokal
- ✅ Hot reload berfungsi penuh
- ✅ Bisa deploy langsung dari container

---

## 🐳 Metode 2: Docker Compose (Production)

Deploy dengan satu perintah menggunakan Docker Compose.

### Langkah:

1. Clone repositori dan masuk ke direktori:

   ```bash
   git clone <repo-url>
   cd Sewa-Platform
   ```

2. Salin file environment (opsional, sesuaikan jika perlu):

   ```bash
   cp .env.example .env
   ```

3. Build dan jalankan semua service:

   ```bash
   docker compose up -d --build
   ```

4. Push database schema:

   ```bash
   docker compose exec api pnpm --filter @workspace/db run push
   ```

5. Aplikasi akan berjalan di:
   - **Frontend + API**: `http://localhost:8080`
   - **Database**: `localhost:5432`

6. Melihat log:

   ```bash
   docker compose logs -f
   ```

7. Menghentikan:
   ```bash
   docker compose down
   ```

---

## 🖥️ Metode 3: VPS Manual (Tanpa Docker)

### Prasyarat Server:

- Node.js 24+
- pnpm
- PostgreSQL 16+
- Nginx (sebagai reverse proxy)

### Langkah:

1. **Setup Database:**

   ```bash
   # Buat database PostgreSQL
   sudo -u postgres psql -c "CREATE USER sewa WITH PASSWORD 'your_password';"
   sudo -u postgres psql -c "CREATE DATABASE sewa_db OWNER sewa;"
   ```

2. **Clone & Install:**

   ```bash
   git clone <repo-url>
   cd Sewa-Platform
   npm install -g pnpm
   pnpm install
   ```

3. **Set environment variables:**

   ```bash
   export DATABASE_URL=postgresql://sewa:your_password@localhost:5432/sewa_db
   export PORT=8080
   export NODE_ENV=production
   export BASE_PATH=/
   ```

4. **Generate API client & Build:**

   ```bash
   pnpm --filter @workspace/api-spec run codegen
   pnpm run typecheck:libs
   pnpm --filter @workspace/api-server run build
   pnpm --filter @workspace/sewa run build
   ```

5. **Push database schema:**

   ```bash
   pnpm --filter @workspace/db run push
   ```

6. **Jalankan server:**

   ```bash
   node --enable-source-maps artifacts/api-server/dist/index.mjs
   ```

   (Gunakan PM2 untuk production: `pm2 start ...`)

7. **Setup Nginx reverse proxy:**

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location /api {
           proxy_pass http://127.0.0.1:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location / {
           root /path/to/Sewa-Platform/artifacts/sewa/dist/public;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

---

## ☁️ Metode 4: Railway / Render (Cloud)

### Railway

1. Push repositori ke GitHub
2. Dashboard Railway → **New Project** → **Deploy from GitHub repo**
3. Railway auto-detect `pnpm` workspaces
4. Set environment variables:
   - `DATABASE_URL` → Railway akan auto-provision PostgreSQL
   - `PORT` = 8080
   - `NODE_ENV` = production
   - `BASE_PATH` = /
5. Railway akan build & deploy otomatis.

### Render

1. Push ke GitHub
2. Dashboard Render → **New Web Service**
3. Build Command:
   ```bash
   pnpm install && pnpm --filter @workspace/api-spec run codegen && pnpm run typecheck:libs && pnpm --filter @workspace/api-server run build && pnpm --filter @workspace/sewa run build
   ```
4. Start Command:
   ```bash
   node --enable-source-maps artifacts/api-server/dist/index.mjs
   ```
5. Tambahkan PostgreSQL via Render Dashboard
6. Set environment variables yang sama

---

## 📦 Environment Variables

| Variable       | Deskripsi                    | Contoh                                |
| -------------- | ---------------------------- | ------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `PORT`         | Port API server              | `8080`                                |
| `NODE_ENV`     | Environment mode             | `production` / `development`          |
| `BASE_PATH`    | Base path frontend           | `/`                                   |

---

## 🔧 VS Code Tasks (Optional)

Buat file `.vscode/tasks.json` untuk shortcut:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start API Server (Dev)",
      "type": "shell",
      "command": "pnpm --filter @workspace/api-server run dev",
      "group": "none",
      "problemMatcher": []
    },
    {
      "label": "Start Frontend (Dev)",
      "type": "shell",
      "command": "pnpm --filter @workspace/sewa run dev",
      "group": "none",
      "problemMatcher": []
    }
  ]
}
```

---

## ✅ Verifikasi Deployment

Setelah deploy, cek endpoint berikut:

```bash
# Health check API
curl http://localhost:8080/api/health

# Cek frontend (harus return HTML)
curl http://localhost:8080/

# Jika semua OK, seharusnya response sukses
```

---

## 🐛 Troubleshooting

| Masalah                                 | Solusi                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| `PORT environment variable is required` | Set `PORT=8080` di environment                         |
| `DATABASE_URL is required`              | Set koneksi PostgreSQL yang valid                      |
| `ECONNREFUSED database`                 | Pastikan PostgreSQL running dan bisa diakses           |
| Frontend blank                          | Build ulang: `pnpm --filter @workspace/sewa run build` |
| CORS error                              | Pastikan API server running di port yang benar         |

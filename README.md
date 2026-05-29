# Naraya

<p align="center">
  <img src="./naraya/public/logo.svg" alt="Naraya" width="520" />
</p>

Naraya adalah platform baca komik dan nonton anime dengan katalog terstruktur, reader gambar, custom video player, rak bacaan, komentar, autentikasi, dan sistem internal berbasis PostgreSQL.

Domain produksi:

```text
https://naraya.biz.id
```

## Struktur Project

```text
website/
  naraya/      Next.js App Router frontend
  naraya-api/  Go Fiber backend API
```

## Stack

Frontend:

- Next.js 14 App Router
- React 18
- Tailwind CSS
- TypeScript
- Lucide React

Backend:

- Go 1.25
- Fiber v2
- PostgreSQL
- pgx
- goquery
- In-memory cache
- Media proxy untuk gambar dan video

## Fitur Utama

- Home dengan sorotan utama, update komik, update anime, dan genre populer.
- Explore dengan live search, filter status, filter tipe, filter genre, dan infinite loading.
- Indeks katalog A-Z dengan total item, filter huruf, status, tipe, dan genre.
- Detail komik dengan info, sinopsis, daftar chapter, library action, dan komentar.
- Reader komik dengan infinite chapter rendering, komentar chapter, dan kontrol bar yang adaptif.
- Detail anime dengan info, sinopsis, daftar episode, library action, dan komentar.
- Halaman nonton dengan custom Naraya video player, pilihan server, download, komentar episode, dan navigasi episode.
- Login, register, profile, settings, library, dan comment system.
- API backend untuk data katalog publik dan sistem internal Naraya.

## Menjalankan Development

Prerequisites:

- Node.js 20 LTS atau lebih baru.
- npm 10 atau lebih baru.
- Go 1.25.
- PostgreSQL 16.
- Git.

### 1. Backend

```bash
cd naraya-api
go mod download
go run ./cmd/migrate
go run ./cmd/api
```

Default backend:

```text
http://127.0.0.1:4000
```

### 2. Frontend

```bash
cd naraya
npm install
npm run dev
```

Default frontend:

```text
http://127.0.0.1:3000
```

## Instalasi Lokal dari Nol

Clone repository:

```bash
git clone https://github.com/mevander88/naraya.git
cd naraya
```

Jalankan PostgreSQL lokal:

```bash
cd naraya-api
docker compose up -d postgres
```

Install dan jalankan backend:

```bash
go mod download
go run ./cmd/migrate
go run ./cmd/api
```

Install dan jalankan frontend di terminal lain:

```bash
cd naraya
npm install
npm run dev
```

## Environment

Frontend:

```env
NARAYA_API_URL=http://127.0.0.1:4000/api
```

Production frontend:

```env
NARAYA_API_URL=https://naraya.biz.id/api
```

Backend:

```env
ADDR=:4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/naraya?sslmode=disable
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://naraya.biz.id,https://www.naraya.biz.id
HTTP_TIMEOUT_SECONDS=20
CACHE_TTL_SECONDS=300
```

## Build Production Lokal

Backend:

```bash
cd naraya-api
go build -o bin/naraya-api.exe ./cmd/api
go build -o bin/naraya-migrate.exe ./cmd/migrate
```

Frontend:

```bash
cd naraya
npm ci
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Untuk audit Lighthouse lokal, gunakan `npm run build` dan `npm run start`. Jangan memakai `npm run dev` untuk skor production karena dev server membawa HMR, WebSocket, source dev runtime, dan cache `no-store`.

## API Ringkas

Public content API:

- `GET /api/health`
- `GET /api/home`
- `GET /api/navigation`
- `GET /api/search?q=keyword`
- `GET /api/genres`
- `GET /api/comics/az?page=1&letter=A`
- `GET /api/comics/catalog?page=1&genre=&type=&status=`
- `GET /api/comics/latest?page=1`
- `GET /api/comics/:slug`
- `GET /api/chapters/:slug`
- `GET /api/series/latest?page=1`
- `GET /api/series/:slug`
- `GET /api/episodes/:slug`
- `GET /api/video-source?url=...`
- `GET /api/images/:token`
- `GET /api/videos/:token`

Internal API:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/library`
- `POST /api/library`
- `DELETE /api/library/:comicSlug`
- `GET /api/comments?comicSlug=...`
- `GET /api/comments?chapterSlug=...`
- `POST /api/comments`
- `GET /api/settings`
- `PATCH /api/settings`

## Database

Schema utama:

- `naraya_users`
- `naraya_sessions`
- `naraya_user_settings`
- `naraya_library_items`
- `naraya_comments`

Migrasi dijalankan dari folder `naraya-api`:

```bash
go run ./cmd/migrate
```

## Production Notes

- Set `NARAYA_API_URL` ke `https://naraya.biz.id/api`.
- Set `CORS_ORIGINS` hanya ke domain yang digunakan.
- Jalankan backend di balik reverse proxy dengan TLS.
- Gunakan PostgreSQL managed atau instance production yang dibackup rutin.
- Pastikan cache dan timeout backend disesuaikan dengan kapasitas server.
- Jangan expose detail sumber data internal pada UI, metadata publik, atau dokumentasi publik.

## Deploy Production

Arsitektur yang disarankan:

```text
Internet
  -> Nginx/Caddy reverse proxy dengan TLS
  -> Next.js frontend di 127.0.0.1:3000
  -> Go Fiber API di 127.0.0.1:4000
  -> PostgreSQL private network
```

Environment production frontend:

```env
NARAYA_API_URL=https://naraya.biz.id/api
NEXT_PUBLIC_NARAYA_API_URL=https://naraya.biz.id/api
NODE_ENV=production
```

Environment production backend:

```env
ADDR=127.0.0.1:4000
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/naraya?sslmode=require
CORS_ORIGINS=https://naraya.biz.id,https://www.naraya.biz.id
HTTP_TIMEOUT_SECONDS=20
CACHE_TTL_SECONDS=300
```

Urutan deploy:

1. Pull kode terbaru dari `main`.
2. Set environment production frontend dan backend.
3. Jalankan migrasi database.
4. Build binary backend.
5. Build frontend Next.js.
6. Start atau restart service backend.
7. Start atau restart service frontend.
8. Pastikan reverse proxy mengarah ke service yang benar.
9. Cek health endpoint dan halaman utama.

Command deploy manual:

```bash
git pull origin main

cd naraya-api
go mod download
go run ./cmd/migrate
go build -o bin/naraya-api ./cmd/api

cd ../naraya
npm ci
npm run build
```

Health check:

```text
GET https://naraya.biz.id/api/health
GET https://naraya.biz.id
GET https://naraya.biz.id/sitemap.xml
GET https://naraya.biz.id/robots.txt
```

Contoh Nginx reverse proxy:

```nginx
server {
    listen 80;
    server_name naraya.biz.id www.naraya.biz.id;
    return 301 https://naraya.biz.id$request_uri;
}

server {
    listen 443 ssl http2;
    server_name naraya.biz.id;

    ssl_certificate /etc/letsencrypt/live/naraya.biz.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/naraya.biz.id/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Contoh PM2 untuk frontend:

```bash
cd naraya
NARAYA_API_URL=https://naraya.biz.id/api NEXT_PUBLIC_NARAYA_API_URL=https://naraya.biz.id/api pm2 start npm --name naraya-web -- run start -- --hostname 127.0.0.1 --port 3000
pm2 save
```

Contoh systemd backend:

```ini
[Unit]
Description=Naraya API
After=network.target

[Service]
WorkingDirectory=/var/www/naraya/naraya-api
ExecStart=/var/www/naraya/naraya-api/bin/naraya-api
Restart=always
RestartSec=5
Environment=ADDR=127.0.0.1:4000
Environment=DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/naraya?sslmode=require
Environment=CORS_ORIGINS=https://naraya.biz.id,https://www.naraya.biz.id
Environment=HTTP_TIMEOUT_SECONDS=20
Environment=CACHE_TTL_SECONDS=300

[Install]
WantedBy=multi-user.target
```

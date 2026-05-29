# Naraya API

<p align="center">
  <img src="../naraya/public/logo.svg" alt="Naraya" width="520" />
</p>

Naraya API adalah backend Go Fiber untuk katalog komik, katalog anime, reader chapter, episode streaming, media proxy, autentikasi, library, komentar, dan pengaturan user.

## Stack

- Go 1.25
- Fiber v2
- PostgreSQL
- pgx
- goquery
- In-memory cache

## Menjalankan API

Install dependency:

```bash
go mod download
```

Jalankan migrasi dan API:

```bash
go run ./cmd/migrate
go run ./cmd/api
```

Default server:

```text
http://127.0.0.1:4000
```

Health check:

```text
GET http://127.0.0.1:4000/api/health
```

## Environment

Development:

```env
ADDR=:4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/naraya?sslmode=disable
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://naraya.biz.id,https://www.naraya.biz.id
HTTP_TIMEOUT_SECONDS=20
CACHE_TTL_SECONDS=300
```

Production:

```env
ADDR=127.0.0.1:4000
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/naraya?sslmode=require
CORS_ORIGINS=https://naraya.biz.id,https://www.naraya.biz.id
HTTP_TIMEOUT_SECONDS=20
CACHE_TTL_SECONDS=300
```

## PostgreSQL Lokal

Jalankan database lokal dengan Docker:

```bash
docker compose up -d postgres
```

Default database lokal:

```text
postgres://postgres:postgres@localhost:5432/naraya?sslmode=disable
```

## Struktur Utama

```text
cmd/
  api/       Entry point server API
  migrate/   Runner migrasi SQL

internal/
  config/    Konfigurasi environment
  database/  Koneksi PostgreSQL
  http/      Fiber handlers dan route registration
  model/     Data contract API
  scraper/   Service katalog, parser, cache, dan media resolver
  store/     Query internal system ke PostgreSQL

migrations/  Schema database Naraya
```

## Public Content API

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

## Internal API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/users`
- `GET /api/users/:id`
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

Migrasi:

```bash
go run ./cmd/migrate
```

Schema dump tersedia di:

```text
database/schema.sql
```

## Media Proxy

Naraya API menyediakan proxy untuk gambar dan video agar frontend memakai endpoint Naraya secara konsisten:

- `/api/images/:token`
- `/api/videos/:token`

Video proxy mendukung range request agar player dapat seek dan streaming secara bertahap.

## Production Notes

- Jalankan API di balik reverse proxy dengan TLS.
- Set `CORS_ORIGINS` hanya untuk domain yang digunakan.
- Set `DATABASE_URL` ke database production.
- Atur `HTTP_TIMEOUT_SECONDS` dan `CACHE_TTL_SECONDS` sesuai kapasitas server.
- Jangan expose detail sumber data internal pada response, log publik, atau dokumentasi publik.

## Build Production

Linux:

```bash
go mod download
go build -o bin/naraya-api ./cmd/api
go build -o bin/naraya-migrate ./cmd/migrate
```

Windows:

```bash
go mod download
go build -o bin/naraya-api.exe ./cmd/api
go build -o bin/naraya-migrate.exe ./cmd/migrate
```

Jalankan migrasi production:

```bash
DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/naraya?sslmode=require" ./bin/naraya-migrate
```

Jalankan API:

```bash
ADDR=127.0.0.1:4000 DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/naraya?sslmode=require" CORS_ORIGINS="https://naraya.biz.id,https://www.naraya.biz.id" ./bin/naraya-api
```

## Deploy Backend

Urutan deploy:

1. Pull kode terbaru.
2. Set environment production.
3. Jalankan migrasi database.
4. Build binary API.
5. Restart service backend.
6. Cek `/api/health`.

Contoh systemd:

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

Health check:

```text
GET https://naraya.biz.id/api/health
```

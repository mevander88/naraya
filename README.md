# Naraya

<p align="center">
  <img src="naraya/public/logo.svg" alt="Logo Naraya" width="420">
</p>

Naraya adalah aplikasi web untuk membaca komik dan menonton anime. Project ini
terdiri dari frontend Next.js dan backend Go yang mengambil data katalog dari
source upstream, menyajikan halaman publik untuk SEO, serta menyediakan fitur
akun seperti rak, progress, komentar, reply, love, dan settings. Repository ini
juga memuat aplikasi native Android Naraya Beta, bukan WebView, yang memakai API
dan flow yang sama dengan web.

Domain produksi:

```text
https://naraya.biz.id
```

## Ringkasan Fitur

Fitur publik:

- Home dengan hero, update komik, update anime, dan genre.
- Anime Indo di `/anime-indo` untuk landing keyword anime Indonesia.
- Explore dengan pencarian, filter genre, tipe, status, dan infinite loading.
- Indeks katalog A-Z di `/indeks` untuk komik dan anime.
- Detail komik dengan cover, sinopsis, info, chapter terbaru, love, share, dan komentar.
- Detail anime dengan cover, sinopsis, info, episode terbaru, love, share, dan komentar.
- Reader komik di `/baca/[slug]` dengan infinite chapter rendering dan komentar chapter.
- Player anime di `/nonton/[slug]` dengan custom controls, fullscreen, seek 10 detik, indikator waktu, komentar episode, dan navigasi episode.
- Halaman AMP untuk home, detail komik, dan detail anime.
- Halaman install Android Beta di `/download` dengan download APK publik dan update langsung dari aplikasi.
- Halaman 404, robots.txt, sitemap.xml, Open Graph image, Twitter card, JSON-LD, dan metadata SEO.

Fitur akun:

- Register, login, logout, dan session cookie.
- Login/register otomatis redirect ke profile jika session user masih valid.
- Profile dengan role, settings shortcut mobile, total library, complete, komentar, dan love.
- Rak/library dengan tab favorit dan riwayat, filter tipe/status, progress baca/nonton, dan akses ke detail item tersimpan.
- Settings user: auto bookmark, mature filter, dan high quality images.
- Riwayat komentar dan riwayat love dengan tampilan ringkas dan view all.
- Komentar, reply komentar, reload komentar, dan pagination/infinite load.
- Love komik/anime dengan proteksi agar satu user tidak bisa love target yang sama dua kali.
- Favorite komik/anime dengan total favorite dan proteksi satu item per user.
- Progress baca/nonton dihitung dari chapter/episode unik yang sudah dibuka user.

Fitur Android Beta:

- Aplikasi Kotlin native dengan Jetpack Compose, bukan WebView.
- Menu Home, Explore, Indeks, Rak, Profile, Settings, Login, dan Register mengikuti flow web Naraya.
- Detail komik/anime, reader chapter, player episode, komentar, reply, love, favorite, share, dan progress tersinkron ke backend.
- Reader komik fullscreen dengan tombol chapter sebelumnya/berikutnya.
- Player anime native Media3 ExoPlayer dengan pilihan server, fullscreen, loading state, retry, dan Picture-in-Picture.
- MediaSession foreground service untuk playback video saat aplikasi masuk latar belakang sesuai dukungan Android.
- In-app updater untuk build distribusi web, termasuk cek versi terbaru, download streaming, install prompt, dan notifikasi update.
- Variant `play` mematikan in-app updater agar permission install APK tidak ikut ke build Google Play.

Fitur backend:

- API katalog publik untuk home, search, genres, katalog, detail, reader, episode, dan sitemap.
- API internal untuk auth, profile, stats, library, settings, comments, replies, dan loves.
- Query count profile dilakukan di backend, bukan dihitung dari array frontend.
- Pagination komentar menggunakan cursor.
- Love count disimpan di tabel counter dengan trigger database.
- Favorite count disimpan di tabel counter dengan trigger database.
- In-memory cache untuk data scraper yang sering dipakai.
- PostgreSQL connection pool dengan konfigurasi min/max connection.

## Proteksi dan SEO

Naraya memakai beberapa lapisan proteksi agar asset dan API tidak mudah diambil
langsung, tetapi halaman publik tetap dapat diindeks dengan benar.

Proteksi API:

- Semua route `/api/*` dilindungi oleh web guard, kecuali `/api/health`.
- Browser Naraya mendapat cookie `naraya_web` dari frontend.
- Request API browser harus membawa konteks web yang valid.
- Request internal server-side frontend memakai `NARAYA_INTERNAL_TOKEN`.
- Request aplikasi Android native memakai header `X-Naraya-App`, versi, timestamp, dan HMAC signature dari `NARAYA_APP_ACCESS_SECRET`.
- User-agent scraping umum seperti curl, wget, python-requests, httpx, scrapy,
  axios, headlesschrome, selenium, playwright, dan sejenisnya ditolak oleh web guard.

Proteksi media:

- Gambar reader memakai token scope protected dan butuh konteks web Naraya.
- Video dan resolver video memakai token protected dan tidak dibuka untuk crawler.
- Cover/poster publik memakai token scope `public-image`.
- `public-image` boleh diakses crawler dan social preview tanpa cookie, termasuk request `HEAD`.
- Token public image lebih panjang TTL-nya agar aman untuk cache SEO/share.
- Reader image dan video tetap memakai header privat: `no-store`, `noindex`, dan `same-origin`.

SEO:

- Halaman detail komik/anime memakai cover publik sebagai `og:image` jika tersedia.
- `sitemap.xml` dibuat runtime dari backend `/api/sitemap` memakai internal token.
- Sitemap memasukkan home, anime indo, explore, indeks, detail komik, detail anime/series, AMP detail, serta route baca/nonton terbaru.
- JSON-LD dipisahkan di folder `seo/schema` dan dirender sesuai tipe halaman.
- Halaman privat seperti login, register, profile, library, settings, dan notifications dibuat noindex/disallow.
- `robots.txt` origin mengizinkan `/api/images/` untuk cover publik, tetapi menolak `/api/` secara umum.

Catatan produksi:

- Cloudflare dapat menambahkan managed content signals di bagian atas `robots.txt`.
- Jika Cloudflare meng-cache `robots.txt`, origin tetap menjadi sumber kebenaran dan cache edge perlu expired atau dipurge.

## Struktur Project

```text
/var/www/naraya
  README.md
  deploy/
    env/
      naraya-api.env.example
      naraya-frontend.env.example
    nginx/
      naraya.biz.id.conf
      naraya.biz.id.http.conf
    systemd/
      naraya-api.service
      naraya-frontend.service
  naraya/
    app/
      amp/
      anime-indo/
      baca/
      explore/
      indeks/
      komik/
      library/
      login/
      nonton/
      notifications/
      profile/
      register/
      series/
      settings/
      data.ts
      robots.ts
      sitemap.ts
    seo/
      schema/
    public/
    next.config.mjs
    package.json
  naraya-api/
    cmd/
      api/
      migrate/
    database/
      schema.sql
    internal/
      config/
      database/
      http/
      model/
      proxytoken/
      scraper/
      store/
    migrations/
    go.mod
  naraya-android/
    app/
      src/main/java/id/naraya/app/
        data/
        ui/
    README.md
    build.gradle.kts
    settings.gradle.kts
```

Frontend utama berada di `naraya/app`. Backend utama berada di `naraya-api`.
Project Android native berada di `naraya-android`. Folder `deploy` berisi
contoh environment, systemd unit, dan nginx reverse proxy untuk production.
Build Android saat ini ditandai sebagai beta melalui label aplikasi
`Naraya Beta` dan version name `1.0.36-beta`.

## Stack

Frontend:

- Next.js 16 App Router
- React 18
- TypeScript
- Tailwind CSS
- Lucide React
- Next.js standalone output untuk production

Backend:

- Go 1.25
- Fiber v2
- PostgreSQL
- pgx
- goquery
- AES-GCM token untuk media proxy
- In-memory cache untuk data scraper

Database:

- PostgreSQL
- Extension `pgcrypto`
- SQL migrations di `naraya-api/migrations`

Android:

- Kotlin
- Jetpack Compose
- Material 3
- Navigation Compose
- OkHttp
- Kotlinx Serialization
- Coil Compose
- Media3 ExoPlayer
- Media3 Session
- WorkManager

## Route Frontend

Route publik:

- `/`
- `/explore`
- `/anime-indo`
- `/indeks`
- `/komik/[slug]`
- `/series/[slug]`
- `/baca/[slug]`
- `/nonton/[slug]`
- `/amp`
- `/amp/komik/[slug]`
- `/amp/series/[slug]`
- `/download`
- `/robots.txt`
- `/sitemap.xml`
- `/opengraph-image`
- `/twitter-image`

Route akun:

- `/login`
- `/register`
- `/profile`
- `/library`
- `/settings`
- `/notifications`

Route download Android:

- `/download` menampilkan halaman install Naraya Android Beta.
- `/download/android/version` mengirim metadata versi APK, release notes, dan URL download.
- `/download/android` mengirim APK publik tanpa login dengan header noindex, noarchive, no-store, range request, dan filename versi.

Route redirect:

- `/baca` redirect ke `/indeks`
- `/nonton` redirect ke `/indeks`
- `/series` redirect ke `/indeks`

## API Backend

Public/content API:

- `GET /api/health`
- `GET /api/home`
- `GET /api/navigation`
- `GET /api/sitemap`
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

Media API:

- `GET /api/images/:token`
- `GET /api/videos/:token`
- `GET /api/video-source/:token`

Account/internal API:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/me/stats`
- `GET /api/library`
- `GET /api/library/:targetSlug/status`
- `POST /api/library`
- `DELETE /api/library/:comicSlug`
- `GET /api/loves/me`
- `GET /api/loves/:targetSlug`
- `POST /api/loves`
- `GET /api/comments`
- `GET /api/comments/me`
- `POST /api/comments`
- `GET /api/settings`
- `PATCH /api/settings`

## Database Schema

Schema utama ada di `naraya-api/database/schema.sql`.

### `naraya_users`

Menyimpan akun user.

Kolom penting:

- `id`
- `username`
- `email`
- `password_hash`
- `display_name`
- `avatar_url`
- `bio`
- `role`
- `created_at`
- `updated_at`

Index dan constraint penting:

- Unique username.
- Unique lower email jika email tidak kosong.
- Unique lower username.
- Check format email.
- Check panjang username dan display name.

### `naraya_sessions`

Menyimpan session login.

Kolom penting:

- `id`
- `user_id`
- `token_hash`
- `user_agent`
- `ip_address`
- `created_at`
- `expires_at`
- `revoked_at`

Index penting:

- `naraya_sessions_user_idx`
- `naraya_sessions_active_idx`
- `naraya_sessions_active_lookup_idx`

### `naraya_user_settings`

Menyimpan preferensi user.

Kolom:

- `user_id`
- `auto_bookmark`
- `mature_filter`
- `high_quality_images`
- `updated_at`

### `naraya_library_items`

Menyimpan rak user, progress, bookmark, dan status baca/nonton.

Kolom penting:

- `id`
- `user_id`
- `comic_slug`
- `comic_title`
- `cover_url`
- `source_url`
- `latest_chapter_slug`
- `last_chapter_slug`
- `last_chapter_title`
- `status`
- `progress_percent`
- `progress_completed`
- `progress_total`
- `is_bookmarked`
- `content_kind`
- `content_status`
- `added_at`
- `updated_at`
- `last_read_at`

Constraint dan index penting:

- Unique `(user_id, comic_slug)`.
- `status` dibatasi ke `reading`, `planned`, `completed`, `paused`, `dropped`.
- `content_kind` dibatasi ke `comic` dan `series`.
- `content_status` menyimpan status katalog seperti ongoing/complete jika tersedia.
- `progress_percent` 0 sampai 100.
- `progress_completed` dan `progress_total` tidak boleh negatif.
- Index user updated, bookmark, kind updated, status/kind, content status, dan `(user_id, status)`.

### `naraya_library_progress_items`

Menyimpan chapter/episode unik yang sudah dibaca atau ditonton user.

Kolom penting:

- `id`
- `user_id`
- `comic_slug`
- `content_kind`
- `chapter_slug`
- `chapter_title`
- `read_at`
- `created_at`
- `updated_at`

Constraint dan index penting:

- Unique `(user_id, comic_slug, content_kind, chapter_slug)`.
- `content_kind` dibatasi ke `comic` dan `series`.
- Target progress wajib memiliki `comic_slug` dan `chapter_slug`.
- Index by user target dan by target untuk perhitungan progress.

### `naraya_comments`

Menyimpan komentar dan reply.

Kolom penting:

- `id`
- `user_id`
- `comic_slug`
- `chapter_slug`
- `parent_id`
- `body`
- `is_edited`
- `created_at`
- `updated_at`
- `deleted_at`

Constraint dan index penting:

- Komentar wajib memiliki `comic_slug` atau `chapter_slug`.
- Body 1 sampai 2000 karakter.
- Index target root cursor untuk pagination komentar.
- Index chapter root cursor untuk komentar chapter.
- Index parent latest untuk 3 reply terbaru.
- Index user cursor untuk riwayat komentar profile.

### `naraya_love_items`

Menyimpan love user ke komik/anime.

Kolom penting:

- `id`
- `user_id`
- `target_slug`
- `target_title`
- `content_kind`
- `cover_url`
- `target_url`
- `created_at`

Constraint dan index penting:

- Unique `(user_id, target_slug)` agar user tidak bisa love target yang sama dua kali.
- `content_kind` dibatasi ke `comic` dan `series`.
- Index by target dan by user created.

### `naraya_love_counts`

Counter love per target.

Kolom:

- `target_slug`
- `love_count`
- `updated_at`

Trigger:

- `naraya_love_counts_increment_trigger`
- `naraya_love_counts_decrement_trigger`

Trigger ini menjaga jumlah love agar tidak perlu dihitung mahal dari tabel
`naraya_love_items` setiap request detail.

### `naraya_favorite_counts`

Counter favorite/bookmark per target.

Kolom:

- `target_slug`
- `favorite_count`
- `updated_at`

Trigger:

- `naraya_favorite_counts_insert_trigger`
- `naraya_favorite_counts_update_trigger`
- `naraya_favorite_counts_delete_trigger`

Trigger ini menjaga total favorite saat user menambah, menghapus, atau mengubah
bookmark library.

## Migrations

Folder migration:

```text
naraya-api/migrations
```

Urutan migration saat ini:

- `001_internal_system.sql`
- `002_auth_sessions.sql`
- `003_user_settings.sql`
- `004_development_copy.sql`
- `005_library_content_kind.sql`
- `006_love_items.sql`
- `007_drop_immersive_setting.sql`
- `008_backend_scale_indexes.sql`
- `009_database_hot_path_counters.sql`
- `010_comment_cursor_indexes.sql`
- `011_profile_count_indexes.sql`
- `012_library_favorite_history_split.sql`
- `013_favorite_counts.sql`
- `014_library_pagination_indexes.sql`
- `015_library_content_status.sql`
- `016_library_unique_progress.sql`

Jalankan migrasi dari folder backend:

```bash
cd naraya-api
go run ./cmd/migrate
```

## Environment

### Backend

Contoh file:

```text
deploy/env/naraya-api.env.example
```

Variabel utama:

```env
ADDR=127.0.0.1:4000
SOURCE_URL=https://www.mynimeku.com
DATABASE_URL=postgres://naraya_app:change-me@127.0.0.1:5432/naraya?sslmode=disable
DB_MAX_CONNS=25
DB_MIN_CONNS=2
CORS_ORIGINS=https://naraya.biz.id,https://www.naraya.biz.id
HTTP_TIMEOUT_SECONDS=20
CACHE_TTL_SECONDS=300
MEDIA_PROXY_SECRET=change-this-long-random-secret
WEB_ACCESS_SECRET=change-this-long-random-secret
NARAYA_INTERNAL_TOKEN=change-this-internal-token
```

Catatan:

- `MEDIA_PROXY_SECRET` dipakai untuk token proxy gambar/video.
- `WEB_ACCESS_SECRET` dipakai untuk cookie web guard. Jika kosong, fallback ke `MEDIA_PROXY_SECRET`.
- `NARAYA_INTERNAL_TOKEN` dipakai frontend server-side untuk memanggil API protected.
- `DB_MAX_CONNS` dan `DB_MIN_CONNS` mengatur PostgreSQL pool.

### Frontend

Contoh file:

```text
deploy/env/naraya-frontend.env.example
```

Variabel utama:

```env
NODE_ENV=production
PORT=3010
HOSTNAME=127.0.0.1
NARAYA_API_URL=https://naraya.biz.id/api
NEXT_PUBLIC_NARAYA_API_URL=https://naraya.biz.id/api
NARAYA_INTERNAL_TOKEN=change-this-internal-token
NARAYA_ANDROID_APK_PATH=/var/www/naraya/naraya-android/app/build/outputs/apk/web/debug/app-web-debug.apk
NARAYA_ANDROID_VERSION_CODE=37
NARAYA_ANDROID_VERSION_NAME=1.0.36-beta
NARAYA_ANDROID_MIN_SUPPORTED_VERSION_CODE=1
NARAYA_ANDROID_UPDATE_REQUIRED=false
```

Catatan:

- `NARAYA_API_URL` dipakai server-side frontend.
- `NEXT_PUBLIC_NARAYA_API_URL` dipakai client-side jika perlu.
- `NARAYA_INTERNAL_TOKEN` harus sama dengan backend agar sitemap dan server-rendered data bisa mengambil API protected.
- `NARAYA_ANDROID_APK_PATH` opsional untuk menentukan lokasi APK yang dilayani halaman `/download`.
- `NARAYA_ANDROID_VERSION_CODE` dan `NARAYA_ANDROID_VERSION_NAME` dipakai endpoint update Android.
- `NARAYA_ANDROID_UPDATE_REQUIRED=true` membuat update dianggap wajib oleh aplikasi.

## Install Lokal

Prerequisite:

- Node.js 20 atau lebih baru.
- npm 10 atau lebih baru.
- Go 1.25.
- PostgreSQL.

Clone repository:

```bash
git clone https://github.com/mevander88/naraya.git
cd naraya
```

Siapkan database PostgreSQL dan env backend:

```bash
cp deploy/env/naraya-api.env.example /tmp/naraya-api.env
```

Sesuaikan `DATABASE_URL`, `MEDIA_PROXY_SECRET`, `WEB_ACCESS_SECRET`, dan
`NARAYA_INTERNAL_TOKEN`.

Jalankan backend:

```bash
cd naraya-api
set -a
. /tmp/naraya-api.env
set +a
go mod download
go run ./cmd/migrate
go run ./cmd/api
```

Backend default:

```text
http://127.0.0.1:4000
```

Siapkan env frontend:

```bash
cp deploy/env/naraya-frontend.env.example /tmp/naraya-frontend.env
```

Untuk local development, gunakan API lokal:

```env
NARAYA_API_URL=http://127.0.0.1:4000/api
NEXT_PUBLIC_NARAYA_API_URL=http://127.0.0.1:4000/api
```

Jalankan frontend:

```bash
cd naraya
set -a
. /tmp/naraya-frontend.env
set +a
npm install
npm run dev
```

Frontend development default:

```text
http://127.0.0.1:3000
```

## Build Production

Backend:

```bash
cd naraya-api
go mod download
go build -o bin/naraya-api ./cmd/api
go build -o bin/naraya-migrate ./cmd/migrate
```

Frontend:

```bash
cd naraya
npm ci
npm run build
```

Android Beta:

```bash
cd naraya-android
NARAYA_APP_ACCESS_SECRET=change-this-long-random-secret ./gradlew assembleWebDebug
```

Output APK distribusi web:

```text
naraya-android/app/build/outputs/apk/web/debug/app-web-debug.apk
```

Build Google Play tanpa in-app updater:

```bash
cd naraya-android
NARAYA_APP_ACCESS_SECRET=change-this-long-random-secret ./gradlew assemblePlayRelease
```

Project memakai `output: 'standalone'`. Pada production systemd, folder
`.next/static` dan `public` disalin ke `.next/standalone` sebelum server Next
dijalankan, karena standalone output tidak selalu membawa asset statis tersebut.

## Deploy Production

Arsitektur produksi yang digunakan:

```text
Internet
  -> Cloudflare / DNS
  -> Nginx TLS reverse proxy
  -> Next.js standalone frontend 127.0.0.1:3010
  -> Go Fiber API 127.0.0.1:4000
  -> PostgreSQL
```

File deploy:

```text
deploy/nginx/naraya.biz.id.conf
deploy/systemd/naraya-api.service
deploy/systemd/naraya-frontend.service
deploy/env/naraya-api.env.example
deploy/env/naraya-frontend.env.example
```

Urutan deploy:

1. Pull kode terbaru.
2. Siapkan env di `/etc/naraya/naraya-api.env`.
3. Siapkan env di `/etc/naraya/naraya-frontend.env`.
4. Build binary API dan migrator.
5. Jalankan migrasi database.
6. Build frontend Next.js.
7. Build APK Android Beta jika ingin memperbarui `/download`.
8. Install/update systemd unit.
9. Restart API dan frontend.
10. Pastikan nginx proxy mengarah ke port yang benar.
11. Audit health, HTML, static asset, robots, sitemap, dan endpoint update Android.

Contoh command:

```bash
cd /var/www/naraya
git pull

cd naraya-api
go mod download
go build -o bin/naraya-api ./cmd/api
go build -o bin/naraya-migrate ./cmd/migrate
set -a
. /etc/naraya/naraya-api.env
set +a
./bin/naraya-migrate

cd ../naraya
npm ci
npm run build

cd ../naraya-android
NARAYA_APP_ACCESS_SECRET="$(awk -F= '/^WEB_ACCESS_SECRET=/{print $2}' /etc/naraya/naraya-api.env)" ./gradlew assembleWebDebug

sudo cp /var/www/naraya/deploy/systemd/naraya-api.service /etc/systemd/system/naraya-api.service
sudo cp /var/www/naraya/deploy/systemd/naraya-frontend.service /etc/systemd/system/naraya-frontend.service
sudo systemctl daemon-reload
sudo systemctl restart naraya-api.service
sudo systemctl restart naraya-frontend.service
```

Nginx production memakai:

```text
/api/ -> http://127.0.0.1:4000
/     -> http://127.0.0.1:3010
```

Contoh konfigurasi ada di:

```text
deploy/nginx/naraya.biz.id.conf
```

## Health Check dan Audit Production

API:

```bash
curl -i https://naraya.biz.id/api/health
```

Frontend:

```bash
curl -I https://naraya.biz.id
curl -I https://naraya.biz.id/anime-indo
curl -I https://naraya.biz.id/indeks
```

Static asset:

```bash
curl -I https://naraya.biz.id/logo.svg
curl -I https://naraya.biz.id/_next/static/chunks/example.css
```

SEO:

```bash
curl https://naraya.biz.id/robots.txt
curl https://naraya.biz.id/sitemap.xml
```

Android update:

```bash
curl https://naraya.biz.id/download/android/version
curl -I https://naraya.biz.id/download/android
```

Service:

```bash
systemctl is-active naraya-api.service
systemctl is-active naraya-frontend.service
journalctl -u naraya-api.service --since '10 minutes ago' --no-pager -o cat
journalctl -u naraya-frontend.service --since '10 minutes ago' --no-pager -o cat
```

Media protection checks:

```bash
# Public cover image should be accessible if token scope is public-image.
curl -I -A 'Googlebot-Image/1.0' 'https://naraya.biz.id/api/images/<public-image-token>'

# Reader image and video token should remain protected without valid web context.
curl -I -A 'Googlebot-Image/1.0' 'https://naraya.biz.id/api/images/<reader-image-token>'
curl -I 'https://naraya.biz.id/api/videos/<video-token>'
```

## Notes Operasional

- Jangan expose nilai secret di dokumentasi, log publik, atau UI.
- Ganti `MEDIA_PROXY_SECRET`, `WEB_ACCESS_SECRET`, dan `NARAYA_INTERNAL_TOKEN`
  untuk setiap environment.
- Setelah mengubah `robots.txt`, perhatikan cache Cloudflare.
- Setelah build frontend standalone, pastikan `.next/static` dan `public` tersedia
  di `.next/standalone`; systemd unit project sudah menanganinya.
- Jalankan migrasi database sebelum binary API baru dipakai jika perubahan menyentuh schema.
- Untuk query besar, gunakan index yang sudah tersedia di migration dan jalankan
  `ANALYZE` setelah migrasi besar.

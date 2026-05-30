# Naraya Frontend

<p align="center">
  <img src="./public/logo.svg" alt="Naraya" width="520" />
</p>

Frontend Naraya dibangun dengan Next.js App Router, Tailwind CSS, dan TypeScript untuk pengalaman baca komik dan nonton anime yang cepat, fokus, dan konsisten.

## Stack

- Next.js 16
- React 18
- Tailwind CSS
- TypeScript
- Lucide React

## Menjalankan Frontend

Install dependency:

```bash
npm install
```

Development:

```bash
npm run dev
```

Server development:

```text
http://127.0.0.1:3000
```

## Environment

Development:

```env
NARAYA_API_URL=http://127.0.0.1:4000/api
NEXT_PUBLIC_NARAYA_API_URL=http://127.0.0.1:4000/api
```

Production:

```env
NARAYA_API_URL=https://naraya.biz.id/api
NEXT_PUBLIC_NARAYA_API_URL=https://naraya.biz.id/api
```

Jika `NARAYA_API_URL` tidak diset, frontend memakai fallback:

- Development: `http://127.0.0.1:4000/api`
- Production: `https://naraya.biz.id/api`

## Script

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Build Production

```bash
npm ci
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Gunakan `npm run start` untuk audit production dan Lighthouse. `npm run dev` hanya untuk development karena membawa HMR, WebSocket, runtime development, dan cache behavior khusus dev.

## Deploy Frontend

Environment wajib:

```env
NODE_ENV=production
NARAYA_API_URL=https://naraya.biz.id/api
NEXT_PUBLIC_NARAYA_API_URL=https://naraya.biz.id/api
```

Deploy manual:

```bash
git pull origin main
npm ci
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Contoh PM2:

```bash
NARAYA_API_URL=https://naraya.biz.id/api NEXT_PUBLIC_NARAYA_API_URL=https://naraya.biz.id/api pm2 start npm --name naraya-web -- run start -- --hostname 127.0.0.1 --port 3000
pm2 save
```

Reverse proxy harus mengarah ke frontend:

```text
https://naraya.biz.id -> http://127.0.0.1:3000
```

Route SEO yang perlu dicek setelah deploy:

```text
https://naraya.biz.id
https://naraya.biz.id/robots.txt
https://naraya.biz.id/sitemap.xml
https://naraya.biz.id/opengraph-image
```

## Struktur Utama

```text
app/
  page.tsx                  Home
  nav-shell.tsx             Navbar, sidebar, bottom bar, footer
  data.ts                   Server-side API adapter
  home-client.tsx           Home interaction layer
  home-hero-slider.tsx      Hero slider
  explore/                  Explore dan live search
  komik/                    Indeks katalog dan detail komik
  baca/                     Reader komik
  series/                   Detail anime
  nonton/                   Custom video player dan episode view
  library/                  Rak bacaan
  login/                    Login
  register/                 Register
  profile/                  Profile
  settings/                 Settings
```

## Integrasi API

Frontend mengambil data dari Naraya API melalui `app/data.ts` dan client-side fetch pada komponen interaktif.

Data utama:

- Home: `/api/home`
- Search: `/api/search`
- Genre: `/api/genres`
- Katalog A-Z: `/api/comics/az`
- Explore: `/api/comics/catalog`
- Detail komik: `/api/comics/:slug`
- Reader chapter: `/api/chapters/:slug`
- Detail anime: `/api/series/:slug`
- Episode: `/api/episodes/:slug`
- Video source: `/api/video-source`
- Library: `/api/library`
- Comments: `/api/comments`
- Settings: `/api/settings`

## Catatan Desain

- Gunakan style Naraya yang sudah ada.
- Hindari card di dalam card.
- Dropdown, button, input, dan empty state harus mengikuti visual system Naraya.
- Hero rail tidak boleh memakai `scrollIntoView`.
- Rail hanya boleh mengubah `scrollLeft` saat card aktif keluar dari safe area.
- Jangan menampilkan detail sumber data internal pada UI.

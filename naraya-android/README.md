# Naraya Android Beta

Project ini adalah aplikasi Android native Kotlin untuk Naraya. Aplikasi ini
tidak memakai WebView. UI, menu, dan flow dibuat mengikuti source web Naraya
yang ada di repository ini.

Build distribusi web saat ini ditandai sebagai beta:

- App label: `Naraya Beta`
- Application ID: `id.naraya.app`
- Version code: `37`
- Version name: `1.0.36-beta`

## Source Yang Dianalisa

Frontend:

- `naraya/app/page.tsx`
- `naraya/app/home-client.tsx`
- `naraya/app/home-hero-slider.tsx`
- `naraya/app/components.tsx`
- `naraya/app/explore/page.tsx`
- `naraya/app/indeks/page.tsx`
- `naraya/app/komik/[slug]/page.tsx`
- `naraya/app/series/[slug]/page.tsx`
- `naraya/app/baca/[slug]/page.tsx`
- `naraya/app/nonton/[slug]/page.tsx`
- `naraya/app/library/page.tsx`
- `naraya/app/profile/page.tsx`
- `naraya/app/settings/page.tsx`
- `naraya/app/login/page.tsx`
- `naraya/app/register/page.tsx`

Backend:

- `naraya-api/internal/http/server.go`
- `naraya-api/internal/http/web_guard.go`
- `naraya-api/internal/http/session.go`
- `naraya-api/internal/model/comic.go`
- `naraya-api/internal/model/internal.go`
- `naraya-api/internal/store/store.go`

Database:

- `naraya-api/database/schema.sql`
- `naraya-api/migrations/001_internal_system.sql` sampai
  `016_library_unique_progress.sql`

## Flow Yang Dibawa Ke Android

Menu utama:

- Home
- Explore
- Indeks
- Rak
- Profile

Route/flow konten:

- Detail komik
- Detail anime/series
- Baca chapter
- Nonton episode
- Login
- Register
- Settings

Fitur akun:

- Session login/register
- Rak favorit dan history
- Profile stats
- Riwayat komentar
- Riwayat love
- Settings user
- Logout

Fitur interaksi:

- Favorite/simpan
- Love
- Share
- Komentar
- Reader gambar
- Player video native ExoPlayer
- Picture-in-Picture untuk nonton episode
- MediaSession foreground service untuk playback video saat aplikasi masuk latar belakang
- Notifikasi update aplikasi
- In-app updater untuk build distribusi web

## Integrasi API

API production:

```text
https://naraya.biz.id/api
```

Backend Naraya memakai web guard. Native Android tidak menyimpan
`NARAYA_INTERNAL_TOKEN` karena token internal tidak boleh dikirim ke client.
Aplikasi melakukan bootstrap seperti browser dan menandatangani request native:

1. Request ke `https://naraya.biz.id` untuk mendapat cookie `naraya_web`.
2. Memakai user-agent browser-like.
3. Menyimpan cookie lewat `CookieJar`.
4. Request API memakai `Referer`, `Origin`, dan `Sec-Fetch-*` sesuai konteks web.
5. Request native membawa `X-Naraya-App`, versi, timestamp, dan HMAC signature dari `NARAYA_APP_ACCESS_SECRET`.
6. Login menyimpan `naraya_session` dari cookie response untuk API akun.

Ini mengikuti proteksi backend yang sudah ada. `NARAYA_APP_ACCESS_SECRET`
dipakai untuk signature aplikasi dan tidak sama dengan `NARAYA_INTERNAL_TOKEN`.

## Struktur

```text
naraya-android/
  settings.gradle.kts
  build.gradle.kts
  gradlew
  gradle/wrapper/
  app/
    build.gradle.kts
    src/main/
      AndroidManifest.xml
      java/id/naraya/app/
        MainActivity.kt
        NarayaApplication.kt
        data/
          Models.kt
          NarayaApiClient.kt
          SessionStore.kt
        ui/
          Components.kt
          NarayaApp.kt
          UiState.kt
          theme/
            NarayaTheme.kt
```

## Stack

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

## Cara Setup

Prerequisite:

- Android Studio terbaru.
- JDK 17.
- Android SDK 35.

Build dari Android Studio:

1. Open folder `naraya-android`.
2. Sync Gradle.
3. Pilih device/emulator Android.
4. Run `app`.

Build dari terminal:

```bash
cd naraya-android
NARAYA_APP_ACCESS_SECRET=change-this-long-random-secret ./gradlew assembleWebDebug
```

Output APK distribusi web:

```text
app/build/outputs/apk/web/debug/app-web-debug.apk
```

Build Google Play tanpa in-app updater:

```bash
cd naraya-android
NARAYA_APP_ACCESS_SECRET=change-this-long-random-secret ./gradlew assemblePlayRelease
```

## Catatan Verifikasi

Server ini sudah dipasang toolchain build Android:

- OpenJDK 17
- Android SDK command-line tools di `/opt/android-sdk`
- Android platform 35
- Android build-tools 35.0.0
- Gradle wrapper 8.10.2

Build yang sudah diverifikasi:

```bash
./gradlew assembleWebDebug
```

Hasil verifikasi:

```text
BUILD SUCCESSFUL
```

## Catatan Proteksi Media

Reader image dan video tetap dipanggil melalui endpoint Naraya:

- `/api/images/:token`
- `/api/videos/:token`
- `/api/video-source/:token`

Video player native memakai Media3 ExoPlayer dengan request header dan cookie
dari bootstrap web guard agar tetap mengikuti proteksi backend Naraya.

## Update Aplikasi

Endpoint versi:

```text
https://naraya.biz.id/download/android/version
```

Endpoint download APK:

```text
https://naraya.biz.id/download/android
```

Build `web` mengaktifkan updater dalam aplikasi. Build `play` mematikan updater
agar distribusi Google Play tidak membawa permission install APK.

import { NextResponse } from 'next/server';
import { stat } from 'node:fs/promises';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const APK_PATH = process.env.NARAYA_ANDROID_APK_PATH || '/var/www/naraya/naraya-android/app/build/outputs/apk/web/debug/app-web-debug.apk';
const VERSION_CODE = Number.parseInt(process.env.NARAYA_ANDROID_VERSION_CODE || '38', 10);
const VERSION_NAME = process.env.NARAYA_ANDROID_VERSION_NAME || '1.0.37-beta';
const MIN_SUPPORTED_VERSION_CODE = Number.parseInt(process.env.NARAYA_ANDROID_MIN_SUPPORTED_VERSION_CODE || '1', 10);
const REQUIRED = process.env.NARAYA_ANDROID_UPDATE_REQUIRED === 'true';

function apkFileName() {
  return `Naraya-${VERSION_NAME.replace(/[^0-9A-Za-z._-]/g, '') || 'Android'}.apk`;
}

function releaseNotes() {
  const raw = process.env.NARAYA_ANDROID_RELEASE_NOTES || '';
  if (!raw.trim()) {
    return [
      'Animasi loading muncul saat video masih menyiapkan buffer.',
      'Tombol fullscreen video tersedia langsung di player.',
      'Tombol sort daftar chapter dan episode tersedia di APK.',
      'Filter Explore diperbaiki menjadi dropdown non-sticky.',
      'Riwayat komentar tampil penuh dengan warna teks lebih jelas.',
      'Video player diperbaiki agar loading tidak menutup kontrol dan video tetap termuat.',
      'Filter Anime di Rak APK diperbaiki untuk data lama dan data baru.',
      'Download dan update APK bisa dilakukan tanpa login.',
      'Loading awal aplikasi memakai animasi logo Naraya dan background baru.',
      'Download update APK dibuat streaming dan progress aplikasi lebih ringan.',
      'Cek versi dan download update tidak lagi memuat halaman utama lebih dulu.',
      'Filter Rak di APK memakai dropdown, ikut scroll, dan query tipe/status langsung ke backend.',
      'Profile APK sekarang menampilkan foto profil dengan fallback logo Naraya.',
      'Reader dan video player APK diperbaiki agar loading tidak muter terus dan menampilkan retry saat media lambat.',
      'Akses video native APK diperbaiki agar server nonton anime bisa dimuat oleh player.',
      'Retry halaman baca komik dan nonton sekarang benar-benar memuat ulang data dari server.',
      'Loading gambar baca komik APK diperbaiki agar mengikuti status load gambar yang sebenarnya.',
      'Halaman baca chapter APK sekarang punya tombol Prev/Next chapter.',
      'Kolom komentar chapter ditambahkan di halaman baca komik APK.',
      'Posisi Info dan Sinopsis di detail komik/anime APK dirapikan menjadi section terpisah.',
      'Format tanggal komentar APK dirapikan menjadi tanggal dan jam tanpa teks ISO mentah.',
      'Tombol logout APK dipindahkan dari Profile ke Settings.',
      'Build APK dipisah untuk distribusi web dan Google Play agar permission install APK tidak ikut ke variant Play.',
      'Updater APK sekarang selalu mengecek versi terbaru sebelum download dan memakai URL download berversi.',
      'Riwayat Love di Profile APK disamakan dengan tampilan web dan tanggalnya dirapikan.',
      'Tombol Favorite, Love, dan Share di detail komik/anime APK dipindahkan ke bawah judul.',
      'Navigasi Home APK diperbaiki setelah membuka Explore dari pilihan genre di Home.',
      'Pilihan server nonton APK diganti menjadi dropdown.',
      'Video nonton APK sekarang dipegang MediaSession foreground service agar playback tetap jalan di latar belakang.',
      'APK mengecek update berkala dan menampilkan notifikasi ketika versi baru terdeteksi.',
      'Tombol Favorite, Love, dan Share detail komik/anime APK diposisikan di bawah judul sebelah kanan cover.',
      'Mode Picture-in-Picture ditambahkan agar video nonton APK muncul sebagai popup saat aplikasi masuk latar belakang.',
      'Mode Picture-in-Picture APK sekarang hanya menampilkan video, bukan halaman nonton penuh.',
      'Tombol Favorite, Love, dan Share detail APK dibuat icon-only dengan badge jumlah.',
      'PiP nonton APK diperbaiki agar transisi ke popup tidak menghentikan service/player.',
      'Aplikasi Android ditandai sebagai Naraya Beta untuk distribusi awal.',
      'Kontak iklan dan kerja sama ditambahkan di Settings aplikasi.',
    ];
  }
  return raw.split('|').map((item) => item.trim()).filter(Boolean);
}

export async function GET() {
  const apkInfo = await stat(/* turbopackIgnore: true */ APK_PATH).catch(() => null);
  const versionCode = Number.isFinite(VERSION_CODE) ? VERSION_CODE : 1;

  return NextResponse.json(
    {
      platform: 'android',
      versionCode,
      versionName: VERSION_NAME,
      minSupportedVersionCode: Number.isFinite(MIN_SUPPORTED_VERSION_CODE) ? MIN_SUPPORTED_VERSION_CODE : 1,
      downloadUrl: `/download/android?v=${versionCode}`,
      fileName: apkFileName(),
      pageUrl: '/download',
      sizeBytes: apkInfo?.isFile() ? apkInfo.size : 0,
      updatedAt: apkInfo?.isFile() ? apkInfo.mtime.toISOString() : '',
      required: REQUIRED,
      releaseNotes: releaseNotes(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    },
  );
}

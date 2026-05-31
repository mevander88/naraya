import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const APK_PATH = process.env.NARAYA_ANDROID_APK_PATH || '/var/www/naraya/naraya-android/app/build/outputs/apk/web/debug/app-web-debug.apk';
const VERSION_NAME = process.env.NARAYA_ANDROID_VERSION_NAME || '1.0.36-beta';

function apkFileName() {
  return `Naraya-${VERSION_NAME.replace(/[^0-9A-Za-z._-]/g, '') || 'Android'}.apk`;
}

function baseHeaders(apkInfo: { size: number; mtime: Date }, contentLength = apkInfo.size) {
  return {
    'Content-Type': 'application/vnd.android.package-archive',
    'Content-Length': String(contentLength),
    'Content-Disposition': `attachment; filename="${apkFileName()}"`,
    'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Last-Modified': apkInfo.mtime.toUTCString(),
    'Accept-Ranges': 'bytes',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Resource-Policy': 'same-site',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  };
}

function parseRange(range: string | null, size: number) {
  if (!range) return null;
  const match = range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return { invalid: true as const };

  const [, rawStart, rawEnd] = match;
  let start = rawStart ? Number.parseInt(rawStart, 10) : Number.NaN;
  let end = rawEnd ? Number.parseInt(rawEnd, 10) : size - 1;

  if (!rawStart && rawEnd) {
    const suffixLength = Number.parseInt(rawEnd, 10);
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) {
    return { invalid: true as const };
  }

  return { start, end: Math.min(end, size - 1), invalid: false as const };
}

async function getApkInfo() {
  const apkInfo = await stat(/* turbopackIgnore: true */ APK_PATH).catch(() => null);
  if (!apkInfo?.isFile()) {
    return null;
  }
  return apkInfo;
}

export async function HEAD() {
  const apkInfo = await getApkInfo();
  if (!apkInfo) {
    return NextResponse.json({ error: 'android apk is not available' }, { status: 503 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: baseHeaders(apkInfo),
  });
}

export async function GET(request: NextRequest) {
  const apkInfo = await getApkInfo();
  if (!apkInfo) {
    return NextResponse.json({ error: 'android apk is not available' }, { status: 503 });
  }

  const range = parseRange(request.headers.get('range'), apkInfo.size);
  if (range?.invalid) {
    return new NextResponse(null, {
      status: 416,
      headers: {
        'Content-Range': `bytes */${apkInfo.size}`,
        'Accept-Ranges': 'bytes',
      },
    });
  }

  const start = range?.start ?? 0;
  const end = range?.end ?? apkInfo.size - 1;
  const contentLength = end - start + 1;
  const stream = Readable.toWeb(createReadStream(/* turbopackIgnore: true */ APK_PATH, { start, end })) as ReadableStream<Uint8Array>;
  const headers = baseHeaders(apkInfo, contentLength);

  if (range) {
    return new NextResponse(stream, {
      status: 206,
      headers: {
        ...headers,
        'Content-Range': `bytes ${start}-${end}/${apkInfo.size}`,
      },
    });
  }

  return new NextResponse(stream, {
    status: 200,
    headers,
  });
}

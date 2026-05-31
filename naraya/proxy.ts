import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = 'naraya_web';
const TOKEN_TTL_SECONDS = 2 * 60 * 60;

export async function proxy(request: NextRequest) {
  const ampURL = ampURLForPath(request.nextUrl.pathname);
  const response = NextResponse.next();

  if (ampURL) {
    response.headers.append('Link', `<${ampURL}>; rel="amphtml"`);
  }

  const secret = process.env.WEB_ACCESS_SECRET || process.env.NARAYA_WEB_ACCESS_SECRET || '';
  if (!secret) return response;

  const token = await createWebToken(request.headers.get('user-agent') ?? '', secret);
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  });
  return response;
}

export const config = {
  matcher: [
    '/((?!api|amp|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|logo.svg|opengraph-image|twitter-image).*)',
  ],
};

function ampURLForPath(pathname: string) {
  const match = pathname.match(/^\/(komik|series)\/([^/]+)\/?$/);
  if (!match) return '';
  return `https://naraya.biz.id/amp/${match[1]}/${match[2]}`;
}

async function createWebToken(userAgent: string, secret: string) {
  const expiresAt = String(Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS);
  const uaHash = (await sha256Hex(userAgent.trim())).slice(0, 24);
  const nonce = randomHex(16);
  const signature = await hmacHex(`${expiresAt}|${uaHash}|${nonce}`, secret);
  return `${expiresAt}.${uaHash}.${nonce}.${signature}`;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

async function hmacHex(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(signature));
}

function randomHex(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

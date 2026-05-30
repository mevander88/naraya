'use client';

export function apiBaseURL() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '/api';
  }
  return process.env.NEXT_PUBLIC_NARAYA_API_URL ?? (process.env.NODE_ENV === 'production' ? 'https://naraya.biz.id/api' : 'http://127.0.0.1:4000/api');
}

export function apiOrigin() {
  const base = apiBaseURL();
  if (base.startsWith('/')) return '';
  return base.replace(/\/api\/?$/, '');
}

export function mediaURL(value: string): string;
export function mediaURL(value?: string): string | undefined;
export function mediaURL(value?: string) {
  if (!value) return value;
  return value.startsWith('/api/') ? `${apiOrigin()}${value}` : value;
}

export function apiURL(path: string) {
  return `${apiBaseURL()}${path.startsWith('/') ? path : `/${path}`}`;
}

export function apiCredentials(): RequestCredentials {
  return 'include';
}

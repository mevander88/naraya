'use client';

import { Check, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import type { UserSettings } from '../data';
import { apiCredentials, apiURL } from '../lib/client-api';

type SettingKey = 'autoBookmark' | 'matureFilter' | 'highQualityImages';

type SettingRow = {
  key: SettingKey;
  title: string;
  description: string;
};

const rows: SettingRow[] = [
  { key: 'autoBookmark', title: 'Bookmark otomatis', description: 'Simpan item ketika mulai membaca atau menonton' },
  { key: 'matureFilter', title: 'Filter mature', description: 'Batasi konten dewasa dari explore' },
  { key: 'highQualityImages', title: 'Kualitas gambar tinggi', description: 'Prioritaskan artwork resolusi besar' },
];

export function SettingsClient({ initialSettings }: { initialSettings: UserSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [savingKey, setSavingKey] = useState<SettingKey | null>(null);
  const [error, setError] = useState('');

  async function toggle(key: SettingKey) {
    const nextValue = !settings[key];
    const previous = settings;
    setSettings((current) => ({ ...current, [key]: nextValue }));
    setSavingKey(key);
    setError('');

    try {
      const response = await fetch(apiURL('/settings'), {
        method: 'PATCH',
        credentials: apiCredentials(),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: nextValue }),
      });
      if (!response.ok) throw new Error('settings update failed');
      const updated = (await response.json()) as UserSettings;
      setSettings(updated);
    } catch {
      setSettings(previous);
      setError('Settings belum bisa disimpan. Coba ulang sebentar lagi.');
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {rows.map((row) => {
          const enabled = settings[row.key];
          const saving = savingKey === row.key;

          return (
            <article key={row.key} className="glass-panel flex min-w-0 items-center justify-between gap-4 rounded-2xl p-5">
              <div className="min-w-0">
                <h3 className="font-semibold">{row.title}</h3>
                <p className="mt-1 break-words text-sm text-on-surface-variant">{row.description}</p>
              </div>
              <button
                type="button"
                onClick={() => void toggle(row.key)}
                disabled={savingKey !== null}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  enabled ? 'bg-primary text-on-primary shadow-glow' : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/12 hover:text-primary'
                }`}
                aria-pressed={enabled}
                aria-label={`${enabled ? 'Nonaktifkan' : 'Aktifkan'} ${row.title}`}
              >
                {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Check size={18} />}
              </button>
            </article>
          );
        })}
      </div>
      {error ? (
        <p className="mt-5 rounded-2xl bg-tertiary/10 px-4 py-3 text-sm leading-6 text-tertiary ring-1 ring-tertiary/25">
          {error}
        </p>
      ) : null}
    </>
  );
}

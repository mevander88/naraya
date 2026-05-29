import { Check } from 'lucide-react';
import { getSettings } from '../data';

export default async function SettingsPage() {
  const settings = await getSettings();
  const rows = [
    ['Mode imersif', 'Sembunyikan UI saat membaca panel panjang', settings.immersiveMode],
    ['Bookmark otomatis', 'Simpan item ketika mulai membaca atau menonton', settings.autoBookmark],
    ['Filter mature', 'Batasi konten dewasa dari explore', settings.matureFilter],
    ['Kualitas gambar tinggi', 'Prioritaskan artwork resolusi besar', settings.highQualityImages],
  ] as const;

  return (
    <section className="px-container-mobile pt-28 md:px-container-desktop">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Settings</p>
      <h2 className="mt-2 font-display text-4xl font-bold">Preferensi baca</h2>
      <p className="mt-3 max-w-2xl text-on-surface-variant">Atur pengalaman baca Naraya agar sesuai dengan kebiasaanmu.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {rows.map(([title, desc, enabled]) => (
          <article key={title} className="glass-panel flex items-center justify-between rounded-2xl p-5">
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">{desc}</p>
            </div>
            <span className={`rounded-full p-2 ${enabled ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
              <Check size={18} />
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

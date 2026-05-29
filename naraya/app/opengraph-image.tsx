import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Naraya - Baca Komik dan Nonton Anime';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #121019 0%, #201a29 48%, #33283f 100%)',
          color: '#f4eff4',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -120,
            top: -120,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: 'rgba(208, 188, 255, 0.24)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -100,
            bottom: -140,
            width: 470,
            height: 470,
            borderRadius: 999,
            background: 'rgba(242, 184, 181, 0.18)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '86px 92px', width: 760 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#d0bcff',
                color: '#211e27',
                fontSize: 50,
                fontWeight: 900,
              }}
            >
              N
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 24, letterSpacing: 8, color: '#d0bcff', fontWeight: 800 }}>NARAYA</div>
              <div style={{ marginTop: 8, fontSize: 18, color: '#cac4d0', fontWeight: 700 }}>KOMIK DAN ANIME</div>
            </div>
          </div>
          <div style={{ marginTop: 58, fontSize: 78, lineHeight: 0.96, letterSpacing: -4, fontWeight: 900 }}>
            Baca komik dan nonton anime tanpa distraksi.
          </div>
          <div style={{ marginTop: 32, maxWidth: 700, fontSize: 28, lineHeight: 1.35, color: '#cac4d0', fontWeight: 600 }}>
            Katalog, genre, reader chapter, episode, library, dan diskusi dalam satu ruang Naraya.
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 88,
            bottom: 74,
            width: 300,
            height: 410,
            borderRadius: 44,
            border: '14px solid #d0bcff',
            background: '#211e27',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 36px 90px rgba(0,0,0,0.34)',
          }}
        >
          <div style={{ fontSize: 170, fontWeight: 900, color: '#d0bcff', letterSpacing: -14 }}>N</div>
        </div>
      </div>
    ),
    size,
  );
}

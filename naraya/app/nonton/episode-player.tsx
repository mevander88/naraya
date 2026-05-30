'use client';

import { ChevronDown, FastForward, Maximize2, Minimize2, Pause, Play, Rewind, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import type { EpisodeServerData } from '../data';
import { apiBaseURL, apiOrigin } from '../lib/client-api';

type EpisodePlayerProps = {
  title: string;
  playerUrl: string;
  servers: EpisodeServerData[];
  episodeLabel?: string;
};

export function EpisodePlayer({ title, playerUrl, servers, episodeLabel }: EpisodePlayerProps) {
  const normalizedServers = useMemo(() => {
    const playerServer = servers.find((server) => server.url === playerUrl);
    const withPlayer = playerUrl ? [{ type: 'Default', host: 'Player', url: playerUrl, direct: playerServer?.direct }, ...servers] : servers;
    const seen = new Set<string>();
    return withPlayer.filter((server) => {
      if (!server.url || seen.has(server.url)) return false;
      seen.add(server.url);
      return true;
    });
  }, [playerUrl, servers]);
  const [activeUrl, setActiveUrl] = useState(normalizedServers[0]?.url ?? playerUrl);
  const [resolvedUrl, setResolvedUrl] = useState(activeUrl);
  const [resolvedDirect, setResolvedDirect] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [open, setOpen] = useState(false);
  const activeServer = normalizedServers.find((server) => server.url === activeUrl);
  const activeIsDirect = Boolean(resolvedDirect || activeServer?.direct || /\.(m3u8|mp4)(\?|$)/i.test(resolvedUrl) || resolvedUrl.includes('/media/') || resolvedUrl.startsWith('/api/videos/') || resolvedUrl.includes('/api/videos/'));
  const resolvedIsResolverUrl = resolvedUrl.includes('/api/video-source/');
  const showResolvingState = resolving || resolvedIsResolverUrl;

  useEffect(() => {
    let alive = true;
    setResolvedDirect(Boolean(activeServer?.direct));
    if (!activeUrl) {
      setResolvedUrl('');
      setResolving(false);
      return;
    }
    const base = apiBaseURL();
    const origin = apiOrigin();
    const resolverUrl = activeUrl.startsWith('/api/video-source/')
      ? `${origin}${activeUrl}`
      : activeUrl.includes('/api/video-source/')
        ? activeUrl
        : '';
    if (activeUrl.includes('/api/videos/') || activeServer?.direct || !resolverUrl) {
      setResolvedUrl(activeUrl);
      setResolving(false);
      return;
    }
    setResolving(true);
    setResolvedUrl('');
    fetch(resolverUrl)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { url?: string; direct?: boolean } | null) => {
        if (!alive) return;
        if (!payload?.url) {
          setResolvedUrl('');
          return;
        }
        setResolvedUrl(payload.url.startsWith('/api/') ? `${base.replace(/\/api\/?$/, '')}${payload.url}` : payload.url);
        setResolvedDirect(Boolean(payload.direct));
      })
      .catch(() => {
        if (alive) setResolvedUrl('');
      })
      .finally(() => {
        if (alive) setResolving(false);
      });
    return () => {
      alive = false;
    };
  }, [activeServer?.direct, activeUrl]);

  return (
    <div>
      <div className="naraya-player-frame relative aspect-video overflow-hidden rounded-[1.55rem] bg-black shadow-[0_22px_60px_rgba(0,0,0,0.38)]">
        {showResolvingState ? (
          <div className="naraya-player-loading grid h-full place-items-center bg-[radial-gradient(circle_at_50%_48%,rgba(216,178,255,0.18),transparent_28%),rgba(7,5,10,0.86)] px-6 text-center">
            <div className="flex flex-col items-center rounded-[1.5rem] bg-[rgba(18,14,25,0.68)] px-5 py-4 shadow-2xl shadow-black/35 backdrop-blur-xl">
              <span className="relative grid h-12 w-12 place-items-center rounded-full bg-primary/12">
                <span className="naraya-loading-ping absolute h-full w-full animate-ping rounded-full bg-primary/20" />
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
              </span>
              <span className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Menyiapkan server</span>
            </div>
          </div>
        ) : resolvedUrl && activeIsDirect ? (
          <NarayaVideoPlayer key={resolvedUrl} title={title} src={resolvedUrl} resolving={resolving} />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-on-surface-variant">
            Server aman belum tersedia untuk episode ini.
          </div>
        )}
      </div>
      {normalizedServers.length ? (
        <div className="relative mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(240px,360px)] md:items-end">
          <div>
            <div className="mb-2 flex items-end justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Server</p>
              <p className="text-xs font-semibold text-on-surface-variant">{normalizedServers.length} pilihan</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              className="flex h-12 w-full items-center justify-between rounded-2xl bg-background/34 px-4 text-left text-sm font-bold text-on-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-primary/10 focus:outline-none focus-visible:bg-primary/10"
            >
              <span className="truncate pr-3">
                {activeServer ? [activeServer.type, activeServer.host].filter(Boolean).join(' - ') || 'Server aktif' : 'Pilih server'}
              </span>
              <ChevronDown size={17} className={`shrink-0 text-primary transition ${open ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <div className="flex h-12 min-w-0 items-center justify-between gap-3 px-1 md:px-0">
            <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Episode</p>
            <p className="min-w-0 truncate text-sm font-bold text-on-surface">{episodeLabel ?? title}</p>
          </div>
          {open ? (
            <div className="absolute bottom-auto left-0 top-[calc(100%+0.5rem)] z-30 max-h-72 w-full overflow-y-auto rounded-[1.35rem] bg-[linear-gradient(145deg,rgba(25,22,33,0.98),rgba(14,13,20,0.98))] p-2 shadow-2xl shadow-black/45 [scrollbar-color:rgba(216,178,255,0.45)_transparent] [scrollbar-width:thin] md:w-[360px]">
              {normalizedServers.map((server, index) => {
                const label = [server.type, server.host].filter(Boolean).join(' - ') || `Server ${index + 1}`;
                const active = activeUrl === server.url;
                return (
                  <button
                    key={`${server.url}-${index}`}
                    type="button"
                    onClick={() => {
                      setActiveUrl(server.url);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                      active ? 'bg-primary text-on-primary shadow-[0_12px_30px_rgba(216,178,255,0.18)]' : 'text-on-surface-variant hover:bg-white/[0.075] hover:text-on-surface'
                    }`}
                  >
                    <span className="truncate">{label}</span>
                    {active ? <span className="ml-3 h-1.5 w-1.5 shrink-0 rounded-full bg-on-primary" /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function NarayaVideoPlayer({ src, title, resolving }: { src: string; title: string; resolving: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const tapTimerRef = useRef<number | null>(null);
  const tapCountRef = useRef(0);
  const lastTimeUpdateRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [waiting, setWaiting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!playing || !controlsVisible || error) return;
    const timer = window.setTimeout(() => setControlsVisible(false), 2000);
    return () => window.clearTimeout(timer);
  }, [controlsVisible, error, playing]);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current !== null) {
        window.clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === wrapRef.current);
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
    };
  }, []);

  useEffect(() => {
    if (!controlsVisible) return;
    const video = videoRef.current;
    if (video) setCurrent(video.currentTime || 0);
  }, [controlsVisible]);

  function handleSurfaceClick() {
    tapCountRef.current += 1;

    if (tapCountRef.current >= 2) {
      if (tapTimerRef.current !== null) {
        window.clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      tapCountRef.current = 0;
      toggleFullscreen();
      return;
    }

    tapTimerRef.current = window.setTimeout(() => {
      tapTimerRef.current = null;
      tapCountRef.current = 0;
      setControlsVisible((currentValue) => !currentValue);
    }, 260);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }

  function seek(value: string) {
    const video = videoRef.current;
    if (!video) return;
    const next = Number(value);
    video.currentTime = next;
    setCurrent(next);
  }

  function skipBy(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    const max = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration;
    const next = Math.min(Math.max(video.currentTime + seconds, 0), max || video.currentTime + seconds);
    video.currentTime = next;
    setCurrent(next);
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function replay() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setCurrent(0);
    void video.play();
  }

  function toggleFullscreen() {
    const node = wrapRef.current;
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    if (node?.requestFullscreen) {
      void node.requestFullscreen();
    } else if (video?.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  }

  function handleTimeUpdate(event: SyntheticEvent<HTMLVideoElement>) {
    const next = event.currentTarget.currentTime || 0;
    if (!controlsVisible && playing) return;
    const now = window.performance.now();
    if (now - lastTimeUpdateRef.current < 250 && Math.abs(next - current) < 1) return;
    lastTimeUpdateRef.current = now;
    setCurrent(next);
  }

  const progressPercent = duration > 0 ? Math.min(Math.max((current / duration) * 100, 0), 100) : 0;

  return (
    <div
      ref={wrapRef}
      onClick={handleSurfaceClick}
      onContextMenu={(event) => event.preventDefault()}
      onMouseEnter={() => setControlsVisible(true)}
      className="naraya-video-surface group relative h-full w-full bg-[radial-gradient(circle_at_50%_15%,rgba(216,178,255,0.12),transparent_38%),linear-gradient(145deg,#100d17,#020203)]"
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        draggable={false}
        onContextMenu={(event) => event.preventDefault()}
        className="h-full w-full bg-transparent object-contain"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0);
          setWaiting(false);
        }}
        onCanPlay={() => setWaiting(false)}
        onWaiting={() => setWaiting(true)}
        onLoadStart={() => setWaiting(true)}
        onTimeUpdate={handleTimeUpdate}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
        onError={() => setError(true)}
      />

      <div className={`pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-[rgba(18,14,25,0.58)] px-3 py-1.5 font-display text-xs font-bold tracking-[0.16em] text-primary shadow-xl shadow-black/35 backdrop-blur-md transition duration-300 ${controlsVisible || !playing ? 'opacity-100' : 'opacity-35'}`}>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/16 text-[0.62rem] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">N</span>
        <span>Naraya</span>
      </div>

      <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(216,178,255,0.22),transparent_30%),linear-gradient(180deg,rgba(11,8,16,0.18),rgba(11,8,16,0.56))] transition duration-300 ${controlsVisible || !playing ? 'opacity-100' : 'opacity-0'}`} />

      {(!playing || controlsVisible) && !error ? (
        <button type="button" onClick={(event) => { event.stopPropagation(); togglePlay(); }} className="absolute left-1/2 top-1/2 grid h-[4.35rem] w-[4.35rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[linear-gradient(145deg,rgba(216,178,255,0.96),rgba(159,122,234,0.92))] text-on-primary shadow-[0_0_42px_rgba(216,178,255,0.36)] backdrop-blur transition hover:scale-105">
          {playing ? <Pause size={28} fill="currentColor" /> : <Play size={30} fill="currentColor" className="translate-x-0.5" />}
        </button>
      ) : null}

      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-black/72 px-6 text-center">
          <div>
            <p className="font-display text-xl font-semibold text-on-surface">Server ini belum bisa diputar.</p>
            <p className="mt-2 text-sm text-on-surface-variant">Pilih server lain dari dropdown di bawah player.</p>
          </div>
        </div>
      ) : null}

      {(resolving || waiting) && !error ? (
        <div className="naraya-player-loading absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_48%,rgba(216,178,255,0.18),transparent_28%),rgba(7,5,10,0.42)]">
          <div className="flex flex-col items-center rounded-[1.5rem] bg-[rgba(18,14,25,0.68)] px-5 py-4 shadow-2xl shadow-black/35 backdrop-blur-xl">
            <span className="relative grid h-12 w-12 place-items-center rounded-full bg-primary/12">
              <span className="naraya-loading-ping absolute h-full w-full animate-ping rounded-full bg-primary/20" />
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
            </span>
            <span className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {resolving ? 'Menyiapkan server' : 'Memuat video'}
            </span>
          </div>
        </div>
      ) : null}

      <div onClick={(event) => event.stopPropagation()} className={`naraya-player-controls absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(11,8,16,0.54)_28%,rgba(11,8,16,0.94))] p-3 transition duration-300 ${controlsVisible || !playing ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}>
        <div className="relative pt-7">
          <span
            className="pointer-events-none absolute top-0 rounded-full bg-primary px-2 py-0.5 text-[0.68rem] font-bold tabular-nums text-on-primary shadow-glow"
            style={{ left: `clamp(1.75rem, ${progressPercent}%, calc(100% - 1.75rem))`, transform: 'translateX(-50%)' }}
          >
            {formatTime(current)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="0.1"
            value={Math.min(current, duration || current)}
            onChange={(event) => seek(event.target.value)}
            className="w-full accent-primary"
            aria-label="Progress video"
          />
          <div className="mt-1 flex items-center justify-between text-[0.68rem] font-semibold tabular-nums text-on-surface-variant">
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={() => skipBy(-10)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-container-high/42 text-on-surface-variant shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur transition hover:bg-primary/18 hover:text-primary" aria-label="Kembali 10 detik" title="Kembali 10 detik">
              <Rewind size={17} />
            </button>
            <button type="button" onClick={togglePlay} className="grid h-10 w-10 place-items-center rounded-full bg-primary/18 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition hover:bg-primary hover:text-on-primary">
              {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <button type="button" onClick={() => skipBy(10)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-container-high/42 text-on-surface-variant shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur transition hover:bg-primary/18 hover:text-primary" aria-label="Maju 10 detik" title="Maju 10 detik">
              <FastForward size={17} />
            </button>
            <button type="button" onClick={replay} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-container-high/42 text-on-surface-variant shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur transition hover:bg-primary/18 hover:text-primary" aria-label="Ulangi dari awal" title="Ulangi dari awal">
              <RotateCcw size={17} />
            </button>
            <button type="button" onClick={toggleMute} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-container-high/42 text-on-surface-variant shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur transition hover:bg-primary/18 hover:text-primary" aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'} title={muted ? 'Nyalakan suara' : 'Matikan suara'}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
          <button type="button" onClick={toggleFullscreen} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-container-high/42 text-on-surface-variant shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur transition hover:bg-primary/18 hover:text-primary" aria-label={isFullscreen ? `Keluar fullscreen ${title}` : `Fullscreen ${title}`} title={isFullscreen ? 'Keluar fullscreen' : 'Masuk fullscreen'}>
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '00:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

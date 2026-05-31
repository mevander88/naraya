package id.naraya.app.playback

import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import id.naraya.app.notify.NarayaNotifications
import java.util.concurrent.atomic.AtomicReference

class NarayaPlaybackService : MediaSessionService() {
    private var mediaSession: MediaSession? = null

    override fun onCreate() {
        super.onCreate()
        NarayaNotifications.ensureChannels(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val title = intent?.getStringExtra(EXTRA_TITLE).orEmpty()
        currentTitle.set(title)
        currentPlayer.get()?.let { ensureSession(it) }
        ServiceCompat.startForeground(
            this,
            NarayaNotifications.PLAYBACK_NOTIFICATION_ID,
            NarayaNotifications.playbackNotification(this, title),
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK else 0,
        )
        return START_STICKY
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? =
        mediaSession

    override fun onDestroy() {
        mediaSession?.release()
        mediaSession = null
        currentPlayer.getAndSet(null)?.release()
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    private fun ensureSession(player: ExoPlayer) {
        if (mediaSession?.player === player) return
        mediaSession?.release()
        mediaSession = MediaSession.Builder(this, player).build()
    }

    companion object {
        private const val EXTRA_TITLE = "title"
        private val currentPlayer = AtomicReference<ExoPlayer?>(null)
        private val currentTitle = AtomicReference("")

        fun ensurePlayer(context: Context, title: String, url: String, headers: Map<String, String>): ExoPlayer {
            val appContext = context.applicationContext
            val existing = currentPlayer.get()
            val player = existing ?: ExoPlayer.Builder(appContext)
                .setMediaSourceFactory(DefaultMediaSourceFactory(DefaultHttpDataSource.Factory().setDefaultRequestProperties(headers)))
                .build()
                .also { currentPlayer.set(it) }

            currentTitle.set(title)
            val changed = player.currentMediaItem?.localConfiguration?.uri?.toString() != url
            if (changed) {
                player.setMediaItem(MediaItem.fromUri(url))
                player.setWakeMode(C.WAKE_MODE_LOCAL)
                player.prepare()
            }
            player.playWhenReady = true
            start(appContext, title)
            return player
        }

        fun start(context: Context, title: String) {
            val intent = Intent(context, NarayaPlaybackService::class.java).putExtra(EXTRA_TITLE, title)
            ContextCompat.startForegroundService(context, intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, NarayaPlaybackService::class.java))
        }
    }
}

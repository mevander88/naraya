package id.naraya.app.playback

import android.app.Activity
import android.app.PictureInPictureParams
import android.os.Build
import android.util.Rational
import androidx.media3.exoplayer.ExoPlayer
import java.lang.ref.WeakReference

object NarayaPipController {
    private var activityRef: WeakReference<Activity>? = null
    private var playerRef: WeakReference<ExoPlayer>? = null

    fun attach(activity: Activity, player: ExoPlayer) {
        activityRef = WeakReference(activity)
        playerRef = WeakReference(player)
        updateParams(activity)
    }

    fun detach(player: ExoPlayer) {
        if (playerRef?.get() === player) {
            playerRef = null
            activityRef = null
        }
    }

    fun enterIfReady(activity: Activity): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || activity.isInPictureInPictureMode) return false
        val player = playerRef?.get() ?: return false
        if (player.currentMediaItem == null) return false
        return runCatching {
            activity.enterPictureInPictureMode(buildParams())
        }.getOrDefault(false)
    }

    private fun updateParams(activity: Activity) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        runCatching { activity.setPictureInPictureParams(buildParams()) }
    }

    private fun buildParams(): PictureInPictureParams {
        val builder = PictureInPictureParams.Builder()
            .setAspectRatio(Rational(16, 9))
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder
                .setAutoEnterEnabled(true)
                .setSeamlessResizeEnabled(true)
        }
        return builder.build()
    }
}

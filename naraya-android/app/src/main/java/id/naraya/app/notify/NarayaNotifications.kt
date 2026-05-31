package id.naraya.app.notify

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import id.naraya.app.MainActivity
import id.naraya.app.R
import id.naraya.app.data.AndroidUpdateInfo
import id.naraya.app.data.SessionStore

object NarayaNotifications {
    const val UPDATE_CHANNEL_ID = "naraya_updates"
    const val PLAYBACK_CHANNEL_ID = "naraya_playback"
    const val UPDATE_NOTIFICATION_ID = 1001
    const val PLAYBACK_NOTIFICATION_ID = 2001

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java)
        val updateChannel = NotificationChannel(
            UPDATE_CHANNEL_ID,
            "Update Naraya",
            NotificationManager.IMPORTANCE_DEFAULT,
        ).apply {
            description = "Notifikasi saat versi baru Naraya tersedia."
        }
        val playbackChannel = NotificationChannel(
            PLAYBACK_CHANNEL_ID,
            "Nonton Naraya",
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Status pemutaran video Naraya saat berjalan di latar belakang."
            setShowBadge(false)
        }
        manager.createNotificationChannel(updateChannel)
        manager.createNotificationChannel(playbackChannel)
    }

    fun canPostNotifications(context: Context): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    fun showUpdateAvailable(context: Context, sessionStore: SessionStore, info: AndroidUpdateInfo) {
        if (info.versionCode <= 0 || sessionStore.notifiedUpdateVersionCode == info.versionCode || !canPostNotifications(context)) return
        ensureChannels(context)
        val notification = NotificationCompat.Builder(context, UPDATE_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Update Naraya tersedia")
            .setContentText("Versi ${info.versionName} sudah bisa di-download.")
            .setStyle(NotificationCompat.BigTextStyle().bigText("Versi ${info.versionName} sudah bisa di-download. Buka Naraya untuk update langsung ke versi terbaru."))
            .setContentIntent(mainPendingIntent(context))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
        NotificationManagerCompat.from(context).notify(UPDATE_NOTIFICATION_ID, notification)
        sessionStore.notifiedUpdateVersionCode = info.versionCode
    }

    fun playbackNotification(context: Context, title: String) =
        NotificationCompat.Builder(context, PLAYBACK_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Naraya sedang memutar video")
            .setContentText(title.ifBlank { "Nonton anime di Naraya" })
            .setContentIntent(mainPendingIntent(context))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .build()

    private fun mainPendingIntent(context: Context): PendingIntent =
        PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
}

package id.naraya.app

import android.app.Application
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import id.naraya.app.data.NarayaApiClient
import id.naraya.app.data.SessionStore
import id.naraya.app.notify.NarayaNotifications
import id.naraya.app.update.NarayaUpdateCheckWorker
import java.util.concurrent.TimeUnit

class NarayaApplication : Application() {
    lateinit var sessionStore: SessionStore
        private set
    lateinit var api: NarayaApiClient
        private set

    override fun onCreate() {
        super.onCreate()
        NarayaNotifications.ensureChannels(this)
        sessionStore = SessionStore(this)
        api = NarayaApiClient(sessionStore)
        scheduleUpdateChecks()
    }

    private fun scheduleUpdateChecks() {
        if (!BuildConfig.ENABLE_IN_APP_UPDATER) return
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        val request = PeriodicWorkRequestBuilder<NarayaUpdateCheckWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "naraya-update-check",
            ExistingPeriodicWorkPolicy.UPDATE,
            request,
        )
    }
}

package id.naraya.app.update

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import id.naraya.app.BuildConfig
import id.naraya.app.data.NarayaApiClient
import id.naraya.app.data.SessionStore
import id.naraya.app.notify.NarayaNotifications

class NarayaUpdateCheckWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        if (!BuildConfig.ENABLE_IN_APP_UPDATER) return Result.success()
        val sessionStore = SessionStore(applicationContext)
        val api = NarayaApiClient(sessionStore)
        return runCatching {
            val info = api.androidUpdateInfo()
            if (info.versionCode > BuildConfig.VERSION_CODE || BuildConfig.VERSION_CODE < info.minSupportedVersionCode) {
                NarayaNotifications.showUpdateAvailable(applicationContext, sessionStore, info)
            }
            Result.success()
        }.getOrElse {
            Result.retry()
        }
    }
}

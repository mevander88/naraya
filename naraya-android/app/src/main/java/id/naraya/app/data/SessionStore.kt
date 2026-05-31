package id.naraya.app.data

import android.content.Context

class SessionStore(context: Context) {
    private val preferences = context.getSharedPreferences("naraya-session", Context.MODE_PRIVATE)

    var sessionToken: String
        get() = preferences.getString("sessionToken", "") ?: ""
        set(value) = preferences.edit().putString("sessionToken", value).apply()

    var displayName: String
        get() = preferences.getString("displayName", "") ?: ""
        set(value) = preferences.edit().putString("displayName", value).apply()

    var dismissedUpdateVersionCode: Int
        get() = preferences.getInt("dismissedUpdateVersionCode", 0)
        set(value) = preferences.edit().putInt("dismissedUpdateVersionCode", value).apply()

    var notifiedUpdateVersionCode: Int
        get() = preferences.getInt("notifiedUpdateVersionCode", 0)
        set(value) = preferences.edit().putInt("notifiedUpdateVersionCode", value).apply()

    var notificationPermissionAsked: Boolean
        get() = preferences.getBoolean("notificationPermissionAsked", false)
        set(value) = preferences.edit().putBoolean("notificationPermissionAsked", value).apply()

    fun clear() {
        preferences.edit().clear().apply()
    }
}

package id.naraya.app

import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import id.naraya.app.playback.NarayaPipController
import id.naraya.app.ui.NarayaApp
import id.naraya.app.ui.theme.NarayaTheme

class MainActivity : ComponentActivity() {
    private var isInPipMode by mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val application = application as NarayaApplication
        setContent {
            NarayaTheme {
                NarayaApp(
                    api = application.api,
                    sessionStore = application.sessionStore,
                    isInPictureInPictureMode = isInPipMode,
                )
            }
        }
    }

    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        isInPipMode = isInPictureInPictureMode
    }

    override fun onUserLeaveHint() {
        NarayaPipController.enterIfReady(this)
        super.onUserLeaveHint()
    }
}

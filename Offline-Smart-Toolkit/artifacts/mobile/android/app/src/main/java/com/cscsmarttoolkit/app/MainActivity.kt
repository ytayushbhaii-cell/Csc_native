package com.cscsmarttoolkit.app

import android.os.Build
import android.os.Bundle
import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import org.devio.rn.splashscreen.SplashScreen

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Show the native splash screen before React Native JS loads.
        // SplashScreen.show() must be called before super.onCreate() so the
        // splash is visible while the JS bundle initialises.
        SplashScreen.show(this)
        super.onCreate(null)
    }

    /**
     * Returns the name of the main component registered in index.js via
     * AppRegistry.registerComponent('main', () => App).
     */
    override fun getMainComponentName(): String = "main"

    /**
     * Returns the instance of the [ReactActivityDelegate].
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    /**
     * Align back-button behaviour with Android S+.
     */
    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                super.invokeDefaultOnBackPressed()
            }
            return
        }
        super.invokeDefaultOnBackPressed()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        (application as? MainApplication)
            ?.reactNativeHost
            ?.reactInstanceManager
            ?.currentReactContext
            ?.getNativeModule(Phase6NativeModule::class.java)
            ?.onActivityResult(requestCode, resultCode, data)
    }
}

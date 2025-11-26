package dev.michaelomichael.tracka;

import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginResult;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "[Tracka:MainActivity]";

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Log.i(TAG, "onNewIntent(): " + intent);
        handleShortcutIntent(intent);
        setIntent(intent);
    }

    @Override
    public void onStart() {
        super.onStart();
        handleShortcutIntent(getIntent());
    }

    private void handleShortcutIntent(Intent intent) {
        Log.i(TAG, "handleShortcutIntent(): intent is " + intent);
        if (intent == null) return;

        Uri data = intent.getData();

        Log.i(TAG, "handleShortcutIntent(): data URI is " + data);

        if (data != null) {
            String path = data.toString();

            if (path.startsWith("tracka://link/"))
            {
                path = path.replace("tracka://link", "");
                bridge.triggerJSEvent("androidIntent", "document", "{ targetWebViewPath: \"" + path + "\" }");// TODO: Escape JS properly
                Log.i(TAG, "handleShortcutIntent(): Finished calling sendPluginResult");
            } else {
                Log.w(TAG, "handleShortcutIntent(): Given path '" + path + "' should start with 'tracka://link'");
            }
        }
    }
}

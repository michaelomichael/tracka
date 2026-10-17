package dev.michaelomichael.tracka;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

abstract class BaseActivity extends BridgeActivity {

    private final String TAG = this.getClass().getName();

    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.i(TAG, "### In onCreate, registering IntentPlugin :)");
        registerPlugin(IntentPlugin.class);
        Log.i(TAG, "### In onCreate, done registering IntentPlugin :)");
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        Log.i(TAG, "### In onNewIntent, intent is:");
        logIntent(intent);
        super.onNewIntent(intent);
        IntentPlugin plugin = (IntentPlugin) (this.getBridge().getPlugin("Intent").getInstance());
        plugin.notifyNewIntentReceived(intent);
    }

    private void logIntent(Intent intent) {
        Log.i(TAG, "Intent: " + intent);
        if (intent != null) {
            Log.i(TAG, "  Data: " + intent.getData());

            if (intent.getExtras() != null) {
                for (String key : intent.getExtras().keySet()) {
                    String value = intent.getExtras().getString(key);
                    Log.i(TAG, "  Extra '" + key + "' = '" + value + "'");
                }
            }
        }
    }
}

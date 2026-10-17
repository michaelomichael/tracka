package dev.michaelomichael.tracka;

import static java.util.Objects.requireNonNull;

import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Intent")
public class IntentPlugin extends Plugin {

    final String TAG = this.getClass().getName();

    @PluginMethod
    public void getStartIntent(PluginCall pluginCall) {
        Intent intent = getActivity().getIntent();
        Log.i(TAG, "In getStartIntent, pluginCall is " + pluginCall + " and intent is " + intent);
        JSObject ret = intentToJsObject(intent);
        pluginCall.resolve(ret);
    }

    public void notifyNewIntentReceived(Intent intent) {
        Log.i(TAG, "### notifyNewIntentReceived(): received new intent " + intent + " - will notify listeners for newIntentReceivedEvent");
        JSObject ret = intentToJsObject(intent);
        notifyListeners("newIntentReceivedEvent", ret);
    }

    private JSObject intentToJsObject(Intent intent) {
        JSObject ret = new JSObject();
        ret.put("action", intent.getAction());
        ret.put("component", requireNonNull(intent.getComponent()).getClassName());
        ret.put("uri", intent.getData() == null ? null : intent.getData().toString());
        JSObject extras = new JSObject();
        if (intent.getExtras() != null) {
            for (String key : intent.getExtras().keySet()) {
                String value = intent.getExtras().getString(key);
                extras.put(key, value);
            }
        }
        ret.put("extras", extras);

        return ret;
    }
}

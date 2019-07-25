package com.example.ebphotostorenative;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.util.Log;

public class NetworkChangeReceiver extends BroadcastReceiver {

  @Override
  public void onReceive(final Context context, final Intent intent) {
    Log.d("Connected State Changed", "Network connected: " + isConnected(context));
  }

  public static boolean isConnected(Context context) {
    try {
      ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
      NetworkInfo netInfo = cm.getActiveNetworkInfo();

      //should check null because in airplane mode it will be null
      boolean connected = (netInfo != null && netInfo.isConnected());
      Log.d("Connected State", "Connected: " + connected);
      return connected;
    } catch (NullPointerException e) {
        e.printStackTrace();
        return false;
    }
  }
}
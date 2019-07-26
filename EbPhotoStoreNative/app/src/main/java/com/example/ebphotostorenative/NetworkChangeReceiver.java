package com.example.ebphotostorenative;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.util.Log;

public class NetworkChangeReceiver extends BroadcastReceiver {
  public interface INetworkStatusListener {
    void onNetworkStatusChanged(boolean isConnected);
  }

  private static boolean mConnected = false;
  private INetworkStatusListener mListener;

  public NetworkChangeReceiver(INetworkStatusListener listener) {
    mListener = listener;
  }

  @Override
  public void onReceive(final Context context, final Intent intent) {
    mConnected = determineIsConnected(context);

    Log.d("Connected State Changed", "Network connected: " + mConnected);
    mListener.onNetworkStatusChanged(mConnected);
  }

  public static boolean isConnected() {
    return mConnected;
  }

  private static boolean determineIsConnected(Context context) {
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
// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

public class OpenAppSettingsModule extends ReactContextBaseJavaModule {
  @Override
  public String getName() {
    return "OpenAppSettingsModule";
  }

  @ReactMethod
  public void openAppSettings() {
    Activity currentActivity = getCurrentActivity();

    if (currentActivity == null) {
      return;
    }

    try {
      Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
              Uri.parse("package:" + currentActivity.getPackageName()));
      currentActivity.startActivity(i);
    } catch (Exception e) {
    }
  }

  public OpenAppSettingsModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }
}

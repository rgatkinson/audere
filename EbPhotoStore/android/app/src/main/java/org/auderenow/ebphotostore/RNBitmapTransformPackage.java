// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package org.auderenow.ebphotostore;

import java.io.ByteArrayOutputStream;
import java.util.Arrays;
import java.util.List;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.net.Uri;
import android.provider.Settings;
import android.util.Base64;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.uimanager.ViewManager;

public class RNBitmapTransformPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    return Arrays.<NativeModule>asList(
      new BitmapTransformModule(reactContext)
    );
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Arrays.<ViewManager>asList();
  }

  private static class BitmapTransformModule extends ReactContextBaseJavaModule {
    public BitmapTransformModule(ReactApplicationContext reactContext) {
      super(reactContext);
    }

    @Override
    public String getName() {
      return "BitmapTransform";
    }

    @ReactMethod
    public String transform(
      String imageBase64,
      float oldX0,
      float oldY0,
      float oldX1,
      float oldY1,
      float newX0,
      float newY0,
      float newX1,
      float newY1,
      int width,
      int height
    ) {
      float[] oldPoints = new float[]{ oldX0, oldY0, oldX1, oldY1 };
      float[] newPoints = new float[]{ newX0, newY0, newX1, newY1 };
      Matrix matrix = new Matrix();
      if (!matrix.setPolyToPoly(oldPoints, 0, newPoints, 0, 2)) {
        throw new RuntimeException("Could not initialize matrix");
      }

      byte[] imageBytes = Base64.decode(imageBase64, Base64.DEFAULT);
      Bitmap original = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);

      Bitmap result = Bitmap.createBitmap(original, 0, 0, width, height, matrix, true);

      ByteArrayOutputStream stream = new ByteArrayOutputStream();
      result.compress(Bitmap.CompressFormat.JPEG, 10, stream);
      return Base64.encodeToString(stream.toByteArray(), Base64.DEFAULT);
    }
  }
}

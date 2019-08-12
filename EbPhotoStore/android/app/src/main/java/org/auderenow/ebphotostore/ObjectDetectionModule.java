package org.auderenow.ebphotostore;

import android.app.Activity;
import android.content.Intent;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;

import org.tensorflow.lite.examples.detection.DetectorActivity;

public class ObjectDetectionModule extends ReactContextBaseJavaModule {

    public ObjectDetectionModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ObjectDetection";
    }

    @ReactMethod
    void launchDetector() {
        Activity currentActivity = getCurrentActivity();
        ReactApplicationContext context = getReactApplicationContext();
        Intent intent = new Intent(context, DetectorActivity.class);
        currentActivity.startActivity(intent);
    }
}
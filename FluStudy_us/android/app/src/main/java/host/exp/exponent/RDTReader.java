// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent;

import android.app.Activity;
import android.content.Context;
import android.widget.LinearLayout;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class RDTReader extends LinearLayout implements DetectorView.DetectorListener {
    private static final String TAG = "RDTReader";

    private Activity mActivity;
    private DetectorView detectorView;
    private boolean demoMode = false;

    public RDTReader(Context context, Activity activity) {
        super(context);
        mActivity = activity;
    }

    public void enable() {
        final RDTReader self = this;
        mActivity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                inflate(mActivity, R.layout.rdt_reader_view, self);

                detectorView = findViewById(R.id.detector_view);
                detectorView.setDetectorListener(self);
                detectorView.setDemoMode(demoMode);
                requestLayout();
            }
        });
    }

    public void disable() {
        removeAllViews();
    }


    public void callReactCallback(final String name, final WritableMap arguments) {
        mActivity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                ReactContext reactContext = (ReactContext)getContext();
                reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                        getId(), name, arguments);

            }
        });
    }

    @Override
    public void onRDTCameraReady(boolean supportsTorchMode) {
        WritableMap event = Arguments.createMap();
        event.putBoolean("supportsTorchMode", supportsTorchMode);
        callReactCallback("RDTCameraReady", event);
    }

    @Override
    public void onRDTDetected(
            DetectorView.CaptureResult captureResult,
            DetectorView.InterpretationResult interpretationResult,
            ImageFilter.FilterResult filterResult) {
        if (interpretationResult == null) {
            interpretationResult = new DetectorView.InterpretationResult();
        }
        WritableMap event = Arguments.createMap();
        if (captureResult.image != null) {
            event.putString("img", captureResult.image);
            event.putString("resultWindowImg", captureResult.windowImage);
        }

        if (captureResult.stripLocation != null) {
            event.putArray("boundary", getLocationArray(captureResult.stripLocation));
        }

        WritableMap dimensions = new WritableNativeMap();
        dimensions.putInt("width", captureResult.viewportWidth);
        dimensions.putInt("height", captureResult.viewportHeight);
        event.putMap("viewportDimensions", dimensions);
        event.putBoolean("passed", captureResult.testStripFound && filterResult.exposureResult == ImageFilter.ExposureResult.NORMAL && filterResult.isSharp());
        event.putBoolean("testStripDetected", captureResult.testStripFound);
        event.putBoolean("fiducial", interpretationResult.control);
        event.putBoolean("center", captureResult.testStripFound);
        event.putInt("sizeResult", ImageFilter.SizeResult.RIGHT_SIZE.ordinal());
        event.putBoolean("shadow", false);
        event.putBoolean("sharpness", filterResult.isSharp());
        event.putBoolean("orientation", captureResult.testStripFound);
        event.putDouble("angle", 0);
        event.putInt("exposureResult", filterResult.exposureResult.ordinal());
        event.putBoolean("control", interpretationResult.control);
        event.putBoolean("testA", interpretationResult.testA);
        event.putBoolean("testB", interpretationResult.testB);
        event.putInt("progress", getProgress(interpretationResult));
        callReactCallback("RDTCaptured", event);
    }

    private WritableArray getLocationArray(float[] location) {
        WritableArray boundary = new WritableNativeArray();
        for (int i = 0; i < location.length; i += 2) {
            WritableMap point = new WritableNativeMap();
            point.putDouble("x", location[i]);
            point.putDouble("y", location[i + 1]);
            boundary.pushMap(point);
        }
        return boundary;
    }

    private int getProgress(DetectorView.InterpretationResult result) {
        return Math.min(100, (int) (100.0 * result.samples / result.requiredSamples));
    }

    @Override
    public void onAttachedToWindow() {
        super.onAttachedToWindow();
        if (detectorView != null) {
            detectorView.onResume();
        }
    }

    @Override
    public void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        if (detectorView != null) {
            detectorView.onPause();
        }
    }

    public void onPause() {
        if (detectorView != null) {
            detectorView.onPause();
        }
    }

    public void onResume() {
        if (detectorView != null) {
            detectorView.onResume();
        }
    }

    public void setFlashEnabled(boolean flashEnabled) {
        if (detectorView != null) {
            detectorView.setFlashEnabled(flashEnabled);
        }
    }

    public void setDemoMode(boolean demoMode) {
        this.demoMode = demoMode;
        if (detectorView != null) {
            detectorView.setDemoMode(demoMode);
        }
    }
}

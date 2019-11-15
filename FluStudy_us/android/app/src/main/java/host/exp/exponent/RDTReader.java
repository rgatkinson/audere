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
            IprdAdapter.FrameResult iprdFrameResult,
            DetectorView.CaptureResult captureResult,
            DetectorView.InterpretationResult interpretationResult,
            ImageFilter.FilterResult filterResult) {
        if (interpretationResult == null) {
            interpretationResult = new DetectorView.InterpretationResult();
        }
        WritableMap event = Arguments.createMap();

        if (iprdFrameResult != null) {
            WritableMap iprdResult = Arguments.createMap();

            iprdResult.putInt("sharpness", iprdFrameResult.sharpness);
            iprdResult.putInt("scale", iprdFrameResult.scale);
            iprdResult.putInt("brightness", iprdFrameResult.brightness);
            iprdResult.putInt("perspectiveDistortion", iprdFrameResult.perspectiveDistortion);
            iprdResult.putInt("xOffset", iprdFrameResult.xOffset);
            iprdResult.putInt("yOffset", iprdFrameResult.yOffset);
            iprdResult.putInt("left", iprdFrameResult.left);
            iprdResult.putInt("top", iprdFrameResult.top);
            iprdResult.putInt("right", iprdFrameResult.right);
            iprdResult.putInt("bottom", iprdFrameResult.bottom);
            iprdResult.putBoolean("foundRDT", iprdFrameResult.foundRDT);

            // Forward constants so we don't have to hard code these outside IPRD code.
            iprdResult.putInt("NOT_COMPUTED", IprdAdapter.FrameResult.NOT_COMPUTED);
            iprdResult.putInt("TOO_HIGH", IprdAdapter.FrameResult.TOO_HIGH);
            iprdResult.putInt("TOO_LOW", IprdAdapter.FrameResult.TOO_LOW);
            iprdResult.putInt("GOOD", IprdAdapter.FrameResult.GOOD);

            event.putMap("iprdResult", iprdResult);
        }

        if (captureResult.image != null) {
            event.putString("img", captureResult.image);
        }

        if (captureResult.stripLocation != null) {
            event.putArray("boundary", getLocationArray(captureResult.stripLocation));
        }

        WritableMap dimensions = new WritableNativeMap();
        dimensions.putInt("width", captureResult.viewportWidth);
        dimensions.putInt("height", captureResult.viewportHeight);
        event.putMap("viewportDimensions", dimensions);
        event.putBoolean("testStripDetected", captureResult.testStripFound);

        if (filterResult != null) {
            event.putBoolean("sharpness", filterResult.isSharp());
            event.putInt("exposureResult", filterResult.exposureResult.ordinal());
        }
        event.putBoolean("control", interpretationResult.control);
        event.putBoolean("testA", interpretationResult.testA);
        event.putBoolean("testB", interpretationResult.testB);
        event.putBoolean("passed", interpretationResult != null);
        callReactCallback("RDTCaptured", event);
    }

    @Override
    public void onRDTInterpreting() {
        WritableMap args = Arguments.createMap();
        args.putInt("timeTaken", 0); // TODO
        callReactCallback("RDTInterpreting", args);
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
}

// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent;

import android.app.Activity;
import android.content.Context;
import android.util.Log;
import android.widget.LinearLayout;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import org.opencv.core.Point;

import edu.washington.cs.ubicomplab.rdt_reader.ImageProcessor;
import edu.washington.cs.ubicomplab.rdt_reader.ImageQualityView;
import edu.washington.cs.ubicomplab.rdt_reader.ImageUtil;

public class RDTReader extends LinearLayout implements ImageQualityView.ImageQualityViewListener {
    private static final String TAG = "RDTReader";

    private Activity mActivity;
    private boolean showViewfinder = false;
    private boolean flashEnabled = true;
    private ImageQualityView mImageQualityView;
    public RDTReader(Context context, Activity activity) {
        super(context);
        mActivity = activity;

    }
    @Override
    public void onLayout(boolean changed, int left, int top, int right, int bottom) {
        super.onLayout(changed, left, top, right, bottom);
        Log.i("RDTReader", "onLayout");
    }

    public void enable() {
        final RDTReader self = this;
        mActivity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                inflate(mActivity, R.layout.rdt_reader_view, self);
                mImageQualityView = findViewById(R.id.imageQualityView);
                mImageQualityView.setImageQualityViewListener(self);
                mImageQualityView.setShowViewfinder(showViewfinder);
                mImageQualityView.setFlashEnabled(flashEnabled);
                Log.i("RDTReader", "width" + getWidth());
                Log.i("RDTReader", "height" + getHeight());
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
    public ImageQualityView.RDTDectedResult onRDTDetected(
            ImageProcessor.CaptureResult captureResult,
            ImageProcessor.InterpretationResult interpretationResult,
            long timeTaken) {
        if (interpretationResult == null) {
            interpretationResult = new ImageProcessor.InterpretationResult();
        }
        WritableMap event = Arguments.createMap();
        if (captureResult.allChecksPassed && captureResult.fiducial) {
            event.putString("img", ImageUtil.matToBase64(captureResult.resultMat));
            event.putString("resultWindowImg", ImageUtil.matToBase64(interpretationResult.resultMat));
        }
        if (captureResult.boundary != null) {
            WritableArray boundary = new WritableNativeArray();
            for (Point p : captureResult.boundary.toArray()) {
                WritableMap point = new WritableNativeMap();
                point.putDouble("x", p.x);
                point.putDouble("y", p.y);
                boundary.pushMap(point);
            }
            event.putArray("boundary", boundary);
        }
        event.putBoolean("passed", captureResult.allChecksPassed);
        event.putBoolean("testStripDetected", captureResult.testStripDetected);
        event.putBoolean("fiducial", captureResult.fiducial);
        event.putBoolean("center", captureResult.isCentered);
        event.putInt("sizeResult", captureResult.sizeResult.ordinal());
        event.putBoolean("shadow", captureResult.isShadow);
        event.putBoolean("sharpness", captureResult.isSharp);
        event.putBoolean("orientation", captureResult.isRightOrientation);
        event.putDouble("angle", captureResult.angle);
        event.putInt("exposureResult", captureResult.exposureResult.ordinal());
        event.putBoolean("control", interpretationResult.control);
        event.putBoolean("testA", interpretationResult.testA);
        event.putBoolean("testB", interpretationResult.testB);
        callReactCallback("RDTCaptured", event);
        return ImageQualityView.RDTDectedResult.CONTINUE;
    }

    @Override
    public void onRDTInterpreting(long timeTaken) {
        WritableMap args = Arguments.createMap();
        args.putInt("timeTaken", (int)timeTaken);
        callReactCallback("RDTInterpreting", args);
    }

    @Override
    public void onAttachedToWindow() {
        super.onAttachedToWindow();
        if (mImageQualityView != null) {
            mImageQualityView.onResume();
        }
    }

    @Override
    public void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        if (mImageQualityView != null) {
            mImageQualityView.onPause();
        }
    }

    public void onPause() {
        if (mImageQualityView != null) {
            mImageQualityView.onPause();
        }
    }

    public void onResume() {
        if (mImageQualityView != null) {
            mImageQualityView.onResume();
        }
    }

    public void setShowViewfinder(boolean showViewfinder) {
        this.showViewfinder = showViewfinder;
        if (mImageQualityView != null) {
            mImageQualityView.setShowViewfinder(showViewfinder);
        }
    }

    public void setFlashEnabled(boolean flashEnabled) {
        this.flashEnabled = flashEnabled;
        if (mImageQualityView != null) {
            mImageQualityView.setFlashEnabled(flashEnabled);
        }
    }
}

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
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import edu.washington.cs.ubicomplab.rdt_reader.ImageProcessor;
import edu.washington.cs.ubicomplab.rdt_reader.ImageQualityView;

public class RDTReader extends LinearLayout implements ImageQualityView.ImageQualityViewListener {
    private Activity mActivity;
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
                inflate(getContext(), R.layout.rdt_reader_view, self);
                ImageQualityView imageQualityView = findViewById(R.id.imageQualityActivity);
                imageQualityView.setActivity(mActivity);
                imageQualityView.setImageQualityViewListener(self);
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
    public void onRDTCameraReady() {
        callReactCallback("RDTCameraReady", Arguments.createMap());
    }

    @Override
    public void onRDTDetected(
            String img,
            boolean passed,
            boolean center,
            ImageProcessor.SizeResult sizeResult,
            boolean shadow,
            double target,
            boolean sharpness,
            boolean orientation,
            double angle,
            ImageProcessor.ExposureResult exposureResult,
            boolean control,
            boolean testA,
            boolean testB) {
        WritableMap event = Arguments.createMap();
        event.putString("img", img);
        event.putBoolean("passed", passed);
        event.putBoolean("center", center);
        event.putInt("sizeResult", sizeResult.ordinal());
        event.putBoolean("shadow", shadow);
        event.putDouble("target", target);
        event.putBoolean("sharpness", sharpness);
        event.putBoolean("orientation", orientation);
        event.putDouble("angle", angle);
        event.putInt("exposureResult", exposureResult.ordinal());
        event.putBoolean("control", control);
        event.putBoolean("testA", testA);
        event.putBoolean("testB", testB);
        callReactCallback("RDTCaptured", event);
    }
}

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

import java.util.List;
import java.util.Map;

import host.exp.exponent.tflite.Classifier;
import host.exp.exponent.tracking.RDTTracker;

public class RDTReader extends LinearLayout implements DetectorView.DetectorListener {
    private Activity mActivity;
    private DetectorView detectorView;
    private boolean processFrames;

    public RDTReader(Context context, Activity activity) {
        super(context);
        mActivity = activity;
        processFrames = false;
    }

    public void enable() {
        final RDTReader self = this;
        mActivity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                inflate(mActivity, R.layout.rdt_reader_view, self);

                detectorView = findViewById(R.id.detector_view);
                detectorView.setDetectorListener(self);
                detectorView.setProcessFrames(self.processFrames);
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
    public void onRDTCameraReady(boolean supportsTorchMode, int screenWidth, int screenHeight,
                                 boolean legacyCamera) {
        WritableMap event = Arguments.createMap();
        event.putBoolean("supportsTorchMode", supportsTorchMode);
        event.putInt("screenWidth", screenWidth);
        event.putInt("screenHeight", screenHeight);
        event.putBoolean("legacyCameraApi", legacyCamera);
        callReactCallback("RDTCameraReady", event);
    }

    private void writeRDTResultArgs(RDTTracker.RDTResult rdtResult, WritableMap event) {
        if (rdtResult == null) {
            return;
        }
        if (rdtResult.rdtOutline != null) {
            event.putArray("boundary", getLocationArray(rdtResult.rdtOutline));
        }

        event.putBoolean("isCentered", rdtResult instanceof RDTTracker.RDTStillFrameResult ||
                ((RDTTracker.RDTPreviewResult) rdtResult).centered);

        event.putBoolean("testStripDetected", rdtResult.rdtOutline != null);
    }

    private void writeIntermediateResults(RDTTracker.RDTStillFrameResult rdtResult,
                                          Classifier.Recognition phase2Result,
                                          WritableMap event) {
        Map<String, String> intermediateResults = rdtResult.intermediateResults;
        WritableMap intermediates = Arguments.createMap();
        for (Map.Entry<String, String> entry : intermediateResults.entrySet()) {
            intermediates.putString(entry.getKey(), entry.getValue());
        }
        event.putMap("intermediateResults", intermediates);

        List<Classifier.Recognition> phase1Results = rdtResult.recognitions;
        WritableArray phase1Recognitions = Arguments.createArray();
        for (Classifier.Recognition recognition : phase1Results) {
            phase1Recognitions.pushString(recognition.toString());
        }
        event.putArray("phase1Recognitions", phase1Recognitions);

        event.putString("phase2Recognition", phase2Result.toString());
    }

    @Override
    public void onRDTInterpreted(DetectorView.InterpretationResult interpretationResult) {
        WritableMap event = Arguments.createMap();
        writeRDTResultArgs(interpretationResult.rdtResult, event);
        writeIntermediateResults(interpretationResult.rdtResult, interpretationResult.recognition,
                event);
        event.putBoolean("control", interpretationResult.control);
        event.putBoolean("testA", interpretationResult.testA);
        event.putBoolean("testB", interpretationResult.testB);
        event.putString("imageUri", interpretationResult.imageUri);
        event.putString("resultWindowImageUri", interpretationResult.resultWindowImageUri);
        event.putString("failureReason", "Interpreted");
        callReactCallback("RDTCaptured", event);
    }

    @Override
    public void onRDTDetected(IprdAdapter.Result iprdResult, RDTTracker.RDTResult rdtResult,
                              String previewUri, int previewFrameIndex, String failureReason) {
        WritableMap event = Arguments.createMap();
        writeRDTResultArgs(rdtResult, event);
        event.putBoolean("isSteady", iprdResult.isSteady());
        event.putBoolean("sharpness", iprdResult.isSharp());
        event.putDouble("sharpnessRaw", iprdResult.getSharpnessRaw());
        event.putInt("exposureResult", iprdResult.exposureResult().ordinal());
        event.putString("failureReason", failureReason);
        event.putString("previewUri", previewUri);
        event.putInt("previewFrameIndex", previewFrameIndex);

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

    public void setProcessFrames(boolean processFrames) {
        // Can't guarantee call order for the RN prop variables, so we'll store a local
        // copy to initialize the detectorView with if it gets created later
        this.processFrames = processFrames;
        if (detectorView != null) {
            detectorView.setProcessFrames(processFrames);
        }
    }
}

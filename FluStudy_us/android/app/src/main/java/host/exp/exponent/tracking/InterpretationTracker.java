// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.tracking;

import android.app.Activity;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.RectF;
import android.util.Log;
import android.util.Pair;

import host.exp.exponent.DetectorView;
import host.exp.exponent.tflite.Classifier;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class InterpretationTracker extends Tracker {
    private static int FRAMES_TO_INTERPRET = 4;
    private static final String TAG = "InterpretationTracker";

    private final List<List<RDTTracker.TrackedRecognition>> allTrackedObjects = new ArrayList<>();

    public InterpretationTracker(final Activity activity) {
        super(activity);
    }

    private boolean sentResults;

    /*
    @Override
    public synchronized void draw(final Canvas canvas, boolean demoMode) {
        /*if (demoMode && allTrackedObjects.size() > 0) {
            for (final RDTTracker.TrackedRecognition recognition : allTrackedObjects.get(allTrackedObjects.size() - 1)) {
                final RectF trackedPos = new RectF(recognition.location);

                boxPaint.setColor(recognition.color);

                float cornerSize = Math.min(trackedPos.width(), trackedPos.height()) / 8.0f;
                float leftOffset = canvas.getWidth() - (TF_OD_API_INPUT_SIZE / 2) - TEST_AREA_INSET_MARGIN;
                float topOffset = canvas.getHeight() - (TF_OD_API_INPUT_SIZE / 2) - TEST_AREA_INSET_MARGIN;
                canvas.drawRoundRect(leftOffset + trackedPos.left, topOffset + trackedPos.top, leftOffset + trackedPos.right, topOffset + trackedPos.bottom, cornerSize, cornerSize, boxPaint);

                final String labelString = getLabel(recognition);
                borderedText.drawText(canvas, leftOffset - TF_OD_API_INPUT_SIZE, topOffset + trackedPos.top, labelString + "%", boxPaint);
            }
        }
    }
    */

    @Override
    public synchronized void trackResults(final List<Classifier.Recognition> results) {
        Log.i(TAG, "tracking interpretation result");
        final List<Pair<Float, Classifier.Recognition>> rectsToTrack = new LinkedList<Pair<Float, Classifier.Recognition>>();

        for (final Classifier.Recognition result : results) {
            if (result.getLocation() == null) {
                continue;
            }

            rectsToTrack.add(new Pair(result.getConfidence(), result));
        }
        List<RDTTracker.TrackedRecognition> trackedObjects = new LinkedList<>();
        if (rectsToTrack.isEmpty()) {
            Log.i(TAG, "Nothing to track, aborting.");
        } else {
            for (final Pair<Float, Classifier.Recognition> potential : rectsToTrack) {
                final RDTTracker.TrackedRecognition trackedRecognition = new RDTTracker.TrackedRecognition();
                trackedRecognition.detectionConfidence = potential.first;
                trackedRecognition.location = new RectF(potential.second.getLocation());
                trackedRecognition.title = potential.second.getTitle();
                trackedRecognition.color = trackedRecognition.title.equals("control") ? Color.BLUE : Color.RED;
                trackedObjects.add(trackedRecognition);
            }
        }
        allTrackedObjects.add(trackedObjects);

        Log.d(TAG, "All results");
        Log.d(TAG, "\n" + getAllResultsForDisplay());
    }

    private String getAllResultsForDisplay() {
        StringBuilder allResults = new StringBuilder();
        for (int i = 0; i < allTrackedObjects.size(); i++) {
            List<RDTTracker.TrackedRecognition> trackedObjects = allTrackedObjects.get(i);
            allResults.append("\n" + i);
            for (RDTTracker.TrackedRecognition recognition : trackedObjects) {
                allResults.append("   " + getLabel(recognition) + "\n");
            }
        }
        return allResults.toString();
    }

    public boolean shouldSendResults() {
        if (!sentResults && allTrackedObjects.size() >= FRAMES_TO_INTERPRET) {
            sentResults = true;
            return true;
        }
        return false;
    }

    public DetectorView.InterpretationResult getInterpretationResult() {
        DetectorView.InterpretationResult interpretationResult = new DetectorView.InterpretationResult();

        interpretationResult.samples = allTrackedObjects.size();
        interpretationResult.requiredSamples = FRAMES_TO_INTERPRET;

        // First pass attempt at combining results:
        // Return control | testA | testB if at least half the samples showed that result
        int controlCount = 0;
        int aCount = 0;
        int bCount = 0;

        for (List<RDTTracker.TrackedRecognition> trackedObjects : allTrackedObjects) {
            for (RDTTracker.TrackedRecognition recognition : trackedObjects) {
                if (recognition.title.equals("control")) {
                    controlCount++;
                } else if (recognition.title.equals("flu-a")) {
                    aCount++;
                } else if (recognition.title.equals("flu-b")) {
                    bCount++;
                }
            }
        }

        interpretationResult.control = controlCount >= allTrackedObjects.size() / 2;
        interpretationResult.testA = aCount >= allTrackedObjects.size() / 2;
        interpretationResult.testB = bCount >= allTrackedObjects.size() / 2;

        return interpretationResult;
    }
}

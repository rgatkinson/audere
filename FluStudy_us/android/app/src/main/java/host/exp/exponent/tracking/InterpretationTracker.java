// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.tracking;

import android.graphics.Color;
import android.graphics.RectF;
import android.util.Log;
import android.util.Pair;

import host.exp.exponent.DetectorView;
import host.exp.exponent.tflite.Classifier;

import java.util.LinkedList;
import java.util.List;

public class InterpretationTracker {
    private static final String TAG = "InterpretationTracker";

    public static synchronized DetectorView.InterpretationResult interpretResults(final List<Classifier.Recognition> results) {
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
            Log.i(TAG, "Nothing to track.");
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

        Log.d(TAG, "All results");
        Log.d(TAG, "\n" + getAllResultsForDisplay(trackedObjects));

        return getInterpretationResult(trackedObjects);
    }

    private static String getAllResultsForDisplay(List<RDTTracker.TrackedRecognition> trackedObjects) {
        StringBuilder allResults = new StringBuilder("\nResults:\n");
        for (RDTTracker.TrackedRecognition recognition : trackedObjects) {
            allResults.append("   " + Tracker.getLabel(recognition) + "\n");
        }
        return allResults.toString();
    }

    public static DetectorView.InterpretationResult getInterpretationResult(List<RDTTracker.TrackedRecognition> trackedObjects) {
        DetectorView.InterpretationResult interpretationResult = new DetectorView.InterpretationResult();

        for (RDTTracker.TrackedRecognition recognition : trackedObjects) {
            if (recognition.title.equals("control")) {
                interpretationResult.control = true;
            } else if (recognition.title.equals("flu-a")) {
                interpretationResult.testA = true;
            } else if (recognition.title.equals("flu-b")) {
                interpretationResult.testB = true;
            }
        }

        return interpretationResult;
    }
}

// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.tracking;

import android.text.TextUtils;
import android.util.Log;

import host.exp.exponent.DetectorView;
import host.exp.exponent.tflite.Classifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class InterpretationTracker {
    private static final String TAG = "InterpretationTracker";

    public static synchronized DetectorView.InterpretationResult interpretResults(
            final List<Classifier.Recognition> results) {
        Log.i(TAG, "tracking interpretation result");

        Map<String, Double> bestResults = new HashMap();

        StringBuilder allResults = new StringBuilder("\nResults:\n");

        for (final Classifier.Recognition result : results) {
            if (result.getLocation() == null) {
                continue;
            }
            allResults.append("   " + getLabel(result) + "\n");

            String label = result.getTitle();
            double score = result.getConfidence();
            if (!bestResults.containsKey(label) || bestResults.get(label) < score) {
                bestResults.put(label, score);
            }
        }

        Log.d(TAG, "All results");
        Log.d(TAG, "\n" + allResults.toString());

        DetectorView.InterpretationResult interpretationResult =
                new DetectorView.InterpretationResult();

        if (hasLine("control", "notvalid", bestResults)) {
            interpretationResult.control = true;
            if (hasLine("a-pos", "a-neg", bestResults)) {
                interpretationResult.testA = true;
            }
            if (hasLine("b-pos", "b-neg", bestResults)) {
                interpretationResult.testB = true;
            }
        }

        Log.d(TAG, "Interpretation results\n");
        Log.d(TAG, interpretationResult.toString());

        return interpretationResult;
    }

    public static String getLabel(Classifier.Recognition rec) {
        return !TextUtils.isEmpty(rec.getTitle())
                ? String.format("%s %.2f", rec.getTitle(), (100 * rec.getConfidence()))
                : String.format("%.2f", (100 * rec.getConfidence()));
    }

    private static boolean hasLine(String line, String notLine, Map<String, Double> bestResults) {
        if (!bestResults.containsKey(line)) {
            return false;
        }

        if (bestResults.containsKey(notLine) && bestResults.get(notLine) > bestResults.get(line)) {
            return false;
        }

        return true;
    }

}

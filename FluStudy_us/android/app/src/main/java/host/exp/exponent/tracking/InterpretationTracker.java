// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.tracking;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.text.TextUtils;
import android.util.Log;

import host.exp.exponent.DetectorView;
import host.exp.exponent.env.BorderedText;
import host.exp.exponent.tflite.Classifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class InterpretationTracker {
    private static final String TAG = "InterpretationTracker";
    private static final Canvas canvas = new Canvas();
    private static final Paint paint = getPaint();
    private static final BorderedText borderedText = new BorderedText(12);

    public static synchronized DetectorView.InterpretationResult interpretResults(
            final List<Classifier.Recognition> results, RDTTracker.RDTStillFrameResult rdtResult,
            boolean drawResults) {
        Log.i(TAG, "tracking interpretation result");

        Map<String, Classifier.Recognition> bestResults = new HashMap();

        StringBuilder allResults = new StringBuilder("\nResults:\n");

        for (final Classifier.Recognition result : results) {
            if (result.getLocation() == null) {
                continue;
            }
            allResults.append("   " + getLabel(result) + "\n");

            String label = result.getTitle();
            if (!bestResults.containsKey(label) ||
                    bestResults.get(label).getConfidence() < result.getConfidence()) {
                bestResults.put(label, result);
            }
        }

        Log.d(TAG, "All results");
        Log.d(TAG, "\n" + allResults.toString());

        DetectorView.InterpretationResult interpretationResult =
                new DetectorView.InterpretationResult(rdtResult, results);

        canvas.setBitmap(rdtResult.testArea);

        if (hasLine("control", "notvalid", bestResults)) {
            interpretationResult.control = true;
            drawLineIf(drawResults, bestResults.get("control"), Color.BLUE);

            if (hasLine("a-pos", "a-neg", bestResults)) {
                interpretationResult.testA = true;
                drawLineIf(drawResults, bestResults.get("a-pos"), Color.RED);
            }

            if (hasLine("b-pos", "b-neg", bestResults)) {
                interpretationResult.testB = true;
                drawLineIf(drawResults, bestResults.get("b-pos"), Color.RED);
            }
        }

        Log.d(TAG, "Interpretation results\n");
        Log.d(TAG, interpretationResult.toString());

        return interpretationResult;
    }

    private static Paint getPaint() {
        Paint p = new Paint();
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(5.0f);
        p.setStrokeCap(Paint.Cap.ROUND);
        p.setStrokeJoin(Paint.Join.ROUND);
        p.setStrokeMiter(100);
        return p;
    }

    private static void drawLineIf(boolean draw, Classifier.Recognition recognition, int color) {
        if (!draw) {
            return;
        }
        paint.setColor(color);
        final RectF trackedPos = new RectF(recognition.getLocation());
        canvas.drawRect(trackedPos.left, trackedPos.top, trackedPos.right, trackedPos.bottom, paint);
        borderedText.drawText(canvas, trackedPos.left, trackedPos.top, getLabel(recognition), paint);

    }
    public static String getLabel(Classifier.Recognition rec) {
        return !TextUtils.isEmpty(rec.getTitle())
                ? String.format("%s %.2f", rec.getTitle(), (100 * rec.getConfidence()))
                : String.format("%.2f", (100 * rec.getConfidence()));
    }

    private static boolean hasLine(String line, String notLine, Map<String, Classifier.Recognition> bestResults) {
        if (!bestResults.containsKey(line)) {
            return false;
        }

        if (bestResults.containsKey(notLine) &&
                bestResults.get(notLine).getConfidence() > bestResults.get(line).getConfidence()) {
            return false;
        }

        return true;
    }

}

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
            final Classifier.Recognition result, RDTTracker.RDTStillFrameResult rdtResult,
            boolean drawResults) {
        Log.i(TAG, "tracking interpretation result");

        DetectorView.InterpretationResult interpretationResult =
                new DetectorView.InterpretationResult(rdtResult, result);

        canvas.setBitmap(rdtResult.testArea);
        drawLabel(drawResults, result, Color.RED);

        Log.d(TAG, "Result: " +  getLabel(result));

        // reset flags to deal with the case of capturing one strip and back capturing another strip
        interpretationResult.control = false;
        interpretationResult.testA = false;
        interpretationResult.testB = false;
        if (!result.getTitle().equals("Invalid")) {
            interpretationResult.control = true;
            if (result.getTitle().equals("Both") || result.getTitle().equals("Flu-A")) {
                interpretationResult.testA = true;
            }
            if (result.getTitle().equals("Both") || result.getTitle().equals("Flu-B")) {
                interpretationResult.testB = true;
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

    private static void drawLabel(boolean draw, Classifier.Recognition recognition, int color) {
        if (!draw) {
            return;
        }
        paint.setColor(color);
        borderedText.drawText(canvas, 5, 5, getLabel(recognition), paint);
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

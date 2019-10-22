// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.tracking;

import android.app.Activity;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.RectF;
import android.util.Log;
import android.util.Pair;
import java.util.LinkedList;
import java.util.List;

import host.exp.exponent.env.ImageUtils;
import host.exp.exponent.tflite.Classifier.Recognition;

/**
 * A tracker that handles non-max suppression and matches existing objects to
 * new detections.
 */
public class MultiBoxTracker extends Tracker {
    private static final String TAG = "MultiBoxTracker";

    private static final float MIN_SIZE = 16.0f;

    private static final int[] COLORS = { Color.BLUE, Color.RED, Color.GREEN, Color.YELLOW, Color.CYAN };

    private final List<TrackedRecognition> trackedObjects = new LinkedList<TrackedRecognition>();

    private Matrix frameToCanvasMatrix;

    public MultiBoxTracker(final Activity activity) {
        super(activity);
    }

    public synchronized void trackResults(final List<Recognition> results) {
        processResults(results);
    }

    /*
    public synchronized void draw(final Canvas canvas, boolean demoMode) {
        /*
        if (demoMode) {
            frameToCanvasMatrix = ImageUtils.getTransformationMatrix(previewWidth, previewHeight,
                    canvas.getWidth(), canvas.getHeight(), sensorOrientation, false);

            for (final TrackedRecognition recognition : trackedObjects) {
                final RectF trackedPos = new RectF(recognition.location);

                frameToCanvasMatrix.mapRect(trackedPos);
                boxPaint.setColor(recognition.color);

                float cornerSize = Math.min(trackedPos.width(), trackedPos.height()) / 8.0f;
                canvas.drawRoundRect(trackedPos, cornerSize, cornerSize, boxPaint);

                final String labelString = getLabel(recognition);
                borderedText.drawText(canvas, trackedPos.left + cornerSize, trackedPos.top, labelString + "%", boxPaint);
            }
        }
    }
    */

    private void processResults(final List<Recognition> results) {
        trackedObjects.clear();

        final List<Pair<Float, Recognition>> rectsToTrack = new LinkedList<Pair<Float, Recognition>>();

        final Matrix rgbFrameToScreen = new Matrix(frameToCanvasMatrix);

        for (final Recognition result : results) {
            if (result.getLocation() == null) {
                continue;
            }
            final RectF detectionFrameRect = new RectF(result.getLocation());

            final RectF detectionScreenRect = new RectF();
            rgbFrameToScreen.mapRect(detectionScreenRect, detectionFrameRect);

            if (detectionFrameRect.width() < MIN_SIZE || detectionFrameRect.height() < MIN_SIZE) {
                Log.d(TAG, "Degenerate rectangle! " + detectionFrameRect);
                continue;
            }

            rectsToTrack.add(new Pair<Float, Recognition>(result.getConfidence(), result));
        }

        if (rectsToTrack.isEmpty()) {
            Log.d(TAG, "Nothing to track, aborting.");
            return;
        }

        for (final Pair<Float, Recognition> potential : rectsToTrack) {
            final TrackedRecognition trackedRecognition = new TrackedRecognition();
            trackedRecognition.detectionConfidence = potential.first;
            trackedRecognition.location = new RectF(potential.second.getLocation());
            trackedRecognition.title = potential.second.getTitle();
            trackedRecognition.color = COLORS[getColorIndex(trackedRecognition.title)];
            trackedObjects.add(trackedRecognition);
        }
    }

    private final String[] LABELS = new String[] { "arrows", "test", "ABC", "squares", "influenza" };
    
    private int getColorIndex(String label) {
        for (int i = 0; i < LABELS.length; i++) {
            if (LABELS[i].equals(label)) {
                return i;
            }
        }
        return -1;
    }
}

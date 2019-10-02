package org.tensorflow.lite.examples.detection.tracking;

import android.app.Activity;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.RectF;
import android.text.TextUtils;
import android.util.Pair;

import org.tensorflow.lite.examples.detection.tflite.Classifier;

import java.util.LinkedList;
import java.util.List;

public class InterpretationTracker extends Tracker {
    private final List<RDTTracker.TrackedRecognition> trackedObjects = new LinkedList<RDTTracker.TrackedRecognition>();

    public InterpretationTracker(final Activity activity) {
        super(activity);
    }

    @Override
    public synchronized void draw(final Canvas canvas) {
        for (final RDTTracker.TrackedRecognition recognition : trackedObjects) {
            final RectF trackedPos = new RectF(recognition.location);

            boxPaint.setColor(recognition.color);

            float cornerSize = Math.min(trackedPos.width(), trackedPos.height()) / 8.0f;
            float leftOffset = canvas.getWidth() - TF_OD_API_INPUT_SIZE - TEST_AREA_INSET_MARGIN;
            float topOffset = canvas.getHeight() - TF_OD_API_INPUT_SIZE - TEST_AREA_INSET_MARGIN;
            canvas.drawRoundRect(leftOffset + trackedPos.left, topOffset + trackedPos.top, leftOffset + trackedPos.right, topOffset + trackedPos.bottom, cornerSize, cornerSize, boxPaint);

            final String labelString = !TextUtils.isEmpty(recognition.title)
                    ? String.format("%s %.2f", recognition.title, (100 * recognition.detectionConfidence))
                    : String.format("%.2f", (100 * recognition.detectionConfidence));
            borderedText.drawText(canvas, leftOffset - TF_OD_API_INPUT_SIZE, topOffset + trackedPos.top, labelString + "%", boxPaint);
        }
    }

    @Override
    public synchronized void trackResults(final List<Classifier.Recognition> results) {
        final List<Pair<Float, Classifier.Recognition>> rectsToTrack = new LinkedList<Pair<Float, Classifier.Recognition>>();

        for (final Classifier.Recognition result : results) {
            if (result.getLocation() == null) {
                continue;
            }

            rectsToTrack.add(new Pair(result.getConfidence(), result));
        }

        if (rectsToTrack.isEmpty()) {
            logger.v("Nothing to track, aborting.");
            return;
        }

        for (final Pair<Float, Classifier.Recognition> potential : rectsToTrack) {
            final RDTTracker.TrackedRecognition trackedRecognition = new RDTTracker.TrackedRecognition();
            trackedRecognition.detectionConfidence = potential.first;
            trackedRecognition.location = new RectF(potential.second.getLocation());
            trackedRecognition.title = potential.second.getTitle();
            trackedRecognition.color = trackedRecognition.title.equals("control") ? Color.BLUE : Color.RED;
            trackedObjects.add(trackedRecognition);
        }
    }

    public synchronized void clearResults() {
        trackedObjects.clear();
    }
}

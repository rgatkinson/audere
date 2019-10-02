/* Copyright 2019 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

package org.tensorflow.lite.examples.detection.tracking;

import android.app.Activity;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.RectF;
import android.text.TextUtils;
import android.util.Pair;
import java.util.LinkedList;
import java.util.List;

import org.tensorflow.lite.examples.detection.env.ImageUtils;
import org.tensorflow.lite.examples.detection.tflite.Classifier.Recognition;

/**
 * A tracker that handles non-max suppression and matches existing objects to
 * new detections.
 */
public class MultiBoxTracker extends Tracker {
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

  public synchronized void draw(final Canvas canvas) {
    logger.i("draw: frame=(%d, %d) canvas=(%d, %d) orientation=%d", previewWidth, previewHeight, canvas.getWidth(),
        canvas.getHeight(), this.sensorOrientation);
    final boolean rotated = sensorOrientation % 180 == 90;
    final float multiplier = Math.min(canvas.getHeight() / (float) (rotated ? previewWidth : previewHeight),
        canvas.getWidth() / (float) (rotated ? previewHeight : previewWidth));
    frameToCanvasMatrix = ImageUtils.getTransformationMatrix(previewWidth, previewHeight,
        (int) (multiplier * (rotated ? previewHeight : previewWidth)),
        (int) (multiplier * (rotated ? previewWidth : previewHeight)), sensorOrientation, false);

    for (final TrackedRecognition recognition : trackedObjects) {
      final RectF trackedPos = new RectF(recognition.location);

      frameToCanvasMatrix.mapRect(trackedPos);
      boxPaint.setColor(recognition.color);

      float cornerSize = Math.min(trackedPos.width(), trackedPos.height()) / 8.0f;
      canvas.drawRoundRect(trackedPos, cornerSize, cornerSize, boxPaint);

      final String labelString = !TextUtils.isEmpty(recognition.title)
              ? String.format("%s %.2f", recognition.title, (100 * recognition.detectionConfidence))
              : String.format("%.2f", (100 * recognition.detectionConfidence));
      borderedText.drawText(canvas, trackedPos.left + cornerSize, trackedPos.top, labelString + "%", boxPaint);
    }
  }

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

      logger.v("Result! Frame: " + result.getLocation() + " mapped to screen:" + detectionScreenRect);

      if (detectionFrameRect.width() < MIN_SIZE || detectionFrameRect.height() < MIN_SIZE) {
        logger.w("Degenerate rectangle! " + detectionFrameRect);
        continue;
      }

      rectsToTrack.add(new Pair<Float, Recognition>(result.getConfidence(), result));
    }

    if (rectsToTrack.isEmpty()) {
      logger.v("Nothing to track, aborting.");
      return;
    }

    for (final Pair<Float, Recognition> potential : rectsToTrack) {
      final TrackedRecognition trackedRecognition = new TrackedRecognition();
      trackedRecognition.detectionConfidence = potential.first;
      trackedRecognition.location = new RectF(potential.second.getLocation());
      trackedRecognition.title = potential.second.getTitle();
      trackedRecognition.color = COLORS[getColorIndex(trackedRecognition.title)];
      trackedObjects.add(trackedRecognition);

      if (trackedObjects.size() >= COLORS.length) {
        break;
      }
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

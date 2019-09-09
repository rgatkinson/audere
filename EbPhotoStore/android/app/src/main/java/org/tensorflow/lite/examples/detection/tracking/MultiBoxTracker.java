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
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Paint.Cap;
import android.graphics.Paint.Join;
import android.graphics.Paint.Style;
import android.graphics.PointF;
import android.graphics.RectF;
import android.text.TextUtils;
import android.util.Pair;
import android.util.TypedValue;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

import org.tensorflow.lite.examples.detection.env.BorderedText;
import org.tensorflow.lite.examples.detection.env.ImageUtils;
import org.tensorflow.lite.examples.detection.env.Logger;
import org.tensorflow.lite.examples.detection.tflite.Classifier.Recognition;

/** A tracker that handles non-max suppression and matches existing objects to new detections. */
public class MultiBoxTracker {
  private static final float TEXT_SIZE_DIP = 18;
  private static final float MIN_SIZE = 16.0f;
  private static final int[] COLORS = {
    Color.BLUE,
    Color.RED,
    Color.GREEN,
    Color.YELLOW,
    Color.CYAN,
    Color.MAGENTA,
    Color.WHITE,
    Color.parseColor("#55FF55"),
    Color.parseColor("#FFA500"),
    Color.parseColor("#FF8888"),
    Color.parseColor("#AAAAFF"),
    Color.parseColor("#FFFFAA"),
    Color.parseColor("#55AAAA"),
    Color.parseColor("#AA33AA"),
    Color.parseColor("#0D0068")
  };
  final List<Pair<Float, RectF>> screenRects = new LinkedList<Pair<Float, RectF>>();
  private final Logger logger = new Logger();
  private final Queue<Integer> availableColors = new LinkedList<Integer>();
  private final List<TrackedRecognition> trackedObjects = new LinkedList<TrackedRecognition>();
  private final Paint boxPaint = new Paint();
  private final float textSizePx;
  private final BorderedText borderedText;
  private Matrix frameToCanvasMatrix;
  private int frameWidth;
  private int frameHeight;
  private int sensorOrientation;

  private Activity activity;

  public MultiBoxTracker(final Activity activity) {
    for (final int color : COLORS) {
      availableColors.add(color);
    }

    boxPaint.setColor(Color.RED);
    boxPaint.setStyle(Style.STROKE);
    boxPaint.setStrokeWidth(10.0f);
    boxPaint.setStrokeCap(Cap.ROUND);
    boxPaint.setStrokeJoin(Join.ROUND);
    boxPaint.setStrokeMiter(100);

    textSizePx =
        TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP, TEXT_SIZE_DIP, activity.getResources().getDisplayMetrics());
    borderedText = new BorderedText(textSizePx);
    this.activity = activity;
  }

  public synchronized void setFrameConfiguration(
      final int width, final int height, final int sensorOrientation) {
    frameWidth = width;
    frameHeight = height;
    this.sensorOrientation = sensorOrientation;
  }

  public synchronized Bitmap trackResults(final Bitmap sourceBitmap, final List<Recognition> results, final long timestamp) {
    // logger.i("Processing %d results from %d", results.size(), timestamp);
    processResults(results);
    return this.rdtTrack(sourceBitmap, results);
  }

  private Matrix getFrameToCanvasMatrix() {
    return frameToCanvasMatrix;
  }

  public synchronized void draw(final Canvas canvas) {
    final boolean rotated = sensorOrientation % 180 == 90;
    final float multiplier =
        Math.min(
            canvas.getHeight() / (float) (rotated ? frameWidth : frameHeight),
            canvas.getWidth() / (float) (rotated ? frameHeight : frameWidth));
    frameToCanvasMatrix =
        ImageUtils.getTransformationMatrix(
            frameWidth,
            frameHeight,
            (int) (multiplier * (rotated ? frameHeight : frameWidth)),
            (int) (multiplier * (rotated ? frameWidth : frameHeight)),
            sensorOrientation,
            false);
     for (final TrackedRecognition recognition : trackedObjects) {
       final RectF trackedPos = new RectF(recognition.location);

       getFrameToCanvasMatrix().mapRect(trackedPos);
       boxPaint.setColor(recognition.color);

       float cornerSize = Math.min(trackedPos.width(), trackedPos.height()) / 8.0f;
       canvas.drawRoundRect(trackedPos, cornerSize, cornerSize, boxPaint);

       final String labelString =
           !TextUtils.isEmpty(recognition.title)
               ? String.format("%s %.2f", recognition.title, (100 * recognition.detectionConfidence))
               : String.format("%.2f", (100 * recognition.detectionConfidence));
       //            borderedText.drawText(canvas, trackedPos.left + cornerSize, trackedPos.top,
       // labelString);
       borderedText.drawText(
           canvas, trackedPos.left + cornerSize, trackedPos.top, labelString + "%", boxPaint);
     }

    this.rdtDraw(canvas);
  }

  private void processResults(final List<Recognition> results) {
    final List<Pair<Float, Recognition>> rectsToTrack = new LinkedList<Pair<Float, Recognition>>();

    screenRects.clear();
    final Matrix rgbFrameToScreen = new Matrix(getFrameToCanvasMatrix());

    for (final Recognition result : results) {
      if (result.getLocation() == null) {
        continue;
      }
      final RectF detectionFrameRect = new RectF(result.getLocation());

      final RectF detectionScreenRect = new RectF();
      rgbFrameToScreen.mapRect(detectionScreenRect, detectionFrameRect);

      logger.v(
          "Result! Frame: " + result.getLocation() + " mapped to screen:" + detectionScreenRect);

      screenRects.add(new Pair<Float, RectF>(result.getConfidence(), detectionScreenRect));

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

    trackedObjects.clear();
    for (final Pair<Float, Recognition> potential : rectsToTrack) {
      final TrackedRecognition trackedRecognition = new TrackedRecognition();
      trackedRecognition.detectionConfidence = potential.first;
      trackedRecognition.location = new RectF(potential.second.getLocation());
      trackedRecognition.title = potential.second.getTitle();
      trackedRecognition.color = COLORS[trackedObjects.size()];
      trackedObjects.add(trackedRecognition);

      if (trackedObjects.size() >= COLORS.length) {
        break;
      }
    }
  }

  private static class TrackedRecognition {
    RectF location;
    float detectionConfidence;
    int color;
    String title;
  }

  // AUDERE CODE BELOW

  final String[] RDT_NAMES = new String[]{ "arrows", "test", "ABC", "squares", "influenza" };
  final float[] RDT_OFFSETS = new float[]{ 1.5f, 3.0f, 5.0f, 7.0f, 8.0f };
  final float RDT_HEIGHT = 8.7f;
  final float RDT_WIDTH = 0.5f;
  final int RDT_INSET_MARGIN = 3;

  Matrix rdtMatrix = null;
  Bitmap rdtBitmap = null;
  float[] rdtOutline = null;

  private Bitmap rdtTrack(final Bitmap sourceBitmap, final List<Recognition> results) {
    final Recognition[] findings = this.rdtLocations(results);

    int index0 = findings.length + 1;
    int index1 = -1;
    for (int i = 0; i < findings.length; i++) {
      if (findings[i] != null) {
        if (i < index0) index0 = i;
        if (index1 < i) index1 = i;
      }
    }
    if (index0 >= index1) {
      this.rdtMatrix = null;
      this.rdtBitmap = null;
      this.rdtOutline = null;
      return null;
    }

    PointF location0 = this.center(findings[index0].getLocation());
    PointF location1 = this.center(findings[index1].getLocation());
    float offset0 = RDT_OFFSETS[index0];
    float offset1 = RDT_OFFSETS[index1];

    int rdtHeight = this.frameHeight - (RDT_INSET_MARGIN * 2);
    float scale = (float) rdtHeight / RDT_HEIGHT;
    int rdtWidth = (int) (RDT_WIDTH * scale);
    float hCenter = RDT_INSET_MARGIN + rdtWidth / 2;
    float vCenter0 = RDT_INSET_MARGIN + ((RDT_HEIGHT - offset0) * scale);
    float vCenter1 = RDT_INSET_MARGIN + ((RDT_HEIGHT - offset1) * scale);

    float[] before = new float[]{
      location0.x, location0.y,
      location1.x, location1.y
    };
    float[] after = new float[]{
      hCenter, vCenter0,
      hCenter, vCenter1
    };

    int rdtTop = RDT_INSET_MARGIN;
    int rdtBottom = RDT_INSET_MARGIN + rdtHeight;
    int rdtLeft = RDT_INSET_MARGIN;
    int rdtRight = RDT_INSET_MARGIN + rdtWidth;

    float[] outline = new float[]{
      rdtLeft, rdtTop, rdtRight, rdtTop,
      rdtRight, rdtTop, rdtRight, rdtBottom,
      rdtRight, rdtBottom, rdtLeft, rdtBottom,
      rdtLeft, rdtBottom, rdtLeft, rdtTop,
    };

    this.debugLogOutline("initialize outline", outline);

    Matrix inverseRdtMatrix = new Matrix();
    if (!inverseRdtMatrix.setPolyToPoly(after, 0, before, 0, 2)) {
      throw new RuntimeException("Could not create rdtMatrix");
    }
    inverseRdtMatrix.postConcat(getFrameToCanvasMatrix());
    inverseRdtMatrix.mapPoints(outline);

    Matrix rdtExtract = new Matrix();
    if (!inverseRdtMatrix.invert(rdtExtract)) {
      throw new RuntimeException("COuld not invert matrix");
    }
    this.rdtMatrix = rdtExtract;

    this.debugLogOutline("transformed outline", outline);
    this.rdtOutline = outline;

    // This is horrible but let's just try for now
    int CANVAS_WIDTH = 1080;
    int CANVAS_HEIGHT = 2028;
    int x1 = (int) (1.0 * outline[0] / CANVAS_WIDTH * sourceBitmap.getWidth());
    int y1 = (int) (1.0 * outline[1] / CANVAS_HEIGHT * sourceBitmap.getHeight());
    int scaledHeight = (int) (1.0 * (outline[7] - outline[5]) / CANVAS_HEIGHT * sourceBitmap.getHeight());
    int scaledWidth = (int) (1.0 * (outline[2] - outline[0]) / CANVAS_WIDTH * sourceBitmap.getWidth());

    try {
      Bitmap croppedBitmap = Bitmap.createBitmap(
              sourceBitmap,
              x1,
              y1,
              scaledWidth,
              scaledHeight,
              this.rdtMatrix,
              true
      );
      this.rdtBitmap = Bitmap.createScaledBitmap(croppedBitmap, 100, 870, false);
      return Bitmap.createScaledBitmap(croppedBitmap, 224, 224, false);
    } catch (Exception e) {
      // Extraction isn't great at handling clipping
      logger.e("DETECTOR caught " + e.toString());
    }
    return null;
  }

  private void rdtDraw(final Canvas canvas) {
    if (this.rdtOutline != null) {
      float[] outline = this.rdtOutline;
      this.debugLogOutline("rdtDraw outline", outline);
      final Paint paint = new Paint();
      paint.setColor(Color.MAGENTA);
      paint.setStyle(Style.STROKE);
      paint.setStrokeWidth(10.0f);
      canvas.drawLines(this.rdtOutline, paint);
    }

    if (rdtBitmap != null) {
      canvas.drawBitmap(this.rdtBitmap, RDT_INSET_MARGIN, RDT_INSET_MARGIN, new Paint());
    }
  }

  private Recognition[] rdtLocations(final List<Recognition> results) {
    final Recognition[] findings = new Recognition[RDT_NAMES.length];

    for (final Recognition result : results) {
      final RectF location = result.getLocation();
      final String title = result.getTitle();
      for (int i = 0; i < RDT_NAMES.length; i++) {
        if (RDT_NAMES[i].equals(title)) {
          findings[i] = result;
        }
      }
    }

    return findings;
  }

  private final PointF center(RectF rect) {
    return new PointF((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2);
  }

  private void debugLogOutline(String tag, float[] outline) {
    logger.i(tag);
    // for (int i = 0; i * 4 < outline.length; i++) {
    //   logger.i("  " + debugLineSegment(outline, i));
    // }
  }

  private String debugLineSegment(float[] outline, int index) {
    int o = 4 * index;
    return "("+outline[o+0]+","+outline[o+1]+") - ("+outline[o+2]+","+outline[o+3]+")";
  }
}

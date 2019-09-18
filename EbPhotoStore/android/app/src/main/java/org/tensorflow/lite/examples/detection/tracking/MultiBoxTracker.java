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

/**
 * A tracker that handles non-max suppression and matches existing objects to
 * new detections.
 */
public class MultiBoxTracker {
  private static final float TEXT_SIZE_DIP = 18;
  private static final float MIN_SIZE = 16.0f;
  private static final int[] COLORS = { Color.BLUE, Color.RED, Color.GREEN, Color.YELLOW, Color.CYAN, Color.MAGENTA,
      Color.WHITE, Color.parseColor("#55FF55"), Color.parseColor("#FFA500"), Color.parseColor("#FF8888"),
      Color.parseColor("#AAAAFF"), Color.parseColor("#FFFFAA"), Color.parseColor("#55AAAA"),
      Color.parseColor("#AA33AA"), Color.parseColor("#0D0068") };
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
  private PointF canvasSize;

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

    textSizePx = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, TEXT_SIZE_DIP,
        activity.getResources().getDisplayMetrics());
    borderedText = new BorderedText(textSizePx);
  }

  public synchronized void setFrameConfiguration(final int width, final int height, final int sensorOrientation) {
    frameWidth = width;
    frameHeight = height;
    this.sensorOrientation = sensorOrientation;
  }

  public synchronized Bitmap trackResults(final Bitmap sourceBitmap, final List<Recognition> results,
      final long timestamp) {
    // logger.i("Processing %d results from %d", results.size(), timestamp);
    processResults(results);
    return this.rdtTrack(sourceBitmap, results);
  }

  private Matrix getFrameToCanvasMatrix() {
    return frameToCanvasMatrix;
  }

  public synchronized void draw(final Canvas canvas) {
    logger.i("draw: frame=(%d, %d) canvas=(%d, %d) orientation=%d", frameWidth, frameHeight, canvas.getWidth(),
        canvas.getHeight(), this.sensorOrientation);
    final boolean rotated = sensorOrientation % 180 == 90;
    final float multiplier = Math.min(canvas.getHeight() / (float) (rotated ? frameWidth : frameHeight),
        canvas.getWidth() / (float) (rotated ? frameHeight : frameWidth));
    frameToCanvasMatrix = ImageUtils.getTransformationMatrix(frameWidth, frameHeight,
        (int) (multiplier * (rotated ? frameHeight : frameWidth)),
        (int) (multiplier * (rotated ? frameWidth : frameHeight)), sensorOrientation, false);

    this.canvasSize = new PointF(canvas.getWidth(), canvas.getHeight());

    for (final TrackedRecognition recognition : trackedObjects) {
      final RectF trackedPos = new RectF(recognition.location);

      getFrameToCanvasMatrix().mapRect(trackedPos);
      boxPaint.setColor(recognition.color);

      float cornerSize = Math.min(trackedPos.width(), trackedPos.height()) / 8.0f;
      canvas.drawRoundRect(trackedPos, cornerSize, cornerSize, boxPaint);

      final String labelString = !TextUtils.isEmpty(recognition.title)
          ? String.format("%s %.2f", recognition.title, (100 * recognition.detectionConfidence))
          : String.format("%.2f", (100 * recognition.detectionConfidence));
      // borderedText.drawText(canvas, trackedPos.left + cornerSize, trackedPos.top,
      // labelString);
      borderedText.drawText(canvas, trackedPos.left + cornerSize, trackedPos.top, labelString + "%", boxPaint);
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

      logger.v("Result! Frame: " + result.getLocation() + " mapped to screen:" + detectionScreenRect);

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

  final String[] RDT_NAMES = new String[] { "arrows", "test", "ABC", "squares", "influenza" };
  final float[] RDT_OFFSETS = new float[] { (67 + 78) / 2.0f, (50 + 64) / 2.0f, (30 + 43) / 2.0f, (13 + 18) / 2.0f,
      (1 + 12) / 2.0f, };
  final float RDT_HEIGHT = 87;
  final float RDT_WIDTH = 5;
  final int RDT_INSET_MARGIN = 3;

  final float RDT_TEST_TOP = 51;
  final float RDT_TEST_BOTTOM = 61;

  final int TEST_RECOGNIZER_SIZE = 224;

  Bitmap rdtBitmap = null;
  float[] rdtOutline = null;
  Bitmap testBitmap = null;

  private float scaleToCanvasFromRdt() {
    return (canvasSize.y - (2 * RDT_INSET_MARGIN)) / RDT_HEIGHT;
  }

  private Matrix canvasFromRdt() {
    float scale = scaleToCanvasFromRdt();
    Matrix matrix = new Matrix();
    matrix.setScale(scale, scale);
    return matrix;
  }

  private Matrix rdtFromRecognition(int index0, PointF location0, int index1, PointF location1) {
    Matrix matrix = new Matrix();
    matrix.setPolyToPoly(new float[] { location0.x, location0.y, location1.x, location1.y }, 0,
        new float[] { RDT_WIDTH / 2, RDT_OFFSETS[index0], RDT_WIDTH / 2, RDT_OFFSETS[index1] }, 0, 2);
    return matrix;
  }

  private Matrix recognizerFromRdt() {
    Matrix matrix = new Matrix();
    matrix.preScale(TEST_RECOGNIZER_SIZE / RDT_WIDTH, TEST_RECOGNIZER_SIZE / (RDT_TEST_BOTTOM - RDT_TEST_TOP));
    matrix.preTranslate(0, -RDT_TEST_TOP);
    return matrix;
  }

  private Bitmap rdtTrack(final Bitmap sourceBitmap, final List<Recognition> results) {
    final Recognition[] findings = this.rdtLocations(results);

    int index0 = findings.length + 1;
    int index1 = -1;
    for (int i = 0; i < findings.length; i++) {
      if (findings[i] != null) {
        if (i < index0)
          index0 = i;
        if (index1 < i)
          index1 = i;
      }
    }
    if (index0 >= index1) {
      this.rdtBitmap = null;
      this.rdtOutline = null;
      return null;
    }

    PointF location0 = this.center(findings[index0].getLocation());
    PointF location1 = this.center(findings[index1].getLocation());

    if (this.canvasSize == null) {
      return null;
    }

    Matrix rdtFromRecognition = this.rdtFromRecognition(index0, location0, index1, location1);

    Matrix rdtImageMatrix = new Matrix();
    rdtImageMatrix.preConcat(canvasFromRdt());
    rdtImageMatrix.preConcat(rdtFromRecognition);

    Matrix phase2Matrix = new Matrix();
    phase2Matrix.preConcat(this.recognizerFromRdt());
    phase2Matrix.preConcat(rdtFromRecognition);

    Matrix outlineToCanvasMatrix = new Matrix();
    rdtFromRecognition.invert(outlineToCanvasMatrix);
    outlineToCanvasMatrix.postConcat(frameToCanvasMatrix);

    float[] outline = this.rdtOutline();
    outlineToCanvasMatrix.mapPoints(outline);
    this.rdtOutline = outline;

    float scaleToCanvasFromRdt = this.scaleToCanvasFromRdt();
    int rdtCanvasWidth = (int) (RDT_WIDTH * scaleToCanvasFromRdt);
    int rdtCanvasHeight = (int) (RDT_HEIGHT * scaleToCanvasFromRdt);

    this.rdtBitmap = this.extractBitmap(sourceBitmap, rdtCanvasWidth, rdtCanvasHeight, rdtImageMatrix);
    this.testBitmap = this.extractBitmap(sourceBitmap, 224, 224, phase2Matrix);

    return this.testBitmap;
  }

  private float[] rdtOutline() {
    float rdtLeft = 0;
    float rdtTop = 0;
    float rdtRight = RDT_WIDTH;
    float rdtBottom = RDT_HEIGHT;
    return new float[] { rdtLeft, rdtTop, rdtRight, rdtTop, rdtRight, rdtTop, rdtRight, rdtBottom, rdtRight, rdtBottom,
        rdtLeft, rdtBottom, rdtLeft, rdtBottom, rdtLeft, rdtTop, };
  }

  private Bitmap extractBitmap(Bitmap sourceBitmap, int width, int height, Matrix destFromSource) {
    try {
      Bitmap rdtBitmap = Bitmap.createBitmap(width, height, sourceBitmap.getConfig());

      Paint paint = new Paint();
      paint.setFilterBitmap(true);
      paint.setAntiAlias(true);

      Canvas canvas = new Canvas();
      canvas.setBitmap(rdtBitmap);
      canvas.drawBitmap(sourceBitmap, destFromSource, paint);
      canvas.setBitmap(null);

      return rdtBitmap;
    } catch (Exception e) {
      logger.e("Bitmap extraction threw " + e.toString());
      return null;
    }
  }

  private void rdtDraw(final Canvas canvas) {
    if (this.rdtOutline != null) {
      float[] outline = this.rdtOutline;
      final Paint paint = new Paint();
      paint.setColor(Color.MAGENTA);
      paint.setStyle(Style.STROKE);
      paint.setStrokeWidth(10.0f);
      canvas.drawLines(outline, paint);
    }

    if (this.rdtBitmap != null) {
      logger.i("Drawing rdtBitmap");
      canvas.drawBitmap(this.rdtBitmap, RDT_INSET_MARGIN, RDT_INSET_MARGIN, new Paint());
    }

    if (this.testBitmap != null) {
      logger.i("Drawing testBitmap");
      canvas.drawBitmap(this.testBitmap, canvas.getWidth() - (this.testBitmap.getWidth() + RDT_INSET_MARGIN),
          canvas.getHeight() - (this.testBitmap.getHeight() + RDT_INSET_MARGIN + 200), new Paint());
    }
  }

  private Recognition[] rdtLocations(final List<Recognition> results) {
    final Recognition[] findings = new Recognition[RDT_NAMES.length];

    for (final Recognition result : results) {
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
}

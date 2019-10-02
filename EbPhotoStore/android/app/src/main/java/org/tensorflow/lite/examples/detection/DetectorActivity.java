/*
 * Copyright 2019 The TensorFlow Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.tensorflow.lite.examples.detection;

import android.graphics.Bitmap;
import android.graphics.Bitmap.Config;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.media.ImageReader.OnImageAvailableListener;
import android.os.SystemClock;
import android.util.Size;
import android.util.TypedValue;
import android.widget.Toast;
import java.io.IOException;
import java.util.LinkedList;
import java.util.List;
import org.tensorflow.lite.examples.detection.customview.OverlayView;
import org.tensorflow.lite.examples.detection.customview.OverlayView.DrawCallback;
import org.tensorflow.lite.examples.detection.env.BorderedText;
import org.tensorflow.lite.examples.detection.env.ImageUtils;
import org.tensorflow.lite.examples.detection.env.Logger;
import org.tensorflow.lite.examples.detection.tflite.Classifier;
import org.tensorflow.lite.examples.detection.tflite.TFLiteObjectDetectionAPIModel;
import org.tensorflow.lite.examples.detection.tracking.InterpretationTracker;
import org.tensorflow.lite.examples.detection.tracking.MultiBoxTracker;
import org.auderenow.ebphotostore.R;
import org.tensorflow.lite.examples.detection.tracking.RDTTracker;

/**
 * An activity that uses a TensorFlowMultiBoxDetector and ObjectTracker to detect and then track
 * objects.
 */
public class DetectorActivity extends CameraActivity implements OnImageAvailableListener {
  private static final Logger LOGGER = new Logger();

  // Configuration values for the prepackaged SSD model.
  private static final int TF_OD_API_INPUT_SIZE = 300;
  private static final boolean TF_OD_API_IS_QUANTIZED = true;
  private static final String BOX_TF_OD_API_MODEL_FILE = "detect.tflite";
  private static final String BOX_TF_OD_API_LABELS_FILE = "file:///android_asset/labelmap.txt";
  private static final String INTERPRETATION_TF_OD_API_MODEL_FILE = "phase2-detect.tflite";
  private static final String INTERPRETATION_TF_OD_API_LABELS_FILE = "file:///android_asset/phase2-labelmap.txt";
  // Minimum detection confidence to track a detection.
  private static final float BOX_MINIMUM_CONFIDENCE_TF_OD_API = 0.5f;
  private static final float INTERPRETATION_MINIMUM_CONFIDENCE_TF_OD_API = 0.2f;
  private static final boolean MAINTAIN_ASPECT = false;
  private static final Size DESIRED_PREVIEW_SIZE = new Size(640, 480);
  private static final boolean SAVE_PREVIEW_BITMAP = false;
  private static final float TEXT_SIZE_DIP = 10;

  OverlayView trackingOverlay;

  private Classifier boxDetector;
  private Classifier interpretationDetector;

  private MultiBoxTracker boxTracker;
  private RDTTracker rdtTracker;
  private InterpretationTracker interpretationTracker;

  private Integer sensorOrientation;
  private long boxLastProcessingTimeMs;
  private long interpretationLastProcessingTimeMs;

  private Bitmap previewBitmap = null;
  private Bitmap boxModelBitmap = null;
  private Bitmap interpretationModelBitmap = null;

  private boolean computingDetection = false;

  private long timestamp = 0;

  private Matrix previewToModelTransform;
  private Matrix modelToPreviewTransform;

  private BorderedText borderedText;

  @Override
  public void onPreviewSizeChosen(final Size size, final int rotation) {
    final float textSizePx =
        TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP, TEXT_SIZE_DIP, getResources().getDisplayMetrics());
    borderedText = new BorderedText(textSizePx);
    borderedText.setTypeface(Typeface.MONOSPACE);

    boxTracker = new MultiBoxTracker(this);
    rdtTracker = new RDTTracker(this);
    interpretationTracker = new InterpretationTracker(this);

    int modelSize = TF_OD_API_INPUT_SIZE;

    try {
      boxDetector =
              TFLiteObjectDetectionAPIModel.create(
                      getAssets(),
                      BOX_TF_OD_API_MODEL_FILE,
                      BOX_TF_OD_API_LABELS_FILE,
                      TF_OD_API_INPUT_SIZE,
                      TF_OD_API_IS_QUANTIZED);
    } catch (final IOException e) {
      e.printStackTrace();
      LOGGER.e(e, "Exception initializing classifier!");
      Toast toast =
              Toast.makeText(
                      getApplicationContext(), "Phase 1 Detector could not be initialized", Toast.LENGTH_SHORT);
      toast.show();
      finish();
    }

    try {
      interpretationDetector =
              TFLiteObjectDetectionAPIModel.create(
                      getAssets(),
                      INTERPRETATION_TF_OD_API_MODEL_FILE,
                      INTERPRETATION_TF_OD_API_LABELS_FILE,
                      TF_OD_API_INPUT_SIZE,
                      TF_OD_API_IS_QUANTIZED);
    } catch (final IOException e) {
      e.printStackTrace();
      LOGGER.e(e, "Exception initializing classifier!");
      Toast toast =
              Toast.makeText(
                      getApplicationContext(), "Phase 2 Detector could not be initialized", Toast.LENGTH_SHORT);
      toast.show();
      finish();
    }

    previewWidth = size.getWidth();
    previewHeight = size.getHeight();

    sensorOrientation = rotation - getScreenOrientation();
    LOGGER.i("Camera orientation relative to screen canvas: %d", sensorOrientation);

    LOGGER.i("Initializing at size %dx%d", previewWidth, previewHeight);
    previewBitmap = Bitmap.createBitmap(previewWidth, previewHeight, Config.ARGB_8888);
    boxModelBitmap = Bitmap.createBitmap(modelSize, modelSize, Config.ARGB_8888);

    previewToModelTransform =
        ImageUtils.getTransformationMatrix(
            previewWidth, previewHeight,
            modelSize, modelSize,
            sensorOrientation, MAINTAIN_ASPECT);

    modelToPreviewTransform = new Matrix();
    previewToModelTransform.invert(modelToPreviewTransform);

    trackingOverlay = (OverlayView) findViewById(R.id.tracking_overlay);
    trackingOverlay.addCallback(
        new DrawCallback() {
          @Override
          public void drawCallback(final Canvas canvas) {
            // boxTracker.draw(canvas);
            rdtTracker.draw(canvas);
            interpretationTracker.draw(canvas);
          }
        });

    boxTracker.setPreviewConfiguration(previewWidth, previewHeight, sensorOrientation);
    rdtTracker.setPreviewConfiguration(previewWidth, previewHeight, sensorOrientation);
    interpretationTracker.setPreviewConfiguration(previewWidth, previewHeight, sensorOrientation);
  }

  @Override
  protected void processImage() {
    ++timestamp;
    final long currTimestamp = timestamp;
    trackingOverlay.postInvalidate();

    // No mutex needed as this method is not reentrant.
    if (computingDetection) {
      readyForNextImage();
      return;
    }
    computingDetection = true;

    previewBitmap.setPixels(getRgbBytes(), 0, previewWidth, 0, 0, previewWidth, previewHeight);

    readyForNextImage();

    final Canvas canvas = new Canvas(boxModelBitmap);
    canvas.drawBitmap(previewBitmap, previewToModelTransform, null);
    // For examining the actual TF input.
    if (SAVE_PREVIEW_BITMAP) {
      ImageUtils.saveBitmap(boxModelBitmap);
    }

    runInBackground(
        new Runnable() {
          private List<Classifier.Recognition> filterResults(float minimumConfidence, List<Classifier.Recognition> results, boolean toPreviewTransform) {
            final List<Classifier.Recognition> mappedRecognitions = new LinkedList<Classifier.Recognition>();
            for (final Classifier.Recognition result : results) {
              final RectF location = result.getLocation();
              if (location != null && result.getConfidence() >= minimumConfidence) {

                if (toPreviewTransform) {
                  modelToPreviewTransform.mapRect(location);
                  result.setLocation(location);
                }
                mappedRecognitions.add(result);
              }
            }
            return mappedRecognitions;
          }

          @Override
          public void run() {
            final long boxStartTimeMs = SystemClock.uptimeMillis();
            final List<Classifier.Recognition> results = boxDetector.recognizeImage(boxModelBitmap);
            boxLastProcessingTimeMs = SystemClock.uptimeMillis() - boxStartTimeMs;

            final List<Classifier.Recognition> mappedRecognitions = filterResults(BOX_MINIMUM_CONFIDENCE_TF_OD_API, results, true);

            boxTracker.trackResults(mappedRecognitions);
            rdtTracker.trackResults(mappedRecognitions);

            interpretationModelBitmap = rdtTracker.extractRDT(previewBitmap);
            interpretationTracker.clearResults();

            if (interpretationModelBitmap != null) {
              final long interpretationStartTimeMs = SystemClock.uptimeMillis();
              final List<Classifier.Recognition> phase2Results = interpretationDetector.recognizeImage(interpretationModelBitmap);
              interpretationLastProcessingTimeMs = SystemClock.uptimeMillis() - interpretationStartTimeMs;

              final List<Classifier.Recognition> phase2MappedRecognitions = filterResults(INTERPRETATION_MINIMUM_CONFIDENCE_TF_OD_API, phase2Results, false);
              interpretationTracker.trackResults(phase2MappedRecognitions);
            }
            trackingOverlay.postInvalidate();

            computingDetection = false;

            runOnUiThread(
                new Runnable() {
                  @Override
                  public void run() {
                    if (interpretationModelBitmap != null) {
                      // TODO showResultsInBottomSheet(classifierResults);
                      showClassifierInference(interpretationLastProcessingTimeMs + "ms");
                    }
                    showInference( boxLastProcessingTimeMs + "ms");
                  }
                });
          }
        });
  }

  @Override
  protected int getLayoutId() {
    return R.layout.camera_connection_fragment_tracking;
  }

  @Override
  protected Size getDesiredPreviewFrameSize() {
    return DESIRED_PREVIEW_SIZE;
  }
}

// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.tracking;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.PointF;
import android.graphics.RectF;
import android.text.TextUtils;
import android.util.Log;

import host.exp.exponent.env.ImageUtils;
import host.exp.exponent.tflite.Classifier;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RDTTracker {
    private static final String TAG = "RDTTracker";

    private final PointF canvasSize;
    private final PointF previewSize;
    private final int sensorOrientation;
    private final float[] desiredOutline;
    private final Matrix frameToCanvasMatrix;

    private static final String[] RDT_NAMES = new String[] { "arrows", "test", "ABC", "squares", "influenza" };
    private static final float[] RDT_OFFSETS = new float[] { (67 + 78) / 2.0f, (50 + 64) / 2.0f, (30 + 43) / 2.0f, (13 + 18) / 2.0f,
            (1 + 12) / 2.0f, };
    public static final float RDT_HEIGHT = 87;
    public static final float RDT_WIDTH = 4.5f;
    private static final float RDT_TEST_TOP = 49;
    private static final float RDT_TEST_BOTTOM = 63;
    private static final int TEST_RECOGNIZER_SIZE = 300;
    public static final float INSTRUCTION_HEIGHT_PERCENT = 0.25f;
    public static final float RDT_HEIGHT_PERCENT = 0.65f;
    public static final int RDT_LOCATION_BUFFER = 128;

    public RDTTracker(int previewWidth, int previewHeight, final int sensorOrientation, final int screenWidth, final int screenHeight) {
        canvasSize = new PointF(screenWidth, screenHeight);
        previewSize = new PointF(previewWidth, previewHeight);
        this.sensorOrientation = sensorOrientation;
        frameToCanvasMatrix = ImageUtils.getTransformationMatrix(previewWidth, previewHeight,
                screenWidth, screenHeight, sensorOrientation, false);
        desiredOutline = getDesiredRdtOutline();
    }

    private float[] getDesiredRdtOutline() {
        float rdtAspectRatio = RDT_WIDTH / RDT_HEIGHT;
        float rdtHeight = canvasSize.y * RDT_HEIGHT_PERCENT;
        float rdtWidth = rdtHeight * rdtAspectRatio;

        float rdtLeft = canvasSize.x / 2 - rdtWidth / 2;
        float rdtTop = canvasSize.y * INSTRUCTION_HEIGHT_PERCENT;
        float rdtRight = rdtLeft + rdtWidth;
        float rdtBottom = rdtTop + rdtHeight;
        return new float[]{
                rdtLeft, rdtTop, rdtRight, rdtTop, rdtRight, rdtTop, rdtRight, rdtBottom,
                rdtRight, rdtBottom, rdtLeft, rdtBottom, rdtLeft, rdtBottom, rdtLeft, rdtTop };
    }

    private boolean rdtInDesiredLocation(float[] rdtOutline) {
        if (rdtOutline == null ) {
            return false;
        }

        boolean upsideDown = rdtOutline[1] > rdtOutline[7]; // rdtTop > rdtBottom

        for (int i = 0; i < rdtOutline.length; i++) {
            int desiredIndex = upsideDown ? (i + 8) % 16 : i;
            if (Math.abs(desiredOutline[desiredIndex] - rdtOutline[i]) > RDT_LOCATION_BUFFER) {
                return false;
            }
        }
        return true;
    }

    private RDTResult extractRDT(final List<Classifier.Recognition> results, final Bitmap previewBitmap, boolean isHighRes) {
        // TODO: make more strict regarding how good the current results have to be
        final Classifier.Recognition[] findings = this.rdtLocations(results);

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
            return null;
        }

        PointF location0 = center(findings[index0].getLocation());
        PointF location1 = center(findings[index1].getLocation());

        Matrix rdtFromRecognition = rdtFromRecognition(index0, location0, index1, location1);

        Matrix rdtImageMatrix = new Matrix();
        rdtImageMatrix.preConcat(canvasFromRdt());
        rdtImageMatrix.preConcat(rdtFromRecognition);

        Matrix outlineToCanvasMatrix = new Matrix();
        rdtFromRecognition.invert(outlineToCanvasMatrix);
        outlineToCanvasMatrix.postConcat(frameToCanvasMatrix);

        float[] outline = rdtOutline();
        outlineToCanvasMatrix.mapPoints(outline);

        float scaleToCanvasFromRdt = this.scaleToCanvasFromRdt();
        int rdtCanvasWidth = (int) (RDT_WIDTH * scaleToCanvasFromRdt);
        int rdtCanvasHeight = (int) (RDT_HEIGHT * scaleToCanvasFromRdt);
        Bitmap rdtBitmap = extractBitmap(previewBitmap, rdtCanvasWidth, rdtCanvasHeight, rdtImageMatrix);

        if (isHighRes) {
            Matrix phase2Matrix = new Matrix();
            phase2Matrix.preConcat(testAreaFromRdt());
            phase2Matrix.preConcat(rdtFromRecognition);
            Bitmap testAreaBitmap = extractBitmap(previewBitmap, TEST_RECOGNIZER_SIZE,
                    TEST_RECOGNIZER_SIZE, phase2Matrix);
            Map<String, String> intermediateResults = getIntermediates(location0, index0, location1,
                    index1, rdtFromRecognition, rdtImageMatrix, outlineToCanvasMatrix, outline,
                    phase2Matrix);
            return new RDTStillFrameResult(outline, testAreaBitmap, results, intermediateResults);
        } else {
            return new RDTPreviewResult(rdtBitmap, outline, rdtInDesiredLocation(outline));
        }
    }

    public RDTPreviewResult extractRDTFromPreview(final List<Classifier.Recognition> results,
                                                  final Bitmap previewBitmap) {
        return (RDTPreviewResult) extractRDT(results, previewBitmap, false);
    }

    public RDTStillFrameResult extractRDTFromStillFrame(final List<Classifier.Recognition> results,
                                                        final Bitmap previewBitmap) {
        return (RDTStillFrameResult) extractRDT(results, previewBitmap, true);
    }

    private float scaleToCanvasFromRdt() {
        return canvasSize.y / RDT_HEIGHT;
    }

    private Matrix canvasFromRdt() {
        float scale = scaleToCanvasFromRdt();
        Matrix matrix = new Matrix();
        matrix.setScale(scale, scale);
        return matrix;
    }

    private static Matrix rdtFromRecognition(int index0, PointF location0, int index1, PointF location1) {
        Matrix matrix = new Matrix();
        matrix.setPolyToPoly(new float[] { location0.x, location0.y, location1.x, location1.y }, 0,
                new float[] { RDT_WIDTH / 2, RDT_OFFSETS[index0], RDT_WIDTH / 2, RDT_OFFSETS[index1] }, 0, 2);
        return matrix;
    }

    private static Matrix testAreaFromRdt() {
        Matrix matrix = new Matrix();
        matrix.preScale(
                TEST_RECOGNIZER_SIZE / RDT_WIDTH,
                TEST_RECOGNIZER_SIZE / (RDT_TEST_BOTTOM - RDT_TEST_TOP));
        matrix.preTranslate(0, -RDT_TEST_TOP);
        return matrix;
    }

    private static float[] rdtOutline() {
        float rdtLeft = 0;
        float rdtTop = 0;
        float rdtRight = RDT_WIDTH;
        float rdtBottom = RDT_HEIGHT;
        return new float[] {
                rdtLeft, rdtTop, rdtRight, rdtTop, rdtRight, rdtTop, rdtRight, rdtBottom,
                rdtRight, rdtBottom, rdtLeft, rdtBottom, rdtLeft, rdtBottom, rdtLeft, rdtTop };
    }

    private static Bitmap extractBitmap(Bitmap sourceBitmap, int width, int height, Matrix destFromSource) {
        try {
            Bitmap destBitmap = Bitmap.createBitmap(width, height, sourceBitmap.getConfig());

            Paint paint = new Paint();
            paint.setFilterBitmap(true);
            paint.setAntiAlias(true);

            Canvas canvas = new Canvas();
            canvas.setBitmap(destBitmap);
            canvas.drawBitmap(sourceBitmap, destFromSource, paint);
            canvas.setBitmap(null);

            return destBitmap;
        } catch (Exception e) {
            Log.e(TAG, "Bitmap extraction threw " + e.toString());
            return null;
        }
    }

    private Classifier.Recognition[] rdtLocations(final List<Classifier.Recognition> results) {
        final Classifier.Recognition[] findings = new Classifier.Recognition[RDT_NAMES.length];

        for (final Classifier.Recognition result : results) {
            final String title = result.getTitle();
            for (int i = 0; i < RDT_NAMES.length; i++) {
                if (RDT_NAMES[i].equals(title) && (findings[i] == null ||
                        findings[i].getConfidence() < result.getConfidence())) {
                    findings[i] = result;
                }
            }
        }

        return findings;
    }

    private static final PointF center(RectF rect) {
        return new PointF((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2);
    }

    public abstract class RDTResult {
        public final float[] rdtOutline;

        public RDTResult(float[] rdtOutline) {
            this.rdtOutline = rdtOutline;
        }

        @Override
        public String toString() {
            return new StringBuilder()
                .append("Audere RDTResult")
                .append(" outline=").append(rdtOutline == null ? 0 : rdtOutline.length)
                .toString();
        }
    }

    public class RDTPreviewResult extends RDTResult {
        public final boolean centered;
        public final Bitmap rdtBitmap;

        public RDTPreviewResult(Bitmap rdtBitmap, float[] rdtOutline, boolean centered) {
            super(rdtOutline);
            this.rdtBitmap = rdtBitmap;
            this.centered = centered;
        }
    }

    public class RDTStillFrameResult extends RDTResult {
        public final Bitmap testArea;
        public final List<Classifier.Recognition> recognitions;
        public final Map<String, String> intermediateResults;

        public RDTStillFrameResult(float[] rdtOutline, Bitmap testArea,
                                   List<Classifier.Recognition> recognitions,
                                   Map<String, String> intermediateResults) {
            super(rdtOutline);
            this.recognitions = recognitions;
            this.intermediateResults = intermediateResults;
            this.testArea = testArea;
        }
    }

    public static String getLabel(RDTTracker.TrackedRecognition recognition) {
        return !TextUtils.isEmpty(recognition.title)
                ? String.format("%s %.2f", recognition.title, (100 * recognition.detectionConfidence))
                : String.format("%.2f", (100 * recognition.detectionConfidence));
    }

    protected static class TrackedRecognition {
        float detectionConfidence;
        String title;
    }

    public Map<String, String> getIntermediates(PointF location0, int index0, PointF location1,
                                                int index1, Matrix rdtFromRecognition,
                                                Matrix rdtImageMatrix, Matrix outlineToCanvasMatrix,
                                                float[] outline, Matrix phase2Matrix) {
        Map<String, String> result = new HashMap<>();
        if (location0 != null) {
            result.put("location0", location0.toString());
        }

        result.put("index0", "" + index0);

        if (location1 != null) {
            result.put("location1", location1.toString());
        }

        result.put("index1", "" + index1);

        if (rdtFromRecognition != null) {
            result.put("rdtFromRecognition", rdtFromRecognition.toString());
        }

        if (rdtImageMatrix != null) {
            result.put("rdtImageMatrix", rdtImageMatrix.toString());
        }

        if (frameToCanvasMatrix != null) {
            result.put("frameToCanvasMatrix", frameToCanvasMatrix.toString());
        }

        result.put("canvasSize", canvasSize.toString());
        result.put("previewSize", previewSize.toString());
        result.put("sensorOrientation", "" + sensorOrientation);

        if (outlineToCanvasMatrix != null) {
            result.put("outlineToCanvasMatrix", outlineToCanvasMatrix.toString());
        }

        if (outline != null) {
            result.put("outline", Arrays.toString(outline));
        }

        if (phase2Matrix != null) {
            result.put("phase2Matrix", phase2Matrix.toString());
        }

        return result;
    }
}
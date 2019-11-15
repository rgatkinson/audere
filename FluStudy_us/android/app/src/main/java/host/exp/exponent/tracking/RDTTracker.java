// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.tracking;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.PointF;
import android.graphics.RectF;
import android.util.Log;

import host.exp.exponent.env.ImageUtils;
import host.exp.exponent.tflite.Classifier;

import java.util.List;

public class RDTTracker extends Tracker {
    private static final String TAG = "RDTTracker";

    private final PointF canvasSize;
    private final float[] desiredOutline;
    private final Matrix frameToCanvasMatrix;

    private static final String[] RDT_NAMES = new String[] { "arrows", "test", "ABC", "squares", "influenza" };
    private static final float[] RDT_OFFSETS = new float[] { (67 + 78) / 2.0f, (50 + 64) / 2.0f, (30 + 43) / 2.0f, (13 + 18) / 2.0f,
            (1 + 12) / 2.0f, };
    public static final float RDT_HEIGHT = 87;
    public static final float RDT_WIDTH = 5;
    private static final float RDT_TEST_TOP = 51;
    private static final float RDT_TEST_BOTTOM = 61;
    private static final int TEST_RECOGNIZER_SIZE = TF_OD_API_INPUT_SIZE;
    public static final float INSTRUCTION_HEIGHT_PERCENT = 0.25f;
    public static final float RDT_HEIGHT_PERCENT = 0.65f;
    public static final int RDT_LOCATION_BUFFER = 128;

    public RDTTracker(final Activity activity, int previewWidth, int previewHeight, final int sensorOrientation, final int screenWidth, final int screenHeight) {
        super(activity, previewWidth, previewHeight, sensorOrientation, screenWidth, screenHeight);
        canvasSize = new PointF(screenWidth, screenHeight);
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

    public synchronized RDTResult extractRDT(final List<Classifier.Recognition> results, final Bitmap previewBitmap) {

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
            return new RDTResult(null, null, null);
        }

        PointF location0 = this.center(findings[index0].getLocation());
        PointF location1 = this.center(findings[index1].getLocation());

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

        float scaleToCanvasFromRdt = this.scaleToCanvasFromRdt();
        int rdtCanvasWidth = (int) (RDT_WIDTH * scaleToCanvasFromRdt);
        int rdtCanvasHeight = (int) (RDT_HEIGHT * scaleToCanvasFromRdt);
        Bitmap rdtBitmap = this.extractBitmap(previewBitmap, rdtCanvasWidth, rdtCanvasHeight, rdtImageMatrix);

        Bitmap testBitmap = null;
        if (rdtInDesiredLocation(outline)) {
            testBitmap = this.extractBitmap(previewBitmap, TF_OD_API_INPUT_SIZE, TF_OD_API_INPUT_SIZE, phase2Matrix);
        }

        return new RDTResult(rdtBitmap, testBitmap, outline);
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

    private static Matrix recognizerFromRdt() {
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
                if (RDT_NAMES[i].equals(title)) {
                    findings[i] = result;
                }
            }
        }

        return findings;
    }

    private static final PointF center(RectF rect) {
        return new PointF((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2);
    }

    public class RDTResult {
        public final Bitmap rdtStrip;
        public final Bitmap testArea;
        public final float[] rdtOutline;

        public RDTResult(Bitmap rdtStrip, Bitmap testArea, float[] rdtOutline) {
            this.rdtStrip = rdtStrip;
            this.testArea = testArea;
            this.rdtOutline = rdtOutline;
        }
    }
}

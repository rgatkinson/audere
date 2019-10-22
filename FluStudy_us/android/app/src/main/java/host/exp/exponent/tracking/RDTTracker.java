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
    private PointF canvasSize;
    private Matrix frameToCanvasMatrix;
    private List<Classifier.Recognition> results;

    final String[] RDT_NAMES = new String[] { "arrows", "test", "ABC", "squares", "influenza" };
    final float[] RDT_OFFSETS = new float[] { (67 + 78) / 2.0f, (50 + 64) / 2.0f, (30 + 43) / 2.0f, (13 + 18) / 2.0f,
            (1 + 12) / 2.0f, };
    final float RDT_HEIGHT = 87;
    final float RDT_WIDTH = 5;
    final float RDT_TEST_TOP = 51;
    final float RDT_TEST_BOTTOM = 61;
    final int TEST_RECOGNIZER_SIZE = TF_OD_API_INPUT_SIZE;

    Bitmap rdtBitmap = null;
    float[] rdtOutline = null;
    Bitmap testBitmap = null;
    float[] desiredOutline = null;

    private static final float RDT_CANVAS_MARGIN = .05f;
    private static final float RDT_CANVAS_HEIGHT = 0.65f;
    private static final float RDT_CANVAS_HEIGHT_PERCENT = RDT_CANVAS_HEIGHT * (1 - RDT_CANVAS_MARGIN * 2);

    public RDTTracker(final Activity activity) {
        super(activity);
    }

    public synchronized void trackResults(final List<Classifier.Recognition> results) {
        this.results = results;
    }

    private boolean rdtInDesiredLocation() {
        if (rdtOutline == null || canvasSize == null) {
            return false;
        }
        float[] desired = getDesiredOutline();
        for (int i = 0; i < desired.length; i++) {
            if (Math.abs(desired[i] - rdtOutline[i]) > 128) {
                return false;
            }
        }
        return true;
    }

    /*
    public synchronized void draw(final Canvas canvas, boolean demoMode) {
        this.canvasSize = new PointF(canvas.getWidth(), canvas.getHeight());
        frameToCanvasMatrix = ImageUtils.getTransformationMatrix(previewWidth, previewHeight,
                canvas.getWidth(), canvas.getHeight(), sensorOrientation, false);

        if (demoMode) {
            if (this.rdtBitmap != null) {
                Log.i(TAG, "Drawing rdtBitmap");
                canvas.drawBitmap(this.rdtBitmap, 0, 0, new Paint());
            }

            if (this.testBitmap != null) {
                Log.i(TAG, "Drawing testBitmap");
                canvas.drawBitmap(this.testBitmap, canvas.getWidth() - (testBitmap.getWidth() / 2) - TEST_AREA_INSET_MARGIN,
                        canvas.getHeight() - (testBitmap.getHeight() / 2) - TEST_AREA_INSET_MARGIN, new Paint());
            }
        }
    }
    */

    public synchronized void setPreviewConfiguration(final int width, final int height, final int sensorOrientation, final int screenWidth, final int screenHeight) {
        super.setPreviewConfiguration(width, height, sensorOrientation, screenWidth, screenHeight);
        this.canvasSize = new PointF(screenWidth, screenHeight);
        frameToCanvasMatrix = ImageUtils.getTransformationMatrix(previewWidth, previewHeight,
                screenWidth, screenHeight, sensorOrientation, false);
    }

    public synchronized Bitmap extractRDT(final Bitmap previewBitmap) {

        this.rdtBitmap = null;
        this.testBitmap = null;
        this.rdtOutline = null;

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
        this.rdtBitmap = this.extractBitmap(previewBitmap, rdtCanvasWidth, rdtCanvasHeight, rdtImageMatrix);

        if (rdtInDesiredLocation()) {
            this.testBitmap = this.extractBitmap(previewBitmap, TF_OD_API_INPUT_SIZE, TF_OD_API_INPUT_SIZE, phase2Matrix);
            return this.testBitmap;
        }
        return null;
    }

    public Bitmap getRdtBitmap() {
        return this.rdtBitmap;
    }

    public float[] getRdtOutline() {
        return this.rdtOutline;
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

    private Matrix rdtFromRecognition(int index0, PointF location0, int index1, PointF location1) {
        Matrix matrix = new Matrix();
        matrix.setPolyToPoly(new float[] { location0.x, location0.y, location1.x, location1.y }, 0,
                new float[] { RDT_WIDTH / 2, RDT_OFFSETS[index0], RDT_WIDTH / 2, RDT_OFFSETS[index1] }, 0, 2);
        return matrix;
    }

    private Matrix recognizerFromRdt() {
        Matrix matrix = new Matrix();
        matrix.preScale(
                TEST_RECOGNIZER_SIZE / RDT_WIDTH,
                TEST_RECOGNIZER_SIZE / (RDT_TEST_BOTTOM - RDT_TEST_TOP));
        matrix.preTranslate(0, -RDT_TEST_TOP);
        return matrix;
    }

    private float[] rdtOutline() {
        float rdtLeft = 0;
        float rdtTop = 0;
        float rdtRight = RDT_WIDTH;
        float rdtBottom = RDT_HEIGHT;
        return new float[] {
                rdtLeft, rdtTop, rdtRight, rdtTop, rdtRight, rdtTop, rdtRight, rdtBottom,
                rdtRight, rdtBottom, rdtLeft, rdtBottom, rdtLeft, rdtBottom, rdtLeft, rdtTop };
    }

    private float[] getDesiredOutline() {
        if (desiredOutline == null && canvasSize != null) {
            float scale = canvasSize.y / RDT_HEIGHT / (1 / RDT_CANVAS_HEIGHT_PERCENT);
            float height = RDT_HEIGHT * scale;
            float width = RDT_WIDTH * scale;

            float rdtLeft = canvasSize.x / 2 - width / 2;
            float rdtTop = canvasSize.y * .25f + canvasSize.y * RDT_CANVAS_HEIGHT * RDT_CANVAS_MARGIN;
            float rdtRight = rdtLeft + width;
            float rdtBottom = rdtTop + height;
            desiredOutline = new float[] {
                    rdtLeft, rdtTop, rdtRight, rdtTop, rdtRight, rdtTop, rdtRight, rdtBottom,
                    rdtRight, rdtBottom, rdtLeft, rdtBottom, rdtLeft, rdtBottom, rdtLeft, rdtTop };
        }
        return desiredOutline;
    }

    private Bitmap extractBitmap(Bitmap sourceBitmap, int width, int height, Matrix destFromSource) {
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

    private final PointF center(RectF rect) {
        return new PointF((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2);
    }
}

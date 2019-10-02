package org.tensorflow.lite.examples.detection.tracking;

import android.app.Activity;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.TypedValue;

import org.tensorflow.lite.examples.detection.env.BorderedText;
import org.tensorflow.lite.examples.detection.env.Logger;
import org.tensorflow.lite.examples.detection.tflite.Classifier;

import java.util.List;

public abstract class Tracker {
    private static final float TEXT_SIZE_DIP = 18;
    protected static final int TF_OD_API_INPUT_SIZE = 300;

    protected final Paint boxPaint = new Paint();
    protected final float textSizePx;
    protected final BorderedText borderedText;

    protected int previewWidth;
    protected int previewHeight;
    protected int sensorOrientation;

    protected final int TEST_AREA_INSET_MARGIN = 200;

    protected final Logger logger = new Logger();

    public Tracker(final Activity activity) {
        boxPaint.setColor(Color.RED);
        boxPaint.setStyle(Paint.Style.STROKE);
        boxPaint.setStrokeWidth(10.0f);
        boxPaint.setStrokeCap(Paint.Cap.ROUND);
        boxPaint.setStrokeJoin(Paint.Join.ROUND);
        boxPaint.setStrokeMiter(100);

        textSizePx = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, TEXT_SIZE_DIP,
                activity.getResources().getDisplayMetrics());
        borderedText = new BorderedText(textSizePx);
    }

    public synchronized void setPreviewConfiguration(final int width, final int height, final int sensorOrientation) {
        previewWidth = width;
        previewHeight = height;
        this.sensorOrientation = sensorOrientation;
    }

    public abstract void trackResults(final List<Classifier.Recognition> results);

    public abstract void draw(final Canvas canvas);

    protected static class TrackedRecognition {
        RectF location;
        float detectionConfidence;
        int color;
        String title;
    }
}
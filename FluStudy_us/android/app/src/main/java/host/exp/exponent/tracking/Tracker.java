// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.tracking;

import android.app.Activity;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.text.TextUtils;
import android.util.DisplayMetrics;
import android.util.TypedValue;

import host.exp.exponent.env.BorderedText;
import host.exp.exponent.tflite.Classifier;

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

    protected int screenHeight;
    protected int screenWidth;

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

        DisplayMetrics displayMetrics = new DisplayMetrics();
        activity.getWindowManager().getDefaultDisplay().getMetrics(displayMetrics);
        screenHeight = displayMetrics.heightPixels;
        screenWidth = displayMetrics.widthPixels;
    }

    public synchronized void setPreviewConfiguration(final int width, final int height, final int sensorOrientation) {
        previewWidth = width;
        previewHeight = height;
        this.sensorOrientation = sensorOrientation;
    }

    public abstract void trackResults(final List<Classifier.Recognition> results);

    public abstract void draw(final Canvas canvas, boolean demoMode);

    protected String getLabel(RDTTracker.TrackedRecognition recognition) {
        return !TextUtils.isEmpty(recognition.title)
                ? String.format("%s %.2f", recognition.title, (100 * recognition.detectionConfidence))
                : String.format("%.2f", (100 * recognition.detectionConfidence));
    }
    protected static class TrackedRecognition {
        RectF location;
        float detectionConfidence;
        int color;
        String title;
    }
}

// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.tracking;

import android.app.Activity;
import android.graphics.RectF;
import android.text.TextUtils;

public abstract class Tracker {
    protected static final int TF_OD_API_INPUT_SIZE = 300;

    protected int previewWidth;
    protected int previewHeight;
    protected int sensorOrientation;
    protected int screenHeight;
    protected int screenWidth;

    public Tracker(final Activity activity, int previewWidth, int previewHeight, final int sensorOrientation, final int screenWidth, final int screenHeight) {
        this.previewWidth = previewWidth;
        this.previewHeight = previewHeight;
        this.sensorOrientation = sensorOrientation;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
    }

    public static String getLabel(RDTTracker.TrackedRecognition recognition) {
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

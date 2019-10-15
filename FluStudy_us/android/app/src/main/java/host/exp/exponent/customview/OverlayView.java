// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.customview;

import android.content.Context;
import android.graphics.Canvas;
import android.util.AttributeSet;
import android.view.View;

/** A simple View providing a render callback to other classes. */
public class OverlayView extends View {
    private DrawCallback callback;

    public OverlayView(final Context context, final AttributeSet attrs) {
        super(context, attrs);
    }

    public void setCallback(final DrawCallback callback) {
        this.callback = callback;
    }

    @Override
    public synchronized void draw(final Canvas canvas) {
        if (callback != null) {
            callback.drawCallback(canvas);
        }
    }

    /** Interface defining the callback for client classes. */
    public interface DrawCallback {
        void drawCallback(final Canvas canvas);
    }
}


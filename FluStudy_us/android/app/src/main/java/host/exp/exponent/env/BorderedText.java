// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.env;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Paint.Align;
import android.graphics.Paint.Style;
import android.graphics.Typeface;

/** A class that encapsulates the tedious bits of rendering legible, bordered text onto a canvas. */
public class BorderedText {
    private final Paint interiorPaint;
    private final Paint exteriorPaint;


    /**
     * Creates a left-aligned bordered text object with a white interior, and a black exterior with
     * the specified text size.
     *
     * @param textSize text size in pixels
     */
    public BorderedText(final float textSize) {
        this(Color.WHITE, Color.BLACK, textSize);
    }

    /**
     * Create a bordered text object with the specified interior and exterior colors, text size and
     * alignment.
     *
     * @param interiorColor the interior text color
     * @param exteriorColor the exterior text color
     * @param textSize text size in pixels
     */
    public BorderedText(final int interiorColor, final int exteriorColor, final float textSize) {
        interiorPaint = new Paint();
        interiorPaint.setTextSize(textSize);
        interiorPaint.setColor(interiorColor);
        interiorPaint.setStyle(Style.FILL);
        interiorPaint.setAntiAlias(false);
        interiorPaint.setAlpha(255);

        exteriorPaint = new Paint();
        exteriorPaint.setTextSize(textSize);
        exteriorPaint.setColor(exteriorColor);
        exteriorPaint.setStyle(Style.FILL_AND_STROKE);
        exteriorPaint.setStrokeWidth(textSize / 8);
        exteriorPaint.setAntiAlias(false);
        exteriorPaint.setAlpha(255);
    }

    public void setTypeface(Typeface typeface) {
        interiorPaint.setTypeface(typeface);
        exteriorPaint.setTypeface(typeface);
    }

    public void drawText(
            final Canvas canvas, final float posX, final float posY, final String text, Paint bgPaint) {

        float width = exteriorPaint.measureText(text);
        float textSize = exteriorPaint.getTextSize();
        Paint paint = new Paint(bgPaint);
        paint.setStyle(Paint.Style.FILL);
        paint.setAlpha(160);
        canvas.drawRect(posX, (posY + (int) (textSize)), (posX + (int) (width)), posY, paint);

        canvas.drawText(text, posX, (posY + textSize), interiorPaint);
    }

    public void setAlpha(final int alpha) {
        interiorPaint.setAlpha(alpha);
        exteriorPaint.setAlpha(alpha);
    }

    public void setTextAlign(final Align align) {
        interiorPaint.setTextAlign(align);
        exteriorPaint.setTextAlign(align);
    }
}

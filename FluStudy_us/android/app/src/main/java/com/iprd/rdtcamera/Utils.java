package com.iprd.rdtcamera;

import org.opencv.core.Core;
import org.opencv.core.Mat;
import org.opencv.core.Rect;

public class Utils {

    public static Rect rotateRect(Mat in, Rect roi, int rotation) {
        Rect ret= new Rect();
        if (rotation == -90) {
            //transpose and flip
            ret.x = roi.y;
            ret.y = roi.x;
            ret.width = roi.height;
            ret.height = roi.width;
            //now flip
            ret.x = in.height() -( roi.y+roi.height);
        }
        return ret;
    }

    public static Mat rotateFrame(Mat in, int rotation) {
        Mat out = in;

        if (rotation == 90) {
            out = in.t();
            Core.flip(out, out, 1);
        } else if (rotation == -90) {
            out = in.t();
            Core.flip(out, out, 0);

        }
        return out;
    }
}

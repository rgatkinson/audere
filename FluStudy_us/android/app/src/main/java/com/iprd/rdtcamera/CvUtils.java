package com.iprd.rdtcamera;

import android.util.Log;

import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.Point;
import org.opencv.core.Scalar;
import org.opencv.imgproc.Imgproc;

public class CvUtils {

    public static Mat scaleAffineMat(Mat warpMat, int level) {
        Mat warp = warpMat.clone();
        //level 4 mat
        int factor = 1 << level;
        warp.put(0,2,warp.get(0,2)[0] * factor);
        warp.put(1,2,warp.get(1,2)[0] * factor);
        return warp;
    }

    public static void printAffineMat(String s, Mat R) {
        Log.i(s+"[0]",R.get(0,0)[0] + "x" + R.get(0,1)[0] + "x" + R.get(0,2)[0]);
        Log.i(s+"[1]",R.get(1,0)[0] + "x" + R.get(1,1)[0] + "x" + R.get(1,2)[0]);
    }

    public static MotionResult computeVector(Point translation, Mat m, Scalar s) {
        double y = translation.y;//warp.get(1, 2)[0];
        double x = translation.x;//warp.get(0, 2)[0];
        double r = Math.sqrt(x * x + y * y);

        double angleRadian = Math.atan2(y, x);
        if (angleRadian < 0) {
            angleRadian += Math.PI * 2;;
        }
        double x1 = Math.abs(r * Math.cos(angleRadian));
        double y1 = Math.abs(r * Math.sin(angleRadian));
        double angle = Math.toDegrees(angleRadian);
        if (angle >= 0 && angle <= 90) {
            x1 = 100+x1;
            y1 = 100-y1;
        } else if (angle > 90 && angle <= 180) {
            x1 = 100-x1;
            y1 = 100-y1;
        } else if (angle > 180 && angle <= 270) {
            x1 = 100-x1;
            y1 = 100+y1;
        } else if (angle >270 && angle <=360) {
            x1 = 100+x1;
            y1 = 100+y1;
        }
        Log.d("MotionVector", r + "[" + Math.toDegrees(angleRadian) + "]");

        if (m == null) {
            m = new Mat(200, 200, CvType.CV_8UC4);
            m.setTo(new Scalar(0));
        }
        Imgproc.line(m, new Point(100,100), new Point(x1, y1), s,5);
        Point mVector = new Point(r, Math.toDegrees(angleRadian));
        return new MotionResult(mVector, m);
    }

    static class MotionResult {
        public final Point mVector;
        public final Mat m;

        MotionResult(Point mVector, Mat m) {
            this.mVector = mVector;
            this.m = m;
        }
    }
}

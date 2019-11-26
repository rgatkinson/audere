package com.iprd.rdtcamera;

import android.util.Log;

import org.opencv.core.Mat;
import org.opencv.core.TermCriteria;

import static com.iprd.rdtcamera.CvUtils.printAffineMat;
import static com.iprd.rdtcamera.CvUtils.scaleAffineMat;
import static org.opencv.core.CvType.CV_32F;
import static org.opencv.imgproc.Imgproc.pyrDown;
import static org.opencv.video.Video.MOTION_TRANSLATION;
import static org.opencv.video.Video.findTransformECC;

public class ImageRegistration {

    static Mat mRefPyr = null;

    public static Mat findMotion(Mat inp, boolean saveRef) {
        Mat ins = new Mat();
        pyrDown(inp, ins);
        pyrDown(ins, ins);
        pyrDown(ins, ins);
        pyrDown(ins, ins);
        Mat warpMatrix = null;
        if (mRefPyr != null) {
            warpMatrix = getTransformation(mRefPyr, ins);
        }
        if (saveRef) {
            mRefPyr = ins.clone();
        }
        return warpMatrix;
    }

    public static Mat computeMotion(Mat greyMat) {
        Mat warp;
        Mat warpMat = ImageRegistration.findMotion(greyMat, true);
        if (warpMat != null) {
            int level = 4;
            warp = scaleAffineMat(warpMat, level);
            printAffineMat("warp", warp);
            //ComputeVector
            Log.i("Tx-Ty Inp", warpMat.get(0, 2)[0] + "x" + warpMat.get(1, 2)[0]);
        } else {
            warp = Mat.eye(2, 3,CV_32F);
            warp.put(0, 0, 1.0);
            warp.put(1, 1, 1.0);
            warp.put(0, 2, greyMat.width());
            warp.put(1, 2, greyMat.height());
        }
        return warp;
    }

    public static Mat getTransformation(Mat ref, Mat ins) {
        final int warpMode = MOTION_TRANSLATION;
        Mat warpMatrix = Mat.eye(2, 3, CV_32F);
        try {
            int numIter = 50;
            double terminationEps = 1e-3;
            TermCriteria criteria = new TermCriteria(TermCriteria.COUNT + TermCriteria.EPS, numIter, terminationEps);
            findTransformECC(ref, ins, warpMatrix, warpMode, criteria, new Mat());
        } catch(Exception e) {
            Log.e("Exception","Exception in FindTransformECC");
            return null;
        }
        return warpMatrix;
    }
}

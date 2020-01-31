package com.iprd.rdtcamera;

import android.util.Log;

import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.TermCriteria;
import org.opencv.imgproc.Imgproc;
import org.opencv.video.Video;

public class ImageRegistration {

    private Mat mRefPyr = null;

    public Mat findMotion(Mat inp, boolean saveRef) {
        Mat ins = new Mat();
        Imgproc.pyrDown(inp, ins);
        Imgproc.pyrDown(ins, ins);
        Imgproc.pyrDown(ins, ins);
        Imgproc.pyrDown(ins, ins);
        Mat warpMatrix = null;
        if (mRefPyr != null) {
            warpMatrix = getTransformation(mRefPyr, ins);
        }
        if (saveRef) {
            mRefPyr = ins.clone();
        }
        return warpMatrix;
    }

    public Mat computeMotion(Mat greyMat) {
        Mat warp;
        Mat warpMat = findMotion(greyMat, true);
        if (warpMat != null) {
            int level = 4;
            warp = CvUtils.scaleAffineMat(warpMat, level);
            CvUtils.printAffineMat("warp", warp);
            //ComputeVector
            Log.i("Tx-Ty Inp", warpMat.get(0, 2)[0] + "x" + warpMat.get(1, 2)[0]);
        } else {
            warp = Mat.eye(2, 3, CvType.CV_32F);
            warp.put(0, 0, 1.0);
            warp.put(1, 1, 1.0);
            warp.put(0, 2, greyMat.width());
            warp.put(1, 2, greyMat.height());
        }
        return warp;
    }

    private static Mat getTransformation(Mat ref, Mat ins) {
        final int warpMode = Video.MOTION_TRANSLATION;
        Mat warpMatrix = Mat.eye(2, 3, CvType.CV_32F);
        try {
            int numIter = 50;
            double terminationEps = 1e-3;
            TermCriteria criteria = new TermCriteria(TermCriteria.COUNT + TermCriteria.EPS, numIter, terminationEps);
            Video.findTransformECC(ref, ins, warpMatrix, warpMode, criteria, new Mat());
        } catch(Exception e) {
            Log.e("Exception","Exception in FindTransformECC");
            return null;
        }
        return warpMatrix;
    }
}

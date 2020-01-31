package com.iprd.rdtcamera;

import android.graphics.Bitmap;
import android.util.Log;

import org.opencv.android.Utils;
import org.opencv.core.Core;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.MatOfDouble;
import org.opencv.core.Point;
import org.opencv.core.Scalar;
import org.opencv.imgproc.Imgproc;

import java.util.Vector;

import static com.iprd.rdtcamera.AcceptanceStatus.GOOD;
import static com.iprd.rdtcamera.AcceptanceStatus.TOO_HIGH;
import static com.iprd.rdtcamera.AcceptanceStatus.TOO_LOW;

public class RdtAPI {
    private static final String TAG = "RdtApi";

    private Config mConfig;
    private Vector<Mat> mWarpList= new Vector<>();
    private ImageRegistration mImageRegistration;
    public Config getConfig() {
        return mConfig;
    }

    private static boolean computeBlur(Config config, Mat greyImage, AcceptanceStatus ret) {
        Mat laplacian = new Mat();
        Imgproc.Laplacian(greyImage, laplacian, CvType.CV_16S, 3, 1, 0, Core.BORDER_REFLECT101);
        MatOfDouble median = new MatOfDouble();
        MatOfDouble std = new MatOfDouble();
        Core.meanStdDev(laplacian, median, std);
        // Release resources
        laplacian.release();
        ret.mSharpnessMetric = std.get(0,0)[0]*std.get(0,0)[0];

        if (ret.mSharpnessMetric < config.mMinSharpness){
            ret.mSharpness = TOO_LOW;
            return false;
        }
        Log.d("Sharpness",ret.mSharpnessMetric + " (min: " + config.mMinSharpness + ")");
        ret.mSharpness = AcceptanceStatus.GOOD;
        return true;
    }

    private static boolean computeBrightness(Config config, Mat grey, AcceptanceStatus ret) {
        Scalar tempVal = Core.mean(grey);
        double brightness = tempVal.val[0];
        if (brightness > config.mMaxBrightness) {
            ret.mBrightness = TOO_HIGH;
            return false;
        } else if (brightness < config.mMinBrightness){
            ret.mBrightness = TOO_LOW;
            return false;
        }
        Log.d("Brightness", "" + brightness);
        ret.mBrightness = AcceptanceStatus.GOOD;
        return true;
    }

    public boolean isSteady(Bitmap frame) {
        Mat matInput = new Mat();
        Mat greyMat = new Mat();
        boolean result = false;
        try {
            Utils.bitmapToMat(frame, matInput);
            Imgproc.cvtColor(matInput, greyMat, Imgproc.COLOR_RGBA2GRAY);
            result = checkSteadiness(greyMat) == GOOD;
        } catch (Exception e) {
            Log.d(TAG, "Exception: " + e.getMessage());
        } finally {
            matInput.release();
            greyMat.release();
            return result;
        }
    }

    private short checkSteadiness(Mat greyMat) {
        Mat warp;
        warp = mImageRegistration.computeMotion(greyMat);
        mWarpList.add(warp.clone());

        if (mWarpList.size() > 11){
            mWarpList.remove(0);
        }
        //Lets Check Motion now.
        //Threshold1 and Threshold 2.
        Point p = new Point(0, 0);
        for(int i=1; i<mWarpList.size(); i++) {
            p.x +=mWarpList.elementAt(i).get(0,2)[0];
            p.y +=mWarpList.elementAt(i).get(1,2)[0];
            //Log.i(i+"", mWarpList.elementAt(i).get(0,2)[0] + "x" + mWarpList.elementAt(i).get(1,2)[0]);
        }
        Log.i("10 frame", p.x + "x" + p.y);
        Log.i("1 frame", warp.get(0,2)[0] + "x" + warp.get(1,2)[0]);

        Scalar sr = new Scalar(255, 0, 0, 0);//RGBA
        CvUtils.MotionResult motionResult = CvUtils.computeVector(p, null, sr);
        short result = GOOD;
        if (motionResult.mVector.x > mConfig.mMax10FrameTranslationalMagnitude){
            result = TOO_HIGH;
        }

        Scalar sg = new Scalar(0, 255, 0, 0);
        motionResult = CvUtils.computeVector(new Point(warp.get(0,2)[0], warp.get(1,2)[0]), motionResult.m, sg);
        if(motionResult.mVector.x > mConfig.mMaxFrameTranslationalMagnitude) {
            result = TOO_HIGH;
        }
        if (motionResult.m != null) {
            motionResult.m.release();
        }
        return result;
    }

    public AcceptanceStatus checkFrame(Bitmap frame, Bitmap rdt) {
        Mat matInput = new Mat();
        Mat greyMat = new Mat();
        AcceptanceStatus ret = new AcceptanceStatus();

        try {
            Utils.bitmapToMat(rdt, matInput);
            Imgproc.cvtColor(matInput, greyMat, Imgproc.COLOR_RGBA2GRAY);

            computeBlur(mConfig, greyMat, ret);
            computeBrightness(mConfig, greyMat, ret);
        } catch (Exception e) {
            Log.d(TAG, "Exception: " + e.getMessage());
        } finally {
            greyMat.release();
            matInput.release();
            return ret;
        }
    }

    private RdtAPI(RdtAPIBuilder rdtAPIBuilder) {
        this.mConfig = rdtAPIBuilder.mConfig;
        mImageRegistration = new ImageRegistration();
    }

    public static class RdtAPIBuilder {
        private Config mConfig;

        public  RdtAPIBuilder(){
            mConfig = new Config();
        }

        public RdtAPI build() {
            return new RdtAPI(this);
        }
    }
}
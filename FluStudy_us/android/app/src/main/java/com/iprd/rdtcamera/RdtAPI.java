package com.iprd.rdtcamera;

import android.graphics.Bitmap;
import android.util.Log;

import org.opencv.android.Utils;
import org.opencv.core.Mat;
import org.opencv.core.MatOfDouble;
import org.opencv.core.Point;
import org.opencv.core.Rect;
import org.opencv.core.Scalar;
import org.opencv.core.Size;
import org.opencv.imgproc.Imgproc;

import java.nio.MappedByteBuffer;
import java.util.Vector;

import static com.iprd.rdtcamera.AcceptanceStatus.GOOD;
import static com.iprd.rdtcamera.AcceptanceStatus.TOO_HIGH;
import static com.iprd.rdtcamera.AcceptanceStatus.TOO_LOW;
import static com.iprd.rdtcamera.ImageRegistration.computeMotion;
import static com.iprd.rdtcamera.Utils.rotateFrame;
import static com.iprd.rdtcamera.Utils.rotateRect;
import static org.opencv.core.Core.BORDER_REFLECT101;
import static org.opencv.core.Core.mean;
import static org.opencv.core.Core.meanStdDev;
import static org.opencv.core.CvType.CV_16S;
import static org.opencv.imgproc.Imgproc.INTER_CUBIC;
import static org.opencv.imgproc.Imgproc.Laplacian;
import static org.opencv.imgproc.Imgproc.cvtColor;

public class RdtAPI {
    private Config mConfig;
    private ObjectDetection mTensorFlow;
    private Vector<Mat> mWarpList= new Vector<>();
    public Config getConfig() {
        return mConfig;
    }

    private static boolean computeBlur(Config config, Mat greyImage, AcceptanceStatus ret) {
        Mat laplacian = new Mat();
        Laplacian(greyImage, laplacian, CV_16S, 3, 1, 0, BORDER_REFLECT101);
        MatOfDouble median = new MatOfDouble();
        MatOfDouble std = new MatOfDouble();
        meanStdDev(laplacian, median, std);
        // Release resources
        laplacian.release();
        double sharpness =(float) std.get(0,0)[0]*std.get(0,0)[0];

        if (sharpness < config.mMinSharpness){
            ret.mSharpness = TOO_LOW;
            return false;
        }
        Log.d("Sharpness",""+sharpness);
        ret.mSharpness = AcceptanceStatus.GOOD;
        return true;
    }

    private static boolean computeBrightness(Config config, Mat grey, AcceptanceStatus ret) {
        Scalar tempVal = mean(grey);
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

    private static boolean computeDistortion(Config config, boolean rotated, Mat mat, AcceptanceStatus ret){
        if (rotated) {
            if (ret.mBoundingBoxWidth * 100 > config.mMaxScale * mat.cols()) {
                ret.mScale = TOO_HIGH;
                Log.d("DistMaxSc", "" + ret.mBoundingBoxWidth * 100 + ">" + config.mMaxScale * mat.cols());
                return false;
            } else if (ret.mBoundingBoxWidth * 100 < config.mMinScale * mat.cols()) {
                ret.mScale = TOO_LOW;
                Log.d("DistMinSc", "" + ret.mBoundingBoxWidth * 100 + "<" + config.mMinScale * mat.cols());
                return false;
            } else {
                ret.mScale = AcceptanceStatus.GOOD;
            }

            if (ret.mBoundingBoxX * 100 > config.mXMax * mat.cols()) {
                ret.mDisplacementX = TOO_HIGH;
                Log.d("DistXMax","" + ret.mBoundingBoxX * 100 + ">" + config.mXMax * mat.cols());
                return false;
            } else if (ret.mBoundingBoxX * 100 < config.mXMin * mat.cols()) {
                ret.mDisplacementX = TOO_LOW;
                Log.d("DistXMin","" + ret.mBoundingBoxX * 100 + "<" + config.mXMin * mat.cols());
                return false;
            } else {
                ret.mDisplacementX = GOOD;
            }

            if (ret.mBoundingBoxY * 100 > config.mYMax * mat.rows()) {
                ret.mDisplacementY = TOO_HIGH;
                Log.d("DistYMax","" + ret.mBoundingBoxY * 100 + ">" + config.mYMax * mat.rows());
                return false;
            } else if (ret.mBoundingBoxY * 100 < config.mYMin * mat.rows()) {
                ret.mDisplacementY = TOO_LOW;
                Log.d("DistYMin","" + ret.mBoundingBoxY * 100 + "<" + config.mYMin * mat.rows());
                return false;
            } else {
                ret.mDisplacementY = GOOD;
            }

        } else {
            if (ret.mBoundingBoxHeight * 100 > config.mMaxScale * mat.rows()) {
                ret.mScale = TOO_HIGH;
                Log.d("DistMaxSc", "" + ret.mBoundingBoxHeight * 100 + ">" + config.mMaxScale * mat.rows());
                return false;
            } else if (ret.mBoundingBoxHeight * 100 < config.mMinScale * mat.rows()) {
                ret.mScale = TOO_LOW;
                Log.d("DistMinSc", "" + ret.mBoundingBoxHeight * 100 + "<" + config.mMinScale * mat.rows());
                return false;
            } else {
                ret.mScale = AcceptanceStatus.GOOD;
            }

            if (ret.mBoundingBoxX * 100 > config.mXMax * mat.rows()) {
                ret.mDisplacementX = TOO_HIGH;
                Log.d("DistXMax","" + ret.mBoundingBoxX * 100 + ">" + config.mXMax * mat.rows());
                return false;
            } else if (ret.mBoundingBoxX * 100 < config.mXMin * mat.rows()){
                ret.mDisplacementX = TOO_LOW;
                Log.d("DistXMin","" + ret.mBoundingBoxX * 100 + "<" + config.mXMin * mat.rows());
                return false;
            } else {
                ret.mDisplacementX = GOOD;
            }

            if (ret.mBoundingBoxY * 100 > config.mYMax * mat.cols()) {
                ret.mDisplacementY = TOO_HIGH;
                Log.d("DistYMax","" + ret.mBoundingBoxY * 100 + ">" + config.mYMax * mat.cols());
                return false;
            } else if (ret.mBoundingBoxY * 100 < config.mYMin * mat.cols()) {
                ret.mDisplacementY = TOO_LOW;
                Log.d("DistYMin","" + ret.mBoundingBoxY * 100 + "<" + config.mYMin * mat.cols());
                return false;
            } else {
                ret.mDisplacementY = GOOD;
            }
        }

        ret.mPerspectiveDistortion= GOOD;
        return true;
    }

    public boolean isSteady(Bitmap frame) {
        Mat matInput = new Mat();
        Mat greyMat = new Mat();
        Utils.bitmapToMat(frame, matInput);
        cvtColor(matInput, greyMat, Imgproc.COLOR_RGBA2GRAY);
        return checkSteadiness(greyMat) == GOOD;
    }

    private short checkSteadiness(Mat greyMat) {
        Mat warp;
        warp = computeMotion(greyMat);
        mWarpList.add(warp.clone());

        if(mWarpList.size() > 11){
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

    public AcceptanceStatus checkFrame(Bitmap frame) {
        Mat matInput = new Mat();
        Mat greyMat = new Mat();
        Mat greyMatResized = new Mat();

        AcceptanceStatus ret= new AcceptanceStatus();
        Utils.bitmapToMat(frame, matInput);
        cvtColor(matInput, greyMat, Imgproc.COLOR_RGBA2GRAY);

        boolean rotated = matInput.width() < matInput.height();

        Mat rotatedMat = new Mat();
        if (rotated) {
            rotatedMat = rotateFrame(greyMat, -90);
        }

        Size sz = new Size(1280, 720);

        Imgproc.resize(rotated ? rotatedMat : greyMat, greyMatResized, sz, 0.0, 0.0, INTER_CUBIC);

        processRDT(ret, matInput, greyMatResized, rotated, mTensorFlow);

        if (ret.mRDTFound) {
            computeDistortion(mConfig, rotated, greyMat, ret);
            Mat imageROI = greyMat.submat(new Rect(ret.mBoundingBoxX, ret.mBoundingBoxY, ret.mBoundingBoxWidth, ret.mBoundingBoxHeight));
            computeBlur(mConfig, imageROI, ret);
            computeBrightness(mConfig, imageROI, ret);
        }

        greyMatResized.release();
        greyMat.release();
        matInput.release();

        return ret;
    }

    private static void processRDT(AcceptanceStatus retStatus, Mat inputMat, Mat resizedGreyMat, boolean setRotation, ObjectDetection tensorFlow) {
        final long updateTimeSt = System.currentTimeMillis();
        Boolean[] rdtFound = new Boolean[]{ new Boolean(false) };
        Rect detectedRoi = tensorFlow.update(resizedGreyMat, rdtFound);

        retStatus.mRDTFound = rdtFound[0].booleanValue();
        if (retStatus.mRDTFound) {
            float wFactor, hFactor;
            if (setRotation) {
                detectedRoi = rotateRect(resizedGreyMat, detectedRoi, -90);
                wFactor = inputMat.cols() / 720.0f;
                hFactor = inputMat.rows() / 1280f;
            } else {
                wFactor = inputMat.cols() / 1280.f;
                hFactor = inputMat.rows() / 720f;
            }
            retStatus.mBoundingBoxX = (short) (detectedRoi.x * wFactor);
            retStatus.mBoundingBoxY = (short) (detectedRoi.y * hFactor);
            retStatus.mBoundingBoxWidth = (short) (detectedRoi.width * wFactor);
            retStatus.mBoundingBoxHeight = (short) (detectedRoi.height * hFactor);
        }

        Log.i("Process RDT Time ", ""+(System.currentTimeMillis()-updateTimeSt));
    }

    private RdtAPI(RdtAPIBuilder rdtAPIBuilder) {
        this.mConfig = rdtAPIBuilder.mConfig;
        if (this.mConfig.mMappedByteBuffer != null) {
            this.mTensorFlow = new ObjectDetection(this.mConfig.mMappedByteBuffer);
        }
        if (this.mConfig.mTfliteB != null) {
            this.mTensorFlow = new ObjectDetection(this.mConfig.mTfliteB);
        }
    }

    public static class RdtAPIBuilder {
        private Config mConfig;

        public  RdtAPIBuilder(){
            mConfig = new Config();
        }

        public RdtAPIBuilder setModel(MappedByteBuffer model){
            mConfig.setmMappedByteBuffer(model);
            return this;
        }

        public RdtAPI build() {
            RdtAPI rdtAPI =  new RdtAPI(this);
            return rdtAPI;
        }

        public RdtAPIBuilder setMinBrightness(float mMinBrightness) {
            mConfig.setmMinBrightness(mMinBrightness);
            return this;
        }

        public RdtAPIBuilder setMaxBrightness(float mMaxBrightness) {
            mConfig.setmMaxBrightness(mMaxBrightness);
            return this;
        }

        public RdtAPIBuilder setMinSharpness(float mMinSharpness) {
            mConfig.setmMinSharpness(mMinSharpness);
            return this;
        }

        public RdtAPIBuilder setYMax(short mYMax) {
            mConfig.setmYMax(mYMax);
            return this;
        }

        public RdtAPIBuilder setYMin(short mYMin) {
            mConfig.setmYMin(mYMin);
            return this;
        }

        public RdtAPIBuilder setXMax(short mXMax) {
            mConfig.setmXMax(mXMax);
            return this;
        }

        public RdtAPIBuilder setXMin(short mXMin) {
            mConfig.setmXMin(mXMin);
            return this;
        }

        public RdtAPIBuilder setMinScale(short mMinScale) {
            mConfig.setmMinScale(mMinScale);
            return this;
        }

        public RdtAPIBuilder setMaxScale(short mMaxScale) {
            mConfig.setmMaxScale(mMaxScale);
            return this;
        }
    }
}
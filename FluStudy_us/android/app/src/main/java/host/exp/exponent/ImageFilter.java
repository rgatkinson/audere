// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent;

import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.util.Log;

import org.opencv.android.BaseLoaderCallback;
import org.opencv.android.LoaderCallbackInterface;
import org.opencv.android.OpenCVLoader;
import org.opencv.android.Utils;
import org.opencv.core.Core;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.MatOfDouble;
import org.opencv.core.MatOfFloat;
import org.opencv.core.MatOfInt;
import org.opencv.imgproc.Imgproc;

import java.util.Arrays;

import static java.lang.Math.pow;
import static org.opencv.core.Core.meanStdDev;
import static org.opencv.imgproc.Imgproc.Laplacian;
import static org.opencv.imgproc.Imgproc.cvtColor;

public class ImageFilter {
    private static final String TAG = "ImageFilter";

    public static double SHARPNESS_THRESHOLD = 10;
    public static double HIGH_RES_SHARPNESS_THRESHOLD = 100;
    public static double OVER_EXP_THRESHOLD = 255;
    public static double UNDER_EXP_THRESHOLD = 120;
    public static double OVER_EXP_WHITE_COUNT = 100;

    private Activity activity;
    private BaseLoaderCallback loaderCallback;
    private boolean haveOpenCv = false;

    public enum ExposureResult {
        UNDER_EXPOSED, NORMAL, OVER_EXPOSED
    }

    public enum SizeResult {
        RIGHT_SIZE, LARGE, SMALL, INVALID
    }

    public class FilterResult {
        public ExposureResult exposureResult;
        public double sharpness;
        public boolean highResImage;

        public boolean isSharp() {
            if (highResImage) {
                return sharpness > HIGH_RES_SHARPNESS_THRESHOLD;
            } else {
                return sharpness > SHARPNESS_THRESHOLD;
            }
        }

        public FilterResult(ExposureResult exposureResult, double sharpness, boolean highResImage) {
            this.exposureResult = exposureResult;
            this.sharpness = sharpness;
            this.highResImage = highResImage;
        }

        @Override
        public String toString() {
            return new StringBuilder()
                .append("AudereFilterResult")
                .append(" expose=").append(exposureResult)
                .append(" sharp=").append(sharpness)
                .append(" high=").append(highResImage)
                .append(" isSharp=").append(isSharp())
                .toString();
        }
    }

    public ImageFilter(Activity activity) {
        this.activity = activity;
        loaderCallback = new BaseLoaderCallback(activity) {
            @Override
            public void onManagerConnected(int status) {
                switch (status) {
                    case LoaderCallbackInterface.SUCCESS: {
                        Log.i(TAG, "OpenCV loaded successfully");
                        haveOpenCv = true;
                    }
                    break;
                    default: {
                        super.onManagerConnected(status);
                    }
                    break;
                }
            }
        };
    }

    public void onResume() {
        loadOpenCV(activity, loaderCallback);
    }

    public boolean ready() {
        return haveOpenCv;
    }

    public static void loadOpenCV(Context context, BaseLoaderCallback mLoaderCallback) {
        if (!OpenCVLoader.initDebug()) {
            Log.d(TAG, "Internal OpenCV library not found. Using OpenCV Manager for initialization");
            OpenCVLoader.initAsync(OpenCVLoader.OPENCV_VERSION, context, mLoaderCallback);
        } else {
            Log.d(TAG, "OpenCV library found inside package. Using it!");
            mLoaderCallback.onManagerConnected(LoaderCallbackInterface.SUCCESS);
        }
    }

    public FilterResult validateImage(Bitmap bitmap, boolean highResImage) {
        Mat inputMat = new Mat();
        Utils.bitmapToMat(bitmap, inputMat);

        // Convert the input to grayscale
        Mat greyMat = new Mat();
        cvtColor(inputMat, greyMat, Imgproc.COLOR_RGB2GRAY);

        // Check brightness
        ExposureResult exposureResult = checkBrightness(greyMat);
        Log.d(TAG, "exposure result: "  + exposureResult);

        // Check sharpness
        double sharpness = calculateSharpness(greyMat);
        Log.d(TAG, String.format("inputMat sharpness: %.2f", sharpness));

        // Release resources
        inputMat.release();
        greyMat.release();

        return new FilterResult(exposureResult, sharpness, highResImage);
    }

    private double calculateSharpness(Mat input) {
        // Compute Laplacian
        Mat laplace = new Mat();
        Laplacian(input, laplace, CvType.CV_64F);

        // Compute Laplacian's mean and stdev
        MatOfDouble median = new MatOfDouble();
        MatOfDouble std = new MatOfDouble();
        meanStdDev(laplace, median, std);

        // Release resources
        laplace.release();

        // Return squared stdev
        return pow(std.get(0,0)[0], 2);
    }
    /**
     * Determines if the input image is sufficiently exposed
     * @param inputMat: the input image
     * @return exposureResult: an ExposureResult enum value that can be {NORMAL,
     * OVER_EXPOSED, UNDER_EXPOSED}
     */
    private ExposureResult checkBrightness(Mat inputMat) {
        // Compute brightness histograms
        float[] histograms = calculateBrightness(inputMat);

        // Calculate brightest value
        int maxWhite = 0;
        for (int i = histograms.length-1; i >= 0; i--) {
            if (histograms[i] > 0) {
                maxWhite = i;
                break;
            }
        }

        // Compute amount of clipping
        float clippingCount = histograms[histograms.length-1];

        // Compare exposure to requirements
        ExposureResult exposureResult;
        if (maxWhite >= OVER_EXP_THRESHOLD && clippingCount > OVER_EXP_WHITE_COUNT) {
            exposureResult = ExposureResult.OVER_EXPOSED;
            return exposureResult;
        } else if (maxWhite < UNDER_EXP_THRESHOLD) {
            exposureResult = ExposureResult.UNDER_EXPOSED;
            return exposureResult;
        } else {
            exposureResult = ExposureResult.NORMAL;
            return exposureResult;
        }
    }

    /**
     * Computes a brightness histogram for the input image
     * @param input: the input image
     * @return mBuff: a float[] histogram with 256 elements
     */
    private float[] calculateBrightness(Mat input) {
        // Initialize variables
        int mHistSizeNum = 256;
        MatOfInt mHistSize = new MatOfInt(mHistSizeNum);
        Mat hist = new Mat();
        final float[] mBuff = new float[mHistSizeNum];
        MatOfFloat histogramRanges = new MatOfFloat(0f, 256f);
        MatOfInt mChannels[] = new MatOfInt[] { new MatOfInt(0)};
        org.opencv.core.Size sizeRgba = input.size();

        // Go through each channel, normalize the histogram, and add it to mBuff
        // TODO: this for loop is somewhat set up to handle multi-channel, but not done
        for (int ch = 0; ch < input.channels(); ch++) {
            Imgproc.calcHist(Arrays.asList(input), mChannels[ch], new Mat(), hist,
                    mHistSize, histogramRanges);
            Core.normalize(hist, hist, sizeRgba.height/2, 0, Core.NORM_INF);
            hist.get(0, 0, mBuff);
            mChannels[ch].release();
        }

        // Release resources
        mHistSize.release();
        histogramRanges.release();
        hist.release();
        return mBuff;
    }
}

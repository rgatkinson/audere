// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.tflite;

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.os.Trace;
import android.util.Log;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.tensorflow.lite.Interpreter;

/**
 * Wrapper for frozen detection models trained using the Tensorflow Object Detection API:
 * github.com/tensorflow/models/tree/master/research/object_detection
 */
public abstract class TFLiteBaseModel implements Classifier {

    private static final String TAG = "TFLiteBaseModel";

    // Float model
    private static final float IMAGE_MEAN = 128.0f;
    private static final float IMAGE_STD = 128.0f;
    // Number of threads in the java app
    private static final int NUM_THREADS = 4;
    protected boolean isModelQuantized;
    // Config values.
    protected int inputSize;
    // Pre-allocated buffers.
    protected Vector<String> labels = new Vector<String>();
    protected int[] intValues;

    protected ByteBuffer imgData;

    private Interpreter tfLite;

    private String phase;

    protected TFLiteBaseModel(
            final AssetManager assetManager,
            final String modelFilename,
            final String labelFilename,
            final int inputSize,
            final boolean isQuantized,
            final String phase)
            throws IOException {

        InputStream labelsInput = null;
        String actualFilename = labelFilename.split("file:///android_asset/")[1];
        labelsInput = assetManager.open(actualFilename);
        BufferedReader br = null;
        br = new BufferedReader(new InputStreamReader(labelsInput));
        String line;
        while ((line = br.readLine()) != null) {
            Log.w(TAG, line);
            this.labels.add(line);
        }
        br.close();

        this.inputSize = inputSize;

        try {
            this.tfLite = new Interpreter(loadModelFile(assetManager, modelFilename));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        this.isModelQuantized = isQuantized;
        // Pre-allocate buffers.
        int numBytesPerChannel;
        if (isQuantized) {
            numBytesPerChannel = 1; // Quantized
        } else {
            numBytesPerChannel = 4; // Floating point
        }
        this.imgData = ByteBuffer.allocateDirect(1 * this.inputSize * this.inputSize * 3 * numBytesPerChannel);
        this.imgData.order(ByteOrder.nativeOrder());
        this.intValues = new int[this.inputSize * this.inputSize];

        this.tfLite.setNumThreads(NUM_THREADS);
        this.phase = phase;
    }

    /** Memory-map the model file in Assets. */
    public static MappedByteBuffer loadModelFile(AssetManager assets, String modelFilename)
            throws IOException {
        AssetFileDescriptor fileDescriptor = assets.openFd(modelFilename);
        FileInputStream inputStream = new FileInputStream(fileDescriptor.getFileDescriptor());
        FileChannel fileChannel = inputStream.getChannel();
        long startOffset = fileDescriptor.getStartOffset();
        long declaredLength = fileDescriptor.getDeclaredLength();
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength);
    }

    /**
     * Initializes a native TensorFlow session for classifying images.
     *
     * @param assetManager The asset manager to be used to load assets.
     * @param modelFilename The filepath of the model GraphDef protocol buffer.
     * @param labelFilename The filepath of label file for classes.
     * @param inputSize The size of image input
     * @param isQuantized Boolean representing model is quantized or not
     */
    public static Classifier create(
            final AssetManager assetManager,
            final String modelFilename,
            final String labelFilename,
            final int inputSize,
            final boolean isQuantized,
            final String phase)
            throws IOException {
        if (phase == "phase 1") {
            return new TFLiteObjectDetectionAPIModel(assetManager, modelFilename, labelFilename,
                    inputSize, isQuantized, phase);
        } else if (phase == "phase 2") {
            return new TFLiteClassificationAPIModel(assetManager, modelFilename, labelFilename,
                    inputSize, isQuantized, phase);
        } else {
            throw new UnsupportedOperationException();
        }
    }

    @Override
    public List<Recognition> recognizeImage(final Bitmap bitmap) {
        // Log this method so that it can be analyzed with systrace.
        Trace.beginSection("recognizeImage");

        Trace.beginSection("preprocessBitmap");
        preprocessBitmap(bitmap);
        Trace.endSection(); // preprocessBitmap

        // Copy the input data into TensorFlow.
        Trace.beginSection("feed");
        Object[] inputArray = {imgData};
        Map<Integer, Object> outputMap = getOutputMap();
        Trace.endSection();

        // Run the inference call.
        Trace.beginSection("run " + phase);
        tfLite.runForMultipleInputsOutputs(inputArray, outputMap);
        Trace.endSection();

        // Show the best detections.
        // after scaling them back to the input size.
        List<Recognition> recognitions = getRecognitions();
        Trace.endSection(); // "recognizeImage"

        return recognitions;
    }

    protected boolean inRange(float number, float max, float min) {
        return number < max && number >= min;
    }

    protected abstract void preprocessBitmap(Bitmap bitmap);

    protected abstract Map<Integer, Object> getOutputMap();

    protected abstract List<Recognition> getRecognitions();

    @Override
    public void close() {}
}

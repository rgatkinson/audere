// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent.tflite;

import android.content.res.AssetManager;
import android.graphics.Bitmap;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Wrapper for frozen detection models trained using the Tensorflow Classification API:
 */
public class TFLiteClassificationAPIModel extends TFLiteBaseModel {

    private static final String TAG = "TFLiteClassificationAPIModel";

    // Number of classes
    private static final int NUM_CLASSES = 5;
    // Float model
    private static final float[] IMAGENET_MEAN = {0.485f, 0.456f, 0.406f};
    private static final float[] IMAGENET_STD = {0.229f, 0.224f, 0.225f};
    private float[][] outputScores;

    public TFLiteClassificationAPIModel(
            final AssetManager assetManager,
            final String modelFilename,
            final String labelFilename,
            final int inputSize,
            final boolean isQuantized,
            final String phase)
            throws IOException {
        super(assetManager, modelFilename, labelFilename, inputSize, isQuantized, phase);
    }

    @Override
    protected void preprocessBitmap(Bitmap bitmap) {
        // Preprocess the image data from 0-255 int to normalized float based
        // on the provided parameters.
        bitmap.getPixels(intValues, 0, bitmap.getWidth(), 0, 0, bitmap.getWidth(), bitmap.getHeight());

        // precomputed channel offsets
        int nBytes = isModelQuantized ? 1 : 4;
        int[] channelOffsets = {0, inputSize * inputSize * nBytes, 2 * inputSize * inputSize*nBytes};
        for (int i = 0, pixel = 0; i < inputSize; ++i) {
            for (int j = 0; j < inputSize; ++j) {
                int rowColOffset = pixel * nBytes;
                int pixelValue = intValues[pixel++];
                for (int k = 0, bits=16; k<3; k++, bits-=8) {
                    // tflite classifcation model converted from pytorch uses channel first format
                    int offset = channelOffsets[k] + rowColOffset;
                    if (isModelQuantized) {
                        // quantized model
                        imgData.put(offset, (byte) ((pixelValue >> bits) & 0xFF));
                    } else {
                        // float model: convert [0, 255] to [0., 1.], then normalized by ImageNet MEAN and STD
                        imgData.putFloat(offset, (((pixelValue >> bits) & 0xFF) / 255.0f- IMAGENET_MEAN[k]) / IMAGENET_STD[k]);
                    }
                }
            }
        }
    }

    @Override
    protected Map<Integer, Object> getOutputMap() {
        outputScores = new float[1][NUM_CLASSES];

        Map<Integer, Object> outputMap = new HashMap<>();
        outputMap.put(0, outputScores);
        return outputMap;
    }

    private static double[] softmax(float[] input) {
        double[] output = new double[input.length];
        double sum = 0;
        for (int i=0; i<output.length; i++) {
            output[i] = Math.exp(input[i]);
            sum += output[i];
        }
        for (int i=0; i<output.length; i++) {
            output[i] /= sum;
        }
        return output;
    }

    @Override
    protected List<Recognition> getRecognitions() {
        final List<Recognition> recognitions = new ArrayList<>(1);
        // Convert to probabilities using softmax
        double[] probabilities = softmax(outputScores[0]);
        // pred is the class idx with maximum probability
        int pred = 0;
        for (int i=1; i<probabilities.length; i++) {
            if (probabilities[pred] < probabilities[i]) {
                pred = i;
            }
        }
        recognitions.add(new Recognition(
                "0",
                labels.get(pred),
                (float)probabilities[pred],
                null));
        return recognitions;
    }
}

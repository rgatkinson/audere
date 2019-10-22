// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Bitmap.Config;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.RectF;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.media.Image;
import android.media.ImageReader;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.SystemClock;
import android.os.Trace;
import android.support.v4.app.ActivityCompat;
import android.util.AttributeSet;
import android.util.Base64;
import android.util.Log;
import android.util.Size;
import android.view.Surface;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.LinkedList;
import java.util.List;

import host.exp.exponent.customview.AutoFitTextureView;
import host.exp.exponent.env.ImageUtils;
import host.exp.exponent.tflite.Classifier;
import host.exp.exponent.tflite.TFLiteObjectDetectionAPIModel;
import host.exp.exponent.tracking.InterpretationTracker;
import host.exp.exponent.tracking.RDTTracker;

public class DetectorView extends LinearLayout implements
        ImageReader.OnImageAvailableListener,
        ActivityCompat.OnRequestPermissionsResultCallback,
        CameraController.ConnectionCallback {

    private static final String TAG = "DetectorView";

    // Configuration values for the prepackaged SSD model.
    private static final int TF_OD_API_INPUT_SIZE = 300;
    private static final boolean TF_OD_API_IS_QUANTIZED = true;
    private static final String BOX_TF_OD_API_MODEL_FILE = "detect.tflite";
    private static final String BOX_TF_OD_API_LABELS_FILE = "file:///android_asset/labelmap.txt";
    private static final String INTERPRETATION_TF_OD_API_MODEL_FILE = "phase2-detect.tflite";
    private static final String INTERPRETATION_TF_OD_API_LABELS_FILE = "file:///android_asset/phase2-labelmap.txt";

    // Minimum detection confidence to track a detection.
    private static final float BOX_MINIMUM_CONFIDENCE_TF_OD_API = 0.5f;
    private static final float INTERPRETATION_MINIMUM_CONFIDENCE_TF_OD_API = 0.2f;
    private static final boolean MAINTAIN_ASPECT = false;
    private static final Size DESIRED_PREVIEW_SIZE = new Size(640, 480);

    private static final int PERMISSIONS_REQUEST = 1;
    private static final String PERMISSION_CAMERA = Manifest.permission.CAMERA;

    private Activity activity;
    private DetectorListener detectorListener;
    private ImageFilter imageFilter;
    private AutoFitTextureView textureView;
    private CameraController cameraController;

    private Handler handler;
    private HandlerThread handlerThread;


    private Classifier boxDetector;
    private Classifier interpretationDetector;

    private RDTTracker rdtTracker;
    private InterpretationTracker interpretationTracker;
    private Runnable imageConverter;
    private Runnable postInferenceCallback;

    private Integer sensorOrientation;

    private Bitmap previewBitmap = null;
    private Bitmap boxModelBitmap = null;
    private Bitmap interpretationModelBitmap = null;

    private boolean computingDetection = false;
    private boolean isProcessingFrame = false;
    private boolean demoMode;

    private Matrix previewToModelTransform;
    private Matrix modelToPreviewTransform;

    private byte[] yBytes;
    private byte[] uBytes;
    private byte[] vBytes;
    private int[] rgbBytes = null;
    private int yRowStride;

    protected int previewWidth = 0;
    protected int previewHeight = 0;
    private int screenHeight;
    private int screenWidth;

    public DetectorView(Context context, AttributeSet attrs) {
        super(context, attrs);
        if (context instanceof Activity) {
            activity = (Activity) context;
        } else {
            throw new Error("DetectorView must be created in an activity");
        }
        inflate(context, R.layout.detector_view, this);
        textureView = findViewById(R.id.texture);
        imageFilter = new ImageFilter(activity);

        if (hasPermission()) {
            initCameraController();
        } else {
            requestPermission();
        }
    }

    public void setDetectorListener(DetectorListener listener) {
        this.detectorListener = listener;
    }

    public void setDemoMode(boolean demoMode) {
        this.demoMode = demoMode;
    }

    public void onPreviewSizeChosen(final Size size, final int rotation, boolean supportsTorchMode) {
        previewHeight = size.getHeight();
        previewWidth = size.getWidth();

        rdtTracker = new RDTTracker(activity);
        interpretationTracker = new InterpretationTracker(activity);

        int modelSize = TF_OD_API_INPUT_SIZE;
        try {
            boxDetector =
                    TFLiteObjectDetectionAPIModel.create(
                            activity.getAssets(),
                            BOX_TF_OD_API_MODEL_FILE,
                            BOX_TF_OD_API_LABELS_FILE,
                            TF_OD_API_INPUT_SIZE,
                            TF_OD_API_IS_QUANTIZED,
                            "phase 1");
        } catch (final IOException e) {
            e.printStackTrace();
            Log.e(TAG, "Exception initializing classifier!");
            Toast toast =
                    Toast.makeText(
                            activity.getApplicationContext(), "Phase 1 Detector could not be initialized", Toast.LENGTH_SHORT);
            toast.show();
        }

        try {
            interpretationDetector =
                    TFLiteObjectDetectionAPIModel.create(
                            activity.getAssets(),
                            INTERPRETATION_TF_OD_API_MODEL_FILE,
                            INTERPRETATION_TF_OD_API_LABELS_FILE,
                            TF_OD_API_INPUT_SIZE,
                            TF_OD_API_IS_QUANTIZED,
                            "phase 2");
        } catch (final IOException e) {
            e.printStackTrace();
            Log.e(TAG, "Exception initializing classifier!");
            Toast toast =
                    Toast.makeText(
                            activity.getApplicationContext(), "Phase 2 Detector could not be initialized", Toast.LENGTH_SHORT);
            toast.show();
        }

        previewWidth = size.getWidth();
        previewHeight = size.getHeight();

        sensorOrientation = rotation - getScreenOrientation();
        Log.i(TAG, "Camera orientation relative to screen canvas: " + sensorOrientation);

        Log.i(TAG, "Initializing at size " + previewWidth + ", " + previewHeight);
        previewBitmap = Bitmap.createBitmap(previewWidth, previewHeight, Config.ARGB_8888);
        boxModelBitmap = Bitmap.createBitmap(modelSize, modelSize, Config.ARGB_8888);

        previewToModelTransform =
                ImageUtils.getTransformationMatrix(
                        previewWidth, previewHeight,
                        modelSize, modelSize,
                        sensorOrientation, MAINTAIN_ASPECT);

        modelToPreviewTransform = new Matrix();
        previewToModelTransform.invert(modelToPreviewTransform);

        screenHeight = getHeight();
        screenWidth = getWidth();

        rdtTracker.setPreviewConfiguration(previewWidth, previewHeight, sensorOrientation, screenWidth, screenHeight);
        interpretationTracker.setPreviewConfiguration(previewWidth, previewHeight, sensorOrientation, screenWidth, screenHeight);
        detectorListener.onRDTCameraReady(supportsTorchMode);
    }

    protected int getScreenOrientation() {
        switch (activity.getWindowManager().getDefaultDisplay().getRotation()) {
            case Surface.ROTATION_270:
                return 270;
            case Surface.ROTATION_180:
                return 180;
            case Surface.ROTATION_90:
                return 90;
            default:
                return 0;
        }
    }

    protected void readyForNextImage() {
        if (postInferenceCallback != null) {
            postInferenceCallback.run();
        }
    }

    protected synchronized void runInBackground(final Runnable r) {
        if (handler != null) {
            handler.post(r);
        }
    }

    protected void processImage() {
        // No mutex needed as this method is not reentrant.
        if (computingDetection) {
            readyForNextImage();
            return;
        }
        computingDetection = true;

        Trace.beginSection("processImage");
        previewBitmap.setPixels(getRgbBytes(), 0, previewWidth, 0, 0, previewWidth, previewHeight);

        readyForNextImage();

        final Canvas canvas = new Canvas(boxModelBitmap);
        canvas.drawBitmap(previewBitmap, previewToModelTransform, null);

        runInBackground(
                new Runnable() {
                    @Override
                    public void run() {
                        Trace.beginSection("Running Process Image");
                        final long boxStartTimeMs = SystemClock.uptimeMillis();

                        final List<Classifier.Recognition> results = boxDetector.recognizeImage(boxModelBitmap);
                        Log.i(TAG, "Phase 1 processing time: " +  (SystemClock.uptimeMillis() - boxStartTimeMs) + "ms");

                        final List<Classifier.Recognition> mappedRecognitions = filterResults(BOX_MINIMUM_CONFIDENCE_TF_OD_API, results, true);

                        rdtTracker.trackResults(mappedRecognitions);

                        interpretationModelBitmap = rdtTracker.extractRDT(previewBitmap);

                        CaptureResult captureResult = new CaptureResult();
                        captureResult.testStripFound = interpretationModelBitmap != null;
                        captureResult.stripLocation = rdtTracker.getRdtOutline();
                        captureResult.viewportWidth = screenWidth;
                        captureResult.viewportHeight = screenHeight;

                        ImageFilter.FilterResult filterResult = null;

                        detectorListener.onRDTDetected(captureResult, interpretationTracker.getInterpretationResult(), filterResult);

                        if (interpretationModelBitmap != null) {
                            filterResult = imageFilter.validateImage(rdtTracker.getRdtBitmap());
                            if (filterResult.isSharp() && filterResult.exposureResult.equals(ImageFilter.ExposureResult.NORMAL)) {
                                final long interpretationStartTimeMs = SystemClock.uptimeMillis();
                                final List<Classifier.Recognition> phase2Results = interpretationDetector.recognizeImage(interpretationModelBitmap);

                                final List<Classifier.Recognition> phase2MappedRecognitions = filterResults(INTERPRETATION_MINIMUM_CONFIDENCE_TF_OD_API, phase2Results, false);
                                interpretationTracker.trackResults(phase2MappedRecognitions);
                                Log.i(TAG, "Phase 2 processing time: " +  (SystemClock.uptimeMillis() - interpretationStartTimeMs) + "ms");
                                detectorListener.onRDTDetected(captureResult, interpretationTracker.getInterpretationResult(), filterResult);
                            }

                        }

                        if (interpretationTracker.shouldSendResults()) {
                            // This is expensive, only do base64 encoding once
                            captureResult.image = getBase64Encoding(previewBitmap);
                            detectorListener.onRDTDetected(
                                    captureResult,
                                    interpretationTracker.getInterpretationResult(),
                                    filterResult);
                        }

                        computingDetection = false;
                        Trace.endSection();
                    }

                    private List<Classifier.Recognition> filterResults(
                            float minimumConfidence, List<Classifier.Recognition> results, boolean toPreviewTransform) {
                        final List<Classifier.Recognition> mappedRecognitions = new LinkedList<Classifier.Recognition>();
                        for (final Classifier.Recognition result : results) {
                            final RectF location = result.getLocation();
                            if (location != null && result.getConfidence() >= minimumConfidence) {

                                if (toPreviewTransform) {
                                    modelToPreviewTransform.mapRect(location);
                                    result.setLocation(location);
                                }
                                mappedRecognitions.add(result);
                            }
                        }
                        return mappedRecognitions;
                    }
                });
        Trace.endSection();
    }

    private String getBase64Encoding(Bitmap bitmap) {
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
        byte[] byteArray = byteArrayOutputStream .toByteArray();
        return Base64.encodeToString(byteArray, Base64.DEFAULT);
    }

    public Size getDesiredPreviewFrameSize() {
        return DESIRED_PREVIEW_SIZE;
    }

    protected int[] getRgbBytes() {
        imageConverter.run();
        return rgbBytes;
    }

    /**
     * Callback for Camera2 API
     */
    @Override
    public void onImageAvailable(final ImageReader reader) {
        // We need to wait until we have some size from onPreviewSizeChosen
        if (previewWidth == 0 || previewHeight == 0) {
            return;
        }

        if (!imageFilter.ready()) {
            return;
        }

        if (rgbBytes == null) {
            rgbBytes = new int[previewWidth * previewHeight];
        }

        try {
            final Image image = reader.acquireLatestImage();

            if (image == null) {
                return;
            }

            if (isProcessingFrame) {
                image.close();
                return;
            }

            isProcessingFrame = true;

            Trace.beginSection("imageAvailable");

            final Image.Plane[] planes = image.getPlanes();
            fillBytes(planes);
            yRowStride = planes[0].getRowStride();
            final int uvRowStride = planes[1].getRowStride();
            final int uvPixelStride = planes[1].getPixelStride();

            imageConverter =
                    new Runnable() {
                        @Override
                        public void run() {
                            ImageUtils.convertYUV420ToARGB8888(
                                    yBytes,
                                    uBytes,
                                    vBytes,
                                    previewWidth,
                                    previewHeight,
                                    yRowStride,
                                    uvRowStride,
                                    uvPixelStride,
                                    rgbBytes);
                        }
                    };

            postInferenceCallback =
                    new Runnable() {
                        @Override
                        public void run() {
                            image.close();
                            isProcessingFrame = false;
                        }
                    };

            processImage();
        } catch (final Exception e) {
            Log.e(TAG, "Exception in onImageAvailable: " + e.toString());
            Trace.endSection();
            return;
        }
        Trace.endSection();
    }

    protected void fillBytes(final Image.Plane[] planes) {
        ByteBuffer yBuffer = planes[0].getBuffer();
        ByteBuffer uBuffer = planes[1].getBuffer();
        ByteBuffer vBuffer = planes[2].getBuffer();

        if (yBytes == null) {
            yBytes = new byte[yBuffer.capacity()];
        }
        if (uBytes == null) {
            uBytes = new byte[uBuffer.capacity()];
        }
        if (vBytes == null) {
            vBytes = new byte[vBuffer.capacity()];
        }
        yBuffer.get(yBytes);
        uBuffer.get(uBytes);
        vBuffer.get(vBytes);
    }

    private String chooseCamera() {
        final CameraManager manager = (CameraManager) activity.getSystemService(Context.CAMERA_SERVICE);
        try {
            for (final String cameraId : manager.getCameraIdList()) {
                final CameraCharacteristics characteristics = manager.getCameraCharacteristics(cameraId);

                // We don't use a front facing camera in this sample.
                final Integer facing = characteristics.get(CameraCharacteristics.LENS_FACING);
                if (facing != null && facing == CameraCharacteristics.LENS_FACING_FRONT) {
                    continue;
                }

                final StreamConfigurationMap map =
                        characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP);

                if (map == null) {
                    continue;
                }

                return cameraId;
            }
        } catch (CameraAccessException e) {
            Log.e(TAG, "Not allowed to access camera");
        }

        return null;
    }

    private boolean hasPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return activity.checkSelfPermission(PERMISSION_CAMERA) == PackageManager.PERMISSION_GRANTED;
        } else {
            return true;
        }
    }

    private void requestPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (activity.shouldShowRequestPermissionRationale(PERMISSION_CAMERA)) {
                Toast.makeText(
                        activity,
                        "Camera permission is required for this demo",
                        Toast.LENGTH_LONG)
                        .show();
            }
            activity.requestPermissions(new String[]{PERMISSION_CAMERA}, PERMISSIONS_REQUEST);
        }
    }

    protected void initCameraController() {
        String cameraId = chooseCamera();
        cameraController = new CameraController(
                activity,
                textureView,
                this,
                this,
                getDesiredPreviewFrameSize());

        cameraController.setCamera(cameraId);
    }

    public synchronized void onResume() {
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        imageFilter.onResume();
        handlerThread = new HandlerThread("inference");
        handlerThread.start();
        handler = new Handler(handlerThread.getLooper());
        if (cameraController != null) {
            cameraController.onResume();
        }
    }

    public synchronized void onPause() {
        if (cameraController != null) {
            cameraController.onPause();
        }
        handlerThread.quitSafely();
        try {
            handlerThread.join();
            handlerThread = null;
            handler = null;
        } catch (final InterruptedException e) {
            Log.e(TAG, "Exception in onPause: " + e.toString());
        }
    }

    @Override
    public void onRequestPermissionsResult(
            final int requestCode, final String[] permissions, final int[] grantResults) {
        Log.i(TAG, "onrequest permission result");
        if (requestCode == PERMISSIONS_REQUEST) {
            if (grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED
                    && grantResults[1] == PackageManager.PERMISSION_GRANTED) {
                initCameraController();
            } else {
                requestPermission();
            }
        }
    }

    public void setFlashEnabled(boolean flashEnabled) {
        if (cameraController != null) {
            cameraController.setFlashEnabled(flashEnabled);
        }
    }

    public class CaptureResult {
        public boolean testStripFound;
        public String image;
        public String windowImage;
        public float[] stripLocation;
        public int viewportWidth;
        public int viewportHeight;
    }

    public static class InterpretationResult {
        public boolean control;
        public boolean testA;
        public boolean testB;
        public int samples;
        public int requiredSamples;
    }

    public interface DetectorListener {
        void onRDTCameraReady(boolean supportsTorchMode);
        void onRDTDetected(
                CaptureResult captureResult,
                InterpretationResult interpretationResult,
                ImageFilter.FilterResult filterResult
        );
    }
}

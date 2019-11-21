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
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.SystemClock;
import android.os.Trace;
import android.support.v4.app.ActivityCompat;
import android.util.AttributeSet;
import android.util.Log;
import android.util.Size;
import android.view.Surface;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.Toast;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
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
    private static final String IPRD_MODEL_FILE = "iprd.tflite";

    // Minimum detection confidence to track a detection.
    private static final float BOX_MINIMUM_CONFIDENCE_TF_OD_API = 0.5f;
    private static final float INTERPRETATION_MINIMUM_CONFIDENCE_TF_OD_API = 0.2f;
    private static final boolean MAINTAIN_ASPECT = false;
    private static final Size DESIRED_PREVIEW_SIZE = new Size(480, 640);

    private static final int PERMISSIONS_REQUEST = 1;
    private static final String PERMISSION_CAMERA = Manifest.permission.CAMERA;

    private static final String RDT_PHOTO_FILE_NAME = "rdt_photo.jpg";

    private Activity activity;
    private DetectorListener detectorListener;
    private ImageFilter imageFilter;
    private AutoFitTextureView textureView;
    private CameraController cameraController;

    private Handler handler;
    private HandlerThread handlerThread;

    private Classifier boxDetector;
    private Classifier interpretationDetector;

    protected Size previewSize;
    protected Size stillSize;
    private Integer sensorOrientation;
    private int screenHeight;
    private int screenWidth;

    private volatile boolean stillCaptureInProgress = false;

    private IprdAdapter.RdtApi iprdApi;

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

        // TODO: move this to background thread and check that it's ready where needed

        try {
            MappedByteBuffer iprdModel = TFLiteObjectDetectionAPIModel.loadModelFile(
                activity.getAssets(),
                IPRD_MODEL_FILE
            );
            this.iprdApi = IprdAdapter.RdtApi.builder()
                .setModel(iprdModel)
                .build();
        } catch (IOException e) {
            e.printStackTrace();
            Log.e(TAG, "Exception initializing filter: " + e.toString());
            Toast.makeText(
                activity.getApplicationContext(),
                "IPRD filter could not be initialized",
                Toast.LENGTH_SHORT
            ).show();
        }

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

        if (hasPermission()) {
            initCameraController();
        } else {
            requestPermission();
        }
    }

    public void setDetectorListener(DetectorListener listener) {
        this.detectorListener = listener;
    }

    public void onPreviewSizeChosen(final Size previewSize, final Size stillSize, final int rotation, boolean supportsTorchMode) {
        this.previewSize = previewSize;
        this.stillSize = stillSize;

        sensorOrientation = rotation - getScreenOrientation();
        screenHeight = getHeight();
        screenWidth = getWidth();

        Log.i(TAG, "Camera orientation relative to screen canvas: " + sensorOrientation);
        Log.i(TAG, "Initializing at preview size " + previewSize.getWidth() + ", " + previewSize.getHeight());
        Log.i(TAG, "Initializing at still size " + stillSize.getWidth() + ", " + stillSize.getHeight());

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

    protected synchronized void runInBackground(final Runnable r) {
        if (handler != null) {
            handler.post(r);
        }
    }

    public Size getDesiredPreviewFrameSize() {
        return DESIRED_PREVIEW_SIZE;
    }

    private abstract class ImageListener implements ImageReader.OnImageAvailableListener {
        private Runnable imageConverter;
        private Runnable postInferenceCallback;
        private RDTTracker rdtTracker;

        private boolean isProcessingFrame = false;
        private volatile boolean analyzingFrame = false;

        private byte[] yBytes;
        private byte[] uBytes;
        private byte[] vBytes;

        private int[] rgbBytes = null;

        private Bitmap boxModelBitmap = null;
        private Matrix imageToModelTransform;
        private Matrix modelToImageTransform;

        protected Bitmap imageBitmap = null;
        protected int imageWidth;
        protected int imageHeight;

        private boolean initialized = false;

        private int[] getRgbBytes() {
            imageConverter.run();
            return rgbBytes;
        }

        private void readyForNextImage() {
            if (postInferenceCallback != null) {
                postInferenceCallback.run();
            }
        }

        private void fillBytes(final Image.Plane[] planes) {
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


        private void updateBitmaps() {
            imageBitmap.setPixels(getRgbBytes(), 0, imageWidth, 0, 0, imageWidth, imageHeight);
            final Canvas canvas = new Canvas(boxModelBitmap);
            canvas.drawBitmap(imageBitmap, imageToModelTransform, null);
            readyForNextImage();
        }

        protected void initialize() {
            imageBitmap = Bitmap.createBitmap(imageWidth, imageHeight, Config.ARGB_8888);
            boxModelBitmap = Bitmap.createBitmap(TF_OD_API_INPUT_SIZE, TF_OD_API_INPUT_SIZE, Config.ARGB_8888);

            imageToModelTransform =
                    ImageUtils.getTransformationMatrix(
                            imageWidth, imageHeight,
                            TF_OD_API_INPUT_SIZE, TF_OD_API_INPUT_SIZE,
                            sensorOrientation, MAINTAIN_ASPECT);

            modelToImageTransform = new Matrix();
            imageToModelTransform.invert(modelToImageTransform);
            rdtTracker = new RDTTracker(activity, imageWidth, imageHeight, sensorOrientation, screenWidth, screenHeight);
            if (rgbBytes == null) {
                rgbBytes = new int[imageWidth * imageHeight];
            }
            initialized = true;
        }

        @Override
        public void onImageAvailable(ImageReader reader) {
            // We need to wait until we have some size from onPreviewSizeChosen
            if (previewSize == null || stillSize == null) {
                return;
            }

            if (!initialized) {
                initialize();
            }

            if (!imageFilter.ready()) {
                return;
            }

            if (isProcessingFrame) {
                return;
            }

            try {
                final Image image = reader.acquireLatestImage();

                if (image == null) {
                    return;
                }

                isProcessingFrame = true;

                Trace.beginSection("ImageAvailable");

                final Image.Plane[] planes = image.getPlanes();
                fillBytes(planes);

                imageConverter =
                        new Runnable() {
                            @Override
                            public void run() {
                                ImageUtils.convertYUV420ToARGB8888(
                                        yBytes,
                                        uBytes,
                                        vBytes,
                                        imageWidth,
                                        imageHeight,
                                        planes[0].getRowStride(),
                                        planes[1].getRowStride(),
                                        planes[1].getPixelStride(),
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
                Log.e(TAG, "Exception in preview onImageAvailable: " + e.toString());
            } finally {
                Trace.endSection(); // ImageAvailable
            }
        }

        private void processImage() {
            // No mutex needed as this method is not reentrant.
            if (analyzingFrame) {
                readyForNextImage();
                return;
            }
            Log.d(TAG, ImageListener.this.getClass().getSimpleName() + "analyizingFrame = true");
            analyzingFrame = true;

            Trace.beginSection("processImage");

            updateBitmaps();

            runInBackground(
                    new Runnable() {
                        @Override
                        public void run() {
                            try {
                                IprdAdapter.FrameResult iprdResult = checkIPRDFilter(boxModelBitmap);
                                Log.d(TAG, ImageListener.this.getClass().getSimpleName() + " iprdResult=" + iprdResult);
                                if (iprdResult == null || iprdResult.isAccepted()) {
                                    // Local interpretation prototype
                                    Trace.beginSection("Running Process Image");
                                    final long boxStartTimeMs = SystemClock.uptimeMillis();

                                    final List<Classifier.Recognition> results = boxDetector.recognizeImage(boxModelBitmap);
                                    Log.i(TAG, "Phase 1 processing time: " + (SystemClock.uptimeMillis() - boxStartTimeMs) + "ms");

                                    final List<Classifier.Recognition> mappedRecognitions = filterResults(BOX_MINIMUM_CONFIDENCE_TF_OD_API, results, true);

                                    RDTTracker.RDTResult rdtResult = rdtTracker.extractRDT(mappedRecognitions, imageBitmap);

                                    CaptureResult captureResult = new CaptureResult(rdtResult.testArea != null, rdtResult.rdtOutline);

                                    processResult(iprdResult, captureResult, rdtResult);

                                    Trace.endSection(); // Running Process Image
                                }
                            } finally {
                                Log.d(TAG, ImageListener.this.getClass().getSimpleName() + " analyzingFrame = false");
                                analyzingFrame = false;
                            }
                        }
                    });
            Trace.endSection(); // processPreviewImage
        }

        protected abstract IprdAdapter.FrameResult checkIPRDFilter(Bitmap bitmap);

        protected abstract void processResult(
            IprdAdapter.FrameResult iprdResult,
            CaptureResult captureResult,
            RDTTracker.RDTResult rdtResult
        );

        protected List<Classifier.Recognition> filterResults(
                float minimumConfidence, List<Classifier.Recognition> results, boolean toPreviewTransform) {
            final List<Classifier.Recognition> mappedRecognitions = new LinkedList<Classifier.Recognition>();
            for (final Classifier.Recognition result : results) {
                final RectF location = result.getLocation();
                if (location != null && result.getConfidence() >= minimumConfidence) {

                    if (toPreviewTransform) {
                        modelToImageTransform.mapRect(location);
                        result.setLocation(location);
                    }
                    mappedRecognitions.add(result);
                }
            }
            return mappedRecognitions;
        }

        protected String saveImage() {
            File photo = new File(activity.getFilesDir(), RDT_PHOTO_FILE_NAME);

            if (photo.exists()) {
                photo.delete();
            }

            try (BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(photo.getPath()))) {
                imageBitmap.compress(Bitmap.CompressFormat.JPEG, 100, bos);
                return Uri.fromFile(new File(photo.getPath())).toString();
            } catch (java.io.IOException e) {
                Log.e(TAG, "Exception in saveImage", e);
                return null;
            }
        }
    }

    private class PreviewImageListener extends ImageListener {

        protected void initialize() {
            imageWidth = previewSize.getWidth();
            imageHeight = previewSize.getHeight();
            super.initialize();
        }

        @Override
        protected IprdAdapter.FrameResult checkIPRDFilter(Bitmap bitmap) {
            final long iprdStartTimeMs = SystemClock.uptimeMillis();
            Trace.beginSection("IPRD Filter");
            IprdAdapter.FrameResult iprdResult = iprdApi == null
                ? null
                : iprdApi.checkFrame(bitmap);
            Trace.endSection();
            Log.i(TAG, "IPRD processing time: " + (SystemClock.uptimeMillis() - iprdStartTimeMs) + "ms");
            Log.i(TAG, "  IPRD " + IprdAdapter.FrameResult.str(iprdResult));

            return iprdResult;
        }

        protected void processResult(
            IprdAdapter.FrameResult iprdResult,
            CaptureResult captureResult,
            RDTTracker.RDTResult rdtResult
        ) {
            ImageFilter.FilterResult filterResult = null;
            Log.d(TAG, "Preview rdtResult: " + rdtResult);

            if ((iprdResult == null || iprdResult.isAccepted()) && rdtResult.testArea != null) {
                filterResult = imageFilter.validateImage(rdtResult.rdtStrip, false);
                Log.d(TAG, "Preview filter(rdtResult.rdtStrip): " + filterResult);
                Log.d(TAG, "  stillCaptureInProgress=" + stillCaptureInProgress);
                if (!stillCaptureInProgress && filterResult.isSharp() && filterResult.exposureResult.equals(ImageFilter.ExposureResult.NORMAL)) {
                    Log.d(TAG, "Have good preview frame, making single request");
                    stillCaptureInProgress = true;
                    cameraController.captureStill();
                }
            } else {
                filterResult = imageFilter.validateImage(imageBitmap, false);
                Log.d(TAG, "Preview filter(imageBitmap) " + filterResult);
            }

            detectorListener.onRDTDetected(iprdResult, captureResult, null, filterResult);
        }
    }

    private class StillImageListener extends ImageListener {
        protected void initialize() {
            imageWidth = stillSize.getWidth();
            imageHeight = stillSize.getHeight();
            super.initialize();
        }

        @Override
        protected IprdAdapter.FrameResult checkIPRDFilter(Bitmap bitmap) {
            return null;
        }

        @Override
        protected void processResult(
            IprdAdapter.FrameResult iprdResult,
            CaptureResult captureResult,
            RDTTracker.RDTResult rdtResult
        ) {
            Log.d(TAG, "Still rdtResult: " + rdtResult);
            if ((iprdResult == null || iprdResult.isAccepted()) && rdtResult.testArea != null) {

                ImageFilter.FilterResult filterResult = imageFilter.validateImage(rdtResult.rdtStrip, true);
                Log.d(TAG, "Still filter(rdtResult.rdtStrip): " + filterResult);

                if (filterResult.isSharp() && filterResult.exposureResult.equals(ImageFilter.ExposureResult.NORMAL)) {

                    Log.d(TAG, "Have good still frame, running inference");

                    detectorListener.onRDTInterpreting();
                    final long interpretationStartTimeMs = SystemClock.uptimeMillis();

                    InterpretationResult interpretationResult = InterpretationTracker.interpretResults(filterResults(
                            INTERPRETATION_MINIMUM_CONFIDENCE_TF_OD_API,
                            interpretationDetector.recognizeImage(rdtResult.testArea),
                            false));

                    Log.i(TAG, "Phase 2 processing time: " + (SystemClock.uptimeMillis() - interpretationStartTimeMs) + "ms");

                    captureResult.imageUri = saveImage();

                    if (captureResult.imageUri != null) {
                        cameraController.onPause();
                        detectorListener.onRDTDetected(iprdResult, captureResult, interpretationResult, filterResult);

                    } else {
                        Log.d(TAG, "Error saving image, will try again");
                    }
                } else {
                    Log.d(TAG, "Still frame didn't pass filter");
                }
            } else {
                Log.d(TAG, "Still frame didn't have rdt test area");
            }
            stillCaptureInProgress = false;
        }
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
                new PreviewImageListener(),
                new StillImageListener(),
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
        handlerThread = null;
        handler = null;
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
        public final boolean testStripFound;
        public final float[] stripLocation;
        public final int viewportWidth;
        public final int viewportHeight;

        public String imageUri;

        public CaptureResult(boolean testStripFound, float[] stripLocation) {
            this.testStripFound = testStripFound;
            this.stripLocation = stripLocation;
            this.viewportWidth = screenWidth;
            this.viewportHeight = screenHeight;
        }
    }

    public static class InterpretationResult {
        public boolean control;
        public boolean testA;
        public boolean testB;

        public String toString() {
            return "control: " + control + ", testA: " + testA + ", testB: " + testB;
        }
    }

    public interface DetectorListener {
        void onRDTCameraReady(boolean supportsTorchMode);
        void onRDTDetected(
            IprdAdapter.FrameResult iprdResult,
            CaptureResult captureResult,
            InterpretationResult interpretationResult,
            ImageFilter.FilterResult filterResult
        );
        void onRDTInterpreting();
    }
}

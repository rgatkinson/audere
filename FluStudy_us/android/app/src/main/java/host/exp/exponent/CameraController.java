// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent;

import android.app.Activity;
import android.content.Context;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.text.TextUtils;
import android.util.Log;
import android.util.Size;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import host.exp.exponent.customview.AutoFitTextureView;

public abstract class CameraController {
    private static final String TAG = "CameraController";
    protected final Activity activity;
    protected boolean flashEnabled;

    /**
     * The camera preview size will be chosen to be the smallest frame by pixel size capable of
     * containing a DESIRED_SIZE x DESIRED_SIZE square.
     */
    private static final int MINIMUM_PREVIEW_SIZE = 320;

    /** ID of the current camera device. */
    protected final String cameraId;
    /** An {@link AutoFitTextureView} for camera preview. */
    protected final AutoFitTextureView textureView;
    protected final ConnectionCallback cameraConnectionCallback;
    protected final Size desiredSize;

    /** An ImageListener that handles preview frame capture. */
    protected final DetectorView.PreviewImageListener imageListener;
    /** An ImageListener that handles stills. */
    protected final DetectorView.StillImageListener stillImageListener;

    protected CameraController(final Activity activity,
                                 final AutoFitTextureView textureView,
                                 final ConnectionCallback callback,
                                 final DetectorView.PreviewImageListener imageListener,
                                 final DetectorView.StillImageListener stillImageListener,
                                 final Size desiredSize,
                                 final String cameraId) {
        this.activity = activity;
        this.textureView = textureView;
        this.cameraConnectionCallback = callback;
        this.imageListener = imageListener;
        this.stillImageListener = stillImageListener;
        this.desiredSize = desiredSize;
        this.cameraId = cameraId;
    }

    public abstract void onResume();

    public abstract void onPause();

    public abstract void captureStill();

    public abstract void setFlashEnabled(boolean flashEnabled);

    public static CameraController getCamera(final Activity activity,
                                               final AutoFitTextureView textureView,
                                               final ConnectionCallback callback,
                                               final DetectorView.PreviewImageListener imageListener,
                                               final DetectorView.StillImageListener stillImageListener,
                                               final Size desiredSize) {

        boolean useCamera2API = false;
        String selectedCameraID = null;

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

                useCamera2API =
                        (facing == CameraCharacteristics.LENS_FACING_EXTERNAL)
                                || isHardwareLevelSupported(
                                characteristics, CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_FULL);

                selectedCameraID = cameraId;
                break;
            }

            if (useCamera2API) {
                return new CameraApi2Controller(activity, textureView, callback, imageListener,
                        stillImageListener, desiredSize, selectedCameraID);
            } else {
                return new CameraApiLegacyController(activity, textureView, callback, imageListener,
                        stillImageListener, desiredSize, selectedCameraID);
            }
        } catch (CameraAccessException e) {
            Log.e(TAG, "Not allowed to access camera");
        }
        return null;
    }

    // Returns true if the device supports the required hardware level, or better.
    private static boolean isHardwareLevelSupported(CameraCharacteristics c, int requiredLevel) {
        final int[] sortedHwLevels = {
                CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY,
                CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_EXTERNAL,
                CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LIMITED,
                CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_FULL,
                CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_3
        };
        int deviceLevel = c.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL);
        Log.d(TAG, "Device hardware supported level: " + deviceLevel);
        Log.d(TAG, "All levels: " + Arrays.toString(sortedHwLevels));
        if (requiredLevel == deviceLevel) {
            return true;
        }

        for (int sortedlevel : sortedHwLevels) {
            if (sortedlevel == requiredLevel) {
                return true;
            } else if (sortedlevel == deviceLevel) {
                return false;
            }
        }
        return false; // Should never reach here
    }

    /**
     * Callback for Activities to use to initialize their data once the selected preview size is
     * known.
     */
    public interface ConnectionCallback {
        void onPreviewSizeChosen(Size previewSize, Size stillSize, int cameraRotation, boolean supportsTorchMode);
    }

    /**
     * Given {@code choices} of {@code Size}s supported by a camera, chooses the smallest one whose
     * width and height are at least as large as the minimum of both, or an exact match if possible.
     *
     * @param choices The list of sizes that the camera supports for the intended output class
     * @param desiredSize The minimum desired Size
     * @return The optimal {@code Size}, or an arbitrary one if none were big enough
     */
    protected static Size chooseOptimalSize(final Size[] choices, Size desiredSize) {
        final int minSize = Math.max(Math.min(desiredSize.getWidth(), desiredSize.getHeight()),
                MINIMUM_PREVIEW_SIZE);

        // Collect the supported resolutions that are at least as big as the preview Surface
        boolean exactSizeFound = false;
        final List<Size> bigEnough = new ArrayList<Size>();
        final List<Size> tooSmall = new ArrayList<Size>();
        for (final Size option : choices) {
            if (option.equals(desiredSize)) {
                // Set the size but don't return yet so that remaining sizes will still be logged.
                exactSizeFound = true;
            }

            if (option.getHeight() >= minSize && option.getWidth() >= minSize) {
                bigEnough.add(option);
            } else {
                tooSmall.add(option);
            }
        }

        Log.i(TAG, "Desired size: " + desiredSize + ", min size: " + minSize + "x" + minSize);
        Log.i(TAG, TextUtils.join(", ", bigEnough) + "]");
        Log.i(TAG, "Rejected preview sizes: [" + TextUtils.join(", ", tooSmall) + "]");

        if (exactSizeFound) {
            Log.i(TAG, "Matched exact size.");
            return desiredSize;
        }

        if (bigEnough.size() == 0) {
            Log.e(
                    TAG,
                    "No preview size large enough, using "
                            + choices[0].getWidth() + "x" + choices[0].getHeight()
            );
            return choices[0];
        }

        // In general we will want the smallest size
        Collections.sort(bigEnough, new CompareSizesByArea());

        // First try to find one that matches aspect ratio
        for (final Size option : bigEnough) {
            if (option.getHeight() * desiredSize.getWidth() == option.getWidth() * desiredSize.getHeight()) {
                Log.i(TAG, "Matched aspect ratio: " + option.getWidth() + "x" + option.getHeight());
                return option;
            }
        }

        // Second try to find one that matches reversed aspect ratio
        for (final Size option : bigEnough) {
            if (option.getHeight() * desiredSize.getHeight() == option.getWidth() * desiredSize.getWidth()) {
                Log.i(TAG, "Matched inverse aspect ratio: " + option.getWidth() + "x" + option.getHeight());
                return option;
            }
        }

        Size chosen = bigEnough.get(0);
        Log.w(
                TAG,
                "Large enough, but could not match aspect ratio, using "
                        + chosen.getWidth() + "x" + chosen.getHeight()
        );
        return chosen;
    }


    /** Compares two {@code Size}s based on their areas. */
    static class CompareSizesByArea implements Comparator<Size> {
        @Override
        public int compare(final Size lhs, final Size rhs) {
            // We cast here to ensure the multiplications won't overflow
            return Long.signum(
                    (long) lhs.getWidth() * lhs.getHeight() - (long) rhs.getWidth() * rhs.getHeight());
        }
    }
}

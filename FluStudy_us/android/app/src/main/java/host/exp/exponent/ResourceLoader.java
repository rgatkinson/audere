package host.exp.exponent;

import android.content.Context;
import android.content.res.AssetManager;
import android.util.Log;
import android.widget.Toast;

import org.opencv.android.BaseLoaderCallback;
import org.opencv.android.LoaderCallbackInterface;
import org.opencv.android.OpenCVLoader;

import java.io.IOException;

import host.exp.exponent.tflite.Classifier;
import host.exp.exponent.tflite.TFLiteBaseModel;

public class ResourceLoader {
    public static final String TAG = "ResourceLoader";

    private AssetManager assetManager;
    private Context applicationContext;
    private BaseLoaderCallback openCvLoaderCallback;
    private boolean haveOpenCv = false;

    // Configuration values for the prepackaged SSD model.
    private static final String BOX_TF_OD_API_MODEL_FILE = "detect.tflite";
    private static final String BOX_TF_OD_API_LABELS_FILE = "file:///android_asset/labelmap.txt";
    private static final boolean BOX_TF_OD_API_MODEL_IS_QUANTIZED = true;
    private static final String INTERPRETATION_TF_OD_API_MODEL_FILE = "phase2-classify.tflite";
    private static final String INTERPRETATION_TF_OD_API_LABELS_FILE = "file:///android_asset/phase2-labelmap.txt";
    private static final boolean INTERPRETATION_TF_OD_API_MODEL_IS_QUANTIZED = false;
    private static final int TF_OD_API_INPUT_SIZE = 300;

    public ResourceLoader(Context context, final AssetManager assetManager) {
        applicationContext = context.getApplicationContext();
        this.assetManager = assetManager;
        openCvLoaderCallback = new BaseLoaderCallback(applicationContext) {
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
        loadOpenCV(applicationContext, openCvLoaderCallback);
    }

    private static void loadOpenCV(Context context, BaseLoaderCallback mLoaderCallback) {
        if (!OpenCVLoader.initDebug()) {
            Log.d(TAG, "Internal OpenCV library not found. Using OpenCV Manager for initialization");
            OpenCVLoader.initAsync(OpenCVLoader.OPENCV_VERSION, context, mLoaderCallback);
        } else {
            Log.d(TAG, "OpenCV library found inside package. Using it!");
            mLoaderCallback.onManagerConnected(LoaderCallbackInterface.SUCCESS);
        }
    }

    public boolean openCVReady() {
        return haveOpenCv;
    }

    public Classifier loadPhase1Detector() {
        try {
            return TFLiteBaseModel.create(
                    assetManager,
                    BOX_TF_OD_API_MODEL_FILE,
                    BOX_TF_OD_API_LABELS_FILE,
                    TF_OD_API_INPUT_SIZE,
                    BOX_TF_OD_API_MODEL_IS_QUANTIZED,
                    "phase 1");
        } catch (final IOException e) {
            e.printStackTrace();
            Log.e(TAG, "Exception initializing classifier!");
            Toast toast = Toast.makeText(
                    applicationContext, "Phase 1 Detector could not be initialized", Toast.LENGTH_SHORT);
            toast.show();
        }
        return null;
    }

    public Classifier loadPhase2Detector() {
        try {
            return TFLiteBaseModel.create(
                    assetManager,
                    INTERPRETATION_TF_OD_API_MODEL_FILE,
                    INTERPRETATION_TF_OD_API_LABELS_FILE,
                    TF_OD_API_INPUT_SIZE,
                    INTERPRETATION_TF_OD_API_MODEL_IS_QUANTIZED,
                    "phase 2");
        } catch (final IOException e) {
            e.printStackTrace();
            Log.e(TAG, "Exception initializing classifier!");
            Toast toast = Toast.makeText(
                    applicationContext, "Phase 2 Detector could not be initialized", Toast.LENGTH_SHORT);
            toast.show();
        }
        return null;
    }
}

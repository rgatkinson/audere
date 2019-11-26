// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent;

import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.util.Log;
import android.widget.Toast;

import com.iprd.rdtcamera.AcceptanceStatus;
import com.iprd.rdtcamera.RdtAPI;

import org.opencv.android.BaseLoaderCallback;
import org.opencv.android.LoaderCallbackInterface;
import org.opencv.android.OpenCVLoader;

import java.io.IOException;
import java.nio.MappedByteBuffer;

import host.exp.exponent.tflite.TFLiteObjectDetectionAPIModel;

public class IprdAdapter {

  public static final String TAG = "IprdAdapter";
  private static final String IPRD_MODEL_FILE = "iprd.tflite";

  private Activity activity;
  private BaseLoaderCallback loaderCallback;
  private boolean haveOpenCv = false;
  private RdtAPI iprdApi;

  public IprdAdapter(Activity activity) {
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

    try {
      MappedByteBuffer iprdModel = TFLiteObjectDetectionAPIModel.loadModelFile(
              activity.getAssets(),
              IPRD_MODEL_FILE
      );
      this.iprdApi = builder().setModel(iprdModel).build();
    } catch (IOException e) {
      e.printStackTrace();
      Log.e(TAG, "Exception initializing filter: " + e.toString());
      Toast.makeText(
              activity.getApplicationContext(),
              "IPRD filter could not be initialized",
              Toast.LENGTH_SHORT
      ).show();
    }
  }

  public void onResume() {
    loadOpenCV(activity, loaderCallback);
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

  public boolean ready() {
    return haveOpenCv;
  }

  public Result isSteady(Bitmap frame) {
    return new Result(iprdApi.isSteady(frame));
  }

  public void checkFrame(Bitmap frame, Result iprdResult) {
    FrameResult frameResult = new FrameResult(this.iprdApi.checkFrame(frame));
    iprdResult.rdtFound = frameResult.foundRDT;
    iprdResult.isSharp = frameResult.sharpness == AcceptanceStatus.GOOD;
    iprdResult.exposureResult = Result.getExposureResult((short) frameResult.brightness);
  }

  private static Builder builder() {
    return new Builder();
  }

  public static class Builder {
    private RdtAPI.RdtAPIBuilder iprdBuilder;

    private Builder() {
      iprdBuilder = new RdtAPI.RdtAPIBuilder();
      iprdBuilder.setMaxScale((short) 100);
      iprdBuilder.setMinScale((short) 0);
      iprdBuilder.setXMin((short) 0);
      iprdBuilder.setXMax((short) 100);
      iprdBuilder.setYMin((short) 0);
      iprdBuilder.setXMax((short) 100);
    }

    public RdtAPI build() {
      return this.iprdBuilder.build();
    }

    public Builder setModel(MappedByteBuffer model) {
      this.iprdBuilder.setModel(model);
      return this;
    }
  }

  public enum ExposureResult {
    UNDER_EXPOSED, NORMAL, OVER_EXPOSED, NOT_CALCULATED;
  }

  public static class Result {
    private boolean isSteady;
    private boolean rdtFound;
    private boolean isSharp;
    private ExposureResult exposureResult;

    private Result(boolean isSteady) {
      this.isSteady = isSteady;
      this.rdtFound = false;
      this.isSharp = false;
      this.exposureResult = ExposureResult.NOT_CALCULATED;
    }

    public boolean isSteady() {
      return isSteady;
    }

    public boolean rdtFound() {
      return rdtFound;
    }

    public boolean isSharp() {
      return isSharp;
    }

    public ExposureResult exposureResult() {
      return exposureResult;
    }

    public boolean isAccepted() {
      return isSteady && rdtFound && isSharp && exposureResult == ExposureResult.NORMAL;
    }

    private static ExposureResult getExposureResult(short brightness) {
      if (brightness == AcceptanceStatus.TOO_HIGH) {
        return ExposureResult.OVER_EXPOSED;
      } else if (brightness == AcceptanceStatus.TOO_LOW) {
        return ExposureResult.UNDER_EXPOSED;
      } else if (brightness == AcceptanceStatus.GOOD) {
        return ExposureResult.NORMAL;
      } else {
        return ExposureResult.NOT_CALCULATED;
      }
    }
  }

  private static class FrameResult {

    private FrameResult(AcceptanceStatus status) {
      this.sharpness = status.mSharpness;
      this.scale = status.mScale;
      this.brightness = status.mBrightness;
      this.perspectiveDistortion = status.mPerspectiveDistortion;
      this.xOffset = status.mDisplacementX;
      this.yOffset = status.mDisplacementY;
      this.foundRDT = status.mRDTFound;
      this.left = status.mBoundingBoxX;
      this.top = status.mBoundingBoxY;
      this.right = this.left + status.mBoundingBoxWidth;
      this.bottom = this.top + status.mBoundingBoxHeight;
    }

    public final int sharpness;
    public final int scale;
    public final int brightness;
    public final int perspectiveDistortion;
    public final int xOffset;
    public final int yOffset;
    public final boolean foundRDT;
    public final int left;
    public final int top;
    public final int right;
    public final int bottom;

    @Override
    public String toString() {
      StringBuilder builder = new StringBuilder();
      return builder.append("FrameResult:")
          .append(" sharp=").append(this.sharpness)
          .append(" scale=").append(this.scale)
          .append(" bright=").append(this.brightness)
          .append(" perspec=").append(this.perspectiveDistortion)
          .append(" rdt=").append(this.foundRDT)
          .toString();
    }
  }
}
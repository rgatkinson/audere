// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent;

import android.graphics.Bitmap;

import com.iprd.rdtcamera.AcceptanceStatus;
import com.iprd.rdtcamera.RdtAPI;

public class IprdAdapter {

  public static final String TAG = "IprdAdapter";
  private RdtAPI iprdApi;

  public IprdAdapter() {
    this.iprdApi = builder().build();
  }

  public Result isSteady(Bitmap frame) {
    return new Result(iprdApi.isSteady(frame));
  }

  public void checkFrame(Bitmap frame, Result iprdResult, Bitmap rdt) {
    FrameResult frameResult = new FrameResult(this.iprdApi.checkFrame(frame, rdt));
    iprdResult.sharpnessRaw = frameResult.sharpnessMetric;
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
    }

    public RdtAPI build() {
      return this.iprdBuilder.build();
    }
  }

  public enum ExposureResult {
    UNDER_EXPOSED, NORMAL, OVER_EXPOSED, NOT_CALCULATED;
  }

  public static class Result {
    private boolean isSteady;
    private boolean isSharp;
    private double sharpnessRaw;
    private ExposureResult exposureResult;

    private Result(boolean isSteady) {
      this.isSteady = isSteady;
      this.isSharp = false;
      this.sharpnessRaw = 0;
      this.exposureResult = ExposureResult.NOT_CALCULATED;
    }

    public boolean isSteady() {
      return isSteady;
    }

    public boolean isSharp() {
      return isSharp;
    }

    public double getSharpnessRaw() {
      return sharpnessRaw;
    }

    public ExposureResult exposureResult() {
      return exposureResult;
    }

    public boolean isAccepted() {
      return isSteady && isSharp && exposureResult == ExposureResult.NORMAL;
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
      this.sharpnessMetric = status.mSharpnessMetric;
    }

    public final double sharpnessMetric;
    public final int sharpness;
    public final int scale;
    public final int brightness;

    @Override
    public String toString() {
      StringBuilder builder = new StringBuilder();
      return builder.append("FrameResult:")
              .append(" sharp=").append(this.sharpness)
              .append(" sharpness=").append(this.sharpnessMetric)
              .append(" scale=").append(this.scale)
              .append(" bright=").append(this.brightness)
              .toString();
    }
  }
}
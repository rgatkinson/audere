package com.iprd.rdtcamera;

public class AcceptanceStatus {
    public static final short NOT_COMPUTED = 100;
    public static final short TOO_HIGH = 1;
    public static final short TOO_LOW = -1;
    public static final short GOOD = 0;

    public double mSharpnessMetric;
    public short mSharpness;
    public short mScale;
    public short mBrightness;

    public AcceptanceStatus() {
        setDefaultStatus();
    }

    private void setDefaultStatus() {
        mBrightness = NOT_COMPUTED;
        mSharpness = NOT_COMPUTED;
        mScale = NOT_COMPUTED;
    }
}
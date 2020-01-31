package com.iprd.rdtcamera;

public class Config{
    public float mMinSharpness;
    public float mMaxBrightness;
    public float mMinBrightness;
    public short mMaxFrameTranslationalMagnitude;
    public short mMax10FrameTranslationalMagnitude;

    public Config() {
        setDefaults();
    }

    public void setDefaults() {
        mMinSharpness = 350.0f;
        mMaxBrightness = 220.0f;
        mMinBrightness = 110.0f;
        mMaxFrameTranslationalMagnitude = 100;
        mMax10FrameTranslationalMagnitude = 200;
    }
}


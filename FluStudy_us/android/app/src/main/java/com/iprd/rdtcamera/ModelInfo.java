package com.iprd.rdtcamera;

public class ModelInfo {
    public static final String mModelFileName="OD_360x640_Scale_25.lite"; //1500 ms

    public final static int[] inputSize;
    public final static int[] aspectAnchors;
    public final static int[] numberBlocks;
    public final static int pyrlevelcnt;

    static{
        if (mModelFileName.contains("180x320")) {
            inputSize = new int[]{ 180,320 };
            aspectAnchors = new int[]{ 15, 35, 34,34, 22, 37, 14, 26 };
            numberBlocks = new int[]{ 5,9 };
            pyrlevelcnt = 2;
        } else if (mModelFileName.contains("360x640")) {
            inputSize = new int[] { 360,640 };
            aspectAnchors = new int[]{ 30, 70, 68, 68, 44, 74, 28, 52 };
            numberBlocks = new int[]{ 10,19 };
            pyrlevelcnt = 1;
        }
        else {
            throw new RuntimeException("Uninitialized model");
        }
    }
}
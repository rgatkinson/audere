package com.iprd.rdtcamera;

import android.util.Log;

import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.Point;
import org.opencv.core.Point3;
import org.opencv.core.Rect;
import org.opencv.core.RotatedRect;
import org.opencv.core.Size;
import org.opencv.imgproc.Imgproc;
import org.tensorflow.lite.Interpreter;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.MappedByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.Vector;

import static com.iprd.rdtcamera.ModelInfo.aspectAnchors;
import static com.iprd.rdtcamera.ModelInfo.inputSize;
import static com.iprd.rdtcamera.ModelInfo.numberBlocks;
import static com.iprd.rdtcamera.ModelInfo.pyrlevelcnt;

public class ObjectDetection {
    private static float [] canonicalArrow = { 121.0f,152.0f,182.0f };
    private static float [] canonicalCPattern = { 596.0f,746.0f,895.0f };
    private static float [] canonicalInfluenza = { 699.0f,874.0f,1048.0f };
    private static double ac_can = canonicalCPattern[1] - canonicalArrow[1];
    private static double ai_can = canonicalInfluenza[1] - canonicalArrow[1];

    private static Point canonicalACMid = new Point(449.0f,30.0f);
    private static Point  ref_A = new Point(canonicalArrow[1]- canonicalACMid.x,0.0f);
    private static Point  ref_C = new Point(canonicalCPattern[1]- canonicalACMid.x,0.0f);
    private static Point  ref_I = new Point(canonicalInfluenza[1]- canonicalACMid.x,0.0f);

    private static double minError = 100.0;

    private static int numberClasses = 31;
    private static int[] resizeFactor = { inputSize[0] / numberBlocks[0], inputSize[1] / numberBlocks[1] };
    private static float[] orientationAngles = { 0, 22.5f, 45, 135, 157.5f, 180, 202.5f, 225, 315, 337.5f };
    private ByteBuffer imgData =  ByteBuffer.allocateDirect(inputSize[0] * inputSize[1] * 4);
    private Point cArrowPredicted = new Point(0, 0);
    private Point cCPatternPredicted = new Point(0, 0);
    private Point cInfluenzaPredicted = new Point(0, 0);

    private static int numberAnchors = aspectAnchors.length / 2;
    private double A_C_to_L = 1.624579124579125;
    private double L_to_W = 0.0601036269430052;
    private static double ref_hyp = 35 ;
    private boolean found = false;

    public static double mThreshold = 0.9;

    private float widthFactor = (float) (1.0 / inputSize[1] * 1280);
    private float heightFactor = (float) (1.0 / inputSize[0] * 720);
    private Interpreter mTflite;
    private Interpreter.Options tfOptions = new Interpreter.Options();

    public ObjectDetection(MappedByteBuffer mappedBuffer) {
       try {
            tfOptions.setNumThreads(4);
            mTflite = new Interpreter(mappedBuffer, tfOptions);
            if (mTflite != null) {
                Log.d("Loaded model File", "length = ");
            }
           imgData.order(ByteOrder.nativeOrder());
        } catch (Exception e){
            e.printStackTrace();
        }
    }

    public ObjectDetection(byte[] bytes) {
        ByteBuffer byteBuffer = ByteBuffer.allocateDirect(bytes.length);
        byteBuffer.order(ByteOrder.nativeOrder());
        byteBuffer.put(bytes);
        try {
            tfOptions.setNumThreads(4);
            mTflite = new Interpreter(byteBuffer, tfOptions);
            if (mTflite != null) {
                Log.d("Loaded model File", "length = ");
            }
            imgData.order(ByteOrder.nativeOrder());
        } catch(Exception e){
            e.printStackTrace();
        }
    }

    class ScoreComparator implements Comparator<HashMap<Float,Vector<Float>>> {
        public int compare(HashMap<Float,Vector<Float>> s1,HashMap<Float,Vector<Float>> s2){

            Map.Entry<Float,Vector<Float>> entryS1 = s1.entrySet().iterator().next();
            Float keyS1 = entryS1.getKey();

            Map.Entry<Float,Vector<Float>> entryS2 = s2.entrySet().iterator().next();
            Float keyS2 = entryS2.getKey();
            return Float.compare(keyS2, keyS1);
        }
    }

    private void convertMattoTfLiteInput(Mat matInp) {
        imgData.rewind();
        for (int i = 0; i < inputSize[0]; ++i) {
            for (int j = 0; j < inputSize[1]; ++j) {
                imgData.putFloat((float) (matInp.get(i, j)[0] / 255.0));
            }
        }
    }

    private int ArgMax(float[] inp) {
        float maxConf = 0.0f;
        int argMax = 0;
        for (int i = 0; i < inp.length; ++i) {
            if (inp[i] > maxConf){
                argMax = i;
                maxConf = inp[i];
            }
        }
        return argMax;
    }
    //This input shooud be 1280x720 in following RDT direction and Grey scale
    //<<<----|| || || CCC Influenza
    public Rect update(Mat inputMat, Boolean[] rdt) {
        found = false;
        minError = 100;
        Rect ret = new Rect(-1, -1, -1, -1);
        try {
            Mat greyMat = new Mat();
            if(pyrlevelcnt >=1 ) {
                Imgproc.pyrDown(inputMat, greyMat);
            }
            if(pyrlevelcnt >=2) {
                Imgproc.pyrDown(greyMat, greyMat);
            }

            //Feed image pixels in normalized form to the input
            float[][][][] input = new float[1][inputSize[0]][inputSize[1]][1];
            convertMattoTfLiteInput(greyMat);
            //Initialize output buffer
            float[][][][] output = new float[1][numberBlocks[0]*numberBlocks[1]][numberAnchors][numberClasses + 4];
            //Image to draw roi in
            long startTime = System.currentTimeMillis();
            int[] dim = { 1,inputSize[0],inputSize[1],1 };
            mTflite.resizeInput(0,dim);
            mTflite.run(imgData, output);

            ArrayList<HashMap<Float, Vector<Float>>> vectorTableArrow = new ArrayList<HashMap<Float, Vector<Float>>>();
            ArrayList<HashMap<Float, Vector<Float>>> vectorTableCpattern = new ArrayList<HashMap<Float, Vector<Float>>>();
            ArrayList<HashMap<Float, Vector<Float>>> vectorTableInfluenza = new ArrayList<HashMap<Float, Vector<Float>>>();
            for (int row = 0; row < numberBlocks[0]; row++) {
                for (int col = 0; col < numberBlocks[1]; col++) {
                    for (int j = 0; j < numberAnchors; j++) {
                        int computedIndex = row * numberBlocks[1] + col;
                        int targetClass = ArgMax(Arrays.copyOfRange(output[0][computedIndex][j],0,31));
                        float confidence = output[0][computedIndex][j][targetClass];
                        if (confidence> mThreshold) {
                            int offsetStartIndex = numberClasses;
                            float cx = (float) ((col + 0.5) * resizeFactor[1] + output[0][computedIndex][j][offsetStartIndex] * inputSize[1]) * widthFactor;
                            float cy = (float) ((row + 0.5) * resizeFactor[0] + output[0][computedIndex][j][offsetStartIndex+1] * inputSize[0]) * heightFactor;
                            float w = (float) (aspectAnchors[j * 2+1] * Math.exp(output[0][computedIndex][j][offsetStartIndex+2] )) * widthFactor;
                            float h = (float) (aspectAnchors[j * 2 ] * Math.exp(output[0][computedIndex][j][offsetStartIndex+3])) * heightFactor;
                            Vector v = new Vector();
                            int typeOfFeat = targetClass / 10;
                            float predictedOrientation = orientationAngles[targetClass % 10];
                            v.add(cx);
                            v.add(cy);
                            v.add(w);
                            v.add(h);
                            v.add(predictedOrientation);
                            HashMap<Float, Vector<Float>> hMap = new HashMap<>();
                            hMap.put(confidence, v);
                            if (typeOfFeat == 2){
                                vectorTableArrow.add(hMap);
                            }
                            else if (typeOfFeat == 1){
                                vectorTableCpattern.add(hMap);
                            }
                            else if (typeOfFeat == 0){
                                vectorTableInfluenza.add(hMap);
                            }
                        }
                    }
                }
            }

            if (vectorTableArrow.size() > 0) {
                Collections.sort(vectorTableArrow, new ScoreComparator());
            }
            if (vectorTableCpattern.size() > 0) {
                Collections.sort(vectorTableCpattern, new ScoreComparator());
            }
            if (vectorTableInfluenza.size() > 0) {
                Collections.sort(vectorTableInfluenza, new ScoreComparator());
            }
            if (vectorTableArrow.size() > 0 & vectorTableCpattern.size() > 0 & vectorTableInfluenza.size() > 0) {
                ret = locateRdt(vectorTableArrow, vectorTableCpattern,vectorTableInfluenza);

                rdt[0] = found;
            }
            if (found) {

                //grow width when it is too thin
                double grow_fact = 0.25;
                if (ret.width * ret.height > 0 && ret.height / ret.width < (1 + grow_fact) * L_to_W) {
                    //remember height is the smaller direction
                    double adder = ret.height * grow_fact;
                    ret.height += adder;
                    ret.y -= (adder / 2);
                }

                if (ret.x <0) {
                    ret.x = 0;
                }

                if (ret.y <0) {
                    ret.y = 0;
                }

                if (ret.width <0) {
                    ret.width =0;
                }

                if(ret.height <0) {
                    ret.height =0;
                }

                if ((ret.x + ret.width) >= inputMat.cols()) {
                    ret.width = inputMat.cols()-ret.x;
                }

                if ((ret.y + ret.height) >= inputMat.rows()) {
                    ret.height = inputMat.rows()-ret.y;
                }
            }

        } catch (Exception ex) {
            ex.printStackTrace();
        }
        if (rdt[0] == true) {
            Log.i("ROI", ret.x + "x" + ret.y + " " + ret.width + "x" + ret.height);
        }
        return ret;
    }

    private static double lengthOfLine(Point p1, Point p2){
        return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
    }

    private static double angleOfLine(Point p1, Point p2) {
        return Math.atan2((p2.y - p1.y), (p2.x - p1.x));
    }

    public static Point warpPoint(Point point, Mat R){
        Point result= new Point();
        result.x = point.x * R.get(0,0)[0] + point.y * R.get(0,1)[0]+ R.get(0,2)[0];
        result.y = point.x * R.get(1,0)[0] + point.y * R.get(1,1)[0]+ R.get(1,2)[0];
        return result;
    }

    public static double detect2(float[] a, float[] c, float[] i, Point scale_rot) {
        Point3 orientations = new Point3(a[2], c[2], i[2]);
        return detect2(new Point(a[0], a[1]), new Point(c[0], c[1]), new Point(i[0], i[1]), orientations, scale_rot);
    }

    public static double detect2(Point a, Point c, Point i, Point3 orientations, Point out_scale_rot) {
        //rotation
        double th1 = angleOfLine(a, c);
        double th2 = angleOfLine(a, i);
        double theta = (th1 + th2) / 2;
        if(theta < 0) {
            theta += 2 * Math.PI;
        }

        //avoid feature orientations which are very different from theta
        double theta_deg = Math.toDegrees(theta);
        if (angle_constraint(orientations.x, theta_deg) ||
                angle_constraint(orientations.y, theta_deg) ||
                angle_constraint(orientations.z, theta_deg)) {
            return Double.MAX_VALUE;
        }

        //scale
        double ac = lengthOfLine(a, c);
        double ai = lengthOfLine(a, i);

        double s1 = ac / ac_can;
        double s2 = ai / ai_can;
        double scale = Math.sqrt(s1 * s2);

        //avoid scales which are very different from each other
        double scale_disparity = s1/ s2;
        if (scale_disparity > 1.25 || scale_disparity < 0.75) {
            return Double.MAX_VALUE;
        }

        //The inspection points rotate back so use -theta angle
        double cos_th = Math.cos(-1 * theta);
        double sin_th = Math.sin(-1 * theta);

        Mat R = new Mat(2,3, CvType.CV_32F);
        R.put(0,0,cos_th / scale);
        R.put(0,1,0-sin_th / scale);
        R.put(0,2,0);
        R.put(1,0,sin_th / scale);
        R.put(1,1,cos_th / scale);
        R.put(1,2,0);

        //Now warp the points
        Point a1 = warpPoint(a, R);
        Point c1 = warpPoint(c, R);
        Point i1 = warpPoint(i, R);

        Point ac1_mid = new Point((a1.x + c1.x) / 2,(a1.y +c1.y) / 2);
        //translate back to 0,0
        a1 = new Point(a1.x - ac1_mid.x, a1.y - ac1_mid.y);
        c1 = new Point(c1.x - ac1_mid.x,c1.y - ac1_mid.y);
        i1 = new Point(i1.x - ac1_mid.x,i1.y - ac1_mid.y);

        out_scale_rot.x = scale;
        out_scale_rot.y = theta;

        //compute the MSE
        return (lengthOfLine(ref_A, a1) + lengthOfLine(ref_C, c1) + lengthOfLine(ref_I, i1)) / 3;
    }

    private static boolean angle_constraint(double orientation, double thetaDeg) {
        double T = 30;

        double d = Math.abs(orientation - thetaDeg);
        if (d > 180) {
            d = 360 - d;
        }

        return d > T;
    }

    private Rect locateRdt(ArrayList<HashMap<Float, Vector<Float>>> Arrow, ArrayList<HashMap<Float, Vector<Float>>>  Cpattern, ArrayList<HashMap<Float, Vector<Float>>>  Infl){
        //Log.d("detection","done");
        Rect roi = new Rect(-1, -1, -1, -1);
        boolean exit = false;
        found = false;
        int cnt_arr = 0;
        int cnt_c = 0;
        int cnt_i = 0;
        float []C_arrow_best = new float[2];
        float []C_Cpattern_best=new float[2];
        float []C_infl_best = new float[2];
        Point best_scale_rot = new Point();
        Point scale_rot = new Point();
        while(cnt_arr < Arrow.size()){
            cnt_c = 0;
            try{
                for (Map.Entry arrowElement : Arrow.get(cnt_arr).entrySet()) {
                    while (cnt_c < Cpattern.size()){
                        cnt_i = 0;
                        Vector cxcywha = (Vector) arrowElement.getValue();
                        float []C_arrow = {(float) cxcywha.get(0), (float) cxcywha.get(1), (float) cxcywha.get(4)};

                        for (Map.Entry cElement : Cpattern.get(cnt_c).entrySet()){

                            cxcywha = (Vector) cElement.getValue();
                            float []C_Cpattern = {(float) cxcywha.get(0), (float) cxcywha.get(1), (float) cxcywha.get(4)};

                            while(cnt_i<Infl.size()) {
                                for (Map.Entry iElement : Infl.get(cnt_i).entrySet()) {
                                    float infConf = (float) iElement.getKey();
                                    cxcywha = (Vector) iElement.getValue();
                                    float[] C_Inlf = {(float) cxcywha.get(0), (float) cxcywha.get(1), (float) cxcywha.get(4)};
                                    cArrowPredicted.x = C_arrow[0];
                                    cArrowPredicted.y = C_arrow[1];
                                    cCPatternPredicted.x = C_Cpattern[0];
                                    cCPatternPredicted.y = C_Cpattern[1];
                                    cInfluenzaPredicted.x = C_Inlf[0];
                                    cInfluenzaPredicted.y = C_Inlf[1];

                                    double tmperror = detect2(C_arrow, C_Cpattern, C_Inlf, scale_rot);
                                    if (tmperror < minError) {
                                        minError = tmperror;
                                        found = true;
                                        C_arrow_best = C_arrow;
                                        C_Cpattern_best = C_Cpattern;
                                        C_infl_best = C_Inlf;
                                        best_scale_rot = scale_rot.clone();
                                    }
                                }
                                cnt_i++;
                            }
                        }
                        cnt_c++;
                    }
                }
            }catch (IndexOutOfBoundsException e){
                Log.e("Error","Index out of bound exception");
                exit = true;
            }
            cnt_arr++;
        }
        double angleRads = best_scale_rot.y;
        if(angleRads > Math.PI) {
            angleRads -= Math.PI * 2;
        }
        double calculatedAngleRotation = Math.toDegrees(angleRads);

        Point rdt_c = new Point(C_arrow_best[0] + (C_Cpattern_best[0] - C_arrow_best[0]) / 2, C_arrow_best[1] + (C_Cpattern_best[1] - C_arrow_best[1]) / 2);

        Size sz = new Size();
        sz.width = ac_can * A_C_to_L * best_scale_rot.x;
        sz.height = sz.width* L_to_W;

        if(true) {
            rdt_c.x += ref_hyp * Math.cos(angleRads);
            rdt_c.y -= ref_hyp * Math.sin(angleRads);
        }

        RotatedRect rotatedRect = new RotatedRect(rdt_c, sz, calculatedAngleRotation);
        roi = rotatedRect.boundingRect();
        //Log.d("ROI:", "X : " + roi.x + "Y : " + roi.y + "W : " + roi.width + "H : " + roi.height);

        return roi;
    }
}
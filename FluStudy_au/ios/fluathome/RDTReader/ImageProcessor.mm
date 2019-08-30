//
//  Copyright (C) 2019 University of Washington Ubicomp Lab
//  All rights reserved.
//
//  This software may be modified and distributed under the terms
//  of a BSD-style license that can be found in the LICENSE file.
//

#import "ImageProcessor.h"
#import <opencv2/imgcodecs/ios.h> // For code to convert UIImage to Mat
#import <opencv2/calib3d/calib3d.hpp> // For calib3d
#include <iostream>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/imgcodecs/ios.h>
#include <opencv2/xfeatures2d.hpp>
#include <opencv2/xfeatures2d/nonfree.hpp>
#include <Accelerate/Accelerate.h>

using namespace cv;
using namespace cv::xfeatures2d;
using namespace std;

const float SHARPNESS_THRESHOLD = 0.8;
const float OVER_EXP_THRESHOLD = 255;
const float UNDER_EXP_THRESHOLD = 120;
const float OVER_EXP_WHITE_COUNT = 100;
const double SIZE_THRESHOLD = 0.15;
const double POSITION_THRESHOLD = 0.15;
const double ANGLE_THRESHOLD = 10.0;
const int GOOD_MATCH_COUNT = 7;
double refImgSharpness = FLT_MIN;
const int MOVE_CLOSER_COUNT = 5;
const double CROP_RATIO = 1.0;
const double VIEW_FINDER_SCALE_W = 0.15;
const double VIEW_FINDER_SCALE_H = 0.60;
const float INTENSITY_THRESHOLD = 190;
const float CONTROL_INTENSITY_PEAK_THRESHOLD = 150;
const float TEST_INTENSITY_PEAK_THRESHOLD = 50;
const int LINE_SEARCH_WIDTH = 13;
const int CONTROL_LINE_POSITION = 45;
const int TEST_A_LINE_POSITION = 15;
const int TEST_B_LINE_POSITION = 75;
const vector<Scalar> CONTROL_LINE_COLOR_LOWER = {Scalar(0/2.0, 20/100.0*255.0, 20/100.0*255.0),
                                                Scalar(300/2.0, 20/100.0*255.0, 20/100.0*255.0)};
const vector<Scalar> CONTROL_LINE_COLOR_UPPER = {Scalar(60/2.0, 85/100.0*255.0, 100/100.0*255.0),
                                                Scalar(360/2.0, 85/100.0*255.0, 100/100.0*255.0)};

//const Scalar CONTROL_LINE_COLOR_LOWER = Scalar(130/2.0, 20/100.0*255.0, 20/100.0*255.0);
//const Scalar CONTROL_LINE_COLOR_UPPER = Scalar(270/2.0, 85/100.0*255.0, 100/100.0*255.0);
const int FIDUCIAL_POSITION_MIN = 160;
const int FIDUCIAL_POSITION_MAX = 935;
const int FIDUCIAL_MIN_HEIGHT = 45;
const int FIDUCIAL_MIN_WIDTH = 20;
const int FIDUCIAL_MAX_WIDTH = 150;
const int FIDUCIAL_TO_CONTROL_LINE_OFFSET = 50;
const int RESULT_WINDOW_RECT_HEIGHT = 90;
const int RESULT_WINDOW_RECT_WIDTH_PADDING = 10;
const int FIDUCIAL_DISTANCE = 610;
const int FIDUCIAL_COUNT = 2;

const int RESULT_WINDOW_X = 550;
const int RESULT_WINDOW_Y = 10;
const int RESULT_WINDOW_WIDTH = 200;
const int RESULT_WINDOW_HEIGHT = 30;
const double ENHANCING_THRESHOLD = 4.5;
const BOOL DEBUG_FLAG = NO;
const double DEFAULT_FRAME_IMAGE_SCALE = 1.0;

NSString *instruction_detected = @"RDT detected at the center!";
NSString *instruction_pos = @"Place RDT at the center.\nFit RDT to the rectangle.";
NSString *instruction_too_small = @"Place RDT at the center.\nFit RDT to the rectangle.\nMove closer.";
NSString *instruction_too_large = @"Place RDT at the center.\nFit RDT to the rectangle.\nMove further away.";
NSString *instruction_focusing = @"Place RDT at the center.\nFit RDT to the rectangle.\nCamera is focusing. \nStay still.";
NSString *instruction_unfocused = @"Place RDT at the center.\n Fit RDT to the rectangle.\nCamera is not focused. \nMove further away.";

Ptr<BRISK> detector;
Ptr<BFMatcher> matcher;
Mat refImg;
Mat refDescriptor;
vector<KeyPoint> refKeypoints;
int mMoveCloserCount;

Ptr<SIFT> siftDetector;
Ptr<BFMatcher> siftMatcher;
vector<KeyPoint> siftRefKeypoints;
Mat siftRefDescriptor;

@implementation ImageProcessor

// Singleton object
+ (ImageProcessor *)sharedProcessor {
    static ImageProcessor *sharedWrapper = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedWrapper = [[self alloc] init];
        sharedWrapper.frameImageScale = DEFAULT_FRAME_IMAGE_SCALE;
        detector = BRISK::create(45, 4, 1.0f);
        matcher = BFMatcher::create(cv::NORM_HAMMING); // 4 indicates BF Hamming
        
        siftDetector = SIFT::create();
        siftMatcher = BFMatcher::create(cv::NORM_L2);
        
        UIImage * image = [UIImage imageNamed:@"quickvue_ref_v5.jpg"];
        UIImageToMat(image, refImg);
        if (DEBUG_FLAG) {
            NSLog(@"RefImg Size: (%d, %d)", refImg.size().width, refImg.size().height);
        }
        
        GaussianBlur(refImg, refImg, cv::Size(5, 5), 0, 0);
        refImgSharpness = [sharedWrapper calculateSharpness:refImg];
        if (DEBUG_FLAG) {
            NSLog(@"mRefImg sharpness: %.2f", refImgSharpness);
        }
        
        cvtColor(refImg, refImg, CV_RGBA2GRAY); // Dereference the pointer
        detector->detectAndCompute(refImg, noArray(), refKeypoints, refDescriptor);
        siftDetector->detectAndCompute(refImg, noArray(), siftRefKeypoints, siftRefDescriptor);
        if (DEBUG_FLAG) {
            NSLog(@"Successfully set up BRISK Detector and BFHamming matcher");
            NSLog(@"Successfully detect and compute reference RDT, currently there are %lu %lu keypoints",refKeypoints.size(), siftRefKeypoints.size());
        }
    });
    return sharedWrapper;
}

- (void) releaseProcessor{
    refImg.release();
    refDescriptor.release();
    detector.release();
    matcher.release();
}

// CJ: this is just a util function to convert an image object of iOS to Mat object of OpenCV
// Get Mat from buffer
- (cv::Mat)matBGRAFromSampleBuffer:(CMSampleBufferRef)sampleBuffer {
    
    CVImageBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    CVPixelBufferLockBaseAddress(pixelBuffer, 0);
    size_t bufferWidth = CVPixelBufferGetWidth(pixelBuffer);
    size_t bufferHeight = CVPixelBufferGetHeight(pixelBuffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
    unsigned char *pixel = (unsigned char *)CVPixelBufferGetBaseAddress(pixelBuffer);
    Mat mat = Mat((int)bufferHeight,(int)bufferWidth,CV_8UC4, pixel,(int)bytesPerRow); //put buffer in open cv, no memory copied
    CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);

    //mat.release();
    if (DEBUG_FLAG) {
        NSLog(@"Mat size: (%d, %d)", mat.size().width, mat.size().height);
    }
    return mat;
}

- (cv::Mat)matRGBAFromSampleBuffer:(CMSampleBufferRef)sampleBuffer {
    Mat mat = [self matBGRAFromSampleBuffer:sampleBuffer];
    cvtColor(mat, mat, CV_BGRA2RGBA);
    return mat;
}

- (ExposureResult)checkBrightness:(Mat)inputMat {
    
    // Brightness Calculation
    vector<float> histograms = [self calculateBrightness:inputMat];
    
    int maxWhite = 0;
    float whiteCount = 0;
    
    for (int i = 0; i < histograms.size(); i++) {
        if (histograms[i] > 0) {
            maxWhite = i;
        }
        if (i == histograms.size() - 1) {
            whiteCount = histograms[i];
        }
    }
    
    // Check Brightness starts
    ExposureResult exposureResult;
    if (maxWhite >= OVER_EXP_THRESHOLD && whiteCount > OVER_EXP_WHITE_COUNT) {
        exposureResult = OVER_EXPOSED;
        return exposureResult;
    } else if (maxWhite < UNDER_EXP_THRESHOLD) {
        exposureResult = UNDER_EXPOSED;
        return exposureResult;
    } else {
        exposureResult = NORMAL;
        return exposureResult;
    }
}

- (bool)checkSharpness:(Mat)inputMat {
    Mat resized = Mat();
    double scale = (double)refImg.size().width/(double)inputMat.size().width;
    cv::resize(inputMat, resized, cv::Size(inputMat.size().width*scale, inputMat.size().height*scale));

    double sharpness = [self calculateSharpness:resized];
    
    if (DEBUG_FLAG) {
        NSLog(@"inputMat sharpness: %.2f", sharpness);
    }
    
    //CJ: checkSharpness starts
    bool isSharp = sharpness > (refImgSharpness * (1-SHARPNESS_THRESHOLD));
    
    inputMat.release();
    resized.release();
    
    return isSharp;
}


//CJ: captureRDT starts
- (void)captureRDT:(CMSampleBufferRef)sampleBuffer withCompletion:(ImageProcessorBlock)completion {
    Mat inputMat = [self matRGBAFromSampleBuffer:sampleBuffer];
    Mat greyMat;
    cvtColor(inputMat, greyMat, COLOR_RGBA2GRAY);
    bool passed = false;
    
    //check brightness (refactored)
    ExposureResult exposureResult = [self checkBrightness:greyMat];
    //isRightBrightness = false;
    
    //check sharpness (refactored)
    bool isSharp = [self checkSharpness:greyMat([self getViewfinderRect:greyMat])];
    //isSharp = false;
    
    //preform detectRDT only if those two quality checks are passed
    //CJ: detectRDT starts
    //CJ: detectRDT ends inside of "performBRISKSearchOnMat". Check "performBRISKSearchOnMat" for the end of detectRDT.
    vector<Point2f> boundary;
    //boundary = [self detectRDT:greyMat andRansac: 5];
    boundary = [self detectRDTWithSIFT:greyMat andRansac: 5];
    bool isCentered = false;
    SizeResult sizeResult = INVALID;
    bool isRightOrientation = false;
    float angle = 0.0;
    bool testStripDetected = false;
    
    //[self checkPositionAndSize:boundary isCropped:false inside:greyMat.size()];
    
    if (boundary.size() > 0) {
        testStripDetected = true;
        isCentered = [self checkIfCentered:boundary inside:greyMat.size()];
        sizeResult = [self checkSize:boundary inside:greyMat.size()];
        isRightOrientation = [self checkOrientation:boundary];
        angle = [self measureOrientation: boundary];
    }
    
    Mat rgbMat = [self crop:inputMat];
    
    passed = exposureResult == NORMAL && isSharp && sizeResult == RIGHT_SIZE && isCentered && isRightOrientation;
    
    bool fiducial = false;
    Mat correctedMat = Mat();
    UIImage *img;
    UIImage *croppedRDTImg;
    if (passed) {
        correctedMat = [self cropRDT:inputMat with:boundary];
        Mat resultWindow = [self cropResultWindow:correctedMat with:&fiducial];
        resultWindow.release();
        passed = passed & fiducial;
        if (passed) {
            img = MatToUIImage(rgbMat);
            croppedRDTImg = MatToUIImage(correctedMat);
        }
    }
    
    if (DEBUG_FLAG) {
        NSLog(@"PASSED: %d", passed);
    }
    
    rgbMat.release();
    inputMat.release();
    greyMat.release();
    completion(passed, testStripDetected, img, croppedRDTImg, fiducial, exposureResult, sizeResult, isCentered, isRightOrientation, angle, isSharp, false, boundary);
}
// end of caputureRDT

- (double) measureOrientation:(vector<Point2f>) boundary {
    RotatedRect rotatedRect = minAreaRect(boundary);
    
    bool isUpright = rotatedRect.size.height > rotatedRect.size.width;
    double angle = 0;
    double height = 0;
    
    if (isUpright) {
        if (rotatedRect.angle < 0) {
            angle = 90 + rotatedRect.angle;
        } else {
            angle = rotatedRect.angle - 90;
        }
    } else {
        angle = rotatedRect.angle;
    }

    return angle;
}

- (bool) checkOrientation:(vector<Point2f>) boundary {
    double angle = [self measureOrientation:boundary];
    
    bool isOriented = abs(angle) < ANGLE_THRESHOLD;
    
    return isOriented;
}

- (double) measureSize:(vector<Point2f>) boundary {
    RotatedRect rotatedRect = minAreaRect(boundary);
    
    bool isUpright = rotatedRect.size.height > rotatedRect.size.width;
    double angle = 0;
    double height = 0;
    
    if (isUpright) {
        angle = 90 - abs(rotatedRect.angle);
        height = rotatedRect.size.height;
    } else {
        angle = abs(rotatedRect.angle);
        height = rotatedRect.size.width;
    }
    
    return height;
}

// Check Size Function need to fill in return values
- (SizeResult) checkSize:(vector<Point2f>) boundary inside:(cv::Size) size {
    double height = [self measureSize:boundary];
    //bool isRightSize = height < size.width*VIEWPORT_SCALE+VIEWPORT_SCALE*SIZE_THRESHOLD) && height > size.width*VIEWPORT_SCALE*(1-SIZE_THRESHOLD);
    bool isRightSize = height < size.width*VIEW_FINDER_SCALE_H+size.width*SIZE_THRESHOLD && height > size.width*VIEW_FINDER_SCALE_H-size.width*SIZE_THRESHOLD;
    
    bool invalid = true;
    for(int i = 0; i < boundary.size(); i++) {
        if (boundary.at(i).x < 0 || boundary.at(i).y)
            invalid = false;
    }
    
    RotatedRect rotatedRect = minAreaRect(boundary);
    cv::Rect rect = boundingRect(boundary);
    float rotatedArea = rotatedRect.size.height*rotatedRect.size.width;
    float boundArea = rect.area();
    if (DEBUG_FLAG) {
        NSLog(@"Rotated: %.2f, Bounding: %.2f, diff: %.2f -- BRISK", rotatedArea, boundArea, rotatedArea-boundArea);
    }
    
    SizeResult sizeResult = INVALID;
    
    if (!invalid) {
        if (isRightSize) {
            sizeResult = RIGHT_SIZE;
        } else {
            if (height > size.width*VIEW_FINDER_SCALE_H+size.width*SIZE_THRESHOLD) {
                sizeResult = LARGE;
            } else if (height < size.width*VIEW_FINDER_SCALE_H-size.width*SIZE_THRESHOLD) {
                sizeResult = SMALL;
            } else {
                sizeResult = INVALID;
            }
        }
    }
    
    return sizeResult;
}

// If Centered function, need to fill in return values
- (bool) checkIfCentered:(vector<Point2f>) boundary inside:(cv::Size)size{
    cv::Point center = [self measureCentering:boundary];
    cv::Point trueCenter = cv::Point(size.width/2, size.height/2);
    bool isCentered = center.x < trueCenter.x + (size.width*POSITION_THRESHOLD) && center.x > trueCenter.x-(size.width*POSITION_THRESHOLD)
    && center.y < trueCenter.y+(size.height*POSITION_THRESHOLD) && center.y > trueCenter.y-(size.height*POSITION_THRESHOLD);
    
    return isCentered;
}

- (cv::Point) measureCentering:(vector<Point2f>) boundary {
    RotatedRect rotatedRect = minAreaRect(boundary);
    return rotatedRect.center;
}

-(NSMutableArray *) checkPositionAndSize:(vector<Point2f>) boundary isCropped:(bool) cropped inside:(cv::Size) size {
    //CJ: checkSize starts
    //CJ: checkIfCentered starts
    //CJ: checkOrientation starts
    NSMutableArray *result = [[NSMutableArray alloc] init];
    for (int i = 0; i < 5; i++) {
        [result addObject:[NSNumber numberWithBool:false]];
    }
    if (boundary.size() < 1) {
        return result;
    }

    RotatedRect rotatedRect = minAreaRect(boundary);
    if (cropped) {
        rotatedRect.center = cv::Point(rotatedRect.center.x + size.width/4, rotatedRect.center.y + size.height/4);
    }

    //CJ: checkIfCentered continues
    cv::Point center = rotatedRect.center;
    cv::Point trueCenter = cv::Point(size.width/2, size.height/2);
    bool isCentered = center.x < trueCenter.x *(1+ POSITION_THRESHOLD) && center.x > trueCenter.x*(1- POSITION_THRESHOLD)
    && center.y < trueCenter.y *(1+ POSITION_THRESHOLD) && center.y > trueCenter.y*(1- POSITION_THRESHOLD);
    //CJ: checkIfCentered ends

    //CJ: checkOrientation and checkSize continues. variable "height" is used for checkSize,
    //and variable "isUpright" and "angle" are used for checkOrientation
    bool isUpright = rotatedRect.size.height > rotatedRect.size.width;
    double angle = 0;
    double height = 0;

    if (isUpright) {
        angle = 90 - abs(rotatedRect.angle);
        height = rotatedRect.size.height;
    } else {
        angle = abs(rotatedRect.angle);
        height = rotatedRect.size.width;
    }
    bool isOriented = angle < 90.0*POSITION_THRESHOLD;
    //CJ: checkOrientation ends

    bool isRightSize = height < size.height*VIEW_FINDER_SCALE_H*(1+SIZE_THRESHOLD) && height > size.height*VIEW_FINDER_SCALE_H*(1-SIZE_THRESHOLD);
    //CJ: checkSize ends

    result[0] = [NSNumber numberWithBool:isCentered];
    result[1] = [NSNumber numberWithBool:isRightSize];
    result[2] = [NSNumber numberWithBool:isOriented];

    //CJ: for size, we have to return whether the image is large or small to provide instruction.
    result[3] = [NSNumber numberWithBool:(height > size.height*VIEW_FINDER_SCALE_H*(1+SIZE_THRESHOLD))]; // large
    result[4] = [NSNumber numberWithBool:(height < size.height*VIEW_FINDER_SCALE_H*(1-SIZE_THRESHOLD))];// small

    if (DEBUG_FLAG) {
        NSLog(@"POS: %.2d, %.2d, Angle: %.2f, Height: %.2f", center.x, center.y, angle, height);
    }

    return result;
}

-(Mat) crop:(Mat) inputMat {
    int width = (int)(inputMat.cols * CROP_RATIO);
    int height = (int)(inputMat.rows * CROP_RATIO);
    int x = (int)(inputMat.cols*(1.0-CROP_RATIO)/2);
    int y = (int)(inputMat.rows*(1.0-CROP_RATIO)/2);
    
    cv::Rect roi = cv::Rect(x, y, width, height);
    Mat cropped = Mat(inputMat, roi);

    return cropped;
}

-(double) calculateSharpness:(Mat) input {
    Mat des = Mat();
    Laplacian(input, des, CV_64F);

    vector<double> median;
    vector<double> std;

    meanStdDev(des, median, std);


    double sharpness = pow(std[0],2);
    des.release();
    return sharpness;
}


-(vector<float>) calculateBrightness:(Mat) input {
    int mHistSizeNum =256;
    vector<int> mHistSize;
    mHistSize.push_back(mHistSizeNum);
    Mat hist = Mat();
    vector<float> mBuff;
    vector<float> histogramRanges;
    histogramRanges.push_back(0.0);
    histogramRanges.push_back(256.0);
    cv::Size sizeBgra = input.size();
    vector<int> channel = {0};
    vector<Mat> allMat = {input};
    calcHist(allMat, channel, Mat(), hist, mHistSize, histogramRanges);
    normalize(hist, hist, sizeBgra.height/2, 0, NORM_INF);
    mBuff.assign((float*)hist.datastart, (float*)hist.dataend);
    hist.release();
    return mBuff;
}


-(NSString *) getInstruction: (SizeResult) sizeResult andFor: (bool) isCentered andFor: (bool) isRightOrientation {
//-(NSString *) getInstruction: (NSMutableArray *) isCorrectPosSize {
    NSString *instructions = instruction_pos;
    
    if (sizeResult == RIGHT_SIZE && isCentered && isRightOrientation){
        instructions = instruction_detected;
        mMoveCloserCount = 0;
    } else if (mMoveCloserCount > MOVE_CLOSER_COUNT) {
        if (sizeResult != INVALID && sizeResult == SMALL) {
            instructions = instruction_too_small;
            mMoveCloserCount = 0;
        }
    } else {
        instructions = instruction_too_small;
        mMoveCloserCount++;
    }
    
    return instructions;
}

//needs to change isBright to incorporate both too dark and too bright
-(NSMutableArray *) getQualityCheckTexts: (SizeResult) sizeResult andFor: (bool) isCentered andFor: (bool) isRightOrientation andFor: (bool) isSharp andFor:(ExposureResult) exposureResult {
//-(NSMutableArray *) getQualityCheckTextsFor: (bool) isSharp andFor:(bool) isBright andFor:(bool) isSizeble andFor:(bool) isCentered {
    NSMutableArray *texts = [[NSMutableArray alloc] init];
    
    texts[0] = isSharp ? @"Sharpness: PASSED": @"Sharpness: FAILED";
    if (exposureResult == NORMAL) {
        texts[1] = @"Brightness: PASSED";
    } else if (exposureResult == OVER_EXPOSED) {
        texts[1] = @"Brightness: TOO BRIGHT";
    } else if (exposureResult == UNDER_EXPOSED) {
        texts[1] = @"Brightness: TOO DARK";
    }
    
    texts[2] = sizeResult==RIGHT_SIZE && isCentered && isRightOrientation ? @"POSITION/SIZE: PASSED": @"POSITION/SIZE: FAILED";
    texts[3] = @"Shadow: PASSED";
    
    return texts;
}

-(void) toggleFlash: (AVCaptureDevice *) device with: (dispatch_queue_t) sessionQueue {
    dispatch_async( sessionQueue, ^{
        NSError *error = nil;
        if ( [device lockForConfiguration:&error] ) {
            if ([device isTorchAvailable] && [device isTorchModeSupported:AVCaptureTorchModeOn]) {
                if (device.torchMode == AVCaptureTorchModeOn){
                    [device setTorchMode:AVCaptureTorchModeOff];
                } else if (device.torchMode == AVCaptureTorchModeOff) {
                    [device setTorchMode:AVCaptureTorchModeOn];
                    [device setTorchModeOnWithLevel:1.0 error:nil];
                }
            }
            [device unlockForConfiguration];
        } else {
            if (DEBUG_FLAG) {
                NSLog( @"Could not lock device for configuration: %@", error );
            }
        }
    });
}

-(void) configureCamera: (AVCaptureDevice *) device with: (dispatch_queue_t) sessionQueue {
    dispatch_async( sessionQueue, ^{
        CGFloat X = 0.5;
        CGFloat Y = 0.5;
        
        AVCaptureExposureMode EXPOSURE_MODE = AVCaptureExposureModeContinuousAutoExposure;
        AVCaptureFocusMode FOCUS_MODE = AVCaptureFocusModeContinuousAutoFocus;
        
        //Setting Autofocus and exposure
        NSError *error = nil;
        if ( [device lockForConfiguration:&error] ) {
            /*
             Setting (focus/exposure)PointOfInterest alone does not initiate a (focus/exposure) operation.
             Call set(Focus/Exposure)Mode() to apply the new point of interest.
             */
            //            if ([device hasTorch] && [device isTorchAvailable]) {
            //                [device setTorchMode:AVCaptureTorchModeOn];
            //            }
            
            CGPoint focusPoint = CGPointMake(X, Y);
            if (DEBUG_FLAG) {
                NSLog(@"%f, %f",focusPoint.x,focusPoint.y);
            }
            if (device.isFocusPointOfInterestSupported && [device isFocusModeSupported:FOCUS_MODE] ) {
                device.focusPointOfInterest = focusPoint;
                device.focusMode = FOCUS_MODE;
            }
            
            if (device.isExposurePointOfInterestSupported && [device isExposureModeSupported:EXPOSURE_MODE] ) {
                device.exposurePointOfInterest = focusPoint;
                device.exposureMode = EXPOSURE_MODE;
            }
            
            if ([device isWhiteBalanceModeSupported:AVCaptureWhiteBalanceModeContinuousAutoWhiteBalance]) {
                device.whiteBalanceMode = AVCaptureWhiteBalanceModeContinuousAutoWhiteBalance;
            }
            
            if ([device isTorchAvailable] && [device isTorchModeSupported:AVCaptureTorchModeOn]) {
                [device setTorchMode:AVCaptureTorchModeOn];
                [device setTorchModeOnWithLevel:1.0 error:nil];
                [device setExposureTargetBias:0 completionHandler:nil];
            }
            
            device.subjectAreaChangeMonitoringEnabled = YES;
            
            [device unlockForConfiguration];
        }
        else {
            if (DEBUG_FLAG) {
                NSLog( @"Could not lock device for configuration: %@", error );
            }
        }
    });
}

- (CALayer *) generateViewFinder: (UIView *) view forPreview:(UIView *)previewView{
    double width = previewView.frame.size.width * VIEW_FINDER_SCALE_W;
    double height = previewView.frame.size.height * VIEW_FINDER_SCALE_H;
    
    double xPos = (view.frame.size.width - width)/2;
    double yPos = (view.frame.size.height - height)/2;
    UIBezierPath *insideBox = [UIBezierPath bezierPathWithRect:CGRectMake(xPos, yPos, width, height)];
    UIBezierPath *outerBox = [UIBezierPath bezierPathWithRect:view.frame];
    [insideBox appendPath:outerBox];
    insideBox.usesEvenOddFillRule = YES;
    
    if (DEBUG_FLAG) {
        NSLog(@"View size: (%.2f,%.2f), Preview size: (%.2f, %.2f)", view.frame.size.width, view.frame.size.height,
              previewView.frame.size.width, previewView.frame.size.height);
        NSLog(@"View size: (%.2f,%.2f), Preview size: (%.2f, %.2f)", view.frame.origin.x, view.frame.origin.y,
              previewView.frame.origin.x, previewView.frame.origin.y);
    }
    
    
    CAShapeLayer *fillLayer = [CAShapeLayer layer];
    fillLayer.path = insideBox.CGPath;
    fillLayer.fillRule = kCAFillRuleEvenOdd;
    fillLayer.fillColor = [UIColor redColor].CGColor;
    fillLayer.opacity = 0.5;
    fillLayer.strokeColor = [UIColor whiteColor].CGColor;
    fillLayer.lineWidth = 5.0;
    [view.layer insertSublayer:fillLayer above:view.layer.sublayers[0]];
    return fillLayer;
}

-(UIImage *) interpretResultFromImage:(UIImage*) img andControlLine: (bool*) control andTestA: (bool*) testA andTestB: (bool*) testB {
    Mat resultMat = Mat();
    UIImageToMat(img, resultMat); //returns RGBA
    resultMat = [self interpretResultWithMat:resultMat andControlLine:control andTestA:testA andTestB:testB];
    return MatToUIImage(resultMat);
}

-(UIImage *) interpretResultWithBoundaryFromImage:(UIImage*) img withBoundary:(vector<Point2f>) boundary andControlLine: (bool*) control andTestA: (bool*) testA andTestB: (bool*) testB {
    Mat resultMat = Mat();
    UIImageToMat(img, resultMat); //returns RGBA
    resultMat = [self interpretResultWithBoundary:resultMat withBoundary:boundary andControlLine:control andTestA:testA andTestB:testB];
    return MatToUIImage(resultMat);
}

-(Mat) interpretResultWithBoundary: (Mat) inputMat withBoundary:(vector<Point2f>) boundary andControlLine: (bool*) control andTestA: (bool*) testA andTestB: (bool*) testB {
    bool fiducial = false;
    Mat correctedMat = [self cropRDT:inputMat with:boundary];
    Mat resultMat = [self cropResultWindow:correctedMat with:&fiducial];

    if (!fiducial) {
        *control = false;
        *testA = false;
        *testB = false;
        
        correctedMat.release();
        resultMat.release();
        
        return Mat();
    }
    
    Mat grayMat = Mat();
    cvtColor(resultMat, grayMat, COLOR_RGB2GRAY);
    cv::Scalar mu,sigma;
    meanStdDev(grayMat, mu, sigma);
    double minVal, maxVal;
    cv::Point minLoc, maxLoc;
    minMaxLoc(grayMat, &minVal, &maxVal, &minLoc, &maxLoc, noArray());
    
    if (DEBUG_FLAG) {
        NSLog(@"%@", [NSString stringWithFormat:@"stdev %.2f, minval %.2f, maxval %.2f",
                                 sigma[0],
                                 minVal,
                                 maxVal]);
    }
    
    if (sigma[0] > ENHANCING_THRESHOLD)
        resultMat = [self enhanceResultWindow:resultMat withTile:cv::Size(5, resultMat.cols)];

    //resultMat = [self enhanceResultWindow:resultMat withTile:cv::Size(10, 10)];
    //resultMat = [self correctGamma:resultMat withGamma:0.75];

    [self interpretResultWithResultWindow:resultMat andControlLine:control andTestA:testA andTestB:testB];
    
    grayMat.release();
    correctedMat.release();

    return resultMat;
}

-(Mat) interpretResultWithMat:(Mat) inputMat andControlLine: (bool*) control andTestA: (bool*) testA andTestB: (bool*) testB {
    vector<Point2f> boundary;
    Mat grayMat = Mat();
    cvtColor(inputMat, grayMat, COLOR_RGBA2GRAY);
    //[self checkSize:boundary inside:inputMat.size()];
    //[self checkPositionAndSize:boundary isCropped:false inside:inputMat.size()]
    int cnt=3;
    SizeResult isSizeable = INVALID;
    bool isCentered = false;
    bool isUpright = false;
    do {
        cnt++;
        boundary = [self detectRDTWithSIFT:grayMat andRansac:cnt];
        isSizeable = [self checkSize:boundary inside:cv::Size(inputMat.size().width/CROP_RATIO, inputMat.size().height/CROP_RATIO)];
        isCentered = [self checkIfCentered:boundary inside:inputMat.size()];
        isUpright = [self checkOrientation:boundary];
        if (DEBUG_FLAG) {
            NSLog(@"SIFT-right size %d, center %d, orientation %d, (%d, %d), cnt %d", isSizeable, isCentered, isUpright, inputMat.size().width, inputMat.size().height, cnt);
        }
    } while (!(isSizeable==RIGHT_SIZE && isCentered && isUpright) && cnt < 8);
    
    if (boundary.size() <= 0)
        return inputMat;

    bool fiducial = false;
    Mat correctedMat = [self cropRDT:inputMat with:boundary];
    Mat resultMat = [self cropResultWindow:correctedMat with:&fiducial];
    
    if (!fiducial) {
        *control = false;
        *testA = false;
        *testB = false;
        
        correctedMat.release();
        resultMat.release();
        
        return Mat();
    }
    
    //resultMat = [self enhanceResultWindow:resultMat withTile:cv::Size(5, resultMat.cols)];
    resultMat = [self enhanceResultWindow:resultMat withTile:cv::Size(10, 10)];
    //resultMat = [self correctGamma:resultMat withGamma:0.75];
    
    [self interpretResultWithResultWindow:resultMat andControlLine:control andTestA:testA andTestB:testB];
    
    correctedMat.release();
    
    return resultMat;
}

-(Mat) interpretResultWithResultWindow:(Mat) inputMat andControlLine: (bool*) control andTestA: (bool*) testA andTestB: (bool*) testB {
    if (DEBUG_FLAG) {
        NSLog(@"Result Mat size: (%d, %d) -- interpretation", inputMat.size().width, inputMat.size().height);
    }
    *control = [self readControlLine:inputMat at:cv::Point(CONTROL_LINE_POSITION,0)];
    *testA = [self readTestLine:inputMat at:cv::Point(TEST_A_LINE_POSITION,0)];
    *testB = [self readTestLine:inputMat at:cv::Point(TEST_B_LINE_POSITION,0)];
    
    if (DEBUG_FLAG) {
        NSLog(@"Control: %d, TestA: %d, TestB: %d", *control, *testA, *testB);
    }
    
    return inputMat;
}

-(cv::Rect) returnResultWindowRect:(Mat) inputMat andResult:(bool *) fiducial{
    *fiducial = true;
    return cv::Rect(RESULT_WINDOW_X, RESULT_WINDOW_Y, RESULT_WINDOW_WIDTH, RESULT_WINDOW_HEIGHT);
}

-(cv::Rect) checkFiducialKMenas:(Mat) inputMat andResult:(bool *) fiducial {
    int k = 5;
    TermCriteria criteria = TermCriteria(CV_TERMCRIT_EPS+CV_TERMCRIT_ITER, 100, 1.0);
    Mat data = Mat();
    inputMat.convertTo(data, CV_32F);
    cvtColor(data, data, COLOR_RGBA2RGB);
    data = data.reshape(1, (int)data.total());
    Mat labels = Mat();
    Mat centers = Mat();
    
    kmeans(data, k, labels, criteria, 10, KMEANS_PP_CENTERS, centers);
    
    centers = centers.reshape(3, centers.rows);
    data = data.reshape(3, data.rows);
    
    Vec3f *p = data.ptr<Vec3f>();
    for (int i = 0; i < data.rows; i++) {
        int centerId = labels.at<int>(i,0);
        p[i] = centers.at<Vec3f>(centerId);
    }
    
    data = data.reshape(3, inputMat.rows);
    data.convertTo(data, CV_8UC3);
    
    Vec3f minCenter = Vec3f();
    float minCenterVal = FLT_MAX;
    for (int i = 0; i < centers.rows; i++) {
        float val = centers.at<Vec3f>(i)[0] + centers.at<Vec3f>(i)[1] + centers.at<Vec3f>(i)[2];
        if (val < minCenterVal) {
            minCenter = centers.at<Vec3f>(i);
            minCenterVal = val;
        }
    }
    
    double thres = 0.299 * minCenter[0] + 0.587 * minCenter[1] + 0.114 * minCenter[2] + 20.0;
    
    cvtColor(data, data, COLOR_RGB2GRAY);
    Mat threshold = Mat();
    cv::threshold(data, threshold, thres, 255, THRESH_BINARY_INV);
    
    Mat element_erode = getStructuringElement(MORPH_ELLIPSE, cv::Size(5, 5));
    Mat element_dilate = getStructuringElement(MORPH_ELLIPSE, cv::Size(15, 15));
    
    erode(threshold, threshold, element_erode);
    dilate(threshold, threshold, element_dilate);
    GaussianBlur(threshold, threshold, cv::Size(5, 5), 2, 2);
    
    vector<vector<cv::Point> > contours;
    vector<Vec4i> hierarchy;
    findContours(threshold, contours, hierarchy, CV_RETR_EXTERNAL, CV_CHAIN_APPROX_SIMPLE, cv::Point(0, 0));
    vector<cv::Rect> fiducialRects;
    cv::Rect fiducialRect;
    *fiducial = false;
    for (int i = 0; i < contours.size(); i++)
    {
        cv::Rect rect = boundingRect(contours[i]);
        if (DEBUG_FLAG) {
            NSLog(@"contour rect: %d %d %d %d", rect.x, rect.y, rect.width, rect.height);
        }
        double rectPos = rect.x + rect.width;
        if (FIDUCIAL_POSITION_MIN < rectPos && rectPos < FIDUCIAL_POSITION_MAX && FIDUCIAL_MIN_HEIGHT < rect.height && FIDUCIAL_MIN_WIDTH < rect.width && rect.width < FIDUCIAL_MAX_WIDTH) {
            fiducialRects.push_back(rect);
            if (DEBUG_FLAG) {
                NSLog(@"control line rect: %d %d %d %d", rect.x, rect.y, rect.width, rect.height);
            }
        }
    }
    
    if (fiducialRects.size() == FIDUCIAL_COUNT) { //should
        double center0 = fiducialRects[0].x + fiducialRects[0].width;
        double center1 = fiducialRects[0].x + fiducialRects[0].width;
        
        if (fiducialRects.size() > 1) {
            center1 = fiducialRects[1].x + fiducialRects[1].width;
        }
        
        int midpoint = (int)((center0+center1)/2);
        double diff = abs(center0-center1);
        
        double scale = FIDUCIAL_DISTANCE == 0? 1 : diff/FIDUCIAL_DISTANCE;
        double offset = scale*FIDUCIAL_TO_CONTROL_LINE_OFFSET;
        
        cv::Point tl = cv::Point(midpoint+offset-RESULT_WINDOW_RECT_HEIGHT*scale/2.0, RESULT_WINDOW_RECT_WIDTH_PADDING);
        cv::Point br = cv::Point(midpoint+offset+RESULT_WINDOW_RECT_HEIGHT*scale/2.0, inputMat.size().height-RESULT_WINDOW_RECT_WIDTH_PADDING);
        
        if (DEBUG_FLAG) {
            NSLog(@"Scale %.2f, Offset %.2f", scale, offset);
        }
        
        fiducialRect = cv::Rect(tl, br);
        
        *fiducial = true;
    }
    
    data.release();
    centers.release();
    labels.release();
    threshold.release();
    element_erode.release();
    element_dilate.release();
    
    return fiducialRect;
}

-(cv::Rect) checkFiducialAndReturnResultWindowRect:(Mat) inputMat andResult:(bool *) fiducial {
    Mat hls = Mat();
    
    cvtColor(inputMat, hls, COLOR_RGBA2RGB);
    cvtColor(hls, hls, COLOR_RGB2HLS);
    
    vector<Mat> thresholds = {Mat(), Mat()};
    
    Mat threshold = Mat(inputMat.rows, inputMat.cols, CV_8U);
    
    for (int i = 0; i < CONTROL_LINE_COLOR_LOWER.size(); i++) {
        inRange(hls, CONTROL_LINE_COLOR_LOWER[i], CONTROL_LINE_COLOR_UPPER[i], thresholds[i]);
        add(threshold, thresholds[i], threshold);
    }
    
    Mat element_erode = getStructuringElement(MORPH_ELLIPSE, cv::Size(5, 5));
    Mat element_dilate = getStructuringElement(MORPH_ELLIPSE, cv::Size(15, 15));
    
    erode(threshold, threshold, element_erode);
    dilate(threshold, threshold, element_dilate);
    GaussianBlur(threshold, threshold, cv::Size(5, 5), 2, 2);
    
    vector<vector<cv::Point> > contours;
    vector<Vec4i> hierarchy;
    
    findContours(threshold, contours, hierarchy, CV_RETR_EXTERNAL, CV_CHAIN_APPROX_SIMPLE, cv::Point(0, 0));
    vector<cv::Rect> fiducialRects;
    cv::Rect fiducialRect;
    *fiducial = false;
    for (int i = 0; i < contours.size(); i++)
    {
        cv::Rect rect = boundingRect(contours[i]);
        if (DEBUG_FLAG) {
            NSLog(@"contour rect: %d %d %d %d", rect.x, rect.y, rect.width, rect.height);
        }
        double rectCenter = rect.x + rect.width/2.0;
        if (FIDUCIAL_POSITION_MIN < rectCenter && rectCenter < FIDUCIAL_POSITION_MAX && FIDUCIAL_MIN_HEIGHT < rect.height && FIDUCIAL_MIN_WIDTH < rect.width && rect.width < FIDUCIAL_MAX_WIDTH) {
            fiducialRects.push_back(rect);
            if (DEBUG_FLAG) {
                NSLog(@"control line rect: %d %d %d %d", rect.x, rect.y, rect.width, rect.height);
            }
                
        }
    }
    
    if (fiducialRects.size() == FIDUCIAL_COUNT) { //should
        double center0 = fiducialRects[0].x + fiducialRects[0].width/2.0;
        double center1 = fiducialRects[0].x + fiducialRects[0].width/2.0;
        
        if (fiducialRects.size() > 1) {
            center1 = fiducialRects[1].x + fiducialRects[1].width/2.0;
        }
        
        int midpoint = (int)((center0+center1)/2);
        double diff = abs(center0-center1);
        
        double scale = FIDUCIAL_DISTANCE == 0? 1 : diff/FIDUCIAL_DISTANCE;
        double offset = scale*FIDUCIAL_TO_CONTROL_LINE_OFFSET;
        
        cv::Point tl = cv::Point(midpoint+offset-RESULT_WINDOW_RECT_HEIGHT*scale/2.0, RESULT_WINDOW_RECT_WIDTH_PADDING);
        cv::Point br = cv::Point(midpoint+offset+RESULT_WINDOW_RECT_HEIGHT*scale/2.0, inputMat.size().height-RESULT_WINDOW_RECT_WIDTH_PADDING);
        
        fiducialRect = cv::Rect(tl, br);
        
        *fiducial = true;
    }
    
    for(int i = 0; i < CONTROL_LINE_COLOR_LOWER.size(); i++) {
        thresholds[i].release();
    }
    threshold.release();
    hls.release();
    element_erode.release();
    element_dilate.release();
    
    return fiducialRect;
}

-(bool) readLine:(Mat) inputMat at: (cv::Point) position for: (bool) isControlLine {
    Mat hls = Mat();
    cvtColor(inputMat, hls, COLOR_RGBA2RGB);
    cvtColor(hls, hls, COLOR_RGB2HLS);
    
    vector<Mat> channels;
    cv::split(hls, channels);
    
    int lower_bound = (position.x-LINE_SEARCH_WIDTH < 0 ? 0 : position.x-LINE_SEARCH_WIDTH);
    int upper_bound = position.x+LINE_SEARCH_WIDTH;
    
    float *avgIntensities = (float *) malloc((upper_bound-lower_bound)*sizeof(float));
    float *avgHues = (float *) malloc((upper_bound-lower_bound)*sizeof(float));
    float *avgSats = (float *) malloc((upper_bound-lower_bound)*sizeof(float));
    
    for (int i = lower_bound; i < upper_bound; i++) {
        float sumIntensity=0;
        float sumHue=0;
        float sumSat=0;
        for (int j = 0; j < channels[1].rows; j++) {
            sumIntensity+=channels[1].at<uchar>(j, i);
            sumHue+=channels[0].at<uchar>(j, i);
            sumSat+=channels[2].at<uchar>(j, i);
        }
        avgIntensities[i-lower_bound] = sumIntensity/channels[1].rows;
        avgHues[i-lower_bound] = sumHue/channels[0].rows;
        avgSats[i-lower_bound] = sumSat/channels[2].rows;
    }
    
    float min, max;
    vDSP_Length min_index, max_index;
    vDSP_minvi(avgIntensities, 1, &min, &min_index, upper_bound-lower_bound);
    vDSP_maxvi(avgIntensities, 1, &max, &max_index, upper_bound-lower_bound);
    
    if (DEBUG_FLAG) {
        NSLog(@"Intensity Minimum HLS (%.2f, %.2f, %.2f) at %lu/%d", avgHues[min_index]*2, min/255*100, avgSats[min_index]/255*100, min_index, upper_bound-lower_bound);
        NSLog(@"Intensity Maximum HLS (%.2f, %.2f, %.2f) at %lu/%d", avgHues[max_index]*2, max/255*100, avgSats[max_index]/255*100, max_index, upper_bound-lower_bound);
        NSLog(@"Intensity diff %.3f",abs(min-max));
    }
    
    if (isControlLine) {
        return min < INTENSITY_THRESHOLD && abs(min-max) > CONTROL_INTENSITY_PEAK_THRESHOLD;
    } else {
        return min < INTENSITY_THRESHOLD && abs(min-max) > TEST_INTENSITY_PEAK_THRESHOLD;
    }
}

-(bool) readControlLine:(Mat) inputMat at: (cv::Point) position {
    return [self readLine:inputMat at:position for: true];
}

-(bool) readTestLine:(Mat) inputMat at: (cv::Point) position {
    return [self readLine:inputMat at:position for: false];
}


-(Mat) enhanceResultWindow:(Mat) inputMat withTile: (cv::Size) tile{
    Mat result = Mat();
    if (DEBUG_FLAG) {
        NSLog(@"Enhance Result Mat Type: %d", inputMat.type());
    }
    cvtColor(inputMat, result, COLOR_RGBA2RGB);
    cvtColor(result, result, COLOR_RGB2HLS);
    
    Ptr<CLAHE> clahe = createCLAHE(10, tile);
    
    vector<Mat> channels;
    cv::split(result, channels);
    
    Mat newChannel = Mat();
    
    cv::normalize(channels[1], channels[1], 0, 255, cv::NORM_MINMAX);
    
    clahe->apply(channels[1], newChannel);
    
    channels[1] = newChannel;
    
    merge(channels, result);
    
    cvtColor(result, result, COLOR_HLS2RGB);
    cvtColor(result, result, COLOR_RGB2RGBA);
    
    return result;
}

- (Mat) correctGamma:(Mat) enhancedImg withGamma: (float) gamma {
    Mat lutMat = Mat(1, 256, CV_8UC1);
    for (int i = 0; i < 256; i ++) {
        float g = pow((float)i/255.0, gamma)*255.0;
        g = g > 255.0 ? 255.0 : g < 0 ? 0 : g;
        lutMat.at<uchar>(0, i) = g;
    }
    Mat result = Mat();
    LUT(enhancedImg, lutMat, result);
    return result;
}

-(Mat) cropRDT:(Mat) inputMat with:(vector<Point2f>) boundary {
    Mat ref_boundary = Mat(4, 1, CV_32FC2);
    
    ref_boundary.at<Vec2f>(0, 0)[0] = 0;
    ref_boundary.at<Vec2f>(0, 0)[1] = 0;
    
    ref_boundary.at<Vec2f>(1, 0)[0] = refImg.cols - 1;
    ref_boundary.at<Vec2f>(1, 0)[1] = 0;
    
    ref_boundary.at<Vec2f>(2, 0)[0] = refImg.cols - 1;
    ref_boundary.at<Vec2f>(2, 0)[1] = refImg.rows - 1;
    
    ref_boundary.at<Vec2f>(3, 0)[0] = 0;
    ref_boundary.at<Vec2f>(3, 0)[1] = refImg.rows - 1;
    
    if (DEBUG_FLAG) {
        NSLog(@"ref_boundary:  (%.2f, %.2f) (%.2f, %.2f) (%.2f, %.2f) (%.2f, %.2f)",
              ref_boundary.at<Vec2f>(0, 0)[0], ref_boundary.at<Vec2f>(0, 0)[1],
              ref_boundary.at<Vec2f>(1, 0)[0], ref_boundary.at<Vec2f>(1, 0)[1],
              ref_boundary.at<Vec2f>(2, 0)[0], ref_boundary.at<Vec2f>(2, 0)[1],
              ref_boundary.at<Vec2f>(3, 0)[0], ref_boundary.at<Vec2f>(3, 0)[1]);
    }
    
    Mat boundaryMat = Mat(boundary);
    
    if (DEBUG_FLAG) {
        NSLog(@"boundaryMat:  (%.2f, %.2f) (%.2f, %.2f) (%.2f, %.2f) (%.2f, %.2f)",
              boundaryMat.at<Vec2f>(0, 0)[0], boundaryMat.at<Vec2f>(0, 0)[1],
              boundaryMat.at<Vec2f>(1, 0)[0], boundaryMat.at<Vec2f>(1, 0)[1],
              boundaryMat.at<Vec2f>(2, 0)[0], boundaryMat.at<Vec2f>(2, 0)[1],
              boundaryMat.at<Vec2f>(3, 0)[0], boundaryMat.at<Vec2f>(3, 0)[1]);
    }
    
    Mat M = getPerspectiveTransform(boundaryMat, ref_boundary);
    Mat correctedMat = Mat(refImg.rows, refImg.cols, refImg.type());
    cv::warpPerspective(inputMat, correctedMat, M, cv::Size(refImg.cols, refImg.rows));
    
    return correctedMat;
}

-(Mat) cropResultWindow:(Mat) correctedMat with:(bool*) fiducial {
    //cv::Rect resultWindowRect = [self checkFiducialAndReturnResultWindowRect:correctedMat andResult:fiducial];
    cv::Rect resultWindowRect = [self checkFiducialKMenas:correctedMat andResult:fiducial];
    //cv::Rect resultWindowRect = [self returnResultWindowRect: correctedMat andResult:fiducial];

    if (!(*fiducial)) {
        return Mat();
    }

    correctedMat = Mat(correctedMat, resultWindowRect);
    resize(correctedMat, correctedMat, cv::Size(RESULT_WINDOW_RECT_HEIGHT, refImg.rows-2*RESULT_WINDOW_RECT_WIDTH_PADDING));

    return correctedMat;
}

-(vector<Point2f>) detectRDTWithSIFT: (Mat) inputMat andRansac: (int) ransac {
    double currentTime = CACurrentMediaTime();
    Mat inDescriptor;
    vector<KeyPoint> inKeypoints;
    vector<cv::Point2f> boundary;
    double avgDist = 0.0;
    
    Mat scaledMat = Mat();
    cv::resize(inputMat, scaledMat, cv::Size(), self.frameImageScale, self.frameImageScale, INTER_LINEAR);
    
    Mat mask = Mat(scaledMat.size().width, scaledMat.size().height, CV_8U, Scalar(0));
    
    cv::Point p1 = cv::Point(0, scaledMat.size().height*(1-VIEW_FINDER_SCALE_W/CROP_RATIO)/2);
    cv::Point p2 = cv::Point(scaledMat.size().width-p1.x, scaledMat.size().height-p1.y);
    rectangle(mask, p1, p2, Scalar(255), -1);
    siftDetector->detectAndCompute(scaledMat(cv::Rect(p1, p2)), noArray(), inKeypoints, inDescriptor);
    if (DEBUG_FLAG) {
        NSLog(@"Found %lu keypoints from input image", inKeypoints.size());
    }
    if (inDescriptor.cols < 1 || inDescriptor.rows < 1) { // No features found!
        if (DEBUG_FLAG) {
            NSLog(@"Found no features!");
            NSLog(@"Time taken to detect: %f -- fail -- SIFT", CACurrentMediaTime() - currentTime);
        }
        
        inDescriptor.release();
        mask.release();
        scaledMat.release();
        
        return boundary;
    }

    // Matching
    vector<vector<DMatch>> matches;
    siftMatcher->knnMatch(siftRefDescriptor, inDescriptor, matches, 2, noArray(), false);
    
    double maxDist = FLT_MIN;
    double minDist = FLT_MAX;
    
    double sum = 0;
    int count = 0;
    vector<DMatch> goodMatches;
    for (int i = 0; i < matches.size(); i++) {
        if (matches[i].size() >= 2) {
            if (matches[i][0].distance <= 0.80 * matches[i][1].distance) {
                goodMatches.push_back(matches[i][0]);
                sum += matches[i][0].distance;
                count++;
            }
        }
    }
    
    vector<Point2f> srcPoints;
    vector<Point2f> dstPoints;
    
    for (int i = 0; i < goodMatches.size(); i++) {
        DMatch currentMatch = goodMatches[i];
        srcPoints.push_back(siftRefKeypoints[currentMatch.queryIdx].pt);
        dstPoints.push_back(inKeypoints[currentMatch.trainIdx].pt);
    }
    
    // HOMOGRAPHY!
    if (DEBUG_FLAG) {
        NSLog(@"GoodMatches size %lu", goodMatches.size());
    }
    if (goodMatches.size() > GOOD_MATCH_COUNT) {
        Mat H = findHomography(srcPoints, dstPoints, CV_RANSAC, ransac);
        
        if (H.cols >= 3 && H.rows >= 3) {
            Mat objCorners = Mat(4, 1, CV_32FC2);
            Mat sceneCorners = Mat(4, 1, CV_32FC2);
            
            objCorners.at<Vec2f>(0, 0)[0] = 0;
            objCorners.at<Vec2f>(0, 0)[1] = 0;
            
            objCorners.at<Vec2f>(1, 0)[0] = refImg.cols - 1;
            objCorners.at<Vec2f>(1, 0)[1] = 0;
            
            objCorners.at<Vec2f>(2, 0)[0] = refImg.cols - 1;
            objCorners.at<Vec2f>(2, 0)[1] = refImg.rows - 1;
            
            objCorners.at<Vec2f>(3, 0)[0] = 0;
            objCorners.at<Vec2f>(3, 0)[1] = refImg.rows - 1;
            
            perspectiveTransform(objCorners, sceneCorners, H);
            if (DEBUG_FLAG) {
                NSLog(@"DstPts-SIFT:  (%.2f, %.2f) (%.2f, %.2f) (%.2f, %.2f) (%.2f, %.2f)",
                      dstPoints[0].x, dstPoints[0].y,
                      dstPoints[1].x, dstPoints[1].y,
                      dstPoints[2].x, dstPoints[2].y,
                      dstPoints[3].x, dstPoints[3].y);
                NSLog(@"Transformed-SIFT: %.2f (%.2f, %.2f) (%.2f, %.2f) (%.2f, %.2f) (%.2f, %.2f)",
                      sceneCorners.at<Vec2f>(1, 0)[0]-sceneCorners.at<Vec2f>(0, 0)[0],
                      sceneCorners.at<Vec2f>(0, 0)[0], sceneCorners.at<Vec2f>(0, 0)[1],
                      sceneCorners.at<Vec2f>(1, 0)[0], sceneCorners.at<Vec2f>(1, 0)[1],
                      sceneCorners.at<Vec2f>(2, 0)[0], sceneCorners.at<Vec2f>(2, 0)[1],
                      sceneCorners.at<Vec2f>(3, 0)[0], sceneCorners.at<Vec2f>(3, 0)[1]);
            }
            
            
            (boundary).push_back(Point2f(sceneCorners.at<Vec2f>(0,0)[0], sceneCorners.at<Vec2f>(0,0)[1]+p1.y));
            (boundary).push_back(Point2f(sceneCorners.at<Vec2f>(1,0)[0], sceneCorners.at<Vec2f>(1,0)[1]+p1.y));
            (boundary).push_back(Point2f(sceneCorners.at<Vec2f>(2,0)[0], sceneCorners.at<Vec2f>(2,0)[1]+p1.y));
            (boundary).push_back(Point2f(sceneCorners.at<Vec2f>(3,0)[0], sceneCorners.at<Vec2f>(3,0)[1]+p1.y));
            
            objCorners.release();
            sceneCorners.release();
            
            avgDist = sum/count;
            
            RotatedRect rotatedRect = minAreaRect(boundary);
            Point2f v[4];
            rotatedRect.points(v);
            
            for (int i = 0; i < 4; i++) {
                if(rotatedRect.angle < -45)
                    boundary[(i+2)%4] = cv::Point(v[i].x/self.frameImageScale, v[i].y/self.frameImageScale);
                else
                    boundary[(i+3)%4] = cv::Point(v[i].x/self.frameImageScale, v[i].y/self.frameImageScale);
            }
            
            cv::Rect rect = boundingRect(boundary);
            
            if (DEBUG_FLAG) {
                NSLog(@"Transformed-SIFT-updated: %.2f (%.2f, %.2f) (%.2f, %.2f) (%.2f, %.2f) (%.2f, %.2f)",
                      v[0].x-v[1].x,
                      v[0].x, v[0].y,
                      v[1].x, v[1].y,
                      v[2].x, v[2].y,
                      v[3].x, v[3].y);
            }
            
            float rotatedArea = rotatedRect.size.height*rotatedRect.size.width;
            float boundArea = rect.area();
            if (DEBUG_FLAG) {
                NSLog(@"Rotated: %.2f, contour: %.2f, diff: %.2f -- SIFT -- angle: %.2f", rotatedArea, contourArea(boundary), rotatedArea-contourArea(boundary), rotatedRect.angle);
            }
        }

        H.release();
    }
    if (DEBUG_FLAG) {
        NSLog(@"Time taken to detect: %f -- success -- SIFT", CACurrentMediaTime() - currentTime);
    }
    inDescriptor.release();
    mask.release();
    scaledMat.release();
    return boundary;
}

-(cv::Rect) getViewfinderRect: (Mat) inputMat {
    cv::Point p1 = cv::Point(inputMat.size().width*(1-VIEW_FINDER_SCALE_H)/2, inputMat.size().height*(1-VIEW_FINDER_SCALE_W)/2);
    cv::Point p2 = cv::Point(inputMat.size().width-p1.x, inputMat.size().height-p1.y);
    return cv::Rect(p1, p2);
}

@end

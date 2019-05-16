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

using namespace cv;
using namespace std;

const float SHARPNESS_THRESHOLD = 0.0;
const float OVER_EXP_THRESHOLD = 255;
const float UNDER_EXP_THRESHOLD = 120;
const float OVER_EXP_WHITE_COUNT = 100;
const double SIZE_THRESHOLD = 0.3;
const double POSITION_THRESHOLD = 0.2;
const double VIEWPORT_SCALE = 0.75;
const int GOOD_MATCH_COUNT = 7;
const double minSharpness = FLT_MIN;
const double maxSharpness = FLT_MAX; //this value is set to min because blur check is not needed.
const int MOVE_CLOSER_COUNT = 5;
const double CROP_RATIO = 0.6;
const double VIEW_FINDER_SCALE_W = 0.15;
const double VIEW_FINDER_SCALE_H = 0.60;

NSString *instruction_detected = @"RDT detected at the center!";
NSString *instruction_pos = @"Place RDT at the center.\nFit RDT to the rectangle.";
NSString *instruction_too_small = @"Place RDT at the center.\nFit RDT to the rectangle.\nMove closer.";
NSString *instruction_too_large = @"Place RDT at the center.\nFit RDT to the rectangle.\nMove further away.";
NSString *instruction_focusing = @"Place RDT at the center.\nFit RDT to the rectangle.\nCamera is focusing. \nStay still.";
NSString *instruction_unfocused = @"Place RDT at the center.\n Fit RDT to the rectangle.\nCamera is not focused. \nMove further away.";

Ptr<BRISK> detector;
Ptr<DescriptorMatcher> matcher;
Mat refImg;
Mat refDescriptor;
vector<KeyPoint> refKeypoints;
int mMoveCloserCount;

@implementation ImageProcessor

// Singleton object
+ (ImageProcessor *)sharedProcessor {
    static ImageProcessor *sharedWrapper = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedWrapper = [[self alloc] init];
        detector = BRISK::create(45, 4, 1.0f);
        matcher = DescriptorMatcher::create(4); // 4 indicates BF Hamming
        UIImage * image = [UIImage imageNamed:@"quickvue_ref.jpg"];
        UIImageToMat(image, refImg);
        NSLog(@"RefImg Size: (%d, %d)", refImg.size().width, refImg.size().height);
        cvtColor(refImg, refImg, CV_BGRA2GRAY); // Dereference the pointer
        detector->detectAndCompute(refImg, noArray(), refKeypoints, refDescriptor);
        NSLog(@"Successfully set up BRISK Detector and BFHamming matcher");
        NSLog(@"Successfully detect and compute reference RDT, currently there are %lu keypoints",refKeypoints.size());
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
- (cv::Mat)matFromSampleBuffer:(CMSampleBufferRef)sampleBuffer {
    
    CVImageBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    CVPixelBufferLockBaseAddress(pixelBuffer, 0);
    size_t bufferWidth = CVPixelBufferGetWidth(pixelBuffer);
    size_t bufferHeight = CVPixelBufferGetHeight(pixelBuffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
    unsigned char *pixel = (unsigned char *)CVPixelBufferGetBaseAddress(pixelBuffer);
    Mat mat = Mat((int)bufferHeight,(int)bufferWidth,CV_8UC4, pixel,(int)bytesPerRow); //put buffer in open cv, no memory copied
    CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
    
    //Mat greyMat;
    //cvtColor(mat, greyMat, CV_BGRA2GRAY);

    //mat.release();
    NSLog(@"Mat size: (%d, %d)", mat.rows, mat.cols);
    return mat;
}

// Do the template matching
// Checks blurriness, brightness, etc. and calls the next method
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
    
    double sharpness = [self calculateSharpness:inputMat];
    
    //CJ: checkSharpness starts
    bool isSharp = sharpness > (minSharpness * SHARPNESS_THRESHOLD);
    
    return isSharp;
}


//CJ: captureRDT starts
- (void)captureRDT:(CMSampleBufferRef)sampleBuffer withCompletion:(ImageProcessorBlock)completion {
    Mat inputMat = [self matFromSampleBuffer:sampleBuffer];
    Mat greyMat;
    cvtColor(inputMat, greyMat, CV_BGRA2GRAY);
    double matchDistance = 0.0;
    bool passed = false;
    
    //check brightness (refactored)
    ExposureResult exposureResult = [self checkBrightness:greyMat];
    //isRightBrightness = false;
    
    //check sharpness (refactored)
    bool isSharp = [self checkSharpness:greyMat];
    //isSharp = false;
    
    //preform detectRDT only if those two quality checks are passed
    if (exposureResult == NORMAL && isSharp) {
        //CJ: detectRDT starts
        
        //CJ: detectRDT ends inside of "performBRISKSearchOnMat". Check "performBRISKSearchOnMat" for the end of detectRDT.
        vector<Point2f> boundary;
        matchDistance = [self detectRDT:greyMat andReturn: &boundary];
        bool isCentered = false;
        SizeResult sizeResult = INVALID;
        bool isRightOrientation = false;
        
        //[self checkPositionAndSize:boundary isCropped:false inside:greyMat.size()];
        
        if (boundary.size() > 0) {
            isCentered = [self checkIfCentered:boundary inside:greyMat.size()];
            sizeResult = [self checkSize:boundary inside:greyMat.size()];
            isRightOrientation = [self checkOrientation:boundary];
        }
        
        passed = sizeResult == RIGHT_SIZE && isCentered && isRightOrientation;
        
        Mat rgbMat = [self cropRDT:inputMat];
        cvtColor(rgbMat, rgbMat, CV_BGRA2RGBA);
        
        completion(passed, MatToUIImage(rgbMat), matchDistance, exposureResult, sizeResult, isCentered, isRightOrientation, isSharp, false);
        //completion(passed, MatToUIImage(inputMat), matchDistance, exposureResult, sizeResult, isCentered, isRightOrientation, isSharp, false);
    } else {
        NSLog(@"Found = ENTERED");
        completion(passed, nil, matchDistance, exposureResult, INVALID, false, false, isSharp, false);
    }
}
// end of caputureRDT

// actually implements template matching
- (double)detectRDT:(Mat)inputMat andReturn: (vector<Point2f> *) boundary{
    Mat inDescriptor;
    vector<KeyPoint> inKeypoints;
    UIImage *resultImg;
    //vector<cv::Point2f> boundary;
    double avgDist = 0.0;
    
//    InputArray mask;
    
    Mat mask = Mat(inputMat.size().width, inputMat.size().height, CV_8U, Scalar(0));
    
    cv::Point p1 = cv::Point(inputMat.size().width*(1-VIEW_FINDER_SCALE_H)/2, inputMat.size().height*(1-VIEW_FINDER_SCALE_W)/2);
    cv::Point p2 = cv::Point(inputMat.size().width-p1.x, inputMat.size().height-p1.y);
    rectangle(mask, p1, p2, Scalar(255), -1);
    
    detector->detectAndCompute(inputMat, mask, inKeypoints, inDescriptor);
    
    if (inDescriptor.cols < 1 || inDescriptor.rows < 1) { // No features found!
        NSLog(@"Found no features!");
        return 0.0;
    }
    NSLog(@"Found %lu keypoints from input image", inKeypoints.size());
    
    // Matching
    double currentTime = CACurrentMediaTime();
    vector<DMatch> matches;
    matcher->match(refDescriptor, inDescriptor, matches);
    NSLog(@"Time taken to match: %f", CACurrentMediaTime() - currentTime);
    
    double maxDist = FLT_MIN;
    double minDist = FLT_MAX;
    
    for (int i = 0; i < matches.size(); i++) {
        double dist = matches[i].distance;
        maxDist = MAX(maxDist, dist);
        minDist = MIN(minDist, dist);
    }
    
    double sum = 0;
    int count = 0;
    vector<DMatch> goodMatches;
    for (int i = 0; i < matches.size(); i++) {
        NSLog(@"matches distance: %.2f", matches[i].distance);
        if (matches[i].distance <= (3.0 * minDist)) {
            goodMatches.push_back(matches[i]);
            sum += matches[i].distance;
            count++;
        }
    }
    
    vector<Point2f> srcPoints; // Works without allocating space?
    vector<Point2f> dstPoints;
    
    for (int i = 0; i < goodMatches.size(); i++) {
        DMatch currentMatch = goodMatches[i];
        srcPoints.push_back(refKeypoints[currentMatch.queryIdx].pt);
        dstPoints.push_back(inKeypoints[currentMatch.trainIdx].pt);
    }
    
    bool found = false;
    NSMutableArray *posSizeArr  = nil;
    // HOMOGRAPHY!
    NSLog(@"GoodMatches size %lu", goodMatches.size());
    if (goodMatches.size() > GOOD_MATCH_COUNT) {
        Mat H = findHomography(srcPoints, dstPoints, CV_RANSAC, 5);
        
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
            
            perspectiveTransform(objCorners, sceneCorners, H); // Not sure! if I'm suppose to dereference
            
            NSLog(@"Transformed:  (%.2f, %.2f) (%.2f, %.2f) (%.2f, %.2f) (%.2f, %.2f)",
                  sceneCorners.at<Vec2f>(0, 0)[0], sceneCorners.at<Vec2f>(0, 0)[1],
                  sceneCorners.at<Vec2f>(1, 0)[0], sceneCorners.at<Vec2f>(1, 0)[1],
                  sceneCorners.at<Vec2f>(2, 0)[0], sceneCorners.at<Vec2f>(2, 0)[1],
                  sceneCorners.at<Vec2f>(3, 0)[0], sceneCorners.at<Vec2f>(3, 0)[1]);
            
            
            (*boundary).push_back(Point2f(sceneCorners.at<Vec2f>(0,0)[0], sceneCorners.at<Vec2f>(0,0)[1]));
            (*boundary).push_back(Point2f(sceneCorners.at<Vec2f>(1,0)[0], sceneCorners.at<Vec2f>(1,0)[1]));
            (*boundary).push_back(Point2f(sceneCorners.at<Vec2f>(2,0)[0], sceneCorners.at<Vec2f>(2,0)[1]));
            (*boundary).push_back(Point2f(sceneCorners.at<Vec2f>(3,0)[0], sceneCorners.at<Vec2f>(3,0)[1]));
            
            objCorners.release();
            sceneCorners.release();
            
            avgDist = sum/count;
            NSLog(@"Average distance: %.2f", sum/count);

        }
    }
    
    return avgDist;
}

- (double) measureOrientation:(vector<Point2f>) boundary {
    RotatedRect rotatedRect = minAreaRect(boundary);
    
    bool isUpright = rotatedRect.size.height > rotatedRect.size.width;
    double angle = 0;
    double height = 0;
    
    if (isUpright) {
        angle = 90 - abs(rotatedRect.angle);
    } else {
        angle = abs(rotatedRect.angle);
    }
    
    return angle;
}

- (bool) checkOrientation:(vector<Point2f>) boundary {
    double angle = [self measureOrientation:boundary];
    
    bool isOriented = angle < 90.0*POSITION_THRESHOLD;
    
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
    bool isRightSize = height < size.height*VIEWPORT_SCALE*(1+SIZE_THRESHOLD) && height > size.height*VIEWPORT_SCALE*(1-SIZE_THRESHOLD);
    
    SizeResult sizeResult = INVALID;
    
    if (isRightSize) {
        sizeResult = RIGHT_SIZE;
    } else {
        if (height > size.height*VIEWPORT_SCALE*(1+SIZE_THRESHOLD)) {
            sizeResult = LARGE;
        } else if (height < size.height*VIEWPORT_SCALE*(1-SIZE_THRESHOLD)) {
            sizeResult = SMALL;
        } else {
            sizeResult = INVALID;
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

    bool isRightSize = height < size.height*VIEWPORT_SCALE*(1+SIZE_THRESHOLD) && height > size.height*VIEWPORT_SCALE*(1-SIZE_THRESHOLD);
    //CJ: checkSize ends

    result[0] = [NSNumber numberWithBool:isCentered];
    result[1] = [NSNumber numberWithBool:isRightSize];
    result[2] = [NSNumber numberWithBool:isOriented];

    //CJ: for size, we have to return whether the image is large or small to provide instruction.
    result[3] = [NSNumber numberWithBool:(height > size.height*VIEWPORT_SCALE*(1+SIZE_THRESHOLD))]; // large
    result[4] = [NSNumber numberWithBool:(height < size.height*VIEWPORT_SCALE*(1-SIZE_THRESHOLD))];// small

    //if (((NSNumber*)result[0]).boolValue && ((NSNumber *)result[1]).boolValue ) {
        NSLog(@"POS: %.2d, %.2d, Angle: %.2f, Height: %.2f", center.x, center.y, angle, height);
    //}

    return result;
}

-(Mat) cropRDT:(Mat) inputMat {
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
    cv::Size sizeRgba = input.size();
    vector<int> channel = {0};
    vector<Mat> allMat = {input};
    calcHist(allMat, channel, Mat(), hist, mHistSize, histogramRanges);
    normalize(hist, hist, sizeRgba.height/2, 0, NORM_INF);
    mBuff.assign((float*)hist.datastart, (float*)hist.dataend);
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
    
//    if (isCorrectPosSize != nil) {
//        if (isCorrectPosSize[1] && isCorrectPosSize[0] && isCorrectPosSize[2]) {
//            instructions = instruction_detected;
//
//        } else if (mMoveCloserCount > MOVE_CLOSER_COUNT) {
//            if (!isCorrectPosSize[5]) {
//                if (!isCorrectPosSize[0] || (!isCorrectPosSize[1] && isCorrectPosSize[3])) {
//                    instructions = instruction_pos;
//                } else if (!isCorrectPosSize[1] && isCorrectPosSize[4]) {
//                    instructions = instruction_too_small;
//                    mMoveCloserCount = 0;
//                }
//            } else {
//                instructions = instruction_pos;
//            }
//        } else {
//            instructions = instruction_too_small;
//            mMoveCloserCount++;
//        }
//    }
//
//    return instructions;
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
            NSLog(@"%f, %f",focusPoint.x,focusPoint.y);
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
                [device setTorchModeOnWithLevel:0.1 error:nil];
                [device setExposureTargetBias:-1 completionHandler:nil];
            }
            
            device.subjectAreaChangeMonitoringEnabled = YES;
            
            [device unlockForConfiguration];
        }
        else {
            NSLog( @"Could not lock device for configuration: %@", error );
        }
    });
}

- (void) generateViewFinder: (UIView *) view forPreview:(UIView *)previewView{
    double width = previewView.frame.size.width * VIEW_FINDER_SCALE_W;
    double height = previewView.frame.size.height * VIEW_FINDER_SCALE_H;
    
    double xPos = (view.frame.size.width - width)/2;
    double yPos = (view.frame.size.height - height)/2;
    UIBezierPath *insideBox = [UIBezierPath bezierPathWithRect:CGRectMake(xPos, yPos, width, height)];
    UIBezierPath *outerBox = [UIBezierPath bezierPathWithRect:view.frame];
    [insideBox appendPath:outerBox];
    insideBox.usesEvenOddFillRule = YES;
    
    NSLog(@"View size: (%.2f,%.2f), Preview size: (%.2f, %.2f)", view.frame.size.width, view.frame.size.height,
          previewView.frame.size.width, previewView.frame.size.height);
    NSLog(@"View size: (%.2f,%.2f), Preview size: (%.2f, %.2f)", view.frame.origin.x, view.frame.origin.y,
          previewView.frame.origin.x, previewView.frame.origin.y);
    
    
    CAShapeLayer *fillLayer = [CAShapeLayer layer];
    fillLayer.path = insideBox.CGPath;
    fillLayer.fillRule = kCAFillRuleEvenOdd;
    fillLayer.fillColor = [UIColor redColor].CGColor;
    fillLayer.opacity = 0.5;
    fillLayer.strokeColor = [UIColor whiteColor].CGColor;
    fillLayer.lineWidth = 5.0;
    [view.layer insertSublayer:fillLayer above:view.layer.sublayers[0]];
}

@end

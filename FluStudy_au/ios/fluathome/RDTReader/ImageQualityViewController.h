//
//  Copyright (C) 2019 University of Washington Ubicomp Lab
//  All rights reserved.
//
//  This software may be modified and distributed under the terms
//  of a BSD-style license that can be found in the LICENSE file.
//

#import <opencv2/videoio/cap_ios.h>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/features2d.hpp>
#include <stdlib.h>
#import <UIKit/UIKit.h>
#import "AVCamPreviewView.h"
#import "ImageProcessor.h"

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM( NSInteger, AVCamSetupResult ) {
    AVCamSetupResultSuccess,
    AVCamSetupResultCameraNotAuthorized,
    AVCamSetupResultSessionConfigurationFailed
};

@interface ImageQualityViewController : UIViewController<AVCaptureVideoDataOutputSampleBufferDelegate>

@property (weak, nonatomic) IBOutlet UIButton *flashButton;
@property (nonatomic) dispatch_queue_t sessionQueue;
@property (nonatomic) dispatch_queue_t videoDataOutputQueue;
@property (nonatomic) AVCaptureSession *session;
@property (nonatomic) IBOutlet AVCamPreviewView *previewView;
@property (nonatomic) AVCamSetupResult setupResult;
@property (nonatomic) AVCaptureDeviceInput *videoDeviceInput;
@property (nonatomic) AVCapturePhotoOutput *photoOutput;
@property (nonatomic, getter=isSessionRunning) BOOL sessionRunning;
@property (nonatomic) AVCaptureVideoDataOutput *videoDataOutput;
@property (nonatomic) BOOL isProcessing;
@property (nonatomic) void (^onRDTDetected)(bool passed, UIImage *img, double matchDistance, ExposureResult exposureResult, SizeResult sizeResult, bool center, bool orientation, float angle, bool sharpness, bool shadow, bool control, bool testA, bool testB);
@property (nonatomic) void (^onRDTCameraReady)();
@property (nonatomic) BOOL disableViewFinder;
@property (weak, nonatomic) IBOutlet UILabel *positionLabel;
@property (weak, nonatomic) IBOutlet UILabel *sharpnessLabel;
@property (weak, nonatomic) IBOutlet UILabel *brightnessLabel;
@property (weak, nonatomic) IBOutlet UILabel *shadowLabel;
@property (weak, nonatomic) IBOutlet UILabel *instructionsLabel;
@property (nonatomic) UIImage *image;
- (IBAction)didTouchUp:(id)sender;
- (IBAction)toggleFlash;
- (BOOL) isFlashEnabled;
@end

NS_ASSUME_NONNULL_END

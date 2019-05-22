//
//  Copyright (C) 2019 University of Washington Ubicomp Lab
//  All rights reserved.
//
//  This software may be modified and distributed under the terms
//  of a BSD-style license that can be found in the LICENSE file.
//

#import "ImageQualityViewController.h"
#import "AVCamPreviewView.h"
#import "ImageProcessor.h"

using namespace std;
using namespace cv;

AVCaptureSessionPreset GLOBAL_CAMERA_PRESET = AVCaptureSessionPresetPhoto;
BOOL HIGH_RESOLUTION_ENABLED = NO;
BOOL DEPTH_DATA_DELIVERY = NO;
AVCaptureExposureMode EXPOSURE_MODE = AVCaptureExposureModeContinuousAutoExposure;
AVCaptureFocusMode FOCUS_MODE = AVCaptureFocusModeContinuousAutoFocus;
CGFloat X = 0.5;
CGFloat Y = 0.5;
double startTime = 0.0;


@implementation ImageQualityViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Create the AVCaptureSession.
    self.session = [[AVCaptureSession alloc] init];
    
    // Set up the preview view.
    if (!self.previewView) {
        self.previewView = [[AVCamPreviewView alloc] init];
        [self.view addSubview: self.previewView];
        [self.previewView setBounds: self.view.bounds];
        [self.previewView setFrame: self.view.frame];
        [self.previewView setCenter: self.view.center];
    }
    self.previewView.session = self.session;
    
    // Communicate with the session and other session objects on this queue.
    self.sessionQueue = dispatch_queue_create( "session queue", DISPATCH_QUEUE_SERIAL );
    
    self.setupResult = AVCamSetupResultSuccess;
    
    /*
     Check video authorization status. Video access is required and audio
     access is optional. If audio access is denied, audio is not recorded
     during movie recording.
     */
    switch ( [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo] )
    {
        case AVAuthorizationStatusAuthorized:
        {
            // The user has previously granted access to the camera.
            break;
        }
        case AVAuthorizationStatusNotDetermined:
        {
            /*
             The user has not yet been presented with the option to grant
             video access. We suspend the session queue to delay session
             setup until the access request has completed.
             
             Note that audio access will be implicitly requested when we
             create an AVCaptureDeviceInput for audio during session setup.
             */
            dispatch_suspend( self.sessionQueue );
            [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^( BOOL granted ) {
                if ( ! granted ) {
                    self.setupResult = AVCamSetupResultCameraNotAuthorized;
                }
                dispatch_resume( self.sessionQueue );
            }];
            break;
        }
        default:
        {
            // The user has previously denied access.
            self.setupResult = AVCamSetupResultCameraNotAuthorized;
            break;
        }
    }
    dispatch_async(self.sessionQueue, ^{
        [self configureSession];
    } );
    //[self setUpGuidingView];
    if (!self.disableViewFinder) {
        [[ImageProcessor sharedProcessor] generateViewFinder:self.view forPreview: self.previewView];
    }
    //    self.previewView.layer addSublayer:(nonnull CALayer *)
    
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    self.isProcessing = false;
    startTime = 0;
    dispatch_async( self.sessionQueue, ^{
        switch ( self.setupResult )
        {
            case AVCamSetupResultSuccess:
            {
                // Start the session running if setup succeeded.
                [self.session startRunning];
                self.sessionRunning = self.session.isRunning;
                self.isProcessing = false;
                if (self.onRDTCameraReady) {
                    self.onRDTCameraReady();
                }
                break;
            }
            case AVCamSetupResultCameraNotAuthorized:
            {
                dispatch_async( dispatch_get_main_queue(), ^{
                    NSString *message = NSLocalizedString( @"This app doesn't have permission to use the camera, please change privacy settings", @"Alert message when the user has denied access to the camera" );
                    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:@"Camera Permission" message:message preferredStyle:UIAlertControllerStyleAlert];
                    UIAlertAction *cancelAction = [UIAlertAction actionWithTitle:NSLocalizedString( @"OK", @"Alert OK button" ) style:UIAlertActionStyleCancel handler:nil];
                    [alertController addAction:cancelAction];
                    // Provide quick access to Settings.
                    UIAlertAction *settingsAction = [UIAlertAction actionWithTitle:NSLocalizedString( @"Settings", @"Alert button to open Settings" ) style:UIAlertActionStyleDefault handler:^( UIAlertAction *action ) {
                        [[UIApplication sharedApplication] openURL:[NSURL URLWithString:UIApplicationOpenSettingsURLString] options:@{} completionHandler:nil];
                    }];
                    [alertController addAction:settingsAction];
                    [self presentViewController:alertController animated:YES completion:nil];
                } );
                break;
            }
            case AVCamSetupResultSessionConfigurationFailed:
            {
                dispatch_async( dispatch_get_main_queue(), ^{
                    NSString *message = NSLocalizedString( @"Unable to capture image", @"Alert message when something goes wrong during capture session configuration" );
                    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:@"Camera Error" message:message preferredStyle:UIAlertControllerStyleAlert];
                    UIAlertAction *cancelAction = [UIAlertAction actionWithTitle:NSLocalizedString( @"OK", @"Alert OK button" ) style:UIAlertActionStyleCancel handler:nil];
                    [alertController addAction:cancelAction];
                    [self presentViewController:alertController animated:YES completion:nil];
                } );
                break;
            }
        }
    } );
}

-(void) viewDidAppear:(BOOL)animated {
    //[self setUpAutoFocusAndExposure];
    [[ImageProcessor sharedProcessor] configureCamera:self.videoDeviceInput.device with:self.sessionQueue];
}

-(void) viewWillDisappear:(BOOL)animated {
    [self.session stopRunning];
    self.isProcessing = true;
    startTime = 0;
}

#pragma mark Session Management
- (void)configureSession {
    
    NSError *error = nil;
    
    [self.session beginConfiguration];
    
    /*
     We do not create an AVCaptureMovieFileOutput when setting up the session because the
     AVCaptureMovieFileOutput does not support movie recording with AVCaptureSessionPresetPhoto.
     */
    // self.session.sessionPreset = GLOBAL_CAMERA_PRESET;
    
    // Add video input.
    
    // Choose the back dual camera if available, otherwise default to a wide angle camera.
    AVCaptureDevice *videoDevice = [AVCaptureDevice defaultDeviceWithDeviceType:AVCaptureDeviceTypeBuiltInDualCamera mediaType:AVMediaTypeVideo position:AVCaptureDevicePositionBack];
    if ( ! videoDevice ) {
        // If the back dual camera is not available, default to the back wide angle camera.
        videoDevice = [AVCaptureDevice defaultDeviceWithDeviceType:AVCaptureDeviceTypeBuiltInWideAngleCamera mediaType:AVMediaTypeVideo position:AVCaptureDevicePositionBack];
        
        // In some cases where users break their phones, the back wide angle camera is not available. In this case, we should default to the front wide angle camera.
        if ( ! videoDevice ) {
            videoDevice = [AVCaptureDevice defaultDeviceWithDeviceType:AVCaptureDeviceTypeBuiltInWideAngleCamera mediaType:AVMediaTypeVideo position:AVCaptureDevicePositionFront];
        }
    }
    AVCaptureDeviceInput *videoDeviceInput = [AVCaptureDeviceInput deviceInputWithDevice:videoDevice error:&error];
    if ( ! videoDeviceInput ) {
        NSLog( @"Could not create video device input: %@", error );
        self.setupResult = AVCamSetupResultSessionConfigurationFailed;
        [self.session commitConfiguration];
        return;
    }
    if ( [self.session canAddInput:videoDeviceInput] ) {
        [self.session addInput:videoDeviceInput];
        self.videoDeviceInput = videoDeviceInput;
        
        dispatch_async( dispatch_get_main_queue(), ^{
            /*
             Why are we dispatching this to the main queue?
             Because AVCaptureVideoPreviewLayer is the backing layer for AVCamPreviewView and UIView
             can only be manipulated on the main thread.
             Note: As an exception to the above rule, it is not necessary to serialize video orientation changes
             on the AVCaptureVideoPreviewLayer’s connection with other session manipulation.
             
             Use the status bar orientation as the initial video orientation. Subsequent orientation changes are
             handled by -[AVCamCameraViewController viewWillTransitionToSize:withTransitionCoordinator:].
             */
            UIInterfaceOrientation statusBarOrientation = [UIApplication sharedApplication].statusBarOrientation;
            AVCaptureVideoOrientation initialVideoOrientation = AVCaptureVideoOrientationPortrait;
            if ( statusBarOrientation != UIInterfaceOrientationUnknown ) {
                initialVideoOrientation = (AVCaptureVideoOrientation)statusBarOrientation;
            }
            
            self.previewView.videoPreviewLayer.connection.videoOrientation = initialVideoOrientation;
        } );
    }
    else {
        NSLog( @"Could not add video device input to the session" );
        self.setupResult = AVCamSetupResultSessionConfigurationFailed;
        [self.session commitConfiguration];
        return;
    }
    
    // Add photo output.
    //    AVCapturePhotoOutput *photoOutput = [[AVCapturePhotoOutput alloc] init];
    //
    //    if ( [self.session canAddOutput:photoOutput] ) {
    //        [self.session addOutput:photoOutput];
    //        self.photoOutput = photoOutput;
    //        self.photoOutput.highResolutionCaptureEnabled = HIGH_RESOLUTION_ENABLED;
    //        self.photoOutput.livePhotoCaptureEnabled = NO;
    //        self.photoOutput.depthDataDeliveryEnabled = DEPTH_DATA_DELIVERY;
    //    }else {
    //        NSLog( @"Could not add photo output to the session" );
    //        self.setupResult = AVCamSetupResultSessionConfigurationFailed;
    //        [self.session commitConfiguration];
    //        return;
    //    }
    
    // Add frame processor output
    self.videoDataOutput = [AVCaptureVideoDataOutput new];
    [self.videoDataOutput setAlwaysDiscardsLateVideoFrames:YES];
    self.videoDataOutputQueue = dispatch_queue_create("VideoDataOutputQueue", DISPATCH_QUEUE_SERIAL);
    self.videoDataOutput.videoSettings = [NSDictionary dictionaryWithObjectsAndKeys: [NSNumber numberWithUnsignedInt:kCVPixelFormatType_32BGRA],(id)kCVPixelBufferPixelFormatTypeKey,
                                          nil];
    [self.videoDataOutput setSampleBufferDelegate:self queue:self.videoDataOutputQueue];
    
    
    if ([self.session canAddOutput:self.videoDataOutput]) {
        [self.session addOutput:self.videoDataOutput];
    } else {
        NSLog(@"Could not add video output to the session");
        self.setupResult = AVCamSetupResultSessionConfigurationFailed;
        [self.session commitConfiguration];
        return;
    }
    
    [self.session commitConfiguration];
    
}

#pragma mark - Image Process
- (void)captureOutput:(AVCaptureOutput *)output
didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer
       fromConnection:(AVCaptureConnection *)connection{
    if (startTime == 0)
        startTime = CACurrentMediaTime();
    
    @synchronized(self) {
        if (self.isProcessing)
            return;
    }
    
    //if (!self.isProcessing) {
        @synchronized (self) {
            self.isProcessing = true;
        }
        [[ImageProcessor sharedProcessor] captureRDT:sampleBuffer withCompletion:^(bool passed, UIImage *img, double matchDistance, ExposureResult exposureResult, SizeResult sizeResult, bool center, bool orientation, bool sharpness, bool shadow, Mat resultWindowMat) {
            NSLog(@"Found = %d, update Pos = %d, update Sharpness = %d, update Brightness = %d, update Shadow = %d", passed, (int)sizeResult, sharpness, (int)exposureResult, shadow);
            
            NSString *instructions = [[ImageProcessor sharedProcessor] getInstruction:sizeResult andFor:center andFor:orientation];
            NSMutableArray *qCheckTexts = [[ImageProcessor sharedProcessor] getQualityCheckTexts:sizeResult andFor:center andFor:orientation andFor:sharpness andFor:exposureResult];
            
            
            dispatch_async(dispatch_get_main_queue(), ^{
                self.positionLabel.text = qCheckTexts[2];
                self.positionLabel.textColor = sizeResult==RIGHT_SIZE && center && orientation? [UIColor greenColor] : [UIColor redColor];
                self.sharpnessLabel.text = qCheckTexts[0];
                self.sharpnessLabel.textColor = sharpness ? [UIColor greenColor] : [UIColor redColor];
                self.brightnessLabel.text = qCheckTexts[1];
                self.brightnessLabel.textColor = exposureResult==NORMAL ? [UIColor greenColor] : [UIColor redColor];
                self.shadowLabel.text = qCheckTexts[3];
                self.shadowLabel.textColor = shadow ? [UIColor redColor] : [UIColor greenColor];
                self.instructionsLabel.text = instructions;
                if(passed == true){
                    NSLog(@"Moving to result screen");
                    double captureTime = CACurrentMediaTime() - startTime;
                    startTime = 0;
                    
                    bool control, testA, testB;
                    // this passees the imgage into the showPhotoViewController
                    UIImage *testStripImage = [[ImageProcessor sharedProcessor] interpretResultWithResultWindow: resultWindowMat andControlLine:&control andTestA:&testA andTestB:&testB];
                    if (self.onRDTDetected) {
                        self.onRDTDetected(passed, img, matchDistance, exposureResult, sizeResult, center, orientation, sharpness, shadow, control, testA, testB);
                    }
                } else {
                    if (self.onRDTDetected) {
                        self.onRDTDetected(passed, img, matchDistance, exposureResult, sizeResult, center, orientation, sharpness, shadow, false, false, false);
                    }
                    @synchronized (self) {
                        self.isProcessing = false;
                    }
                }
                
                
            });
            

        }];
        
    //}
    
}

- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
    [super viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
    
    UIDeviceOrientation deviceOrientation = [UIDevice currentDevice].orientation;
    
    if ( UIDeviceOrientationIsPortrait( deviceOrientation ) || UIDeviceOrientationIsLandscape( deviceOrientation ) ) {
        self.previewView.videoPreviewLayer.connection.videoOrientation = (AVCaptureVideoOrientation)deviceOrientation;
    }
}


@end




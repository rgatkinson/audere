// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
//

#import "RDTView.h"
#import <React/RCTViewManager.h>
#import "ImageQualityViewController.h"

@implementation RDTView
{
    ImageQualityViewController *viewController;
    BOOL showDefaultViewFinder;
}
- (RDTView*) init
{
    self = [super init];
    if (self) {
        showDefaultViewFinder = false;
    }
    return self;
}
- (void) createImageQualityViewController
{
    viewController = [[ImageQualityViewController alloc] init];
    viewController.disableViewFinder = !showDefaultViewFinder;
    __weak RDTView *weakSelf = self;
    viewController.onRDTCameraReady = ^(bool supportsTorchMode) {
        RDTView *strongSelf = weakSelf;
        if (!strongSelf || !strongSelf.onRDTCameraReady) {
            return;
        }
        strongSelf.onRDTCameraReady(
            @{
                @"supportsTorchMode": @(supportsTorchMode),
            }
        );
    };
    viewController.onRDTDetected = ^(bool passed, bool testStripDetected, UIImage *testStrip, UIImage *croppedTestStrip, UIImage *resultWindow, bool fiducial, ExposureResult exposureResult, SizeResult sizeResult, bool center, bool orientation, float angle, bool sharpness, bool shadow, bool control, bool testA, bool testB, double captureTime, std::vector<Point2f> boundary){
        RDTView *strongSelf = weakSelf;
        NSLog(@"Callback called with %@", passed ? @"true" : @"false");
        if (!strongSelf || !strongSelf.onRDTCaptured) {
            return;
        }
        NSLog(@"Calling JS callback");
        NSString *base64img = @"";
        NSString *base64ResultWindowImg = @"";
        if (testStrip && passed && fiducial) {
            base64img = [UIImagePNGRepresentation(testStrip) base64EncodedStringWithOptions: 0];
            base64ResultWindowImg = [UIImagePNGRepresentation(resultWindow) base64EncodedStringWithOptions: 0];
        }
        NSMutableArray *boxedBoundary = [NSMutableArray arrayWithCapacity:boundary.size()];
        for(int i = 0; i < boundary.size(); i++) {
            boxedBoundary[i] =
                @{
                    @"x": @(boundary[i].x),
                    @"y": @(boundary[i].y),
                };
        }
        dispatch_async(dispatch_get_main_queue(), ^{
            strongSelf.onRDTCaptured(
                @{
                    @"passed": @(passed),
                    @"testStripDetected": @(testStripDetected),
                    @"img": base64img,
                    @"resultWindowImg": base64ResultWindowImg,
                    @"fiducial": @(fiducial),
                    @"exposureResult": @(exposureResult),
                    @"sizeResult": @(sizeResult),
                    @"center": @(center),
                    @"orientation": @(orientation),
                    @"angle": @(angle),
                    @"sharpness": @(sharpness),
                    @"shadow": @(shadow),
                    @"control": @(control),
                    @"testA": @(testA),
                    @"testB": @(testB),
                    @"boundary": boxedBoundary,
                }
            );
        });
        return;
    };
    [self addSubview:viewController.view];
    [viewController.view setFrame: CGRectMake(0, 0, CGRectGetWidth(self.bounds), CGRectGetHeight(self.bounds))];
    self.imageQualityViewController = viewController;
}

- (void) setEnabled:(BOOL)enabled
{
    if (enabled) {
        if (!self.imageQualityViewController) {
            [self createImageQualityViewController];
        } else {
            [self addSubview:self.imageQualityViewController.view];
        }
    } else {
        [self.imageQualityViewController.view removeFromSuperview];
    }
}

- (void) setFlashEnabled:(BOOL) flashEnabled
{
    BOOL flashCurrentlyEnabled = [self.imageQualityViewController isFlashEnabled];
    if (flashCurrentlyEnabled != flashEnabled) {
        [self.imageQualityViewController toggleFlash];
    }
}

- (void) setShowDefaultViewfinder:(BOOL) showDefaultViewFinder
{
    self->showDefaultViewFinder = showDefaultViewFinder;
    if (showDefaultViewFinder) {
        [self.imageQualityViewController showViewFinder];
    } else {
        [self.imageQualityViewController hideViewFinder];
    }
}

@end

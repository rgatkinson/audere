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
}

- (void) createImageQualityViewController
{
    viewController = [[ImageQualityViewController alloc] init];
    viewController.disableViewFinder = true;
    __weak RDTView *weakSelf = self;
    viewController.onRDTCameraReady = ^() {
        RDTView *strongSelf = weakSelf;
        if (!strongSelf || !strongSelf.onRDTCameraReady) {
            return;
        }
        strongSelf.onRDTCameraReady(@{});
    };
    viewController.onRDTDetected = ^(bool passed, UIImage *img, double matchDistance, ExposureResult exposureResult, SizeResult sizeResult, bool center, bool orientation, float angle, bool sharpness, bool shadow, bool control, bool testA, bool testB){
        RDTView *strongSelf = weakSelf;
        NSLog(@"Callback called with %@", passed ? @"true" : @"false");
        if (!strongSelf || !strongSelf.onRDTCaptured) {
            return;
        }
        NSLog(@"Calling JS callback");
        NSString *base64img = @"";
        if (img) {
            base64img = [UIImagePNGRepresentation(img) base64EncodedStringWithOptions: 0];
        }
        dispatch_async(dispatch_get_main_queue(), ^{
            strongSelf.onRDTCaptured(
                @{
                    @"passed": @(passed),
                    @"img": base64img,
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
                }
            );
        });
        return;
    };
    [self addSubview:viewController.view];
    self.imageQualityViewController = viewController;
}

- (void) setEnabled:(BOOL)enabled
{
    if (enabled) {
        [self createImageQualityViewController];
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
@end

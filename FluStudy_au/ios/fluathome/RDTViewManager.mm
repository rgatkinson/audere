// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
//

#import "RDTViewManager.h"
#import "RDTView.h"
#import "ImageQualityViewController.h"

@implementation RDTViewManager
{
    ImageQualityViewController *viewController;
}

RCT_EXPORT_MODULE(RDTReader);
RCT_EXPORT_VIEW_PROPERTY(onRDTCaptured, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onRDTCameraReady, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL);

- (UIView *) view
{
    if (_rdtView) {
        return _rdtView;
    }
    viewController = [[ImageQualityViewController alloc] init];
    viewController.disableViewFinder = true;
    __weak RDTViewManager *weakSelf = self;
    viewController.onRDTCameraReady = ^() {
        RDTViewManager *strongSelf = weakSelf;
        if (!strongSelf || !strongSelf.rdtView.onRDTCameraReady) {
            return;
        }
        strongSelf.rdtView.onRDTCameraReady(@{});
    };
    viewController.onRDTCaptured = ^(bool passed, UIImage *img, double matchDistance, ExposureResult exposureResult, SizeResult sizeResult, bool center, bool orientation, bool sharpness, bool shadow){
        RDTViewManager *strongSelf = weakSelf;
        NSLog(@"Callback called with %@", passed ? @"true" : @"false");
        if (!strongSelf || !strongSelf.rdtView.onRDTCaptured) {
            return;
        }
        NSLog(@"Calling JS callback");
        NSString *base64img = @"";
        if (img) {
            base64img = [UIImagePNGRepresentation(img) base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
        }
        dispatch_async(dispatch_get_main_queue(), ^{
            strongSelf.rdtView.onRDTCaptured(
                  @{
                       @"passed": @(passed),
                       @"img": base64img,
                       @"matchDistance": @(matchDistance),
                       @"exposureResult": @(exposureResult),
                       @"sizeResult": @(sizeResult),
                       @"center": @(center),
                       @"orientation": @(orientation),
                       @"sharpness": @(sharpness),
                       @"shadow": @(shadow),
                 }
            );
        });
        return;
    };
    _rdtView = [[RDTView alloc] init];
    [_rdtView addSubview:viewController.view];
    _rdtView.imageQualityViewController = viewController;
    return _rdtView;
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

@end

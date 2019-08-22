// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
//

#import "RDTViewManager.h"
#import "RDTView.h"
#import "ImageQualityViewController.h"

@implementation RDTViewManager

RCT_EXPORT_MODULE(RDTReader);
RCT_EXPORT_VIEW_PROPERTY(onRDTCaptured, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onRDTCameraReady, RCTBubblingEventBlock);
RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL);
RCT_EXPORT_VIEW_PROPERTY(showDefaultViewfinder, BOOL);
RCT_EXPORT_VIEW_PROPERTY(flashEnabled, BOOL);

- (UIView *) view
{
    if (_rdtView) {
        return _rdtView;
    }
    _rdtView = [[RDTView alloc] init];
    return _rdtView;
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

@end

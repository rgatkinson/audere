// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
//

#import "RDTView.h"
#import <React/RCTViewManager.h>

@implementation RDTView
- (void) setEnabled:(BOOL)enabled
{
    dispatch_async(self.imageQualityViewController.sessionQueue, ^{
        if (!self.enabled && enabled) {
            [self.imageQualityViewController.session startRunning];
        } else if (self.enabled && !enabled) {
            [self.imageQualityViewController.session stopRunning];
        }
    });
}
@end

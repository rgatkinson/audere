// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
//
#import <UIKit/UIKit.h>
#import <React/RCTViewManager.h>
#import "ImageQualityViewController.h"

@interface RDTView : UIView
@property (nonatomic, copy) RCTBubblingEventBlock onRDTCaptured;
@property (nonatomic, copy) RCTBubblingEventBlock onRDTCameraReady;
@property (nonatomic) ImageQualityViewController * imageQualityViewController;
@end

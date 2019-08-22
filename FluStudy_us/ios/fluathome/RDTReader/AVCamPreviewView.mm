//
//  Copyright (C) 2019 University of Washington Ubicomp Lab
//  All rights reserved.
//
//  This software may be modified and distributed under the terms
//  of a BSD-style license that can be found in the LICENSE file.
//

#import <AVFoundation/AVFoundation.h>
#import "AVCamPreviewView.h"

@implementation AVCamPreviewView

+ (Class)layerClass
{
	return [AVCaptureVideoPreviewLayer class];
}

- (AVCaptureVideoPreviewLayer *)videoPreviewLayer
{
	return (AVCaptureVideoPreviewLayer *)self.layer;
}

- (AVCaptureSession *)session
{
	return self.videoPreviewLayer.session;
}

- (void)setSession:(AVCaptureSession *)session
{
	self.videoPreviewLayer.session = session;
}

@end

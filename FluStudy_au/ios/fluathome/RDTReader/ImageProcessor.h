//
//  Copyright (C) 2019 University of Washington Ubicomp Lab
//  All rights reserved.
//
//  This software may be modified and distributed under the terms
//  of a BSD-style license that can be found in the LICENSE file.
//

#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <opencv2/imgcodecs/ios.h>

using namespace cv;

NS_ASSUME_NONNULL_BEGIN

@interface ImageProcessor : NSObject

typedef NS_ENUM(NSInteger, ExposureResult ) {
    UNDER_EXPOSED,
    NORMAL,
    OVER_EXPOSED
};

typedef NS_ENUM(NSInteger, SizeResult ) {
    RIGHT_SIZE,
    LARGE,
    SMALL,
    INVALID
};

+ (ImageProcessor *)sharedProcessor;
typedef void (^ImageProcessorBlock)(bool passed, UIImage *img, double matchDistance, ExposureResult exposureResult, SizeResult sizeResult, bool center, bool orientation, float angle, bool sharpness, bool shadow);//, Mat resultWindowMat); // Return hashmap features to client
- (void)captureRDT:(CMSampleBufferRef)sampleBuffer withCompletion:(ImageProcessorBlock)completion;
- (NSString *) getInstruction: (SizeResult) sizeResult andFor: (bool) isCentered andFor: (bool) isRightOrientation;
- (NSMutableArray *) getQualityCheckTexts: (SizeResult) sizeResult andFor: (bool) isCentered andFor: (bool) isRightOrientation andFor: (bool) isSharp andFor:(ExposureResult) exposureResult;
- (void) configureCamera: (AVCaptureDevice *) device with: (dispatch_queue_t) sessionQueue;
- (void) generateViewFinder: (UIView *) view forPreview: (UIView *) previewView;
- (UIImage *) interpretResult:(UIImage*) img andControlLine: (bool*) control andTestA: (bool*) testA andTestB: (bool*) testB;
@end

NS_ASSUME_NONNULL_END

// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
//

#import <Foundation/Foundation.h>
#import "FirebaseStorageUploadModule.h"
#import <React/RCTLog.h>
#import <Firebase/Firebase.h>

@implementation FirebaseStorageUploadModule
{
    NSFileManager *fileManager;
    NSURL *queueRoot;
    FIRStorageReference *rootRef;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

-(id) init {
    self->fileManager = [NSFileManager defaultManager];
    self->rootRef = [[FIRStorage storage] reference];

    NSArray *paths = [self->fileManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask];
    NSURL *docsDir = [paths lastObject];

    self->queueRoot = [docsDir URLByAppendingPathComponent:@"FirebaseStorageUploadQueues" isDirectory:true];
    return self;
}

-(NSURL *) getQueueDir:(NSString *)queue {
    return [self->queueRoot URLByAppendingPathComponent:queue isDirectory:true];
}

RCT_REMAP_METHOD(add,
                 queue:(NSString *)queue
                 uid:(NSString *)uid
                 uriString:(NSString *)uriString
                 addWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    RCTLogInfo(@"add queue=%@ uid=%@ uri=%@", queue, uid, uriString);
    NSError *error = nil;
    NSURL *sourceURL = [[NSURL alloc] initWithString:uriString];
    NSURL *queueURL = [self getQueueDir:queue];
    NSURL *queueItemURL = [queueURL URLByAppendingPathComponent:uid isDirectory:false];

    [self->fileManager createDirectoryAtURL:queueURL withIntermediateDirectories:true attributes:nil error:&error];
    if (error != nil) {
        reject(@"", @"", error);
        return;
    }

    [self->fileManager copyItemAtURL:sourceURL toURL:queueItemURL error:&error];
    if (error != nil) {
        reject(@"", @"", error);
        return;
    }

    resolve(nil);
}

RCT_REMAP_METHOD(deleteFile,
                 uriString:(NSString *)uriString
                 addWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    RCTLogInfo(@"deleteFile uri=%@", uriString);
    NSError *error = nil;

    [self->fileManager removeItemAtPath:uriString error:&error];
    if (error != nil) {
        reject(@"", @"", error);
        return;
    }

    resolve(nil);
}

RCT_REMAP_METHOD(list,
                 queue:(NSString *)queue
                 addWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    RCTLogInfo(@"add list=%@", queue);
    NSError *error = nil;
    NSArray *keys = [NSArray new];

    NSArray *resultURLS = [self->fileManager
                       contentsOfDirectoryAtURL:[self getQueueDir:queue]
                       includingPropertiesForKeys:keys
                       options:NSDirectoryEnumerationSkipsHiddenFiles
                       error:&error];

    // We get an error if the directory does not exist yet.
    // This just represents no queued files.
    if (error != nil || resultURLS == nil) {
        resultURLS = [NSArray new];
    }

    NSMutableArray *result = [NSMutableArray arrayWithCapacity:[resultURLS count]];
    for (NSURL *url in resultURLS) {
        [result addObject:[url lastPathComponent]];
    }

    resolve(result);
}

RCT_REMAP_METHOD(upload,
                 queue:(NSString *)queue
                 uid:(NSString *)uid
                 addWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    RCTLogInfo(@"upload queue=%@ uid=%@", queue, uid);
    FIRStorageReference *queueRef = [self->rootRef child:queue];
    FIRStorageReference *itemRef = [queueRef child:uid];
    NSURL *queueItemURL = [[self getQueueDir:queue] URLByAppendingPathComponent:uid isDirectory:false];

    FIRStorageMetadata *metadata = [[FIRStorageMetadata alloc] init];
    metadata.contentType = @"image/jpeg";

    [itemRef
     putFile:queueItemURL
     metadata:metadata
     completion:^(FIRStorageMetadata *metadata, NSError *error) {
        if (error != nil) {
            reject(@"", @"", error);
            return;
        }

        NSURL *queueURL = [self getQueueDir:queue];
        NSURL *queueItemURL = [queueURL URLByAppendingPathComponent:uid isDirectory:false];
        [self->fileManager removeItemAtURL:queueItemURL error:&error];

        resolve(nil);
    }];
}

@end

// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export const defaultNumEncounters: number = +process.env.NUM_ENCOUNTERS || 50;

export const hutchConcurrentUploads: number = +process.env.HUTCH_CONCURRENT_UPLOADS || 50;

export const hashSecret: string = process.env.EXPORT_HASH_SECRET;

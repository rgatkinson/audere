// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

export interface VideoConfig {
  uri: string;
  thumbnail: string;
}

export const videoConfig: Map<string, VideoConfig> = new Map<
  string,
  VideoConfig
>([
  [
    "beginFirstTest",
    {
      uri:
        "https://player.vimeo.com/external/330874909.m3u8?s=64dedfa68838f7c12b70628efb47d1835808be5c",
      thumbnail: "beginfirsttestthumb",
    },
  ],
  [
    "prepareTube",
    {
      uri:
        "https://player.vimeo.com/external/330876411.m3u8?s=b30834c0f57b7793e481ed81a005e29fe21a8626",
      thumbnail: "preparetubethumb",
    },
  ],
  [
    "collectSample",
    {
      uri:
        "https://player.vimeo.com/external/330876221.m3u8?s=d124ba39c342c6c50b93b5bb941aaf1dba15667d",
      thumbnail: "collectsamplethumb",
    },
  ],
  [
    "putSwabInTube",
    {
      uri:
        "https://player.vimeo.com/external/330876489.m3u8?s=55d401697a5989c5670fd46271189f6061bbad38",
      thumbnail: "putswabintubethumb",
    },
  ],
  [
    "removeSwabFromTube",
    {
      uri:
        "https://player.vimeo.com/external/330876539.m3u8?s=97203b8ba6a04618cf1f22aada6e5b30dabae44c",
      thumbnail: "removeswabfromtubethumb",
    },
  ],
  [
    "openTestStrip",
    {
      uri:
        "https://player.vimeo.com/external/330876319.m3u8?s=80a663c6d00759579e74979f5032123802fa3c24",
      thumbnail: "openteststripthumb",
    },
  ],
  [
    "putTestStripInTube",
    {
      uri:
        "https://player.vimeo.com/external/330876520.m3u8?s=f4f210d94e9562535956b5eb4969ba3e29057949",
      thumbnail: "putteststripintubethumb",
    },
  ],
  [
    "removeTestStrip",
    {
      uri:
        "https://player.vimeo.com/external/330876555.m3u8?s=4d50364b615ea2f5f53f8a31339993cf9079d7f5",
      thumbnail: "removeteststripthumb",
    },
  ],
  [
    "finishWithTube",
    {
      uri:
        "https://player.vimeo.com/external/330876277.m3u8?s=f74ab0fafb7e0e021bafd78900c87f0573b9d5ec",
      thumbnail: "finishwithtubethumb",
    },
  ],
  [
    "lookAtTestStrip",
    {
      uri:
        "https://player.vimeo.com/external/330876294.m3u8?s=5e9c59c67d5839465b1c0851c03150ff1b7b421e",
      thumbnail: "lookatteststripthumb",
    },
  ],
  [
    "takePhotoOfStrip",
    {
      uri:
        "https://player.vimeo.com/external/330876592.m3u8?s=96fe3a5787ef0d2d9bb28bdf5f3dc0b78bac77ae",
      thumbnail: "takephotoofstripthumb",
    },
  ],
  [
    "cleanUpFirstTest1",
    {
      uri:
        "https://player.vimeo.com/external/330876096.m3u8?s=f41f95118cc7658b457a36a90fc8f0cacc083d3a",
      thumbnail: "cleanupfirsttest1thumb",
    },
  ],
  [
    "cleanUpFirstTest2",
    {
      uri:
        "https://player.vimeo.com/external/330876151.m3u8?s=17a21a2f9c9f6f8f670b3326c53898ef17680d13",
      thumbnail: "cleanupfirsttest2thumb",
    },
  ],
  [
    "prepareForTest",
    {
      uri:
        "https://player.vimeo.com/external/330876384.m3u8?s=ac11c620c1005939e7a05b9ef88e9eb651e0b8f0",
      thumbnail: "preparefortestthumb",
    },
  ],
  [
    "collectSampleFromNose",
    {
      uri:
        "https://player.vimeo.com/external/330876248.m3u8?s=c7a748cec189073260b53b4b5d7076980f3e7499",
      thumbnail: "collectsamplefromnosethumb",
    },
  ],
  [
    "putSwabInTube2",
    {
      uri:
        "https://player.vimeo.com/external/330876505.m3u8?s=5b7588166c546ae32b58076ee4612bb5fdfcd7db",
      thumbnail: "putswabintube2thumb",
    },
  ],
]);

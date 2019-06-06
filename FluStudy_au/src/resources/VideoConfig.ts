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
    "collectSample",
    {
      uri:
        "https://player.vimeo.com/external/330876221.m3u8?s=d124ba39c342c6c50b93b5bb941aaf1dba15667d",
      thumbnail: "collectsamplethumb",
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
]);

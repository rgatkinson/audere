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
        "https://player.vimeo.com/external/348454490.m3u8?s=f3b4015a63ea388aba01ac2217f89925319ededa",
      thumbnail: "collectsamplethumb",
    },
  ],
  [
    "removeSwabFromTube",
    {
      uri:
        "https://player.vimeo.com/external/348454806.m3u8?s=616a456cecdd81bc7262f1c8d40be33ce587e7ce",
      thumbnail: "removeswabfromtubethumb",
    },
  ],
]);
